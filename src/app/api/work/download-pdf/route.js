import { NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs/promises";
import path from "path";
import * as fontkit from "fontkit";

export async function POST(req) {
  try {
    const { topicId, user, subject, topic, startPage, endPage, allPages, selectedPages } = await req.json();

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
    
    // Create a new PDF document to work with
    const pdfDoc = await PDFDocument.load(templateBytes);
    
    // Register fontkit
    pdfDoc.registerFontkit(fontkit);

    // Get the first page (template page)
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    // Embed fonts - using standard fonts that closely match common fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Prepare replacement values
    const replacements = {
      '[name]': { value: user.name, size: 14, bold: true, color: rgb(0, 0, 0) },
      '[usn]': { value: user.usn, size: 12, bold: false, color: rgb(0, 0, 0) },
      '[date]': { 
        value: new Date(topic.timestamp).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }), 
        size: 12, 
        bold: false, 
        color: rgb(0, 0, 0) 
      },
      '[subjectname]': { value: subject.subject, size: 14, bold: true, color: rgb(0, 0, 0) },
      '[topicname]': { value: topic.topic, size: 16, bold: true, color: rgb(0.1, 0.3, 0.6) },
      '[topicid]': { value: topicId, size: 10, bold: false, color: rgb(0.4, 0.4, 0.4) },
    };

    // Get the content of the first page
    const pageContent = firstPage.node.Contents();
    
    // Since we can't directly edit text in PDF, we'll overlay rectangles and new text
    // We need to find approximate positions of placeholders and cover them
    
    // Common positions for a standard template (adjust based on your template)
    const placeholderPositions = {
      '[name]': { x: 180, y: 285, width: 350 },
      '[usn]': { x: 180, y: 315, width: 350 },
      '[subjectname]': { x: 180, y: 385, width: 350 },
      '[topicname]': { x: 180, y: 455, width: 350 },
      '[date]': { x: 180, y: 515, width: 350 },
      '[topicid]': { x: 180, y: 675, width: 350 },
    };

    // For each placeholder, draw a white rectangle to cover it and add the replacement text
    Object.keys(replacements).forEach((placeholder) => {
      const position = placeholderPositions[placeholder];
      const replacement = replacements[placeholder];
      
      if (position && replacement) {
        // Calculate text height based on font size
        const textHeight = replacement.size + 4;
        
        // Draw white rectangle to cover the placeholder
        firstPage.drawRectangle({
          x: position.x - 5,
          y: height - position.y - textHeight,
          width: position.width,
          height: textHeight + 2,
          color: rgb(1, 1, 1),
          borderColor: rgb(1, 1, 1),
          borderWidth: 0,
        });

        // Draw the replacement text
        firstPage.drawText(replacement.value, {
          x: position.x,
          y: height - position.y,
          size: replacement.size,
          font: replacement.bold ? fontBold : font,
          color: replacement.color,
        });
      }
    });

    // Process and add images starting from page 2
    const validImages = topic.images.filter((url) => url && url.trim() !== "");

    // Determine which images to include
    const total = validImages.length;
    let rangedImages = validImages;

    if (Array.isArray(selectedPages) && selectedPages.length > 0) {
      const uniqueSelection = Array.from(new Set(selectedPages.map((n) => parseInt(n, 10)))).filter((n) => !Number.isNaN(n) && n >= 1 && n <= total).sort((a, b) => a - b);
      rangedImages = uniqueSelection.map((n) => validImages[n - 1]).filter(Boolean);
    } else if (!allPages) {
      let sliceStart = 1;
      let sliceEnd = total;
      const s = Math.max(1, Math.min(total, parseInt(startPage, 10) || 1));
      const e = Math.max(s, Math.min(total, parseInt(endPage, 10) || total));
      sliceStart = s;
      sliceEnd = e;
      rangedImages = validImages.slice(sliceStart - 1, sliceEnd);
    }

    if (!rangedImages.length) {
      return NextResponse.json(
        { error: "Selected page range has no images" },
        { status: 400 }
      );
    }
    
    for (let i = 0; i < rangedImages.length; i++) {
      const imageUrl = rangedImages[i];
      
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
