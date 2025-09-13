"use client";

import { useState, useEffect } from "react";
import axios from "axios";

export default function AddImagesToTopic({ subjects }) {
  const [usn, setUsn] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [newImages, setNewImages] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const storedUsn = localStorage.getItem("usn");
    if (storedUsn) setUsn(storedUsn);
  }, []);

  const handleAddImageField = () => {
    setNewImages([...newImages, ""]);
  };

  const handleImageChange = (index, value) => {
    const updated = [...newImages];
    updated[index] = value;
    setNewImages(updated);
  };

  const handleSubmit = async () => {
    if (!selectedSubject || !selectedTopic || newImages.length === 0) return;

    const imagesToAdd = newImages.filter((img) => img.trim() !== "");
    if (imagesToAdd.length === 0) return;

    try {
      const res = await axios.put("/api/topic/update", {
        usn,
        subject: selectedSubject,
        topic: selectedTopic,
        images: imagesToAdd
      });
      setMessage(res.data.message);
      setNewImages([]);
    } catch (err) {
      setMessage(err.response?.data?.error || "Error updating topic");
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
      <h3>Add Images to Topic</h3>
      <p style={{ color: "green" }}>{message}</p>

      <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} style={{ width: "100%", marginBottom: "10px" }}>
        <option value="">Select Subject</option>
        {subjects.map((s, idx) => <option key={idx} value={s.subject}>{s.subject}</option>)}
      </select>

      {selectedSubject && (
        <select value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)} style={{ width: "100%", marginBottom: "10px" }}>
          <option value="">Select Topic</option>
          {subjects.find((s) => s.subject === selectedSubject).topics.map((t, idx) => (
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
      <button onClick={handleSubmit}>Submit Images</button>
    </div>
  );
}
