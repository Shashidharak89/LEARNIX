"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Script from "next/script";
import Image from "next/image";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiUser, FiHash, FiArrowRight, FiCheckCircle, FiAlertCircle, FiMail, FiLock } from "react-icons/fi";
import { verifyTokenAndSyncAuth } from "@/lib/clientAuth";
import "../login/styles/Login.css";

export default function Signup({ googleClientId = "" }) {
  const [step, setStep] = useState("verify");
  const [name, setName] = useState("");
  const [usn, setUsn] = useState("");
  const [password, setPassword] = useState("");
  const [googleCredential, setGoogleCredential] = useState("");
  const [googleProfile, setGoogleProfile] = useState(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isManualLoading, setIsManualLoading] = useState(false);
  const [googleScriptReady, setGoogleScriptReady] = useState(false);
  const [isGoogleButtonRendered, setIsGoogleButtonRendered] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const googleButtonRef = useRef(null);
  const router = useRouter();

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

  const handleGoogleCredential = useCallback(async (response) => {
    const credential = String(response?.credential || "").trim();
    if (!credential) {
      setIsSuccess(false);
      setMessage("Google did not return a valid credential.");
      return;
    }

    try {
      setIsGoogleLoading(true);
      setMessage("");

      const res = await axios.post("/api/auth/google-signup", {
        step: "verify",
        credential,
      });

      setGoogleCredential(credential);
      setGoogleProfile(res.data?.profile || null);
      setStep("usn");
      setIsSuccess(true);
      setMessage(res.data?.message || "Google account verified. Enter your USN to continue.");
    } catch (err) {
      setIsSuccess(false);
      setMessage(err.response?.data?.error || "Google verification failed.");
    } finally {
      setIsGoogleLoading(false);
    }
  }, []);

  const handleHardcodedGoogleClick = useCallback(() => {
    if (!googleClientId) {
      setIsSuccess(false);
      setMessage("Google signup is currently unavailable.");
      return;
    }

    if (!window.google?.accounts?.id) {
      setIsSuccess(false);
      setMessage("Google is still loading. Please try again.");
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential,
      });

      // Fallback trigger when the official rendered button does not appear immediately.
      window.google.accounts.id.prompt();
    } catch {
      setIsSuccess(false);
      setMessage("Unable to open Google signup right now. Please try again.");
    }
  }, [googleClientId, handleGoogleCredential]);

  useEffect(() => {
    if (!googleScriptReady || !googleButtonRef.current || !googleClientId || step !== "verify") return;
    if (!window.google?.accounts?.id) return;

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: handleGoogleCredential,
    });

    googleButtonRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: "outline",
      size: "large",
      shape: "pill",
      text: "signup_with",
      logo_alignment: "left",
      width: 320,
    });

    setTimeout(() => {
      if (googleButtonRef.current?.childElementCount > 0) {
        setIsGoogleButtonRendered(true);
      }
    }, 300);
  }, [googleScriptReady, googleClientId, step, handleGoogleCredential]);

  const handleFinish = async (e) => {
    e.preventDefault();
    if (!googleCredential) {
      setIsSuccess(false);
      setMessage("Please verify Google account first.");
      return;
    }

    setIsFinishing(true);
    setMessage("");

    try {
      const res = await axios.post("/api/auth/google-signup", {
        step: "create",
        credential: googleCredential,
        usn: usn.trim().toUpperCase(),
      });

      setMessage(res.data.message);
      setIsSuccess(true);
      saveAuthAndRedirect(res.data);
    } catch (err) {
      setMessage(err.response?.data?.error || "Something went wrong");
      setIsSuccess(false);
    } finally {
      setIsFinishing(false);
    }
  };

  const handleManualSignup = async (e) => {
    e.preventDefault();
    setIsManualLoading(true);
    setMessage("");

    try {
      const res = await axios.post("/api/auth", {
        name,
        usn: usn.trim().toUpperCase(),
        password,
      });

      setMessage(res.data.message || "Account created successfully.");
      setIsSuccess(true);
      saveAuthAndRedirect(res.data);
    } catch (err) {
      setMessage(err.response?.data?.error || "Something went wrong");
      setIsSuccess(false);
    } finally {
      setIsManualLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGoogleScriptReady(true)}
      />
      <div className="auth-wrapper">
        <div className="auth-header">
          <div className="auth-icon-circle">
            <FiUser className="auth-main-icon" />
          </div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">
            {step === "verify"
              ? "Sign up with Google to verify your account"
              : step === "usn"
                ? "Google verified. Enter USN / Reg No to finish"
                : "Create account with name, USN and password"}
          </p>
        </div>

        <form onSubmit={step === "manual" ? handleManualSignup : handleFinish} className="auth-form">
          {step === "verify" ? (
            <div className="auth-google-wrap">
              <div className="auth-google-divider">
                <span>Step 1</span>
              </div>
              {!isGoogleButtonRendered && (
                <button
                  type="button"
                  className="auth-google-hardcoded-btn"
                  onClick={handleHardcodedGoogleClick}
                  disabled={isGoogleLoading}
                >
                  Signup with Google
                </button>
              )}
              {googleClientId ? (
                <div
                  ref={googleButtonRef}
                  className="auth-google-button-slot"
                  style={{ display: isGoogleButtonRendered ? "flex" : "none" }}
                />
              ) : (
                <div className="auth-google-missing">
                  Google signup is currently unavailable.
                </div>
              )}
              {isGoogleLoading && (
                <p className="auth-google-loading">Verifying Google account...</p>
              )}

              <button
                type="button"
                className="auth-guest-btn"
                onClick={() => {
                  setStep("manual");
                  setMessage("");
                  setIsSuccess(false);
                }}
                disabled={isGoogleLoading}
              >
                Continue without google account
              </button>
            </div>
          ) : step === "usn" ? (
            <>
              <div className="auth-verified-profile">
                <Image
                  src={googleProfile?.profileimg || "https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp"}
                  alt="Google Profile"
                  className="auth-verified-avatar"
                  width={44}
                  height={44}
                />
                <div className="auth-verified-details">
                  <p className="auth-verified-name">{googleProfile?.name || "Google User"}</p>
                  <p className="auth-verified-email">
                    <FiMail />
                    <span>{googleProfile?.email || ""}</span>
                  </p>
                </div>
              </div>

              <div className="auth-google-divider">
                <span>Step 2</span>
              </div>

              <div className="input-group">
                <div className="input-wrapper">
                  <FiHash className="input-icon" />
                  <input
                    type="text"
                    placeholder="USN / Register Number / ID"
                    value={usn}
                    onChange={(e) => setUsn(e.target.value.toUpperCase())}
                    required
                    className="auth-input"
                    disabled={isFinishing}
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`auth-submit-btn ${isFinishing ? "loading" : ""}`}
                disabled={isFinishing}
              >
                <span className="btn-text">
                  {isFinishing ? "Creating account..." : "Finish Signup"}
                </span>
                <FiArrowRight className={`btn-icon ${isFinishing ? "spinning" : ""}`} />
              </button>
            </>
          ) : (
            <>
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
                    disabled={isManualLoading}
                  />
                </div>
              </div>

              <div className="input-group">
                <div className="input-wrapper">
                  <FiHash className="input-icon" />
                  <input
                    type="text"
                    placeholder="USN / Register Number / ID"
                    value={usn}
                    onChange={(e) => setUsn(e.target.value.toUpperCase())}
                    required
                    className="auth-input"
                    disabled={isManualLoading}
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
                    disabled={isManualLoading}
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`auth-submit-btn ${isManualLoading ? "loading" : ""}`}
                disabled={isManualLoading}
              >
                <span className="btn-text">
                  {isManualLoading ? "Creating account..." : "Sign up"}
                </span>
                <FiArrowRight className={`btn-icon ${isManualLoading ? "spinning" : ""}`} />
              </button>
            </>
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

          <div className="auth-switch-line">
            <span>Already registered? </span>
            <Link
              href="/login"
              className="auth-switch-link"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = "/login";
              }}
            >
              Login
            </Link>
          </div>

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
