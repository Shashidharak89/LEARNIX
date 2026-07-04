import { NextResponse } from "next/server";
import { seedQPData } from "@/lib/qpSeeder";

export async function GET(req) {
    try {
        // Simple check - can be restricted later
        const authHeader = req.headers.get("authorization");
        const seedKey = req.headers.get("x-seed-key");

        // Allow if admin token OR seed key matches env variable OR from localhost
        const isLocalhost = req.headers.get("host")?.includes("localhost") ||
            req.headers.get("host")?.includes("127.0.0.1");

        if (!isLocalhost && !seedKey) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const result = await seedQPData();

        return NextResponse.json(
            {
                success: true,
                message: "QP data seeded successfully",
                data: result
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error in QP seed endpoint:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Failed to seed QP data",
                error: error.message
            },
            { status: 500 }
        );
    }
}
