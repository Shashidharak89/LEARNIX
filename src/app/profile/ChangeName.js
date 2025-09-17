"use client";

import { useState } from "react";
import axios from "axios";
import { FiEdit2, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import "./styles/UserProfile.css";

export default function ChangeName({ usn }) {
  const [newName, setNewName] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChangeName = async () => {
    if (!newName.trim()) {
      setMessage("Please enter a new name");
      setIsSuccess(false);
      return;
    }

    try {
      setIsLoading(true);
      const res = await axios.put("/api/user/change-name", {
        usn,
        newName,
      });

      setMessage(res.data.message);
      setIsSuccess(true);
      setNewName("");
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to update name");
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="up-change-name">
      <h3 className="up-change-name-title">
        <FiEdit2 /> Change Name
      </h3>
      <input
        type="text"
        placeholder="Enter new name"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        className="up-change-name-input"
        disabled={isLoading}
      />
      <button
        className="up-change-name-btn"
        onClick={handleChangeName}
        disabled={isLoading}
      >
        {isLoading ? "Updating..." : "Update Name"}
      </button>

      {message && (
        <div className={`up-message ${isSuccess ? "up-success" : "up-error"}`}>
          {isSuccess ? <FiCheckCircle /> : <FiAlertCircle />}
          <span>{message}</span>
        </div>
      )}
    </div>
  );
}