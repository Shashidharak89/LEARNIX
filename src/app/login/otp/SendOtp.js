"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { FiMail, FiArrowRight, FiAlertCircle } from "react-icons/fi";
import "../styles/Otp.css";

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
    <div className="otp-root">
      <div className="otp-card">
        <div className="otp-header">
          <h1 className="otp-title">Login with OTP</h1>
          <p className="otp-subtitle">Enter your email to receive an OTP</p>
        </div>

        <form onSubmit={handleSendOtp} className="otp-form">
          <div className="otp-input-wrap">
            <FiMail className="otp-input-icon" />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="otp-input"
              disabled={isLoading}
            />
          </div>

          <button 
            type="submit" 
            className="otp-btn-primary"
            disabled={isLoading}
          >
            <span>{isLoading ? "Sending..." : "Send OTP"}</span>
            <FiArrowRight className={`otp-btn-arrow ${isLoading ? "otp-spin" : ""}`} />
          </button>
        </form>

        {message && (
          <div className="otp-message otp-message--err">
            <FiAlertCircle />
            <span>{message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
