"use client";
import { useState } from "react";

export default function UploadWork() {
  const [form, setForm] = useState({
    name: "",
    usn: "",
    content: "",
    subject: "",
  });
  const [files, setFiles] = useState([]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFile = (e) => {
    setFiles(e.target.files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(form).forEach((key) => formData.append(key, form[key]));
    Array.from(files).forEach((file) => formData.append("files", file));

    const res = await fetch("/api/work", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    console.log("Uploaded:", data);
    alert("Work uploaded successfully!");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Upload Homework</h1>
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Name" onChange={handleChange} required />
        <br />
        <input name="usn" placeholder="USN" onChange={handleChange} required />
        <br />
        <input name="subject" placeholder="Subject" onChange={handleChange} required />
        <br />
        <textarea
          name="content"
          placeholder="Content"
          onChange={handleChange}
          required
        />
        <br />
        <input type="file" multiple onChange={handleFile} />
        <br />
        <button type="submit">Upload</button>
      </form>
    </div>
  );
}
