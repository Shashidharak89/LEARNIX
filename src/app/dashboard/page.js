"use client";

import { Navbar } from "../components/Navbar";
import AllUsersRecords from "./AllUsersRecords";



export default function dashboard() {

  return (
    <div >
      <Navbar />
     <AllUsersRecords/>
    </div>
  );
}
