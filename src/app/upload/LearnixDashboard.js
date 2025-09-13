// app/components/LearnixDashboard.jsx
"use client";

import { useState, useEffect } from "react";
import axios from "axios";

export default function LearnixDashboard() {
  const [usn, setUsn] = useState(localStorage.getItem("usn") || "");
  const [name, setName] = useState(localStorage.getItem("name") || "");
  const [user, setUser] = useState(null);

  const [subjectTitle, setSubjectTitle] = useState("");
  const [selectedSubject, setSelectedSubject] = useState(null);

  const [contentText, setContentText] = useState("");
  const [selectedContent, setSelectedContent] = useState(null);

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const [records, setRecords] = useState([]);

  // ---- LOGIN / SIGNUP ----
  const handleLogin = async () => {
    if (!usn || !name) return alert("Enter both name and USN");

    try {
      const res = await axios.post("/api/user", { name, usn });
      setUser(res.data);

      localStorage.setItem("usn", res.data.usn);
      localStorage.setItem("name", res.data.name);

      fetchRecords(res.data.usn);
    } catch (err) {
      console.error(err);
      alert("Login failed");
    }
  };

  // ---- FETCH ALL RECORDS ----
  const fetchRecords = async (userUsn = usn) => {
    try {
      const res = await axios.get(`/api/work/getall?usn=${userUsn}`);
      setRecords(res.data.subjects || []);
    } catch (err) {
      console.error(err);
    }
  };

  // ---- CREATE SUBJECT ----
  const handleAddSubject = async () => {
    if (!subjectTitle) return alert("Enter subject title");

    try {
      const res = await axios.post("/api/subject", { usn, title: subjectTitle });
      setRecords(res.data.subjects || []);
      setSubjectTitle("");
    } catch (err) {
      console.error(err);
      alert("Failed to add subject");
    }
  };

  // ---- CREATE CONTENT ----
  const handleAddContent = async (subjectId) => {
    if (!contentText) return alert("Enter content text");

    try {
      const res = await axios.post("/api/content", {
        usn,
        subjectId,
        text: contentText
      });

      setRecords((prev) =>
        prev.map((sub) => (sub._id === subjectId ? res.data : sub))
      );
      setContentText("");
    } catch (err) {
      console.error(err);
      alert("Failed to add content");
    }
  };

  // ---- UPLOAD FILE ONE BY ONE ----
  const handleFileUpload = async (subjectId, contentId) => {
    if (!file) return alert("Select a file first");

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("usn", usn);
      formData.append("subjectId", subjectId);
      formData.append("contentId", contentId);

      const res = await axios.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      alert("File uploaded successfully");
      setFile(null);
      fetchRecords();
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    }
    setLoading(false);
  };

  // ---- AUTO FETCH RECORDS IF USER LOGGED IN ----
  useEffect(() => {
    if (usn) {
      fetchRecords();
      setUser({ name, usn });
    }
  }, []);

  // ---- RENDER LOGIN FORM ----
  if (!user) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-4">Login / Signup</h2>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 w-full mb-2"
        />
        <input
          type="text"
          placeholder="USN"
          value={usn}
          onChange={(e) => setUsn(e.target.value.toUpperCase())}
          className="border p-2 w-full mb-4"
        />
        <button onClick={handleLogin} className="bg-blue-600 text-white p-2 w-full">
          Login
        </button>
      </div>
    );
  }

  // ---- RENDER DASHBOARD ----
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Welcome, {user.name} ({user.usn})</h2>

      {/* ADD SUBJECT */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="New Subject Title"
          value={subjectTitle}
          onChange={(e) => setSubjectTitle(e.target.value)}
          className="border p-2 mr-2"
        />
        <button onClick={handleAddSubject} className="bg-green-600 text-white p-2">
          Add Subject
        </button>
      </div>

      {/* SUBJECT LIST */}
      {records.map((sub) => (
        <div key={sub._id} className="mb-6 border p-4 rounded">
          <h3 className="text-xl font-semibold">{sub.title}</h3>

          {/* ADD CONTENT */}
          <div className="flex mb-4 mt-2">
            <input
              type="text"
              placeholder="Content text"
              value={selectedSubject === sub._id ? contentText : ""}
              onChange={(e) => {
                setSelectedSubject(sub._id);
                setContentText(e.target.value);
              }}
              className="border p-2 mr-2 flex-1"
            />
            <button
              onClick={() => handleAddContent(sub._id)}
              className="bg-yellow-600 text-white p-2"
            >
              Add Content
            </button>
          </div>

          {/* CONTENT LIST */}
          {sub.items?.map((content) => (
            <div key={content._id} className="ml-4 mb-4 border p-2 rounded">
              <p className="mb-2">{content.text}</p>

              {/* FILE UPLOAD */}
              <div className="flex items-center mb-2">
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="mr-2"
                />
                <button
                  disabled={!file || loading}
                  onClick={() => handleFileUpload(sub._id, content._id)}
                  className="bg-blue-600 text-white p-2"
                >
                  {loading ? "Uploading..." : "Upload Now"}
                </button>
              </div>

              {/* FILE LIST */}
              <div className="flex flex-wrap">
                {content.files?.map((f, i) => (
                  <img
                    key={i}
                    src={f.url}
                    alt="Uploaded"
                    className="w-24 h-24 object-cover mr-2 mb-2 border"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
