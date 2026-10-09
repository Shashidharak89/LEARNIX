"use client";

import { useState } from "react";
import axios from "axios";
import { FiLock, FiKey, FiEye, FiEyeOff, FiCheckCircle, FiAlertCircle, FiCheck } from "react-icons/fi";
import "./styles/UserProfile.css";

export default function ChangePassword({ usn }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      setMessage("Please enter both current and new passwords");
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

      setMessage(res.data.message || "Password updated successfully");
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
    <div className="up-change-password">
      <div className="up-card-header-group">
        <h3 className="up-change-password-title">
          <span className="up-card-icon-badge"><FiLock /></span>
          Account Security
        </h3>
        <p className="up-card-desc">Keep your account safe by updating your password.</p>
      </div>

      <div className="up-form-body">
        <div className="up-input-group">
          <label className="up-input-label">Current Password</label>
          <div className="up-input-wrapper">
            <FiLock className="up-input-icon" />
            <input
              type={showOldPass ? "text" : "password"}
              placeholder="Enter current password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="up-text-input has-toggle"
              disabled={isLoading}
            />
            <button
              type="button"
              className="up-pass-toggle-btn"
              onClick={() => setShowOldPass(!showOldPass)}
              title={showOldPass ? "Hide password" : "Show password"}
            >
              {showOldPass ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </div>

        <div className="up-input-group">
          <label className="up-input-label">New Password</label>
          <div className="up-input-wrapper">
            <FiKey className="up-input-icon" />
            <input
              type={showNewPass ? "text" : "password"}
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="up-text-input has-toggle"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleChangePassword();
              }}
            />
            <button
              type="button"
              className="up-pass-toggle-btn"
              onClick={() => setShowNewPass(!showNewPass)}
              title={showNewPass ? "Hide password" : "Show password"}
            >
              {showNewPass ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </div>

        <button
          type="button"
          className="up-settings-submit-btn"
          onClick={handleChangePassword}
          disabled={isLoading || !oldPassword || !newPassword}
        >
          {isLoading ? (
            <>
              <div className="up-mini-spinner" />
              <span>Updating...</span>
            </>
          ) : (
            <>
              <FiCheck />
              <span>Update Password</span>
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