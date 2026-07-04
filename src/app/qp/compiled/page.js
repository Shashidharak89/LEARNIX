import React, { Suspense } from "react";
import QPCompiledClient from "./QPCompiledClient";
import { Navbar } from "../../components/Navbar";

export const metadata = {
    title: "Compiled Question Papers | Learnix",
    description: "View automatically compiled question papers based on advanced filter selections."
};

export default function Page() {
    return (
        <Suspense fallback={
            <div style={{ padding: "100px", textAlign: "center" }}>
                <Navbar />
                <p>Loading compilation parameters...</p>
            </div>
        }>
            <QPCompiledClient />
        </Suspense>
    );
}
