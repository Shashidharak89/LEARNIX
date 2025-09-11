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

  // add new captured file to array
  const handleCapture = (e) => {
    const newFile = e.target.files[0];
    if (newFile) {
      setFiles((prev) => [...prev, newFile]); // preserve order
    }
    // reset input so user can capture again
    e.target.value = null;
  };

  // remove a file
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

      if (!res.ok) {
        throw new Error("Failed to upload work");
      }

      const data = await res.json();
      console.log("Uploaded:", data);

      alert("✅ Work uploaded successfully!");

      // reset form
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
        <input
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          required
          style={{ display: "block", marginBottom: "10px", width: "100%" }}
        />
        <input
          name="usn"
          placeholder="USN"
          value={form.usn}
          onChange={handleChange}
          required
          style={{ display: "block", marginBottom: "10px", width: "100%" }}
        />
        <input
          name="subject"
          placeholder="Subject"
          value={form.subject}
          onChange={handleChange}
          required
          style={{ display: "block", marginBottom: "10px", width: "100%" }}
        />
        <textarea
          name="content"
          placeholder="Content"
          value={form.content}
          onChange={handleChange}
          required
          style={{ display: "block", marginBottom: "10px", width: "100%", height: "100px" }}
        />

        {/* Dynamic photo capture */}
        <div style={{ marginBottom: "20px" }}>
          <h3>Captured Photos:</h3>
          {files.map((file, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <img
                src={URL.createObjectURL(file)}
                alt={`preview-${index}`}
                style={{
                  width: "100px",
                  height: "100px",
                  objectFit: "cover",
                  marginRight: "10px",
                }}
              />
              <button
                type="button"
                onClick={() => removeFile(index)}
                style={{
                  padding: "5px 10px",
                  backgroundColor: "red",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Remove
              </button>
            </div>
          ))}

          {/* Add new photo button */}
          <label
            style={{
              display: "inline-block",
              padding: "10px 20px",
              backgroundColor: "#0070f3",
              color: "white",
              borderRadius: "5px",
              cursor: "pointer",
              marginTop: "10px",
            }}
          >
            📸 Add Photo
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCapture}
              style={{ display: "none" }}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px 20px",
            backgroundColor: loading ? "#888" : "#0070f3",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      </form>
    </div>
  );
}
