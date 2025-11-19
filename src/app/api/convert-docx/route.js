// app/api/convert-docx/route.js
import { NextResponse } from "next/server";
import axios from "axios";
import FormData from "form-data";

const ILOVE_API_KEY = process.env.I_LOVE_API;

export async function POST(req) {
  try {
    if (!ILOVE_API_KEY) {
      console.error("Missing I_LOVE_API env var");
      return NextResponse.json({ error: "Server misconfiguration: missing API key" }, { status: 500 });
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!file) return NextResponse.json({ error: "No file uploaded. Use field name 'file'." }, { status: 400 });

    const buf = Buffer.from(await file.arrayBuffer());

    // Step 1: Start task
    const startRes = await axios.post("https://api.ilovepdf.com/v1/start/Word2Pdf", {}, {
      headers: {
        Authorization: `Bearer ${ILOVE_API_KEY}`,
      },
      responseType: "json",
      timeout: 30000,
    });

    if (startRes.status !== 200) {
      console.error("Failed to start task:", startRes.data);
      return NextResponse.json({ error: "Failed to start conversion task" }, { status: 502 });
    }

    const taskToken = startRes.data.task;
    const serverFile = startRes.data.server_filename;
    const uploadUrl = `https://${serverFile}.ilovepdf.com/v1/upload?task=${taskToken}`;

    // Step 2: Upload file
    const fd = new FormData();
    fd.append("file", buf, {
      filename: file.name || "upload.docx",
      contentType: file.type || "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    const uploadRes = await axios.post(uploadUrl, fd, {
      headers: {
        ...fd.getHeaders(),
      },
      responseType: "json",
      timeout: 120000,
    });

    if (uploadRes.status !== 200) {
      console.error("Failed to upload file:", uploadRes.data);
      return NextResponse.json({ error: "Failed to upload file" }, { status: 502 });
    }

    const serverFilename = uploadRes.data.server_filename;

    // Step 3: Process
    const processRes = await axios.post("https://api.ilovepdf.com/v1/process", {
      task: taskToken,
    }, {
      headers: {
        Authorization: `Bearer ${ILOVE_API_KEY}`,
      },
      responseType: "json",
      timeout: 120000,
    });

    if (processRes.status !== 200) {
      console.error("Failed to process:", processRes.data);
      return NextResponse.json({ error: "Failed to process file" }, { status: 502 });
    }

    // Step 4: Download
    const downloadUrl = `https://api.ilovepdf.com/v1/download/${taskToken}`;
    const pdfFetch = await axios.get(downloadUrl, {
      headers: {
        Authorization: `Bearer ${ILOVE_API_KEY}`,
      },
      responseType: "arraybuffer",
      timeout: 120000,
    });

    if (pdfFetch.status !== 200 || !pdfFetch.data) {
      console.error("Failed to download PDF");
      return NextResponse.json({ error: "Failed to download PDF" }, { status: 502 });
    }

    const pdfBuf = Buffer.from(pdfFetch.data);
    const outName = (file.name || "converted").replace(/\.docx$/i, "") + ".pdf";
    return new Response(pdfBuf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(pdfBuf.length),
        "Content-Disposition": `attachment; filename="${encodeURIComponent(outName)}"`,
      },
    });

  } catch (err) {
    console.error("Conversion route error:", err?.response?.data || err?.message || err);
    let details = err?.message || "Conversion failed";
    try {
      if (err?.response?.data) {
        details = typeof err.response.data === "string" ? err.response.data : JSON.stringify(err.response.data);
      }
    } catch (e) {}
    return NextResponse.json({ error: "Server error", details }, { status: 500 });
  }
}
