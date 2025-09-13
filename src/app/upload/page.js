"use client";
import { useEffect, useState } from "react";
import Login from "./Login";
import Dashboard from "./Dashboard"; // Dashboard internally handles AddFile & UploadWork
import UploadWork from "./UploadWork";

export default function Page() {
  const [usn, setUsn] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("usn");
    if (stored) setUsn(stored);

    // when Login sets localStorage, refresh state here
    const listener = () => setUsn(localStorage.getItem("usn"));
    window.addEventListener("storage", listener);
    return () => window.removeEventListener("storage", listener);
  }, []);

  return (
    <div>
      {!usn ? <Login onLogin={setUsn} /> : <Dashboard />}
      <UploadWork/>
    </div>
  );
}
