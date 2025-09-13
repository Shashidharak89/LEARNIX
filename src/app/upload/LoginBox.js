"use client";

import { useState } from "react";

/**
 * LoginBox:
 * - takes name + usn; stores usn uppercase in localStorage.
 * - calls backend to create/get record.
 * - does NOT change name if record exists.
 */
export default function LoginBox({ onLogin }) {
  const [name, setName] = useState("");
  const [usn, setUsn] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!name.trim() || !usn.trim()) return alert("Enter name and usn");
    setLoading(true);
    try {
      const res = await fetch("/api/work", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), usn: usn.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Login failed");
      } else {
        // store uppercase USN
        const up = String(usn).toUpperCase();
        localStorage.setItem("usn", up);
        if (onLogin) onLogin(up);
      }
    } catch (err) {
      console.error(err);
      alert("Login error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <h2>Login / Start</h2>
      <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} style={{ display: "block", width: "100%", marginBottom: 8 }} />
      <input placeholder="USN" value={usn} onChange={(e) => setUsn(e.target.value)} style={{ display: "block", width: "100%", marginBottom: 8 }} />
      <button onClick={handleLogin} disabled={loading} style={{ padding: "8px 12px" }}>
        {loading ? "Please wait..." : "Login / Create"}
      </button>
    </div>
  );
}
