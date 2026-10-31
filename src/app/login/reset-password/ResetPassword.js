"use client";

import { useState, useRef } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MailIcon,
  LockIcon,
  KeyRoundIcon,
  ArrowRightIcon,
  LogInIcon,
  SparklesIcon,
} from "@animateicons/react/lucide";
import { FiCheckCircle, FiAlertCircle } from "react-icons/fi";
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

  const mailIconRef = useRef(null);
  const otpIconRef = useRef(null);
  const passIconRef = useRef(null);
  const confirmPassIconRef = useRef(null);
  const submitArrowRef = useRef(null);
  const backIconRef = useRef(null);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const res = await axios.post("/api/auth/reset-password/send", {
        email: email.trim(),
      });
      setMessage(res.data.message || "Passcode sent to your email.");
      setIsSuccess(true);
      setStep(2);
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to send reset code.");
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
        confirmPassword,
      });
      setMessage(res.data.message || "Password reset successfully! Redirecting…");
      setIsSuccess(true);
      setTimeout(() => router.push("/login"), 1800);
    } catch (err) {
      setMessage(err.response?.data?.error || "Invalid OTP code or request expired.");
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rst-root">
      <div className="rst-ambient-bg" aria-hidden="true">
        <div className="rst-ambient-blob rst-ambient-blob--blue" />
        <div className="rst-ambient-blob rst-ambient-blob--amber" />
      </div>

      <div className="rst-card">
        <div className="rst-header">
          <span className="rst-apple-badge">
            <SparklesIcon size={13} className="rst-badge-icon" />
            <span>ACCOUNT RECOVERY</span>
          </span>
          <h1 className="rst-title">Reset Password</h1>
          <p className="rst-subtitle">
            {step === 1
              ? "Enter your registered email to receive an authorization code."
              : `Enter the 6-digit code sent to ${email} and choose a new password.`}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="rst-form">
            <div
              className="rst-input-wrap"
              onMouseEnter={() => mailIconRef.current?.startAnimation?.()}
              onMouseLeave={() => mailIconRef.current?.stopAnimation?.()}
            >
              <div className="rst-input-icon-box">
                <MailIcon ref={mailIconRef} size={18} />
              </div>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => mailIconRef.current?.startAnimation?.()}
                required
                className="rst-input"
                disabled={isLoading}
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="rst-btn-primary"
              disabled={isLoading || !email.trim()}
              onMouseEnter={() => submitArrowRef.current?.startAnimation?.()}
              onMouseLeave={() => submitArrowRef.current?.stopAnimation?.()}
            >
              <span>{isLoading ? "Sending code…" : "Send Reset Code"}</span>
              <ArrowRightIcon ref={submitArrowRef} size={17} className="rst-btn-arrow" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="rst-form">
            <div
              className="rst-input-wrap"
              onMouseEnter={() => otpIconRef.current?.startAnimation?.()}
              onMouseLeave={() => otpIconRef.current?.stopAnimation?.()}
            >
              <div className="rst-input-icon-box">
                <KeyRoundIcon ref={otpIconRef} size={18} />
              </div>
              <input
                type="text"
                placeholder="6-Digit Code"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))
                }
                onFocus={() => otpIconRef.current?.startAnimation?.()}
                required
                className="rst-input rst-input--code"
                disabled={isLoading}
                maxLength={6}
                autoFocus
              />
            </div>

            <div
              className="rst-input-wrap"
              onMouseEnter={() => passIconRef.current?.startAnimation?.()}
              onMouseLeave={() => passIconRef.current?.stopAnimation?.()}
            >
              <div className="rst-input-icon-box">
                <LockIcon ref={passIconRef} size={18} />
              </div>
              <input
                type="password"
                placeholder="New Password (min. 6 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onFocus={() => passIconRef.current?.startAnimation?.()}
                required
                className="rst-input"
                disabled={isLoading}
              />
            </div>

            <div
              className="rst-input-wrap"
              onMouseEnter={() => confirmPassIconRef.current?.startAnimation?.()}
              onMouseLeave={() => confirmPassIconRef.current?.stopAnimation?.()}
            >
              <div className="rst-input-icon-box">
                <LockIcon ref={confirmPassIconRef} size={18} />
              </div>
              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onFocus={() => confirmPassIconRef.current?.startAnimation?.()}
                required
                className="rst-input"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              className="rst-btn-primary"
              disabled={isLoading || otp.length !== 6 || !newPassword}
              onMouseEnter={() => submitArrowRef.current?.startAnimation?.()}
              onMouseLeave={() => submitArrowRef.current?.stopAnimation?.()}
            >
              <span>{isLoading ? "Updating password…" : "Reset Password"}</span>
              <ArrowRightIcon ref={submitArrowRef} size={17} className="rst-btn-arrow" />
            </button>

            <button
              type="button"
              className="rst-btn-back"
              onClick={() => {
                setStep(1);
                setMessage("");
              }}
              disabled={isLoading}
            >
              Change Email / Resend Code
            </button>
          </form>
        )}

        {message && (
          <div
            className={`rst-message ${
              isSuccess ? "rst-message--ok" : "rst-message--err"
            }`}
          >
            {isSuccess ? <FiCheckCircle /> : <FiAlertCircle />}
            <span>{message}</span>
          </div>
        )}

        <div className="rst-footer">
          <Link
            href="/login"
            className="rst-back-link"
            onMouseEnter={() => backIconRef.current?.startAnimation?.()}
            onMouseLeave={() => backIconRef.current?.stopAnimation?.()}
          >
            <LogInIcon ref={backIconRef} size={16} />
            <span>Return to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
