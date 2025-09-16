"use client";

import { Navbar } from "../components/Navbar";
import WorkSearchInterface from "../search/WorkSearchInterface";
import AllUsersRecords from "./AllUsersRecords";



export default function dashboard() {

  return (
    <div >
      <Navbar />
     <WorkSearchInterface/>
    </div>
  );
}
