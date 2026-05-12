import admin from "firebase-admin";
import fs from "fs";
import path from "path";

// Create or reuse the Firebase Admin app instance
function getFirebaseAdmin() {
    if (admin.apps.length > 0) {
        return admin.app();
    }

    try {
        // Look for any learnix-android-firebase... json file in the root
        const rootDir = path.resolve(process.cwd());
        const files = fs.readdirSync(rootDir);
        let serviceAccountPath = files.find(f => f.startsWith("learnix-android-firebase-adminsdk") && f.endsWith(".json"));

        if (!serviceAccountPath) {
            // Fallback to the one we named earlier
            serviceAccountPath = "firebase-service-account.json";
        }

        const serviceAccount = require(path.join(rootDir, serviceAccountPath));

        return admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    } catch (error) {
        console.error("Firebase Admin initialization error:", error);
        throw new Error("Failed to initialize Firebase Admin SDK. Missing or invalid service account JSON.");
    }

    export const firebaseAdmin = getFirebaseAdmin();
