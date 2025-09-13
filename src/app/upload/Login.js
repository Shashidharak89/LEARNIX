"use client";
import { useState } from "react";

export default function Login({ onLogin }) {
  const [usn, setUsn] = useState("");

  const handleLogin = () => {
    if (!usn) return alert("Enter USN");
    localStorage.setItem("usn", usn);
    if (onLogin) onLogin(usn); // trigger dashboard update
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Login</h1>
      <input
        type="text"
        placeholder="Enter your USN"
        value={usn}
        onChange={(e) => setUsn(e.target.value)}
        style={{ padding: "10px", marginRight: "10px" }}
      />
      <button onClick={handleLogin} style={{ padding: "10px 20px" }}>
        Login
      </button>
    </div>
  );
}
