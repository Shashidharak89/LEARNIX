import { NextResponse } from "next/server";
import { seedQPImagesData } from "@/lib/qpImagesSeeder";

export async function GET(req) {
    try {
        const isLocalhost = req.headers.get("host")?.includes("localhost") ||
            req.headers.get("host")?.includes("127.0.0.1");

        if (!isLocalhost) {
            return NextResponse.json(
                { success: false, message: "Unauthorized - localhost only" },
                { status: 401 }
            );
        }

        const result = await seedQPImagesData();

        return NextResponse.json(
            {
                success: true,
                message: "QP Images data seeded successfully",
                data: result.data
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error in QP Images seed endpoint:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Failed to seed QP Images data",
                error: error.message
            },
            { status: 500 }
        );
    }
}
