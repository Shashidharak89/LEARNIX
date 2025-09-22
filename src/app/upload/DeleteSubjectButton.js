"use client";

import { useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import { useTheme } from "@/context/ThemeContext";
import "./styles/DeleteButton.css";

export default function DeleteSubjectButton({ usn, subject, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/subject/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usn, subject }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to delete subject");
      } else {
        if (onDelete) onDelete(data.subjects);
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting subject");
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  };

  return (
    <div className={`delete-button-container ${theme}`}>
      {!confirming ? (
        <button
          className="delete-btn"
          onClick={() => setConfirming(true)}
          disabled={loading}
          aria-label="Delete subject"
        >
          <FiTrash2 size={18} />
        </button>
      ) : (
        <div className="confirm-box">
          <p>Delete subject?</p>
          <div className="confirm-actions">
            <button
              className="confirm-yes"
              onClick={handleDelete}
              disabled={loading}
              aria-label="Confirm delete subject"
            >
              {loading ? "..." : "Yes"}
            </button>
            <button
              className="confirm-no"
              onClick={() => setConfirming(false)}
              disabled={loading}
              aria-label="Cancel delete subject"
            >
              No
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
