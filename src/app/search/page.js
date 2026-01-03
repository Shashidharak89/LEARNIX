"use client";

import Footer from "../components/Footer";
import { Navbar } from "../components/Navbar";
import UsersPage from "./UsersPage";
import WorkSearchInterface from "../works/WorkSearchInterface";


export default function search() {

    return (
        <div >
            <Navbar />
            <UsersPage/>
        </div>
    );
}
