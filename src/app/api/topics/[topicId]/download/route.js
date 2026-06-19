import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Topic from "@/models/Topic";
import { resolveAuthenticatedUser } from "@/lib/authUser";
import { PDFDocument } from "pdf-lib";

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { topicId } = params;

    if (!topicId) {
      return NextResponse.json({ error: "Topic ID is required" }, { status: 400 });
    }

    const topic = await Topic.findById(topicId);

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    // Check visibility and authentication
    if (topic.visibility === "private") {
      const userResult = await resolveAuthenticatedUser(req, { withMeta: true });
      if (!userResult.user) {
        return NextResponse.json(
          { error: "Unauthorized. You must be verified to download this private topic." },
          { status: 401 }
        );
      }
      // Optional: Check if the user is the owner of the topic
      // if (topic.userId.toString() !== userResult.user._id.toString()) {
      //   return NextResponse.json({ error: "Forbidden. You do not own this topic." }, { status: 403 });
      // }
    }

    if (!topic.images || topic.images.length === 0) {
      return NextResponse.json({ error: "No images found for this topic to generate a PDF" }, { status: 404 });
    }

    // Create a new PDF Document
    const pdfDoc = await PDFDocument.create();

    // Process each image
    for (const imageUrl of topic.images) {
      try {
        // Ensure image is returned as JPG from Cloudinary for pdf-lib compatibility
        let fetchUrl = imageUrl;
        if (fetchUrl.includes('cloudinary.com') && !fetchUrl.includes('/f_jpg/')) {
           fetchUrl = fetchUrl.replace('/upload/', '/upload/f_jpg/');
        }

        const response = await fetch(fetchUrl);
        if (!response.ok) {
          console.error(`Failed to fetch image: ${fetchUrl}`);
          continue;
        }

        const imageBuffer = await response.arrayBuffer();
        
        let pdfImage;
        try {
            // Try to embed as JPEG first
            pdfImage = await pdfDoc.embedJpg(imageBuffer);
        } catch (e) {
            // Fallback to PNG
            pdfImage = await pdfDoc.embedPng(imageBuffer);
        }

        const { width, height } = pdfImage.scale(1);
        
        // Add a blank page to the document with the dimensions of the image
        const page = pdfDoc.addPage([width, height]);

        // Draw the image on the page
        page.drawImage(pdfImage, {
          x: 0,
          y: 0,
          width: width,
          height: height,
        });
      } catch (err) {
        console.error("Error embedding image into PDF:", err);
      }
    }

    // Serialize the PDFDocument to bytes (a Uint8Array)
    const pdfBytes = await pdfDoc.save();

    // Return the PDF as a downloadable response
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${topic.topic.replace(/[^a-zA-Z0-9]/g, '_') || 'topic'}.pdf"`,
      },
    });

  } catch (error) {
    console.error("Topic Download API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
