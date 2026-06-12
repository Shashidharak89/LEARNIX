"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { FiLock, FiArrowRight, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { verifyTokenAndSyncAuth } from "@/lib/clientAuth";
import "../../styles/Login.css";

function VerifyOtpContent() {
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  useEffect(() => {
    if (!email) {
      router.push("/login/otp");
    }
  }, [email, router]);

  const saveAuthAndRedirect = useCallback((data) => {
    if (typeof window !== "undefined") {
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
    }

    verifyTokenAndSyncAuth({ redirectOnFailure: false }).finally(() => {
      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    });
  }, [router]);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    
    try {
      const res = await axios.post("/api/auth/otp/verify", { email, otp: otp.trim() });
      setMessage(res.data.message || "Logged in successfully.");
      setIsSuccess(true);
      saveAuthAndRedirect(res.data);
    } catch (err) {
      setMessage(err.response?.data?.error || "Invalid OTP.");
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (!email) return null;

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <div className="auth-header">
          <div className="auth-icon-circle">
            <FiLock className="auth-main-icon" />
          </div>
          <h1 className="auth-title">Verify OTP</h1>
          <p className="auth-subtitle">Enter the 6-digit code sent to {email}</p>
        </div>

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

          <button 
            type="submit" 
            className={`auth-submit-btn ${isLoading ? "loading" : ""}`}
            disabled={isLoading || otp.length !== 6}
          >
            <span className="btn-text">
              {isLoading ? "Verifying..." : "Submit"}
            </span>
            <FiArrowRight className={`btn-icon ${isLoading ? "spinning" : ""}`} />
          </button>
          
          <div className="auth-switch-line">
            <span 
              className="auth-switch-link" 
              style={{ cursor: 'pointer' }}
              onClick={() => router.push("/login/otp")}
            >
              Change Email / Resend OTP
            </span>
          </div>
        </form>

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

export default function VerifyOtp() {
  return (
    <Suspense fallback={<div className="auth-container"><p>Loading...</p></div>}>
      <VerifyOtpContent />
    </Suspense>
  );
}
