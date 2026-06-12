"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { FiMail, FiLock, FiArrowRight, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import "../styles/ResetPassword.css";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1);
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
      setStep(2);
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
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setMessage(err.response?.data?.error || "Invalid OTP or error occurred.");
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rst-root">
      <div className="rst-card">
        <div className="rst-header">
          <h1 className="rst-title">Reset Password</h1>
          <p className="rst-subtitle">
            {step === 1 ? "Enter your email to receive an OTP." : `Enter the 6-digit code sent to ${email}.`}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="rst-form">
            <div className="rst-input-wrap">
              <FiMail className="rst-input-icon" />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rst-input"
                disabled={isLoading}
              />
            </div>

            {message && (
              <div className={`rst-message ${isSuccess ? "rst-message--ok" : "rst-message--err"}`}>
                {isSuccess ? <FiCheckCircle /> : <FiAlertCircle />}
                <span>{message}</span>
              </div>
            )}

            <button type="submit" className="rst-btn-primary" disabled={isLoading}>
              <span>{isLoading ? "Sending..." : "Send OTP"}</span>
              <FiArrowRight className={`rst-btn-arrow ${isLoading ? "rst-spin" : ""}`} />
            </button>

            <span className="rst-link" onClick={() => router.push("/login")}>
              Back to Login
            </span>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="rst-form">
            <div className="rst-input-wrap">
              <FiLock className="rst-input-icon" />
              <input
                type="text"
                placeholder="6-Digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                required
                className="rst-input"
                disabled={isLoading}
                maxLength={6}
              />
            </div>

            <div className="rst-input-wrap">
              <FiLock className="rst-input-icon" />
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="rst-input"
                disabled={isLoading}
              />
            </div>

            <div className="rst-input-wrap">
              <FiLock className="rst-input-icon" />
              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="rst-input"
                disabled={isLoading}
              />
            </div>

            {message && (
              <div className={`rst-message ${isSuccess ? "rst-message--ok" : "rst-message--err"}`}>
                {isSuccess ? <FiCheckCircle /> : <FiAlertCircle />}
                <span>{message}</span>
              </div>
            )}

            <button 
              type="submit" 
              className="rst-btn-primary"
              disabled={isLoading || otp.length !== 6 || newPassword.length === 0 || confirmPassword.length === 0}
            >
              <span>{isLoading ? "Resetting..." : "Reset Password"}</span>
              <FiArrowRight className={`rst-btn-arrow ${isLoading ? "rst-spin" : ""}`} />
            </button>
            
            <span 
              className="rst-link"
              onClick={() => { setStep(1); setOtp(""); setMessage(""); setNewPassword(""); setConfirmPassword(""); }}
            >
              Change Email / Resend OTP
            </span>
          </form>
        )}
      </div>
    </div>
  );
}
