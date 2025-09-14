"use client";

import AllUsersRecords from "./AllUsersRecords";
import ManageSubjects from "./ManageSubjects";
import { Navbar } from "../components/Navbar";

export default function upload() {

  return (
    <div >
      <Navbar />
      <ManageSubjects />
      <AllUsersRecords />
    </div>
  );
}
