import { connectDB } from "@/lib/db";
import { getFirebaseAdminApp } from "@/lib/firebaseAdmin";
import User from "@/models/User";
import { generateToken } from "@/utils/jwt";
import { successResponse, errorResponse } from "@/utils/apiResponse";

const DEFAULT_PROFILE_IMG =
    "https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp";

export async function POST(req) {
    try {
        const body = await req.json().catch(() => ({}));
        const idToken = String(body.idToken || "").trim();
        const usn = String(body.usn || "").trim().toUpperCase();

        if (!idToken) return errorResponse("Firebase ID token is required", 400);
        if (!usn) return errorResponse("USN is required", 400);

        // 1. Verify Firebase token
        let decodedToken;
        try {
            const firebaseAdmin = getFirebaseAdminApp();
            decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
        } catch (err) {
            console.warn("Invalid Firebase token:", err.message);
            return errorResponse("Invalid Firebase token", 401);
        }

        // 2. Extract user info
        const email = decodedToken.email?.toLowerCase();
        const firebaseUid = decodedToken.uid;
        const name = decodedToken.name || "Learnix User";
        const picture = decodedToken.picture || DEFAULT_PROFILE_IMG;

        if (!email) {
            return errorResponse("Token does not contain an email address", 400);
        }

        // 3. Connect DB
        await connectDB();

        // 4. Validate unique email and USN
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return errorResponse("An account with this email already exists", 409);
        }

        const existingUsn = await User.findOne({ usn });
        if (existingUsn) {
            return errorResponse("An account with this USN already exists", 409);
        }

        // 5. Create user
        const newUser = new User({
            name,
            email,
            usn,
            firebaseUid,
            profileimg: picture,
            role: "user",
            plan: "basic",
            lastLoginAt: new Date()
        });

        const backendToken = generateToken(newUser._id.toString());

        // Save backwards-compatible token stuff
        newUser.token = backendToken;
        newUser.tokenCreatedAt = new Date();
        await newUser.save();

        // 6. Return success
        return successResponse({
            token: backendToken,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                usn: newUser.usn,
                profileUrl: newUser.profileimg,
                role: newUser.role,
                plan: newUser.plan,
                createdAt: newUser.createdAt,
                lastLogin: newUser.lastLoginAt
            }
        }, 201);

    } catch (error) {
        console.error("POST /api/auth/google/signup error:", error);
        return errorResponse("Internal Server Error", 500);
    }
}
