import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { buildQuestionPaperPdfImages, buildQuestionPaperResponse, getQuestionPaperByTreePath } from "../../../../../../store";

export async function POST(req, { params }) {
    try {
        const { semester, batch, examType } = await params;
        const body = await req.json().catch(() => ({}));
        const subject = body?.subject || "";

        const paper = getQuestionPaperByTreePath(semester, batch, examType);

        if (!paper) {
            return NextResponse.json(
                { error: "Question paper not found" },
                { status: 404 }
            );
        }

        const paperData = buildQuestionPaperResponse(paper, subject);
        const images = buildQuestionPaperPdfImages(paper, subject);

        if (!images.length) {
            return NextResponse.json(
                { error: subject ? "No images available for this subject" : "No images available for this question paper" },
                { status: 400 }
            );
        }

        const pdfDoc = await PDFDocument.create();

        for (let i = 0; i < images.length; i++) {
            const imageUrl = images[i];

            try {
                const imageResponse = await fetch(imageUrl);
                if (!imageResponse.ok) continue;

                const imageBuffer = await imageResponse.arrayBuffer();
                const contentType = imageResponse.headers.get("content-type") || "";

                let image;
                if (contentType.includes("png") || imageUrl.toLowerCase().includes(".png")) {
                    image = await pdfDoc.embedPng(imageBuffer);
                } else {
                    image = await pdfDoc.embedJpg(imageBuffer);
                }

                const page = pdfDoc.addPage([image.width, image.height]);
                page.drawImage(image, {
                    x: 0,
                    y: 0,
                    width: image.width,
                    height: image.height,
                });
            } catch (imgError) {
                console.error(`Error processing image ${i + 1}:`, imgError);
            }
        }

        const pdfBytes = await pdfDoc.save();
        const fileName = `${paperData.semesterLabel}_${paperData.batch}_${paperData.examType}${subject ? `_${subject}` : ""}.pdf`
            .replace(/[^a-zA-Z0-9._-]/g, "_");

        return new NextResponse(pdfBytes, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${fileName}"`,
            },
        });
    } catch (error) {
        console.error("POST /api/question-papers/tree/[semester]/[batch]/[examType]/download-pdf error:", error);
        return NextResponse.json(
            { error: "Failed to generate PDF" },
            { status: 500 }
        );
    }
}
