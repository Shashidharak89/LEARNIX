import { NextResponse } from "next/server";
import { resolveAuthenticatedUser } from "@/lib/authUser";

export async function GET(req) {
    try {
        // Verify and get the authenticated user
        const user = await resolveAuthenticatedUser(req);

        if (!user) {
            return NextResponse.json(
                { success: false, message: "Unauthorized or invalid token" },
                { status: 401 }
            );
        }

        // Initialize balance to 0 if it doesn't exist, then increment by 1
        if (typeof user.balance !== 'number' || user.balance == null) {
            user.balance = 0;
        }
        user.balance += 1;

        // Save the updated user
        await user.save();

        return NextResponse.json(
            {
                success: true,
                message: "Balance updated successfully",
                balance: user.balance
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error updating balance:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
