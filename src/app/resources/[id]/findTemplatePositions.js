// Helper script to find text positions in the template PDF
// Run this with: node findTemplatePositions.js

import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function findPlaceholders() {
  try {
    const templatePath = path.join(__dirname, 'download-resource-template.pdf');
    const templateBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);
    
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();
    
    console.log('\n=== PDF Template Information ===');
    console.log(`Page Width: ${width}`);
    console.log(`Page Height: ${height}`);
    console.log(`\nNote: PDF coordinates start from bottom-left corner`);
    console.log(`For pdf-lib, Y coordinate = ${height} - Y_from_top`);
    
    console.log('\n=== Placeholder Positions ===');
    console.log('Look for these placeholders in your template:');
    console.log('[name] - Student name');
    console.log('[usn] - Student USN');
    console.log('[date] - Date');
    console.log('[subjectname] - Subject name');
    console.log('[topicname] - Topic name');
    console.log('[topicid] - Topic ID');
    
    console.log('\n=== Instructions ===');
    console.log('1. Open download-resource-template.pdf in a PDF viewer');
    console.log('2. Note the positions of each [placeholder]');
    console.log('3. Update the coordinates in the API route');
    console.log('4. Common positions (adjust as needed):');
    console.log('   - Title area: y = 100-200 from top');
    console.log('   - Content area: y = 200-400 from top');
    console.log('   - Footer area: y = 600-700 from top');
    
  } catch (error) {
    console.error('Error reading template:', error);
  }
}

findPlaceholders();
