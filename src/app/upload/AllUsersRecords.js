"use client";

import { useState, useEffect } from "react";
import axios from "axios";

export default function AllUsersRecords() {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    try {
      const res = await axios.get("/api/work/getall");
      setUsers(res.data.users || []);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || "Failed to fetch records");
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "900px", margin: "auto" }}>
      <h2>All Users Records</h2>
      <p style={{ color: "red" }}>{message}</p>

      {users.length === 0 && <p>No users found.</p>}

      {users.map((user, uIdx) => (
        <div key={uIdx} style={{ marginBottom: "20px", border: "1px solid #ccc", padding: "10px" }}>
          <h3>{user.name} ({user.usn})</h3>
          {user.subjects.length === 0 ? (
            <p>No subjects added yet.</p>
          ) : (
            user.subjects.map((sub, sIdx) => (
              <div key={sIdx} style={{ marginBottom: "10px", paddingLeft: "10px" }}>
                <strong>Subject: {sub.subject}</strong>
                {sub.topics.length === 0 ? (
                  <p>No topics yet.</p>
                ) : (
                  <ul>
                    {sub.topics.map((t, tIdx) => (
                      <li key={tIdx}>
                        <strong>Topic:</strong> {t.topic} <br />
                        <strong>Images:</strong> {t.images.join(", ")} <br />
                        <strong>Timestamp:</strong> {new Date(t.timestamp).toLocaleString()}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))
          )}
        </div>
      ))}
    </div>
  );
}
