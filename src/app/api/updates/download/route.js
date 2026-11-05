import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const fileUrl = url.searchParams.get("url");
    const nameParam = url.searchParams.get("name");
    const titleParam = url.searchParams.get("title");

    if (!fileUrl) {
      return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
    }

    // Allowlist: Cloudinary-hosted files or same-origin hosts
    try {
      const parsed = new URL(fileUrl);
      const host = parsed.hostname || "";
      if (
        !host.includes("cloudinary.com") &&
        !host.endsWith("res.cloudinary.com") &&
        !host.includes("learnix.dev")
      ) {
        return NextResponse.json(
          { error: "Download allowed only for Cloudinary-hosted files" },
          { status: 403 }
        );
      }
    } catch {
      return NextResponse.json({ error: "Invalid url" }, { status: 400 });
    }

    // Strip fl_attachment if present so remote server delivers clean raw file
    const cleanFetchUrl = fileUrl
      .replace("/upload/fl_attachment/", "/upload/")
      .replace(/\/upload\/fl_attachment:[^/]+\//, "/upload/");

    const resp = await fetch(cleanFetchUrl);
    if (!resp.ok) {
      return NextResponse.json(
        { error: `Failed to fetch file from remote source: HTTP ${resp.status}` },
        { status: 502 }
      );
    }

    const contentType = resp.headers.get("content-type") || "application/pdf";

    // Derive filename
    let filename = (nameParam || "").trim();
    const isGeneric =
      !filename ||
      /^blob(\.pdf)?$/i.test(filename) ||
      /^\d+[-_]blob(\.pdf)?$/i.test(filename);

    if (isGeneric) {
      if (titleParam && titleParam.trim()) {
        filename = titleParam.trim();
      } else {
        const fromUrl = cleanFetchUrl.split("?")[0].split("#")[0].split("/").pop();
        if (fromUrl && !/^blob(\.pdf)?$/i.test(fromUrl) && !/^\d+[-_]blob(\.pdf)?$/i.test(fromUrl)) {
          filename = fromUrl;
        } else {
          filename = "document";
        }
      }
    }

    // Ensure PDF extension
    if (!filename.toLowerCase().endsWith(".pdf")) {
      filename += ".pdf";
    }

    // Sanitize for HTTP headers
    const cleanName = filename.replace(/["\r\n]/g, "").trim();
    const safeAsciiFilename = cleanName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const encodedFilename = encodeURIComponent(cleanName);

    const headers = {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${safeAsciiFilename}"; filename*=UTF-8''${encodedFilename}`,
      "Access-Control-Allow-Origin": "*",
    };

    const contentLength = resp.headers.get("content-length");
    if (contentLength) {
      headers["Content-Length"] = contentLength;
    }

    return new NextResponse(resp.body, {
      status: 200,
      headers,
    });
  } catch (err) {
    console.error("GET /api/updates/download error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
