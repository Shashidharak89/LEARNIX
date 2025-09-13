"use client";

import { useState, useEffect } from "react";
import axios from "axios";

export default function LearnixDashboard() {
  const [usn, setUsn] = useState("");
  const [name, setName] = useState("");
  const [user, setUser] = useState(null);
  const [subjectTitle, setSubjectTitle] = useState("");
  const [contentText, setContentText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedContentId, setSelectedContentId] = useState("");
  const [loading, setLoading] = useState(false);

  // Login function
  const handleLogin = async () => {
    if (!usn || !name) return alert("Enter name and USN");
    try {
      const res = await axios.post("/api/work/login", { name, usn });
      setUser(res.data);
      setName(res.data.name); // ensure name stays
      alert("Logged in successfully");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message);
    }
  };

  // Add Subject
  const addSubject = async () => {
    if (!subjectTitle) return alert("Enter subject title");
    try {
      const res = await axios.post("/api/work/subject", {
        usn,
        title: subjectTitle,
      });
      setUser(res.data);
      setSubjectTitle("");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message);
    }
  };

  // Add Content
  const addContent = async (subjectId) => {
    if (!contentText) return alert("Enter content text");
    try {
      const res = await axios.post("/api/work/content", {
        usn,
        subjectId,
        text: contentText,
      });
      setUser(res.data);
      setContentText("");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message);
    }
  };

  // Upload File
  const uploadFile = async () => {
    if (!selectedFile) return alert("Select a file first");
    if (!selectedSubjectId || !selectedContentId)
      return alert("Select subject and content first");

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("usn", usn);
      formData.append("subjectId", selectedSubjectId);
      formData.append("contentId", selectedContentId);

      const res = await axios.post("/api/work/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert(res.data.message);

      // Refresh user data
      const userRes = await axios.get(`${window.location.origin}/api/work/getall?usn=${usn}`);
      setUser(userRes.data);
      setSelectedFile(null);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user data on USN change
  useEffect(() => {
    if (!usn) return;
    const fetchData = async () => {
      try {
        const res = await axios.get(`${window.location.origin}/api/work/getall?usn=${usn}`);
        setUser(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [usn]);

  if (!user)
    return (
      <div style={{ padding: "20px" }}>
        <h2>Login</h2>
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="USN"
          value={usn}
          onChange={(e) => setUsn(e.target.value)}
        />
        <button onClick={handleLogin}>Login</button>
      </div>
    );

  return (
    <div style={{ padding: "20px" }}>
      <h2>Welcome, {user.name}</h2>

      {/* Add Subject */}
      <div style={{ marginTop: "20px" }}>
        <h3>Add Subject</h3>
        <input
          placeholder="Subject title"
          value={subjectTitle}
          onChange={(e) => setSubjectTitle(e.target.value)}
        />
        <button onClick={addSubject}>Add Subject</button>
      </div>

      {/* Subjects List */}
      <div style={{ marginTop: "30px" }}>
        {user.subjects.map((sub) => (
          <div
            key={sub._id}
            style={{ border: "1px solid gray", padding: "10px", margin: "10px 0" }}
          >
            <h4>{sub.title}</h4>

            {/* Add Content */}
            <div>
              <input
                placeholder="Content text"
                value={selectedSubjectId === sub._id ? contentText : ""}
                onChange={(e) => {
                  setSelectedSubjectId(sub._id);
                  setContentText(e.target.value);
                }}
              />
              <button onClick={() => addContent(sub._id)}>Add Content</button>
            </div>

            {/* Contents */}
            <div style={{ marginTop: "10px" }}>
              {sub.contents.map((cont) => (
                <div
                  key={cont._id}
                  style={{
                    border: "1px dashed gray",
                    padding: "5px",
                    margin: "5px 0",
                  }}
                >
                  <p>{cont.text}</p>

                  {/* Files */}
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {cont.files.map((f, idx) => (
                      <img
                        key={idx}
                        src={f.url}
                        alt="file"
                        width="100"
                        style={{ border: "1px solid black" }}
                      />
                    ))}
                  </div>

                  {/* Upload file */}
                  <div style={{ marginTop: "5px" }}>
                    <input
                      type="file"
                      onChange={(e) => {
                        setSelectedSubjectId(sub._id);
                        setSelectedContentId(cont._id);
                        setSelectedFile(e.target.files[0]);
                      }}
                    />
                    <button onClick={uploadFile} disabled={loading}>
                      {loading ? "Uploading..." : "Upload File"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
