import { Suspense } from "react";
import { Navbar } from "../components/Navbar";
import Login from "./Login";

export default function signin() {
    const googleClientId = process.env.CLIENT_ID || process.env.GOOGLE_CLIENT_ID || "";

    return (
        <div>
            <Navbar />
            <Suspense fallback={null}>
                <Login googleClientId={googleClientId} />
            </Suspense>
        </div>
    );
}
