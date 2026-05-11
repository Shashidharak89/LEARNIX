import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { buildSubjectPdfImages, getSubjectAggregate } from "../../../store";

export async function POST(req) {
    try {
        const pathname = req?.nextUrl?.pathname || "";
        const parts = pathname.split("/").filter(Boolean);
        const raw = parts[parts.length - 2] || "";
        const subject = decodeURIComponent(raw);

        const aggregate = getSubjectAggregate(subject);
        if (!aggregate) {
            return NextResponse.json({ error: "Subject not found" }, { status: 404 });
        }

        const images = buildSubjectPdfImages(subject);
        if (!images || !images.length) {
            return NextResponse.json({ error: "No images available for this subject" }, { status: 400 });
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
        const fileName = `${subject}.pdf`.replace(/[^a-zA-Z0-9._-]/g, "_");

        return new NextResponse(pdfBytes, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${fileName}"`,
            },
        });
    } catch (error) {
        console.error("POST /api/question-papers/subjects/[subject]/download-pdf error:", error);
        return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
    }
}
