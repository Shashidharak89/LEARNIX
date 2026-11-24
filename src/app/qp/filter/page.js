import React, { Suspense } from "react";
import QPFilterClient from "./QPFilterClient";
import { Navbar } from "../../components/Navbar";

export const metadata = {
    title: "Filtered Question Papers | Learnix",
    description: "View filtered question papers matching all selected criteria."
};

export default function Page() {
    return (
        <Suspense fallback={
            <div style={{ padding: "100px", textAlign: "center" }}>
                <Navbar />
                <p>Loading filtered question papers...</p>
            </div>
        }>
            <QPFilterClient />
        </Suspense>
    );
}

