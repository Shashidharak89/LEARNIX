import { NextResponse } from "next/server";
import { resolveAuthenticatedUser } from "@/lib/authUser";

export async function GET(req) {
    try {
        // Verify and get the authenticated user using the provided token
        const user = await resolveAuthenticatedUser(req);

        if (!user) {
            return NextResponse.json(
                { success: false, message: "Unauthorized or invalid token" },
                { status: 401 }
            );
        }

        // Return the user's balance, defaulting to 0 if not found
        const balance = (typeof user.balance === 'number' && user.balance != null) ? user.balance : 0;

        return NextResponse.json(
            {
                success: true,
                message: "Balance fetched successfully",
                balance: balance
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching balance:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
