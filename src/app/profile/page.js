"use client";

import Footer from "../components/Footer";
import { Navbar } from "../components/Navbar";
import UserProfile from "./UserProfile";


export default function profile() {

    return (
        <div >
            <Navbar />
            <UserProfile/>
            <Footer/>
        </div>
    );
}
