"use client";

import { useState, useRef } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MailIcon,
  ArrowRightIcon,
  LogInIcon,
  SparklesIcon,
} from "@animateicons/react/lucide";
import { FiAlertCircle } from "react-icons/fi";
import "../styles/Otp.css";

export default function SendOtp() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const mailIconRef = useRef(null);
  const submitArrowRef = useRef(null);
  const backIconRef = useRef(null);

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
      <div className="otp-ambient-bg" aria-hidden="true">
        <div className="otp-ambient-blob otp-ambient-blob--blue" />
        <div className="otp-ambient-blob otp-ambient-blob--amber" />
      </div>

      <div className="otp-card">
        <div className="otp-header">
          <span className="otp-apple-badge">
            <SparklesIcon size={13} className="otp-badge-icon" />
            <span>PASSWORDLESS AUTH</span>
          </span>
          <h1 className="otp-title">Login with OTP</h1>
          <p className="otp-subtitle">
            Enter your registered email to receive a 6-digit one-time passcode.
          </p>
        </div>

        <form onSubmit={handleSendOtp} className="otp-form">
          <div
            className="otp-input-wrap"
            onMouseEnter={() => mailIconRef.current?.startAnimation?.()}
            onMouseLeave={() => mailIconRef.current?.stopAnimation?.()}
          >
            <div className="otp-input-icon-box">
              <MailIcon ref={mailIconRef} size={18} />
            </div>
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => mailIconRef.current?.startAnimation?.()}
              required
              className="otp-input"
              disabled={isLoading}
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="otp-btn-primary"
            disabled={isLoading || !email.trim()}
            onMouseEnter={() => submitArrowRef.current?.startAnimation?.()}
            onMouseLeave={() => submitArrowRef.current?.stopAnimation?.()}
          >
            <span>{isLoading ? "Sending passcode…" : "Send OTP"}</span>
            <ArrowRightIcon ref={submitArrowRef} size={17} className="otp-btn-arrow" />
          </button>
        </form>

        {message && (
          <div className="otp-message otp-message--err">
            <FiAlertCircle />
            <span>{message}</span>
          </div>
        )}

        <div className="otp-footer">
          <Link
            href="/login"
            className="otp-back-link"
            onMouseEnter={() => backIconRef.current?.startAnimation?.()}
            onMouseLeave={() => backIconRef.current?.stopAnimation?.()}
          >
            <LogInIcon ref={backIconRef} size={16} />
            <span>Back to regular login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
