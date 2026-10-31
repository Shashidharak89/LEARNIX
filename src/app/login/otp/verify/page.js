import { Suspense } from "react";
import { Navbar } from "../../../components/Navbar";
import VerifyOtp from "./VerifyOtp";

export default function VerifyOtpPage() {
    return (
        <div>
            <Navbar />
            <Suspense fallback={null}>
                <VerifyOtp />
            </Suspense>
        </div>
    );
}
