// Test script to check if upload works
import FormData from 'form-data';
import fs from 'fs';

const testUpload = async () => {
  try {
    const form = new FormData();
    // Create a simple test file content
    const testContent = 'Hello, this is a test file!';
    const buffer = Buffer.from(testContent);

    // Create a test file blob-like object
    const testFile = {
      name: 'test.txt',
      type: 'text/plain',
      size: buffer.length,
      arrayBuffer: () => Promise.resolve(buffer)
    };

    form.append('file', testFile);

    const response = await fetch('http://localhost:3000/api/file/upload', {
      method: 'POST',
      body: form
    });

    const data = await response.json();
    console.log('Upload response:', data);

  } catch (error) {
    console.error('Test upload failed:', error);
  }
};

};

testUpload();
