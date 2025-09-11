"use client";
import { useState } from "react";

export default function UploadWork() {
  const [form, setForm] = useState({
    name: "",
    usn: "",
    content: "",
    subject: "",
  });
  const [files, setFiles] = useState([]); // store ordered files
  const [loading, setLoading] = useState(false);

  // handle text input changes
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // add new captured file
  const handleCapture = (e) => {
    const newFile = e.target.files[0];
    if (newFile) setFiles((prev) => [...prev, newFile]);
    e.target.value = null; // reset so can re-capture
  };

  // add browsed files
  const handleBrowse = (e) => {
    const newFiles = Array.from(e.target.files);
    if (newFiles.length > 0) {
      setFiles((prev) => [...prev, ...newFiles]); // keep order
    }
    e.target.value = null;
  };

  // remove file
  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      Object.keys(form).forEach((key) => formData.append(key, form[key]));
      files.forEach((file) => formData.append("files", file));

      const res = await fetch("/api/work", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to upload work");

      const data = await res.json();
      console.log("Uploaded:", data);
      alert("✅ Work uploaded successfully!");

      setForm({ name: "", usn: "", content: "", subject: "" });
      setFiles([]);
      e.target.reset();
    } catch (err) {
      console.error("Upload error:", err);
      alert("❌ Failed to upload work. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px" }}>
        Upload Homework
      </h1>
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
        <input name="usn" placeholder="USN" value={form.usn} onChange={handleChange} required />
        <input name="subject" placeholder="Subject" value={form.subject} onChange={handleChange} required />
        <textarea name="content" placeholder="Content" value={form.content} onChange={handleChange} required />

        {/* File Previews */}
        <div style={{ marginBottom: "20px" }}>
          <h3>Selected Photos:</h3>
          {files.map((file, index) => (
            <div key={index} style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
              <img
                src={URL.createObjectURL(file)}
                alt={`preview-${index}`}
                style={{ width: "100px", height: "100px", objectFit: "cover", marginRight: "10px" }}
              />
              <button type="button" onClick={() => removeFile(index)} style={{ background: "red", color: "white" }}>
                Remove
              </button>
            </div>
          ))}

          {/* Capture Photo Button */}
          <label style={{ marginRight: "10px", backgroundColor: "#0070f3", color: "white", padding: "10px", borderRadius: "5px", cursor: "pointer" }}>
            📸 Capture Photo
            <input type="file" accept="image/*" capture="environment" onChange={handleCapture} style={{ display: "none" }} />
          </label>

          {/* Browse Files Button */}
          <label style={{ backgroundColor: "#28a745", color: "white", padding: "10px", borderRadius: "5px", cursor: "pointer" }}>
            📂 Browse Files
            <input type="file" accept="image/*" multiple onChange={handleBrowse} style={{ display: "none" }} />
          </label>
        </div>

        <button type="submit" disabled={loading} style={{ padding: "10px 20px", backgroundColor: loading ? "#888" : "#0070f3", color: "white", borderRadius: "5px" }}>
          {loading ? "Uploading..." : "Upload"}
        </button>
      </form>
    </div>
  );
}
