"use client";

import { Suspense } from "react";
import Footer from "../components/Footer";
import { Navbar } from "../components/Navbar";
import StudyMaterials from "./StudyMaterials";

// Its material function
export default function materials() {

    return (
        <div >
            <Navbar />
            <Suspense fallback={<div className="sm-wrapper" />}>
                <StudyMaterials />
            </Suspense>
        </div>
    );
}
