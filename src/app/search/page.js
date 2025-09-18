"use client";

import Footer from "../components/Footer";
import { Navbar } from "../components/Navbar";
import WorkSearchInterface from "./WorkSearchInterface";


export default function search() {

    return (
        <div >
            <Navbar />
            <WorkSearchInterface />
            <Footer/>
        </div>
    );
}
