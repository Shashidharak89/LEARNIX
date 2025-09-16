"use client";

import { useState } from "react";
import axios from "axios";
import { FiLock, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import "./styles/ChangeName.css";

export default function ChangePassword({ usn }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      setMessage("Please enter both old and new passwords");
      setIsSuccess(false);
      return;
    }

    try {
      setIsLoading(true);
      const res = await axios.put("/api/user/change-password", {
        usn,
        oldPassword,
        newPassword,
      });

      setMessage(res.data.message);
      setIsSuccess(true);
      setOldPassword("");
      setNewPassword("");
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to update password");
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="change-pass-box">
      <h3 className="change-pass-title">
        <FiLock /> Change Password
      </h3>
      <input
        type="password"
        placeholder="Enter old password"
        value={oldPassword}
        onChange={(e) => setOldPassword(e.target.value)}
        className="change-pass-input"
        disabled={isLoading}
      />
      <input
        type="password"
        placeholder="Enter new password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        className="change-pass-input"
        disabled={isLoading}
      />
      <button
        className="change-pass-btn"
        onClick={handleChangePassword}
        disabled={isLoading}
      >
        {isLoading ? "Updating..." : "Update Password"}
      </button>

      {message && (
        <div className={`change-pass-msg ${isSuccess ? "success" : "error"}`}>
          {isSuccess ? <FiCheckCircle /> : <FiAlertCircle />}
          <span>{message}</span>
        </div>
      )}
    </div>
  );
}
