"use client";

import Footer from "../components/Footer";
import { Navbar } from "../components/Navbar";
import WorkSearchInterface from "../search/WorkSearchInterface";
import AllUsersRecords from "./AllUsersRecords";
import DashBoard from "./DashBoard";

export default function dashboard() {

  return (
    <div >
      <Navbar />
      <DashBoard />
      <Footer />
    </div>
  );
}
