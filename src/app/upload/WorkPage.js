"use client";
import { useState, useEffect } from "react";

export default function WorkPage() {
  const [usn, setUsn] = useState("");
  const [name, setName] = useState("");
  const [user, setUser] = useState(null);
  const [subjectName, setSubjectName] = useState("");
  const [contentText, setContentText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleLogin = async () => {
    try {
      const res = await fetch("/api/work", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usn, name })
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      const data = await res.json();
      setUser(data);
    } catch (err) {
      console.error(err.message);
      alert("Login failed: " + err.message);
    }
  };

  const fetchUser = async () => {
    if (!usn) return;
    try {
      const res = await fetch(`/api/work/get-all?usn=${usn}`);
      const data = await res.json();
      setUser(data);
    } catch (err) {
      console.error(err);
    }
  };

  const addSubject = async () => {
    if (!subjectName) return alert("Enter subject name");
    const res = await fetch("/api/work/add-subject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usn, subject: subjectName })
    });
    const data = await res.json();
    setUser(data);
    setSubjectName("");
  };

  const addContent = async (subjectId) => {
    if (!contentText) return alert("Enter content text");
    const res = await fetch("/api/work/add-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usn, subjectId, text: contentText })
    });
    const data = await res.json();
    setUser(data);
    setContentText("");
  };

  const uploadFile = async (subjectId, contentId) => {
    if (!selectedFile) return alert("Select a file first");
    setUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("usn", usn);
    formData.append("subjectId", subjectId);
    formData.append("contentId", contentId);

    try {
      const res = await fetch("/api/work/upload-file", { method: "POST", body: formData });
      const data = await res.json();
      alert(data.message);
      setSelectedFile(null);
      fetchUser();
    } catch (err) {
      console.error(err);
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  if (!user)
    return (
      <div style={{ padding: "20px" }}>
        <h2>Login</h2>
        <input placeholder="USN" value={usn} onChange={(e) => setUsn(e.target.value)} />
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <button onClick={handleLogin}>Login</button>
      </div>
    );

  return (
    <div style={{ padding: "20px" }}>
      <h2>Welcome, {user.name}</h2>

      <div>
        <input placeholder="New Subject Name" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} />
        <button onClick={addSubject}>Add Subject</button>
      </div>

      {user.contents.map((subject) => (
        <div key={subject._id} style={{ border: "1px solid #ccc", padding: "10px", marginTop: "10px" }}>
          <h3>{subject.subject}</h3>

          <div>
            <input placeholder="Content text" value={contentText} onChange={(e) => setContentText(e.target.value)} />
            <button onClick={() => addContent(subject._id)}>Add Content</button>
          </div>

          {subject.items.map((item) => (
            <div key={item._id} style={{ marginLeft: "20px" }}>
              <p>{item.text}</p>
              <div>
                <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} />
                <button onClick={() => uploadFile(subject._id, item._id)} disabled={uploading || !selectedFile}>
                  {uploading ? "Uploading..." : "Upload File"}
                </button>
              </div>
              <ul>
                {item.files.map((file, idx) => (
                  <li key={idx}>
                    <a href={file.url} target="_blank" rel="noopener noreferrer">{file.url}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
