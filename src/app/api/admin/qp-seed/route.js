import { NextResponse } from "next/server";
import { resolveAuthenticatedUser } from "@/lib/authUser";
import { seedQPData } from "@/lib/qpSeeder";

export async function POST(req) {
    try {
        // Verify user is authenticated
        const user = await resolveAuthenticatedUser(req);

        if (!user) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        // Check if user is admin
        if (user.role !== "admin" && user.role !== "superadmin") {
            return NextResponse.json(
                { success: false, message: "Only admins can seed data" },
                { status: 403 }
            );
        }

        // Seed the data
        const result = await seedQPData();

        return NextResponse.json(
            {
                success: true,
                message: result.message,
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

// Optional: GET endpoint to trigger seeding
export async function GET(req) {
    try {
        const user = await resolveAuthenticatedUser(req);

        if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
            return NextResponse.json(
                { success: false, message: "Unauthorized or not an admin" },
                { status: 401 }
            );
        }

        const result = await seedQPData();

        return NextResponse.json(
            {
                success: true,
                message: result.message,
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
