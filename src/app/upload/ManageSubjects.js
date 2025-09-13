"use client";

import { useState, useEffect } from "react";
import axios from "axios";

export default function ManageSubjects() {
  const [usn, setUsn] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState("");
  const [topicName, setTopicName] = useState("");
  const [message, setMessage] = useState("");

  // Track file input for each topic individually
  const [filesMap, setFilesMap] = useState({});

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
  const handleAddTopic = async (subject) => {
    if (!subject || !topicName) return;
    try {
      const res = await axios.post("/api/topic", {
        usn,
        subject,
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

  // Handle file selection per topic
  const handleFileChange = (subject, topic, file) => {
    setFilesMap({ ...filesMap, [`${subject}-${topic}`]: file });
  };

  // Upload image for a specific topic
  const handleUploadImage = async (subject, topic) => {
    const file = filesMap[`${subject}-${topic}`];
    if (!file) {
      setMessage("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("usn", usn);
    formData.append("subject", subject);
    formData.append("topic", topic);
    formData.append("file", file);

    try {
      const res = await axios.post("/api/topic/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setSubjects(res.data.subjects);
      setFilesMap({ ...filesMap, [`${subject}-${topic}`]: null });
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

      {/* Display Subjects & Topics */}
      <div>
        <h3>Existing Subjects & Topics</h3>
        {subjects.length === 0 && <p>No subjects added yet.</p>}

        {subjects.map((sub, idx) => (
          <div key={idx} style={{ marginBottom: "20px", border: "1px solid #ccc", padding: "10px" }}>
            <strong>{sub.subject}</strong>

            {/* Add Topic Input */}
            <div style={{ margin: "10px 0" }}>
              <input
                type="text"
                placeholder="New Topic Name"
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                style={{ width: "70%", marginRight: "10px" }}
              />
              <button onClick={() => handleAddTopic(sub.subject)}>Add Topic</button>
            </div>

            {sub.topics.length === 0 ? (
              <p>No topics yet.</p>
            ) : (
              <ul>
                {sub.topics.map((t, tIdx) => (
                  <li key={tIdx} style={{ marginBottom: "15px" }}>
                    <strong>{t.topic}</strong> <br />
                    Images: {t.images.join(", ")} <br />
                    Timestamp: {new Date(t.timestamp).toLocaleString()} <br />

                    {/* Upload image directly below topic */}
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(sub.subject, t.topic, e.target.files[0])}
                      style={{ marginTop: "5px", marginBottom: "5px" }}
                    />
                    <button onClick={() => handleUploadImage(sub.subject, t.topic)}>Upload Image</button>
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
