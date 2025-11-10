// app/api/convert-docx/route.js
import { NextResponse } from "next/server";
import axios from "axios";
import FormData from "form-data";

const CONVERT_URL = "https://v2.convertapi.com/convert/docx/to/pdf";
const BEARER = process.env.CONVERTAPI_BEARER; // set this in .env.local

function short(s, n = 400) { return s && s.length > n ? s.slice(0, n) + '...': s; }

export async function POST(req) {
  try {
    if (!BEARER) {
      console.error("Missing CONVERTAPI_BEARER env var");
      return NextResponse.json({ error: "Server misconfiguration: missing API key" }, { status: 500 });
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!file) return NextResponse.json({ error: "No file uploaded. Use field name 'file'." }, { status: 400 });

    const buf = Buffer.from(await file.arrayBuffer());
    const fd = new FormData();
    fd.append("File", buf, {
      filename: file.name || "upload.docx",
      contentType: file.type || "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    // ask ConvertAPI to store the result so we can fetch it (StoreFile=true)
    fd.append("StoreFile", "true");

    // send to ConvertAPI
    const convRes = await axios.post(CONVERT_URL, fd, {
      headers: {
        Authorization: `Bearer ${BEARER}`,
        ...fd.getHeaders(),
      },
      responseType: "json",
      validateStatus: null,
      timeout: 120000,
    });

    // if ConvertAPI returned non-2xx, forward JSON (if any) for debugging
    if (convRes.status < 200 || convRes.status >= 300) {
      console.error("ConvertAPI non-2xx:", convRes.status, convRes.data);
      return NextResponse.json({ error: "ConvertAPI error", status: convRes.status, details: convRes.data }, { status: 502 });
    }

    // convRes.data is expected JSON containing file info; attempt to find PDF URL
    const data = convRes.data || {};
    // Try common paths (defensive)
    const tryPaths = [
      () => data?.Files?.[0]?.Url,
      () => data?.files?.[0]?.Url,
      () => data?.file?.url,
      () => data?.Files?.[0]?.Url,
      () => data?.Files?.[0]?.UrlFull,
      () => data?.Result?.Files?.[0]?.Url,
      () => data?.Files?.[0]?.Url, // fallback repeats — safe
    ];

    let pdfUrl = null;
    for (const fn of tryPaths) {
      try { const v = fn(); if (v) { pdfUrl = v; break; } } catch (e) { /* ignore */ }
    }

    // if we couldn't find a URL, but response contains binary? unlikely since we asked json.
    if (!pdfUrl) {
      // return full ConvertAPI response for debugging
      console.error("Could not find PDF URL in ConvertAPI response:", short(JSON.stringify(data), 2000));
      return NextResponse.json({ error: "Could not locate output file URL in ConvertAPI response", details: data }, { status: 502 });
    }

    // download the PDF from pdfUrl
    const pdfFetch = await axios.get(pdfUrl, {
      responseType: "arraybuffer",
      timeout: 120000,
      validateStatus: null,
    });

    if (pdfFetch.status < 200 || pdfFetch.status >= 300 || !pdfFetch.data) {
      console.error("Failed to fetch PDF URL:", pdfFetch.status, pdfFetch.data);
      return NextResponse.json({ error: "Failed to download PDF from ConvertAPI", status: pdfFetch.status }, { status: 502 });
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
    // attempt to extract pdf/api message
    let details = err?.message || "Conversion failed";
    try {
      if (err?.response?.data) {
        details = typeof err.response.data === "string" ? err.response.data : JSON.stringify(err.response.data);
      }
    } catch (e) {}
    return NextResponse.json({ error: "Server error", details }, { status: 500 });
  }
}
