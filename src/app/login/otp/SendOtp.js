"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { FiMail, FiArrowRight, FiAlertCircle } from "react-icons/fi";
import "../styles/Login.css";

export default function SendOtp() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    
    try {
      await axios.post("/api/auth/otp/send", { email: email.trim() });
      router.push(`/login/otp/verify?email=${encodeURIComponent(email.trim())}`);
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to send OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <div className="auth-header">
          <div className="auth-icon-circle">
            <FiMail className="auth-main-icon" />
          </div>
          <h1 className="auth-title">Login with OTP</h1>
          <p className="auth-subtitle">Enter your email to receive an OTP</p>
        </div>

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
        </form>

        {message && (
          <div className="auth-message error">
            <FiAlertCircle className="message-icon" />
            <span>{message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
