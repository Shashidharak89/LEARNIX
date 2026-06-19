import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

export async function POST(req) {
    try {
        const body = await req.json().catch(() => ({}));
        const images = body?.images || [];
        const requestedFileName = body?.fileName || "document";

        if (!Array.isArray(images) || images.length === 0) {
            return NextResponse.json(
                { error: "No images provided to generate PDF" },
                { status: 400 }
            );
        }

        const pdfDoc = await PDFDocument.create();

        for (let i = 0; i < images.length; i++) {
            const imageUrl = images[i];

            try {
                // Optimize for Cloudinary URLs if applicable, requesting JPG
                let fetchUrl = imageUrl;
                if (fetchUrl.includes('cloudinary.com') && !fetchUrl.includes('/f_jpg/')) {
                    fetchUrl = fetchUrl.replace('/upload/', '/upload/f_jpg/');
                }

                const imageResponse = await fetch(fetchUrl);
                if (!imageResponse.ok) continue;

                const imageBuffer = await imageResponse.arrayBuffer();
                const contentType = imageResponse.headers.get("content-type") || "";

                let image;
                if (contentType.includes("png") || fetchUrl.toLowerCase().includes(".png")) {
                    try {
                        image = await pdfDoc.embedPng(imageBuffer);
                    } catch (e) {
                        image = await pdfDoc.embedJpg(imageBuffer);
                    }
                } else {
                    try {
                        image = await pdfDoc.embedJpg(imageBuffer);
                    } catch (e) {
                        image = await pdfDoc.embedPng(imageBuffer);
                    }
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
        const fileName = `${requestedFileName.replace(/[^a-zA-Z0-9._-]/g, "_")}.pdf`;

        return new NextResponse(pdfBytes, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${fileName}"`,
            },
        });
    } catch (error) {
        console.error("POST /api/work/download-pdf error:", error);
        return NextResponse.json(
            { error: "Failed to generate PDF" },
            { status: 500 }
        );
    }
}
