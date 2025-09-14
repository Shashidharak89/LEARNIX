"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function UserData() {
  const [userData, setUserData] = useState(null);
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    const usn = localStorage.getItem("usn");
    if (!usn) {
      setMessage("Please login to view your data.");
      return;
    }

    const fetchData = async () => {
      try {
        const res = await axios.get(`/api/work/get?usn=${usn}`);
        setUserData(res.data);
        setMessage("");
      } catch (err) {
        setMessage(err.response?.data?.error || "Failed to fetch data.");
      }
    };

    fetchData();
  }, []);

  if (message) return <p style={{ textAlign: "center", marginTop: "50px" }}>{message}</p>;

  return (
    <div style={{ padding: "20px", maxWidth: "700px", margin: "auto" }}>
      <h2>User Data</h2>
      <p><strong>Name:</strong> {userData.name}</p>
      <p><strong>USN:</strong> {userData.usn}</p>
      <p><strong>Created At:</strong> {new Date(userData.createdAt).toLocaleString()}</p>

      <h3>Subjects & Topics</h3>
      {userData.subjects.length === 0 && <p>No subjects added yet.</p>}
      {userData.subjects.map((sub, idx) => (
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
  );
}
