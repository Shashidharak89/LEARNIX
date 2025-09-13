"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function Login() {
  const [name, setName] = useState("");
  const [usn, setUsn] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/api/auth", { name, usn });
      setMessage(res.data.message);

      // Save user info in localStorage
      localStorage.setItem("usn", res.data.user.usn);
      localStorage.setItem("name", res.data.user.name);

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      setMessage(err.response?.data?.error || "Something went wrong");
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: "100px" }}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px", width: "300px" }}>
        <h2>Login / Create Account</h2>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="USN"
          value={usn}
          onChange={(e) => setUsn(e.target.value)}
          required
        />
        <button type="submit" style={{ background: "black", color: "white", padding: "10px" }}>
          Submit
        </button>
        {message && <p>{message}</p>}
      </form>
    </div>
  );
}
