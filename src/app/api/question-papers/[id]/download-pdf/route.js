import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import QuestionPaper from "@/models/QuestionPaper";
import { PDFDocument } from "pdf-lib";

export async function POST(req, { params }) {
    try {
        await connectDB();

        const { id } = await params;

        const paper = await QuestionPaper.findById(id).lean();

        if (!paper) {
            return NextResponse.json(
                { error: "Question paper not found" },
                { status: 404 }
            );
        }

        if (!paper.images || paper.images.length === 0) {
            return NextResponse.json(
                { error: "No images available for this question paper" },
                { status: 400 }
            );
        }

        // Create a new PDF document
        const pdfDoc = await PDFDocument.create();

        // Process each image
        for (let i = 0; i < paper.images.length; i++) {
            const imageUrl = paper.images[i];

            try {
                // Fetch the image
                const imageResponse = await fetch(imageUrl);
                if (!imageResponse.ok) {
                    console.warn(`Failed to fetch image ${i + 1}: ${imageUrl}`);
                    continue;
                }

                const imageBuffer = await imageResponse.arrayBuffer();

                // Embed the image based on type
                let image;
                if (imageUrl.toLowerCase().includes('.png')) {
                    image = await pdfDoc.embedPng(imageBuffer);
                } else {
                    image = await pdfDoc.embedJpg(imageBuffer);
                }

                // Add a new page
                const page = pdfDoc.addPage([image.width, image.height]);
                page.drawImage(image, {
                    x: 0,
                    y: 0,
                    width: image.width,
                    height: image.height,
                });
            } catch (imgError) {
                console.error(`Error processing image ${i + 1}:`, imgError);
                continue;
            }
        }

        // Serialize the PDF
        const pdfBytes = await pdfDoc.save();

        // Create filename
        const fileName = `${paper.subject}_${paper.batch}_${paper.examType}.pdf`
            .replace(/[^a-zA-Z0-9._-]/g, "_");

        // Return the PDF as download
        return new NextResponse(pdfBytes, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${fileName}"`,
            },
        });
    } catch (error) {
        console.error("POST /api/question-papers/[id]/download-pdf error:", error);
        return NextResponse.json(
            { error: "Failed to generate PDF" },
            { status: 500 }
        );
    }
}
