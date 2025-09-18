"use client";

import Footer from "../components/Footer";
import { Navbar } from "../components/Navbar";
import Login from "./Login";

export default function signin() {

    return (
        <div >
            <Navbar />
            <Login />
            <Footer/>
        </div>
    );
}
