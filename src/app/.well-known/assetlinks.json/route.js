import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const packageName = process.env.ANDROID_PACKAGE_NAME || "";
  const sha256 = process.env.ANDROID_SHA256_FINGERPRINT || "";

  const assetlinks = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: packageName,
        sha256_cert_fingerprints: [sha256]
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
