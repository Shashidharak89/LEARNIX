"use client";

import Footer from "../components/Footer";
import { Navbar } from "../components/Navbar";
import StudyMaterials from "./StudyMaterials";

// Its material function
export default function materials() {

    return (
        <div >
            <Navbar />
            <StudyMaterials/>
        </div>
    );
}
