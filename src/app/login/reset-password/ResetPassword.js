"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { FiMail, FiLock, FiArrowRight, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import "../styles/Login.css";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1); // 1 for email, 2 for OTP & passwords
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    
    try {
      const res = await axios.post("/api/auth/reset-password/send", { email: email.trim() });
      setMessage(res.data.message || "OTP sent to your email.");
      setIsSuccess(true);
      setStep(2); // Move to OTP & Password entry step
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to send OTP.");
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      setIsSuccess(false);
      return;
    }

    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters.");
      setIsSuccess(false);
      return;
    }

    setIsLoading(true);
    setMessage("");
    
    try {
      const res = await axios.post("/api/auth/reset-password/verify", { 
        email: email.trim(), 
        otp: otp.trim(),
        newPassword,
        confirmPassword
      });
      setMessage(res.data.message || "Password reset successfully.");
      setIsSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      setMessage(err.response?.data?.error || "Invalid OTP or error occurred.");
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <div className="auth-header">
          <div className="auth-icon-circle">
            <FiLock className="auth-main-icon" />
          </div>
          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-subtitle">
            {step === 1 ? "Enter your email to receive an OTP" : `Enter the 6-digit code sent to ${email} and set a new password`}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="auth-form">
            <div className="input-group">
              <div className="input-wrapper">
                <FiMail className="input-icon" />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="auth-input"
                  disabled={isLoading}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className={`auth-submit-btn ${isLoading ? "loading" : ""}`}
              disabled={isLoading}
            >
              <span className="btn-text">
                {isLoading ? "Sending..." : "Send OTP"}
              </span>
              <FiArrowRight className={`btn-icon ${isLoading ? "spinning" : ""}`} />
            </button>

            <div className="auth-switch-line">
              <span 
                className="auth-switch-link" 
                style={{ cursor: 'pointer' }}
                onClick={() => router.push("/login")}
              >
                Back to Login
              </span>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="auth-form">
            <div className="input-group">
              <div className="input-wrapper">
                <FiLock className="input-icon" />
                <input
                  type="text"
                  placeholder="6-Digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  required
                  className="auth-input"
                  disabled={isLoading}
                  maxLength={6}
                />
              </div>
            </div>

            <div className="input-group">
              <div className="input-wrapper">
                <FiLock className="input-icon" />
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="auth-input"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="input-group">
              <div className="input-wrapper">
                <FiLock className="input-icon" />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="auth-input"
                  disabled={isLoading}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className={`auth-submit-btn ${isLoading ? "loading" : ""}`}
              disabled={isLoading || otp.length !== 6 || newPassword.length === 0 || confirmPassword.length === 0}
            >
              <span className="btn-text">
                {isLoading ? "Resetting..." : "Reset Password"}
              </span>
              <FiArrowRight className={`btn-icon ${isLoading ? "spinning" : ""}`} />
            </button>
            
            <div className="auth-switch-line">
              <span 
                className="auth-switch-link" 
                style={{ cursor: 'pointer' }}
                onClick={() => { setStep(1); setOtp(""); setMessage(""); setNewPassword(""); setConfirmPassword(""); }}
              >
                Change Email / Resend OTP
              </span>
            </div>
          </form>
        )}

        {message && (
          <div className={`auth-message ${isSuccess ? "success" : "error"}`}>
            {isSuccess ? (
              <FiCheckCircle className="message-icon" />
            ) : (
              <FiAlertCircle className="message-icon" />
            )}
            <span>{message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
