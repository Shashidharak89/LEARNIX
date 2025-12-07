// Script to extract text positions from PDF template
// Run: node extractPlaceholderPositions.js

import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function extractTextPositions() {
  try {
    console.log('\n🔍 Analyzing PDF template...\n');
    
    const templatePath = path.join(__dirname, 'download-resource-template.pdf');
    const templateBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);
    
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();
    
    console.log('📄 PDF Information:');
    console.log(`   Width: ${width.toFixed(2)} points`);
    console.log(`   Height: ${height.toFixed(2)} points`);
    console.log(`   Format: ${width > 600 ? 'A4 Portrait' : 'Letter'}`);
    
    console.log('\n📝 Instructions:');
    console.log('1. Open download-resource-template.pdf in your PDF viewer');
    console.log('2. For each placeholder, measure its position from the top-left corner');
    console.log('3. Update the placeholderPositions in the API route.js file\n');
    
    console.log('🎯 Placeholders to locate:');
    const placeholders = [
      { name: '[name]', description: 'Student name' },
      { name: '[usn]', description: 'Student USN' },
      { name: '[subjectname]', description: 'Subject name' },
      { name: '[topicname]', description: 'Topic name' },
      { name: '[date]', description: 'Date' },
      { name: '[topicid]', description: 'Topic ID' },
    ];
    
    placeholders.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name.padEnd(16)} - ${p.description}`);
    });
    
    console.log('\n💡 Tips for finding positions:');
    console.log('   - Use a PDF editor with ruler/coordinate display');
    console.log('   - Measure from top-left corner');
    console.log('   - X = horizontal distance from left edge');
    console.log('   - Y = vertical distance from top edge');
    console.log('   - Add ~10-20pt width buffer to cover the entire placeholder');
    
    console.log('\n📋 Current placeholder positions in code:');
    console.log(`
const placeholderPositions = {
  '[name]':        { x: 180, y: 285, width: 350 },
  '[usn]':         { x: 180, y: 315, width: 350 },
  '[subjectname]': { x: 180, y: 385, width: 350 },
  '[topicname]':   { x: 180, y: 455, width: 350 },
  '[date]':        { x: 180, y: 515, width: 350 },
  '[topicid]':     { x: 180, y: 675, width: 350 },
};
`);
    
    console.log('✅ Adjust these values based on your template layout\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

extractTextPositions();
