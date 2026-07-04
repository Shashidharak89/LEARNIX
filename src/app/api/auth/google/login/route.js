import { connectDB } from "@/lib/db";
import { getFirebaseAdminApp } from "@/lib/firebaseAdmin";
import User from "@/models/User";
import { generateToken } from "@/utils/jwt";
import { successResponse, errorResponse } from "@/utils/apiResponse";

export async function POST(req) {
    try {
        const body = await req.json().catch(() => ({}));
        const idToken = String(body.idToken || "").trim();

        if (!idToken) {
            return errorResponse("Firebase ID token is required", 400);
        }

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
        const name = decodedToken.name;
        const picture = decodedToken.picture;

        if (!email) {
            return errorResponse("Token does not contain an email address", 400);
        }

        // 3. Check MongoDB
        await connectDB();
        const user = await User.findOne({ email });

        if (!user) {
            // User doesn't exist => requires signup
            return errorResponse("Account not found", 404, { requiresSignup: true });
        }

        // 4. Update existing user
        user.lastLoginAt = new Date();
        // Save firebaseUid if it was missing 
        if (!user.firebaseUid) {
            user.firebaseUid = firebaseUid;
        }
        // ensure role/plan
        if (!user.role) user.role = "user";
        if (!user.plan) user.plan = "basic";

        const backendToken = generateToken(user._id.toString());

        // Maintain token backward compatibility 
        user.token = backendToken;
        user.tokenCreatedAt = new Date();
        await user.save();

        // 5. Return success
        return successResponse({
            token: backendToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                usn: user.usn,
                profileUrl: user.profileimg,
                role: user.role,
                plan: user.plan,
                balance: user.balance || 0,
                createdAt: user.createdAt,
                lastLogin: user.lastLoginAt
            }
        });

    } catch (error) {
        console.error("POST /api/auth/google/login error:", error);
        return errorResponse("Internal Server Error", 500);
    }
}
