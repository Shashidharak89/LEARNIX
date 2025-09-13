"use client";
import { useState } from "react";

export default function AddFile({ workId, onSuccess }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      const usn = localStorage.getItem("usn");
      formData.append("usn", usn);
      files.forEach((file) => formData.append("files", file));

      const res = await fetch(`/api/work/${workId}/addFile`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload file");

      alert("✅ File(s) added successfully!");
      setFiles([]);
      if (onSuccess) onSuccess(data); // refresh Dashboard
    } catch (err) {
      console.error("Add file error:", err);
      alert("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: "10px" }}>
      <input type="file" multiple onChange={handleFileChange} />
      <button type="submit" disabled={loading}>
        {loading ? "Uploading..." : "Add File"}
      </button>
    </form>
  );
}
