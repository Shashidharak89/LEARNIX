"use client";

import { Navbar } from "../components/Navbar";
import SearchBox from "./SearchBox";
import WorkSearchInterface from "./WorkSearchInterface";


export default function search() {

    return (
        <div >
            <Navbar />
         <SearchBox/>
         <WorkSearchInterface/>
        </div>
    );
}
