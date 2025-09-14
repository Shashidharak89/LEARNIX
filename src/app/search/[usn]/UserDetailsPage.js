"use client";

import { useState, useEffect } from "react";
import axios from "axios";

export default function UserDetailsPage({ usn }) {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (usn) {
      fetchUserDetails(usn);
    }
  }, [usn]);

  const fetchUserDetails = async (usnToSearch) => {
    try {
      const res = await axios.get(`/api/user?usn=${usnToSearch}`);
      setUser(res.data.user);
      setMessage("");
    } catch (err) {
      console.error(err);
      if (err.response?.status === 404) {
        setMessage("User not found!");
      } else {
        setMessage(err.response?.data?.error || "Failed to fetch user details");
      }
      setUser(null);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "900px", margin: "auto" }}>
      <h2>User Details for {usn.toUpperCase()}</h2>
      <p style={{ color: "red" }}>{message}</p>

      {/* Display User Details */}
      {user ? (
        <div>
          <h3>
            {user.name} ({user.usn})
          </h3>
          {user.subjects.length === 0 ? (
            <p>No subjects added yet.</p>
          ) : (
            user.subjects.map((sub, sIdx) => (
              <div
                key={sIdx}
                style={{
                  marginBottom: "20px",
                  border: "1px solid #ccc",
                  padding: "10px",
                }}
              >
                <strong>Subject: {sub.subject}</strong>
                {sub.topics.length === 0 ? (
                  <p>No topics yet.</p>
                ) : (
                  <ul>
                    {sub.topics.map((t, tIdx) => (
                      <li key={tIdx}>
                        <strong>Topic:</strong> {t.topic} <br />
                        <strong>Images:</strong> {t.images.join(", ")} <br />
                        <strong>Timestamp:</strong>{" "}
                        {new Date(t.timestamp).toLocaleString()}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <p>No user selected or user does not exist.</p>
      )}
    </div>
  );
}
