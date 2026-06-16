import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const packageName = process.env.ANDROID_PACKAGE_NAME || "";
  const releaseSha256 = process.env.ANDROID_SHA256_FINGERPRINT || "";
  const debugSha256 = "A1:59:6C:A2:3B:77:B1:37:B7:7F:2F:DC:DA:4B:FA:59:23:A1:97:1B:0D:B8:EF:42:7B:BF:6A:2E:48:4D:37:CF";

  const assetlinks = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: packageName,
        sha256_cert_fingerprints: [releaseSha256, debugSha256].filter(Boolean)
      }
    }
  ];

  return NextResponse.json(assetlinks, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
