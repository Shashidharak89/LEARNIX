import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/db.js";
import TextShare from "../../../models/TextShare.js";

// Generate a random 6-character code
function generateCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(req) {
  try {
    await connectDB();
    const { text } = await req.json();
    if (!text || typeof text !== 'string' || text.length === 0) {
      return NextResponse.json({ error: 'Text is required.' }, { status: 400 });
    }
    let code;
    let exists = true;
    // Ensure unique code
    while (exists) {
      code = generateCode();
      exists = await TextShare.findOne({ code });
    }
    const doc = await TextShare.create({ text, code });
    return NextResponse.json({ code });
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
    return NextResponse.json({ text: doc.text });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch text.' }, { status: 500 });
  }
}
