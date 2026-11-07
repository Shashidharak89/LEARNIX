import { NextResponse } from "next/server";
import { getOrStartWsServer } from "@/lib/updatesWsServer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const wsInstance = getOrStartWsServer();
    const port = wsInstance?.port || Number(process.env.WS_PORT) || 5001;

    return NextResponse.json({
      success: true,
      port,
      active: true,
    });
  } catch (err) {
    console.error("[GET /api/compiler/ws-info error]:", err);
    return NextResponse.json({
      success: true,
      port: Number(process.env.WS_PORT) || 5001,
      active: false,
      error: err.message,
    });
  }
}

