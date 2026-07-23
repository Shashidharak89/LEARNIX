"use client";

import { Suspense } from "react";
import Footer from "../components/Footer";
import { Navbar } from "../components/Navbar";
import StudyMaterials from "./StudyMaterials";
import SMViewer from "../admin/study-materials/SMViewer";

// Its material function
export default function materials() {

    return (
        <div >
            <Navbar />
            <Suspense fallback={<div className="sm-wrapper" />}>
                <SMViewer />
            </Suspense>
        </div>
    );
}
