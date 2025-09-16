"use client";

import { useState } from "react";
import axios from "axios";
import { FiEdit2, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import "./styles/ChangeName.css";

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
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to update name");
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="change-name-box">
      <h3 className="change-name-title">
        <FiEdit2 /> Change Name
      </h3>
      <input
        type="text"
        placeholder="Enter new name"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        className="change-name-input"
        disabled={isLoading}
      />
      <button
        className="change-name-btn"
        onClick={handleChangeName}
        disabled={isLoading}
      >
        {isLoading ? "Updating..." : "Update Name"}
      </button>

      {message && (
        <div className={`change-name-msg ${isSuccess ? "success" : "error"}`}>
          {isSuccess ? <FiCheckCircle /> : <FiAlertCircle />}
          <span>{message}</span>
        </div>
      )}
    </div>
  );
}
