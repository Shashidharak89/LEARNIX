"use client";

import { useState, useEffect } from "react";
import axios from "axios";

export default function ManageSubjects() {
  const [usn, setUsn] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [topicName, setTopicName] = useState("");
  const [message, setMessage] = useState("");

  // For editing existing topic
  const [editingTopic, setEditingTopic] = useState("");
  const [file, setFile] = useState(null);

  useEffect(() => {
    const storedUsn = localStorage.getItem("usn");
    if (storedUsn) setUsn(storedUsn);
    fetchSubjects(storedUsn);
  }, []);

  const fetchSubjects = async (usn) => {
    try {
      const res = await axios.get("/api/work/get", { params: { usn } });
      setSubjects(res.data.subjects || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Add Subject
  const handleAddSubject = async () => {
    if (!newSubject) return;
    try {
      const res = await axios.post("/api/subject", { usn, subject: newSubject });
      setSubjects(res.data.subjects);
      setNewSubject("");
      setMessage("Subject added!");
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || "Error adding subject");
    }
  };

  // Add Topic
  const handleAddTopic = async () => {
    if (!selectedSubject || !topicName) return;
    try {
      const res = await axios.post("/api/topic", {
        usn,
        subject: selectedSubject,
        topic: topicName,
        images: []
      });
      setSubjects(res.data.subjects);
      setTopicName("");
      setMessage("Topic added!");
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || "Error adding topic");
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Upload single image to Cloudinary and save to topic
  const handleUploadImage = async () => {
    if (!selectedSubject || !editingTopic || !file) {
      setMessage("Please select subject, topic, and file.");
      return;
    }

    const formData = new FormData();
    formData.append("usn", usn);
    formData.append("subject", selectedSubject);
    formData.append("topic", editingTopic);
    formData.append("file", file);

    try {
      const res = await axios.post("/api/topic/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setSubjects(res.data.subjects);
      setFile(null);
      setMessage("Image uploaded successfully!");
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || "Upload failed");
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "700px", margin: "auto" }}>
      <h2>Manage Subjects & Topics</h2>
      <p style={{ color: "green" }}>{message}</p>

      {/* Add Subject */}
      <div style={{ marginBottom: "20px" }}>
        <h3>Add Subject</h3>
        <input
          type="text"
          placeholder="New Subject"
          value={newSubject}
          onChange={(e) => setNewSubject(e.target.value)}
          style={{ width: "70%", marginRight: "10px" }}
        />
        <button onClick={handleAddSubject}>Add Subject</button>
      </div>

      {/* Add Topic */}
      <div style={{ marginBottom: "20px" }}>
        <h3>Add Topic</h3>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          style={{ width: "100%", marginBottom: "10px" }}
        >
          <option value="">Select Subject</option>
          {subjects.map((sub, idx) => (
            <option key={idx} value={sub.subject}>{sub.subject}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Topic Name"
          value={topicName}
          onChange={(e) => setTopicName(e.target.value)}
          style={{ width: "100%", marginBottom: "10px" }}
        />
        <button onClick={handleAddTopic}>Add Topic</button>
      </div>

      {/* Upload Images to Existing Topic */}
      <div style={{ marginBottom: "20px" }}>
        <h3>Upload Images to Existing Topic</h3>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          style={{ width: "100%", marginBottom: "10px" }}
        >
          <option value="">Select Subject</option>
          {subjects.map((sub, idx) => (
            <option key={idx} value={sub.subject}>{sub.subject}</option>
          ))}
        </select>
        {selectedSubject && (
          <select
            value={editingTopic}
            onChange={(e) => setEditingTopic(e.target.value)}
            style={{ width: "100%", marginBottom: "10px" }}
          >
            <option value="">Select Topic</option>
            {subjects.find(s => s.subject === selectedSubject)?.topics.map((t, idx) => (
              <option key={idx} value={t.topic}>{t.topic}</option>
            ))}
          </select>
        )}
        <input
          type="file"
          onChange={handleFileChange}
          style={{ width: "100%", marginBottom: "10px" }}
        />
        <button onClick={handleUploadImage}>Upload Image</button>
      </div>

      {/* Display Subjects & Topics */}
      <div>
        <h3>Existing Subjects & Topics</h3>
        {subjects.length === 0 && <p>No subjects added yet.</p>}
        {subjects.map((sub, idx) => (
          <div key={idx} style={{ marginBottom: "15px", border: "1px solid #ccc", padding: "10px" }}>
            <strong>{sub.subject}</strong>
            {sub.topics.length === 0 ? (
              <p>No topics yet.</p>
            ) : (
              <ul>
                {sub.topics.map((t, tIdx) => (
                  <li key={tIdx}>
                    <strong>{t.topic}</strong> <br />
                    Images: {t.images.join(", ")} <br />
                    Timestamp: {new Date(t.timestamp).toLocaleString()}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
