"use client";

import { Navbar } from "../components/Navbar";
import Footer from "../components/Footer";
import WorkSearchInterface from "../search/WorkSearchInterface";

export default function works() {

    return (
        <div >
            <Navbar />
            <WorkSearchInterface />
            <Footer />
        </div>
    );
}
