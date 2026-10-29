"use client";

import Footer from "../components/Footer";
import { Navbar } from "../components/Navbar";
import WorkSearchInterface from "../works/WorkSearchInterface";
import AllUsersRecords from "./AllUsersRecords";
import DashBoard from "./DashBoard";

export default function dashboard() {

  return (
    <div >
      <Navbar />
      <DashBoard />
   
    </div>
  );
}
