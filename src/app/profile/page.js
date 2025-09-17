"use client";

import { Navbar } from "../components/Navbar";
import UserData from "./UserData";
import UserProfile from "./UserProfile";


export default function profile() {

    return (
        <div >
            <Navbar />
            <UserProfile/>
        </div>
    );
}
