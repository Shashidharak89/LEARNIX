"use client";

import { useState } from "react";
import axios from "axios";

export default function Login() {
  const [name, setName] = useState("");
  const [usn, setUsn] = useState("");
  const [user, setUser] = useState(null);

  const handleLogin = async () => {
    if (!name || !usn) return alert("Enter name and USN");

    try {
      const res = await axios.post("/api/work/login", { name, usn });
      setUser(res.data);
      alert(`Logged in as ${res.data.name} (${res.data.usn})`);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message);
    }
  };

  if (user)
    return (
      <div style={{ padding: "20px" }}>
        <h2>Welcome, {user.name}</h2>
        <p>USN: {user.usn}</p>
      </div>
    );

  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
      <h2>Login</h2>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ padding: "8px", width: "250px" }}
      />
      <input
        type="text"
        placeholder="USN"
        value={usn}
        onChange={(e) => setUsn(e.target.value)}
        style={{ padding: "8px", width: "250px" }}
      />
      <button onClick={handleLogin} style={{ padding: "10px", width: "100px" }}>
        Login
      </button>
    </div>
  );
}
