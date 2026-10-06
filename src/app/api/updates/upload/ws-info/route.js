import { NextResponse } from "next/server";
import { getOrStartWsServer } from "@/lib/updatesWsServer";

export async function GET() {
  try {
    const wsInstance = getOrStartWsServer();
    const port = wsInstance?.port || Number(process.env.WS_PORT) || 5001;

    return NextResponse.json({
      success: true,
      port,
      path: "/ws/updates-upload",
      active: true
    }, { status: 200 });
  } catch (err) {
    console.error("GET /api/updates/upload/ws-info error:", err);
    return NextResponse.json({
      success: false,
      error: err.message
    }, { status: 500 });
  }
}
