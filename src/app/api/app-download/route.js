import { NextResponse } from "next/server";
import { APP_DOWNLOAD } from "@/lib/appDownload";

function parseVersion(version = "") {
    return String(version)
        .trim()
        .split(".")
        .map((part) => Number.parseInt(part, 10))
        .map((num) => (Number.isNaN(num) ? 0 : num));
}

function compareVersions(a = "", b = "") {
    const partsA = parseVersion(a);
    const partsB = parseVersion(b);
    const maxLen = Math.max(partsA.length, partsB.length);

    for (let i = 0; i < maxLen; i += 1) {
        const numA = partsA[i] ?? 0;
        const numB = partsB[i] ?? 0;

        if (numA > numB) return 1;
        if (numA < numB) return -1;
    }

    return 0;
}

export async function POST(req) {
    try {
        const body = await req.json().catch(() => ({}));
        const clientVersion = body?.version;

        if (!clientVersion) {
            return NextResponse.json(
                { error: "version is required" },
                { status: 400 }
            );
        }

        const latestVersion = APP_DOWNLOAD.version;
        const comparison = compareVersions(clientVersion, latestVersion);

        if (comparison >= 0) {
            return new NextResponse(null, { status: 204 });
        }

        return NextResponse.json({
            updateAvailable: true,
            latestVersion,
            downloadUrl: APP_DOWNLOAD.url,
        });
    } catch (error) {
        console.error("POST /api/app-download error:", error);
        return NextResponse.json(
            { error: "Failed to check app download" },
            { status: 500 }
        );
    }
}
