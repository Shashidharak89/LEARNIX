"use client";

import AllUsersRecords from "./AllUsersRecords";
import Login from "./Login";
import ManageSubjects from "./ManageSubjects";
import { Navbar } from "./Navbar";
import UserDetails from "./UserDetails";




export default function upload() {
 
  return (
    <div >
      <Navbar/>
 <Login/>
 <ManageSubjects/>
 <AllUsersRecords/>
 <UserDetails/>

    </div>
  );
}
