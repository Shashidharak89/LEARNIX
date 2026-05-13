import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { getFirebaseAdminApp } from "@/lib/firebaseAdmin"; // Lazy Firebase Admin initializer

// If you have a Web Client ID in env, it goes here
const GOOGLE_CLIENT_ID = process.env.CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client();

const SECRET_KEY = process.env.SECRET_KEY || "mysecretkey";
const DEFAULT_PROFILE_IMG =
    "https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp";

const generateToken = (userId, usn) =>
    jwt.sign({ userId, usn }, SECRET_KEY, { expiresIn: "30d" });

export async function POST(req) {
    try {
        await connectDB();
        const body = await req.json().catch(() => ({}));

        // Expecting ID token (credential) and optionally usn/name from the Android app
        const credential = String(body?.credential || "").trim();
        const usn = String(body?.usn || "").trim().toUpperCase();

        if (!credential) {
            return NextResponse.json(
                { error: "Credential (ID Token) is required." },
                { status: 400 }
            );
        }

        // 1. Decode token to check payload without verifying signature yet
        const decoded = jwt.decode(credential);
        if (!decoded || !decoded.email) {
            return NextResponse.json(
                { error: "Invalid token or no email found in token." },
                { status: 400 }
            );
        }

        let email = decoded.email.toLowerCase();
        let name = decoded.name || "App Google User";
        let picture = decoded.picture || DEFAULT_PROFILE_IMG;

        // 2. Validate Google ID Token or Firebase ID token securely
        const iss = String(decoded.iss);
        if (iss.includes("securetoken.google.com") || iss.includes("firebase")) {
            // Validate Firebase token
            try {
                const firebaseAdmin = getFirebaseAdminApp();
                const decodedFirebaseToken = await firebaseAdmin.auth().verifyIdToken(credential);
                email = decodedFirebaseToken.email.toLowerCase();
                name = decodedFirebaseToken.name || name;
                picture = decodedFirebaseToken.picture || picture;
            } catch (err) {
                console.warn("Failed to verify Firebase token:", err.message);
                return NextResponse.json(
                    { error: "Invalid Firebase token signature." },
                    { status: 401 }
                );
            }
        } else if (iss.includes("accounts.google.com")) {
            try {
                // Collect valid audiences (Web client ID + whatever Android Client ID sent it)
                const audiences = [decoded.aud];
                if (GOOGLE_CLIENT_ID) audiences.push(GOOGLE_CLIENT_ID);

                const ticket = await googleClient.verifyIdToken({
                    idToken: credential,
                    audience: audiences,
                });

                const payload = ticket.getPayload();
                email = payload.email.toLowerCase();
                name = payload.name || name;
                picture = payload.picture || picture;
            } catch (err) {
                console.warn("Failed to verify Google token:", err.message);
                return NextResponse.json(
                    { error: "Invalid Google token signature." },
                    { status: 401 }
                );
            }
        } else {
            return NextResponse.json(
                { error: "Unrecognized token issuer." },
                { status: 401 }
            );
        }

        // 3. Unified Login or Signup logic
        let user = await User.findOne({ email });

        // Path A: User exists -> Log them in immediately
        if (user) {
            if (!user.role) user.role = "user";
            if (!user.plan) user.plan = "basic";

            // If user provided a usn, but the existing account's USN is different,
            // it's fine, we log them into their linked email account.

            const token = generateToken(user._id.toString(), user.usn);
            user.token = token;
            user.tokenCreatedAt = new Date();
            await user.save();

            return NextResponse.json(
                {
                    message: "Logged in successfully with Google.",
                    user: {
                        name: user.name,
                        usn: user.usn,
                        email: user.email,
                        profileimg: user.profileimg,
                        role: user.role,
                        plan: user.plan,
                    },
                    token,
                },
                { status: 200 }
            );
        }

        // Path B: User does NOT exist, and USN is MISSING -> require USN
        if (!usn) {
            return NextResponse.json(
                {
                    error: "ACCOUNT_NOT_FOUND",
                    message: "Account not found. Please provide your USN to register.",
                    requiresUsn: true,
                    email: email
                },
                { status: 404 }
            );
        }

        // Path C: User does NOT exist, but USN IS provided -> Register them
        const existingByUsn = await User.findOne({ usn });
        if (existingByUsn) {
            return NextResponse.json(
                { error: "This USN is already registered to another user." },
                { status: 409 }
            );
        }

        user = new User({
            name,
            usn,
            email,
            password: "", // Left relatively blank, assuming OAuth login
            profileimg: picture,
            role: "user",
            plan: "basic",
        });

        const token = generateToken(user._id.toString(), user.usn);
        user.token = token;
        user.tokenCreatedAt = new Date();
        await user.save();

        return NextResponse.json(
            {
                message: "Account created and logged in securely.",
                user: {
                    name: user.name,
                    usn: user.usn,
                    email: user.email,
                    profileimg: user.profileimg,
                    role: user.role,
                    plan: user.plan,
                },
                token,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("POST /api/auth/app-google error:", error);
        return NextResponse.json(
            { error: "Authentication failed due to server error." },
            { status: 500 }
        );
    }
}
