import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import { getFirebaseAdminApp } from "@/lib/firebaseAdmin";

const SECRET_KEY = process.env.SECRET_KEY || "mysecretkey";

const generateToken = (userId, usn) => {
    return jwt.sign({ userId, usn }, SECRET_KEY, { expiresIn: "30d" });
};

export async function POST(req) {
    try {
        await connectDB();
        
        let body;
        try {
            body = await req.json();
        } catch (e) {
            body = {};
        }

        const { idToken } = body;

        // 1. Validation: Reject request if idToken is missing
        if (!idToken) {
            return NextResponse.json(
                { success: false, message: "Missing token" },
                { status: 400 }
            );
        }

        let firebaseAdmin;
        try {
            firebaseAdmin = getFirebaseAdminApp();
        } catch (error) {
            console.error("Firebase Admin Initialization Error:", error);
            return NextResponse.json(
                { success: false, message: "Internal server error" },
                { status: 500 }
            );
        }

        // 2. Validation: Verify the Firebase ID Token using Firebase Admin SDK
        let decodedToken;
        try {
            decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
        } catch (error) {
            // Security: Reject expired tokens
            if (error.code === "auth/id-token-expired") {
                return NextResponse.json(
                    { success: false, message: "Expired Firebase token" },
                    { status: 401 }
                );
            }
            // Security: Reject invalid tokens or tokens not from this project
            return NextResponse.json(
                { success: false, message: "Invalid Firebase token" },
                { status: 401 }
            );
        }

        // 3. Extract verified data
        // Do not trust any email, uid, name sent by the client. Only trust this decodedToken.
        const { email, email_verified } = decodedToken;

        // Security: Reject if email_verified is false
        if (!email_verified) {
            return NextResponse.json(
                { success: false, message: "Email not verified" },
                { status: 403 }
            );
        }

        // 4. User lookup: Find user by email using the existing User model
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            // Do NOT create a user yet. Return 404.
            return NextResponse.json(
                { success: false, message: "Account not found" },
                { status: 404 }
            );
        }

        // 5. Success: Generate the application's existing JWT
        const token = generateToken(user._id.toString(), user.usn);

        return NextResponse.json(
            {
                success: true,
                message: "Authentication successful",
                token: token,
                user: {
                    _id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                },
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("POST /api/auth/android/signin error:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
