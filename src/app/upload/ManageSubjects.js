"use client";

import { useState, useEffect } from "react";
import axios from "axios";

export default function ManageSubjects() {
  const [usn, setUsn] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [topicName, setTopicName] = useState("");
  const [topicImages, setTopicImages] = useState("");
  const [message, setMessage] = useState("");

  // For adding more images to existing topic
  const [editingTopic, setEditingTopic] = useState("");
  const [newImages, setNewImages] = useState([]);

  // Load USN from localStorage
  useEffect(() => {
    const storedUsn = localStorage.getItem("usn");
    if (storedUsn) setUsn(storedUsn);
    fetchSubjects(storedUsn);
  }, []);

  // Fetch subjects from backend
  const fetchSubjects = async (usn) => {
    try {
      const res = await axios.get("/api/work/get", { params: { usn } });
      setSubjects(res.data.subjects || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Add a new subject
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

  // Add a new topic
  const handleAddTopic = async () => {
    if (!selectedSubject || !topicName) return;
    try {
      const imagesArray = topicImages.split(",").map((url) => url.trim());
      const res = await axios.post("/api/topic", {
        usn,
        subject: selectedSubject,
        topic: topicName,
        images: imagesArray
      });
      setSubjects(res.data.subjects);
      setTopicName("");
      setTopicImages("");
      setMessage("Topic added!");
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || "Error adding topic");
    }
  };

  // Add new image input for editing topic
  const handleAddImageField = () => {
    setNewImages([...newImages, ""]);
  };

  const handleImageChange = (index, value) => {
    const updated = [...newImages];
    updated[index] = value;
    setNewImages(updated);
  };

  const handleUpdateImages = async () => {
    if (!selectedSubject || !editingTopic || newImages.length === 0) return;
    const imagesToAdd = newImages.filter((img) => img.trim() !== "");
    if (imagesToAdd.length === 0) return;

    try {
      const res = await axios.put("/api/topic/update", {
        usn,
        subject: selectedSubject,
        topic: editingTopic,
        images: imagesToAdd
      });
      setSubjects(res.data.subjects);
      setNewImages([]);
      setEditingTopic("");
      setMessage("Images added successfully!");
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || "Error updating topic");
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
        <input
          type="text"
          placeholder="Image URLs (comma separated)"
          value={topicImages}
          onChange={(e) => setTopicImages(e.target.value)}
          style={{ width: "100%", marginBottom: "10px" }}
        />
        <button onClick={handleAddTopic}>Add Topic</button>
      </div>

      {/* Add More Images to Existing Topic */}
      <div style={{ marginBottom: "20px" }}>
        <h3>Add Images to Existing Topic</h3>
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
        {newImages.map((img, idx) => (
          <input
            key={idx}
            type="text"
            placeholder="Image URL"
            value={img}
            onChange={(e) => handleImageChange(idx, e.target.value)}
            style={{ width: "100%", marginBottom: "5px" }}
          />
        ))}
        <button onClick={handleAddImageField} style={{ marginBottom: "10px" }}>+ Add Another Image</button>
        <br />
        <button onClick={handleUpdateImages}>Update Topic Images</button>
      </div>

      {/* Display Subjects and Topics */}
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
