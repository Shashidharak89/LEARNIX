import { NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import fs from "fs/promises";
import path from "path";

export async function POST(req) {
  try {
    const { topicId, user, subject, topic } = await req.json();

    if (!topic || !topic.images || topic.images.length === 0) {
      return NextResponse.json(
        { error: "No images available for this topic" },
        { status: 400 }
      );
    }

    // Load the template PDF
    const templatePath = path.join(
      process.cwd(),
      "src/app/works/[id]/download-resource-template.pdf"
    );
    const templateBytes = await fs.readFile(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);

    // Get the first page (template page)
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    // Embed fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Get page dimensions
    const { width, height } = firstPage.getSize();

    // Prepare replacement values
    const replacements = {
      '[name]': user.name,
      '[usn]': user.usn,
      '[date]': new Date(topic.timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      '[subjectname]': subject.subject,
      '[topicname]': topic.topic,
      '[topicid]': topicId,
    };

    // Function to draw text (Y coordinate from top)
    const drawText = (text, x, yFromTop, size = 12, fontType = font, color = rgb(0, 0, 0)) => {
      firstPage.drawText(text, {
        x,
        y: height - yFromTop,
        size,
        font: fontType,
        color,
      });
    };

    // Draw white rectangles to cover placeholders and write actual values
    // Adjust these coordinates based on your template layout
    // Standard A4 PDF: width=595.3, height=841.89
    
    // These are example positions - you'll need to adjust based on your template
    // Position format: (x, y_from_top, width, height, text, fontSize, isBold)
    const textPositions = [
      { x: 180, y: 285, w: 300, h: 20, value: replacements['[name]'], size: 14, bold: true },
      { x: 180, y: 315, w: 300, h: 20, value: replacements['[usn]'], size: 12, bold: false },
      { x: 180, y: 385, w: 300, h: 20, value: replacements['[subjectname]'], size: 14, bold: true },
      { x: 180, y: 455, w: 300, h: 25, value: replacements['[topicname]'], size: 16, bold: true, color: rgb(0.1, 0.3, 0.6) },
      { x: 180, y: 515, w: 300, h: 20, value: replacements['[date]'], size: 12, bold: false },
      { x: 180, y: 675, w: 300, h: 20, value: replacements['[topicid]'], size: 10, bold: false },
    ];

    // Draw white rectangles over placeholders and add actual text
    textPositions.forEach(pos => {
      // Draw white rectangle to cover placeholder
      firstPage.drawRectangle({
        x: pos.x - 5,
        y: height - pos.y - pos.h,
        width: pos.w,
        height: pos.h,
        color: rgb(1, 1, 1),
      });

      // Draw the actual text
      drawText(
        pos.value,
        pos.x,
        pos.y,
        pos.size,
        pos.bold ? fontBold : font,
        pos.color || rgb(0, 0, 0)
      );
    });

    // Process and add images starting from page 2
    const validImages = topic.images.filter((url) => url && url.trim() !== "");
    
    for (let i = 0; i < validImages.length; i++) {
      const imageUrl = validImages[i];
      
      try {
        // Fetch image
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) continue;
        
        const imageBuffer = await imageResponse.arrayBuffer();
        
        // Determine image type and embed
        let image;
        if (imageUrl.toLowerCase().includes('.png')) {
          image = await pdfDoc.embedPng(imageBuffer);
        } else {
          image = await pdfDoc.embedJpg(imageBuffer);
        }

        // Add a new page for each image
        const imagePage = pdfDoc.addPage();
        const pageWidth = imagePage.getWidth();
        const pageHeight = imagePage.getHeight();

        // Calculate dimensions to maximize image size while maintaining aspect ratio
        const imgWidth = image.width;
        const imgHeight = image.height;
        const margin = 20; // Small margin

        // Calculate scaling to fit page with margins
        const maxWidth = pageWidth - (2 * margin);
        const maxHeight = pageHeight - (2 * margin);
        
        const scaleX = maxWidth / imgWidth;
        const scaleY = maxHeight / imgHeight;
        const scale = Math.min(scaleX, scaleY);

        const scaledWidth = imgWidth * scale;
        const scaledHeight = imgHeight * scale;

        // Center the image on the page
        const x = (pageWidth - scaledWidth) / 2;
        const y = (pageHeight - scaledHeight) / 2;

        imagePage.drawImage(image, {
          x,
          y,
          width: scaledWidth,
          height: scaledHeight,
        });
      } catch (imgError) {
        console.error(`Error processing image ${i + 1}:`, imgError);
        // Continue with next image
      }
    }

    // Serialize the PDF
    const pdfBytes = await pdfDoc.save();

    // Create filename
    const fileName = `${topic.topic}_${subject.subject}_${user.name}`
      .replace(/[^a-zA-Z0-9]/g, "_") + ".pdf";

    // Return the PDF
    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
