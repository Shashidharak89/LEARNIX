"use client";
import { useState } from "react";

export default function AddSubjectBox({ workId, onDone }) {
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);

  const add = async () => {
    if (!subject.trim()) return alert("Enter subject");
    setLoading(true);
    try {
      const res = await fetch(`/api/work/${workId}/subject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to add subject");
      } else {
        setSubject("");
        if (onDone) onDone();
      }
    } catch (err) {
      console.error(err);
      alert("Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject name" />
      <button onClick={add} disabled={loading}>{loading ? "Adding..." : "Add Subject"}</button>
    </div>
  );
}
