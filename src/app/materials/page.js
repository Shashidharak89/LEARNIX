"use client";

import { Suspense } from "react";
import Footer from "../components/Footer";
import { Navbar } from "../components/Navbar";
import StudyMaterials from "./StudyMaterials";
import SMViewer, { SMDirectorySkeleton } from "./SMViewer";

// Its material function
export default function materials() {

    return (
        <div>
            <Navbar />
            <Suspense fallback={
                <section className="sm-viewer-section">
                    <div className="sm-content" style={{ marginTop: "20px" }}>
                        <SMDirectorySkeleton count={5} />
                    </div>
                </section>
            }>
                <SMViewer />
            </Suspense>
        </div>
    );
}
