import { NextResponse } from "next/server";
import { resolveAuthenticatedUser } from "@/lib/authUser";
import User from "@/models/User";

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

        // Update the balance directly in the database using findByIdAndUpdate. 
        // If balance doesn't exist, $inc automatically treats it as 0 and adds 1.
        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            { $inc: { balance: 1 } },
            { new: true } // Return the updated document
        );

        return NextResponse.json(
            {
                success: true,
                message: "Balance updated successfully",
                balance: updatedUser.balance
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
