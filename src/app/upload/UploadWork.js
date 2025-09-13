"use client";

import { useEffect, useState } from "react";
import LoginBox from "./LoginBox";
import Dashboard from "./Dashboard";

export default function UploadWork() {
  const [usn, setUsn] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("usn");
    if (stored) setUsn(stored);
    const onStorage = () => setUsn(localStorage.getItem("usn"));
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <div style={{ padding: 20 }}>
      {!usn ? (
        <LoginBox onLogin={(usn) => setUsn(usn)} />
      ) : (
        <Dashboard />
      )}
    </div>
  );
}
