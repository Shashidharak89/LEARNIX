import { Suspense } from "react";
import { Navbar } from "@/app/components/Navbar";
import SMSharedMaterialsClient from "./SMSharedMaterialsClient";
import "./SMSharePage.css";

export const metadata = {
    title: "Shared Study Materials | LEARNIX",
    description: "Browse study materials shared with you on LEARNIX.",
};

export default function SharedStudyMaterialsPage() {
    return (
        <>
            <Navbar />
            <Suspense fallback={<main className="sm-share-page"><div className="sm-share-loading">Opening shared materials…</div></main>}>
                <SMSharedMaterialsClient />
            </Suspense>
        </>
    );
}
