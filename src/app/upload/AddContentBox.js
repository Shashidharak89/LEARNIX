"use client";
import { useState } from "react";

export default function AddContentBox({ workId, subjectId, onDone }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const add = async () => {
    if (!text.trim()) return alert("Enter content text");
    setLoading(true);
    try {
      const res = await fetch(`/api/work/${workId}/subject/${subjectId}/content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to add content");
      } else {
        setText("");
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
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Content text (short)" />
      <button onClick={add} disabled={loading}>{loading ? "Adding..." : "Add Content"}</button>
    </div>
  );
}
