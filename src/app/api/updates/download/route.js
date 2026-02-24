import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const fileUrl = url.searchParams.get('url');
    const nameParam = url.searchParams.get('name');

    if (!fileUrl) return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });

    // Basic allowlist: only allow Cloudinary-hosted files to be proxied
    try {
      const parsed = new URL(fileUrl);
      const host = parsed.hostname || '';
      if (!host.includes('cloudinary.com') && !host.endsWith('res.cloudinary.com')) {
        return NextResponse.json({ error: 'Download allowed only for Cloudinary-hosted files' }, { status: 403 });
      }
    } catch (e) {
      return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
    }

    const resp = await fetch(fileUrl);
    if (!resp.ok) return NextResponse.json({ error: 'Failed to fetch file' }, { status: 502 });

    const contentType = resp.headers.get('content-type') || 'application/octet-stream';
    const arrayBuffer = await resp.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Derive filename
    let filename = nameParam || fileUrl.split('/').pop() || 'file';
    // sanitize filename
    filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('GET /api/updates/download error:', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
