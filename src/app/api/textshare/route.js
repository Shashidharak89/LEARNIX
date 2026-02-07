import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/db.js";
import TextShare from "../../../models/TextShare.js";

// Generate a random 6-character lowercase code
function generateCode(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(req) {
  try {
    await connectDB();
    const { text, editAccess, customCode, checkOnly } = await req.json();
    
    // Check availability only (for custom code feature)
    if (checkOnly && customCode) {
      const cleanCode = customCode.toLowerCase().trim();
      if (!cleanCode || cleanCode.length < 3 || cleanCode.length > 20) {
        return NextResponse.json({ error: 'Code must be 3-20 characters.' }, { status: 400 });
      }
      if (!/^[a-z0-9]+$/.test(cleanCode)) {
        return NextResponse.json({ error: 'Only lowercase letters and numbers allowed.' }, { status: 400 });
      }
      const exists = await TextShare.findOne({ code: cleanCode });
      return NextResponse.json({ 
        available: !exists,
        code: cleanCode 
      });
    }
    
    if (!text || typeof text !== 'string' || text.length === 0) {
      return NextResponse.json({ error: 'Text is required.' }, { status: 400 });
    }
    
    let code;
    
    // Use custom code if provided
    if (customCode) {
      const cleanCode = customCode.toLowerCase().trim();
      if (!cleanCode || cleanCode.length < 3 || cleanCode.length > 20) {
        return NextResponse.json({ error: 'Code must be 3-20 characters.' }, { status: 400 });
      }
      if (!/^[a-z0-9]+$/.test(cleanCode)) {
        return NextResponse.json({ error: 'Only lowercase letters and numbers allowed.' }, { status: 400 });
      }
      const exists = await TextShare.findOne({ code: cleanCode });
      if (exists) {
        return NextResponse.json({ error: 'This code is already taken.' }, { status: 409 });
      }
      code = cleanCode;
    } else {
      // Generate random code
      let exists = true;
      while (exists) {
        code = generateCode();
        exists = await TextShare.findOne({ code });
      }
    }
    
    const doc = await TextShare.create({ 
      text, 
      code, 
      editAccess: editAccess === true 
    });
    return NextResponse.json({ code, editAccess: doc.editAccess });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save text.' }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    if (!code) {
      return NextResponse.json({ error: 'Code is required.' }, { status: 400 });
    }
    const doc = await TextShare.findOne({ code });
    if (!doc) {
      return NextResponse.json({ error: 'Text not found.' }, { status: 404 });
    }
    return NextResponse.json({ 
      text: doc.text, 
      editAccess: doc.editAccess 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch text.' }, { status: 500 });
  }
}

// PUT - Update text or editAccess
export async function PUT(req) {
  try {
    await connectDB();
    const { code, text, editAccess, updateAccessOnly } = await req.json();
    
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Code is required.' }, { status: 400 });
    }
    
    const doc = await TextShare.findOne({ code });
    if (!doc) {
      return NextResponse.json({ error: 'Text not found.' }, { status: 404 });
    }
    
    // If updating access only (admin action from localStorage)
    if (updateAccessOnly === true) {
      doc.editAccess = editAccess === true;
      await doc.save();
      return NextResponse.json({ 
        success: true, 
        editAccess: doc.editAccess,
        message: 'Access updated successfully.' 
      });
    }
    
    // Otherwise updating text content
    if (!text || typeof text !== 'string' || text.length === 0) {
      return NextResponse.json({ error: 'Text is required.' }, { status: 400 });
    }
    
    if (!doc.editAccess) {
      return NextResponse.json({ error: 'This text is read-only and cannot be edited.' }, { status: 403 });
    }
    
    doc.text = text;
    await doc.save();
    
    return NextResponse.json({ 
      success: true, 
      text: doc.text,
      message: 'Text updated successfully.' 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update.' }, { status: 500 });
  }
}

// DELETE - Delete a text share entry
export async function DELETE(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    
    if (!code) {
      return NextResponse.json({ error: 'Code is required.' }, { status: 400 });
    }
    
    const doc = await TextShare.findOneAndDelete({ code });
    if (!doc) {
      return NextResponse.json({ error: 'Text not found.' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Text deleted successfully.' 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete text.' }, { status: 500 });
  }
}
