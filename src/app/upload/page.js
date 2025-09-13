"use client";

import AllUsersRecords from "./AllUsersRecords";
import Login from "./Login";
import ManageSubjects from "./ManageSubjects";
import UserDetails from "./UserDetails";




export default function upload() {
 
  return (
    <div >
 <Login/>
 <ManageSubjects/>
 <AllUsersRecords/>
 <UserDetails/>

    </div>
  );
}
