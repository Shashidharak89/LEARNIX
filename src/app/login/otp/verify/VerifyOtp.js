"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  KeyRoundIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  SparklesIcon,
} from "@animateicons/react/lucide";
import { FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { verifyTokenAndSyncAuth } from "@/lib/clientAuth";
import "../../styles/Otp.css";

export default function VerifyOtp() {
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const keyIconRef = useRef(null);
  const shieldBtnRef = useRef(null);
  const backIconRef = useRef(null);

  useEffect(() => {
    if (!email) {
      router.push("/login/otp");
    }
  }, [email, router]);

  const saveAuthAndRedirect = useCallback(
    (data) => {
      if (typeof window !== "undefined") {
        if (data.token) {
          localStorage.setItem("token", data.token);
        }
      }

      verifyTokenAndSyncAuth({ redirectOnFailure: false }).finally(() => {
        setTimeout(() => {
          router.push("/workspace");
        }, 1200);
      });
    },
    [router]
  );

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const res = await axios.post("/api/auth/otp/verify", {
        email,
        otp: otp.trim(),
      });
      setMessage(res.data.message || "Logged in successfully.");
      setIsSuccess(true);
      saveAuthAndRedirect(res.data);
    } catch (err) {
      setMessage(err.response?.data?.error || "Invalid OTP code.");
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (!email) return null;

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
            <span>VERIFICATION CODE</span>
          </span>
          <h1 className="otp-title">Verify Passcode</h1>
          <p className="otp-subtitle">
            Enter the 6-digit code sent to <strong>{email}</strong>
          </p>
        </div>

        <form onSubmit={handleVerifyOtp} className="otp-form">
          <div
            className="otp-input-wrap"
            onMouseEnter={() => keyIconRef.current?.startAnimation?.()}
            onMouseLeave={() => keyIconRef.current?.stopAnimation?.()}
          >
            <div className="otp-input-icon-box">
              <KeyRoundIcon ref={keyIconRef} size={18} />
            </div>
            <input
              type="text"
              placeholder="••••••"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))
              }
              onFocus={() => keyIconRef.current?.startAnimation?.()}
              required
              className="otp-input otp-input--code"
              disabled={isLoading}
              maxLength={6}
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="otp-btn-primary"
            disabled={isLoading || otp.length !== 6}
            onMouseEnter={() => shieldBtnRef.current?.startAnimation?.()}
            onMouseLeave={() => shieldBtnRef.current?.stopAnimation?.()}
          >
            <ShieldCheckIcon ref={shieldBtnRef} size={18} />
            <span>{isLoading ? "Verifying code…" : "Verify & Sign In"}</span>
            <ArrowRightIcon size={16} className="otp-btn-arrow" />
          </button>
        </form>

        {message && (
          <div
            className={`otp-message ${
              isSuccess ? "otp-message--ok" : "otp-message--err"
            }`}
          >
            {isSuccess ? <FiCheckCircle /> : <FiAlertCircle />}
            <span>{message}</span>
          </div>
        )}

        <div className="otp-footer">
          <Link
            href="/login/otp"
            className="otp-back-link"
            onMouseEnter={() => backIconRef.current?.startAnimation?.()}
            onMouseLeave={() => backIconRef.current?.stopAnimation?.()}
          >
            <ArrowLeftIcon ref={backIconRef} size={15} />
            <span>Change email / Resend code</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
