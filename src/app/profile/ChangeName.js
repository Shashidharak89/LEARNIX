"use client";

import { useState } from "react";
import axios from "axios";
import { FiEdit2, FiUser, FiCheckCircle, FiAlertCircle, FiCheck } from "react-icons/fi";
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
        newName: newName.trim(),
      });

      setMessage(res.data.message || "Name updated successfully");
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
      <div className="up-card-header-group">
        <h3 className="up-change-name-title">
          <span className="up-card-icon-badge"><FiEdit2 /></span>
          Display Name
        </h3>
        <p className="up-card-desc">Update the full name displayed on your profile and uploads.</p>
      </div>

      <div className="up-form-body">
        <div className="up-input-group">
          <label className="up-input-label">New Full Name</label>
          <div className="up-input-wrapper">
            <FiUser className="up-input-icon" />
            <input
              type="text"
              placeholder="Enter your new name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="up-text-input"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleChangeName();
              }}
            />
          </div>
        </div>

        <button
          type="button"
          className="up-settings-submit-btn"
          onClick={handleChangeName}
          disabled={isLoading || !newName.trim()}
        >
          {isLoading ? (
            <>
              <div className="up-mini-spinner" />
              <span>Updating...</span>
            </>
          ) : (
            <>
              <FiCheck />
              <span>Save Name</span>
            </>
          )}
        </button>

        {message && (
          <div className={`up-message ${isSuccess ? "up-success" : "up-error"}`}>
            {isSuccess ? <FiCheckCircle /> : <FiAlertCircle />}
            <span>{message}</span>
          </div>
        )}
      </div>
    </div>
  );
}