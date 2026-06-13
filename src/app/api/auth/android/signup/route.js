import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { getFirebaseAdminApp } from "@/lib/firebaseAdmin";
import { sendEvent, closeConnection } from "@/lib/sseManager";

const SECRET_KEY = process.env.SECRET_KEY || "mysecretkey";

const generateToken = (userId, usn) => {
    return jwt.sign({ userId, usn }, SECRET_KEY, { expiresIn: "30d" });
};

const generateRandomPassword = (length = 10) => {
    return crypto.randomBytes(Math.ceil(length / 2)).toString("hex").slice(0, length);
};

export async function POST(req) {
    let currentRequestId = null;
    
    try {
        await connectDB();
        
        let body;
        try {
            body = await req.json();
        } catch (e) {
            body = {};
        }

        const { idToken, requestId } = body;
        currentRequestId = requestId;

        // Validation: Reject request if idToken is missing
        if (!idToken) {
            if (requestId) sendEvent(requestId, { error: "Missing token" });
            if (requestId) closeConnection(requestId);
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
            if (requestId) sendEvent(requestId, { error: "Internal server error" });
            if (requestId) closeConnection(requestId);
            return NextResponse.json(
                { success: false, message: "Internal server error" },
                { status: 500 }
            );
        }

        // Verify Firebase Token
        let decodedToken;
        try {
            decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
        } catch (error) {
            if (requestId) sendEvent(requestId, { error: "Invalid Firebase token" });
            if (requestId) closeConnection(requestId);
            
            if (error.code === "auth/id-token-expired") {
                return NextResponse.json(
                    { success: false, message: "Expired Firebase token" },
                    { status: 401 }
                );
            }
            return NextResponse.json(
                { success: false, message: "Invalid Firebase token" },
                { status: 401 }
            );
        }

        const { email, name, picture, email_verified } = decodedToken;

        if (!email_verified) {
            if (requestId) sendEvent(requestId, { error: "Email not verified" });
            if (requestId) closeConnection(requestId);
            return NextResponse.json(
                { success: false, message: "Email not verified" },
                { status: 403 }
            );
        }

        const userEmail = email.toLowerCase();
        
        if (requestId) sendEvent(requestId, { step: 1, message: "User existence checked" });
        
        // 1. Check if user already exists
        const existingUser = await User.findOne({ email: userEmail });
        if (existingUser) {
            if (requestId) sendEvent(requestId, { error: "Account already exists" });
            if (requestId) closeConnection(requestId);
            return NextResponse.json(
                { success: false, message: "Account already exists with this email" },
                { status: 409 }
            );
        }
        
        if (requestId) sendEvent(requestId, { step: 2, message: "USN generated" });

        // 2. Generate Base USN from the first part of the email
        let baseUsn = email.split('@')[0].toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (!baseUsn) {
            baseUsn = "USER"; // Fallback
        }
        
        let finalUsn = baseUsn;
        let counter = 1;
        
        // 3. Ensure USN is unique
        while (await User.findOne({ usn: finalUsn })) {
            finalUsn = `${baseUsn}${counter}`;
            counter++;
        }
        
        if (requestId) sendEvent(requestId, { step: 3, message: "Password generated" });

        // 4. Generate random 10-character password and hash it
        const rawPassword = generateRandomPassword(10);
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        if (requestId) sendEvent(requestId, { step: 4, message: "Email sent" });

        // 5. Send credentials via email using Nodemailer
        try {
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.EMAIL_ID,
                    pass: process.env.EMAIL_KEY,
                },
            });

            const mailOptions = {
                from: process.env.EMAIL_ID,
                to: userEmail,
                subject: "Welcome to Learnix! Your Account Details",
                text: `Hi ${name || "User"},\n\nWelcome to Learnix! Your account has been created successfully.\n\nHere are your login credentials:\n\nUSN: ${finalUsn}\nPassword: ${rawPassword}\n\nPlease keep these safe. You can log in using your Google account or these credentials.\n\nBest,\nLearnix Team`,
                html: `<p>Hi ${name || "User"},</p><p>Welcome to Learnix! Your account has been created successfully.</p><p>Here are your login credentials:</p><ul><li><strong>USN:</strong> ${finalUsn}</li><li><strong>Password:</strong> ${rawPassword}</li></ul><p>Please keep these safe. You can log in using your Google account or these credentials.</p><br/><p>Best,<br/>Learnix Team</p>`
            };

            await transporter.sendMail(mailOptions);
        } catch (emailError) {
            console.error("Failed to send welcome email:", emailError);
            // We'll still proceed to save the user even if email fails
        }
        
        if (requestId) sendEvent(requestId, { step: 5, message: "User saved" });

        // 6. Create and save the new user
        const newUser = new User({
            name: name || "App Google User",
            email: userEmail,
            usn: finalUsn,
            password: hashedPassword,
            profileimg: picture || "https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp",
            role: "user",
            plan: "basic",
        });

        await newUser.save();
        
        if (requestId) sendEvent(requestId, { step: 6, message: "JWT generated" });

        // 7. Generate JWT
        const token = generateToken(newUser._id.toString(), newUser.usn);

        if (requestId) sendEvent(requestId, { step: 7, message: "Registration completed" });
        if (requestId) closeConnection(requestId);

        // 8. Return success response
        return NextResponse.json(
            {
                success: true,
                message: "Account created successfully",
                token: token,
                user: {
                    _id: newUser._id.toString(),
                    name: newUser.name,
                    usn: newUser.usn,
                    email: newUser.email,
                },
            },
            { status: 201 }
        );

    } catch (error) {
        console.error("POST /api/auth/android/signup error:", error);
        if (currentRequestId) sendEvent(currentRequestId, { error: "Internal server error" });
        if (currentRequestId) closeConnection(currentRequestId);
        
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
