"use client";

import { useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import "./styles/DeleteButton.css";

export default function DeleteTopicButton({ usn, subject, topic, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/topic/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usn, subject, topic }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to delete topic");
      } else {
        if (onDelete) onDelete(data.subjects); // parent gets updated subjects
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting topic");
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  };

  return (
    <div className="delete-button-container">
      {!confirming ? (
        <button
          className="delete-btn"
          onClick={() => setConfirming(true)}
          disabled={loading}
        >
          <FiTrash2 size={18} />
        </button>
      ) : (
        <div className="confirm-box">
          <p>Delete topic?</p>
          <div className="confirm-actions">
            <button
              className="confirm-yes"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "..." : "Yes"}
            </button>
            <button
              className="confirm-no"
              onClick={() => setConfirming(false)}
              disabled={loading}
            >
              No
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
