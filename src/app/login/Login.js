"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { FiUser, FiHash, FiLock, FiArrowRight, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import "./styles/Login.css";

export default function Login() {
  const [name, setName] = useState("");
  const [usn, setUsn] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    
    try {
      const res = await axios.post("/api/auth", { name, usn: usn.trim().toUpperCase(), password });
      setMessage(res.data.message);
      setIsSuccess(true);

      if (typeof window !== "undefined") {
        localStorage.setItem("usn", res.data.user.usn); // 🔹 store in localStorage
        localStorage.setItem("name", res.data.user.name);
      }

      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err) {
      setMessage(err.response?.data?.error || "Something went wrong");
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
            <FiUser className="auth-main-icon" />
          </div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to your account or create a new one</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <div className="input-wrapper">
              <FiUser className="input-icon" />
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="auth-input"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="input-group">
            <div className="input-wrapper">
              <FiHash className="input-icon" />
              <input
                type="text"
                placeholder="University Seat Number"
                value={usn}
                onChange={(e) => setUsn(e.target.value.toUpperCase())}
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
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              {isLoading ? "Processing..." : "Continue"}
            </span>
            <FiArrowRight className={`btn-icon ${isLoading ? "spinning" : ""}`} />
          </button>

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
        </form>

        <div className="auth-footer">
          <div className="auth-decorative-line"></div>
          <span className="auth-footer-text">Secure Authentication</span>
          <div className="auth-decorative-line"></div>
        </div>
      </div>
    </div>
  );
}