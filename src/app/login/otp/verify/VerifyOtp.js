"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { FiLock, FiArrowRight, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { verifyTokenAndSyncAuth } from "@/lib/clientAuth";
import "../../styles/Otp.css";

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
    <div className="otp-root">
      <div className="otp-card">
        <div className="otp-header">
          <h1 className="otp-title">Verify OTP</h1>
          <p className="otp-subtitle">Enter the 6-digit code sent to {email}</p>
        </div>

        <form onSubmit={handleVerifyOtp} className="otp-form">
          <div className="otp-input-wrap">
            <FiLock className="otp-input-icon" />
            <input
              type="text"
              placeholder="6-Digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
              required
              className="otp-input"
              disabled={isLoading}
              maxLength={6}
            />
          </div>

          <button 
            type="submit" 
            className="otp-btn-primary"
            disabled={isLoading || otp.length !== 6}
          >
            <span>{isLoading ? "Verifying..." : "Submit"}</span>
            <FiArrowRight className={`otp-btn-arrow ${isLoading ? "otp-spin" : ""}`} />
          </button>
          
          <span 
            className="otp-link"
            onClick={() => router.push("/login/otp")}
          >
            Change Email / Resend OTP
          </span>
        </form>

        {message && (
          <div className={`otp-message ${isSuccess ? "otp-message--ok" : "otp-message--err"}`}>
            {isSuccess ? <FiCheckCircle /> : <FiAlertCircle />}
            <span>{message}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyOtp() {
  return (
    <Suspense fallback={<div className="otp-root"><p>Loading...</p></div>}>
      <VerifyOtpContent />
    </Suspense>
  );
}
