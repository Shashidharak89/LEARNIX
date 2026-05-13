import admin from "firebase-admin";
import fs from "fs";
import path from "path";

function loadServiceAccount() {
    // Recommended: provide as env var to avoid bundler/static-path issues.
    const jsonFromEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (jsonFromEnv) {
        return JSON.parse(jsonFromEnv);
    }

    const pathFromEnv = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    if (pathFromEnv) {
        const raw = fs.readFileSync(pathFromEnv, "utf8");
        return JSON.parse(raw);
    }

    // Fallback: look for a service account json in the project root.
    const rootDir = process.cwd();
    const files = fs.readdirSync(rootDir);
    const autoMatch = files.find(
        (f) =>
            f.startsWith("learnix-android-firebase-adminsdk") &&
            f.endsWith(".json")
    );

    const serviceAccountFile = autoMatch || "firebase-service-account.json";
    const fullPath = path.join(rootDir, serviceAccountFile);
    if (!fs.existsSync(fullPath)) return null;

    const raw = fs.readFileSync(fullPath, "utf8");
    return JSON.parse(raw);
}

// Create or reuse the Firebase Admin app instance (lazy: runs only when called)
export function getFirebaseAdminApp() {
    if (admin.apps.length > 0) return admin.app();

    let serviceAccount;
    try {
        serviceAccount = loadServiceAccount();
    } catch (error) {
        console.error("Firebase service account load error:", error);
        throw new Error("Failed to load Firebase service account JSON.");
    }

    if (!serviceAccount) {
        throw new Error(
            "Firebase Admin SDK not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH."
        );
    }

    return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

