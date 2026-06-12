"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Script from "next/script";
import Image from "next/image";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiUser, FiHash, FiArrowRight, FiCheckCircle, FiAlertCircle, FiMail, FiLock } from "react-icons/fi";
import { verifyTokenAndSyncAuth } from "@/lib/clientAuth";
import "./styles/Signup.css";

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
      logo_alignment: "center",
      width: 280,
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
    <div className="sgn-root">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGoogleScriptReady(true)}
      />
      <div className="sgn-card">
        <div className="sgn-header">
          <h1 className="sgn-title">Create Account</h1>
          <p className="sgn-subtitle">
            {step === "verify"
              ? "Sign up with Google to verify your account"
              : step === "usn"
                ? "Google verified. Enter USN / Reg No to finish"
                : "Create account with name, USN and password"}
          </p>
        </div>

        <form onSubmit={step === "manual" ? handleManualSignup : handleFinish} className="sgn-form">
          {step === "verify" ? (
            <div className="sgn-google-wrap">
              <div className="sgn-divider"><span>Step 1</span></div>
              {!isGoogleButtonRendered && (
                <button
                  type="button"
                  className="sgn-google-hardcoded-btn"
                  onClick={handleHardcodedGoogleClick}
                  disabled={isGoogleLoading}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" />
                    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" />
                    <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" />
                    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" />
                  </svg>
                  Signup with Google
                </button>
              )}
              {googleClientId ? (
                <div
                  ref={googleButtonRef}
                  className="sgn-google-slot"
                  style={{ display: isGoogleButtonRendered ? "flex" : "none" }}
                />
              ) : (
                <div style={{ color: 'red' }}>Google signup is currently unavailable.</div>
              )}
              {isGoogleLoading && <p style={{ color: '#2563eb' }}>Verifying Google account...</p>}

              <button
                type="button"
                className="sgn-guest-btn"
                onClick={() => {
                  setStep("manual");
                  setMessage("");
                  setIsSuccess(false);
                }}
                disabled={isGoogleLoading}
              >
                Continue without Google account
              </button>
            </div>
          ) : step === "usn" ? (
            <>
              <div className="sgn-verified-profile">
                <Image
                  src={googleProfile?.profileimg || "https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp"}
                  alt="Google Profile"
                  className="sgn-verified-avatar"
                  width={44}
                  height={44}
                />
                <div className="sgn-verified-details">
                  <p className="sgn-verified-name">{googleProfile?.name || "Google User"}</p>
                  <p className="sgn-verified-email">
                    <FiMail />
                    <span>{googleProfile?.email || ""}</span>
                  </p>
                </div>
              </div>

              <div className="sgn-divider"><span>Step 2</span></div>

              <div className="sgn-input-wrap">
                <FiHash className="sgn-input-icon" />
                <input
                  type="text"
                  placeholder="USN / Register Number / ID"
                  value={usn}
                  onChange={(e) => setUsn(e.target.value.toUpperCase())}
                  required
                  className="sgn-input"
                  disabled={isFinishing}
                />
              </div>

              <button
                type="submit"
                className="sgn-btn-primary"
                disabled={isFinishing}
              >
                <span>{isFinishing ? "Creating account..." : "Finish Signup"}</span>
                <FiArrowRight className={`sgn-btn-arrow ${isFinishing ? "sgn-spin" : ""}`} />
              </button>
            </>
          ) : (
            <>
              <div className="sgn-input-wrap">
                <FiUser className="sgn-input-icon" />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="sgn-input"
                  disabled={isManualLoading}
                />
              </div>

              <div className="sgn-input-wrap">
                <FiHash className="sgn-input-icon" />
                <input
                  type="text"
                  placeholder="USN / Register Number / ID"
                  value={usn}
                  onChange={(e) => setUsn(e.target.value.toUpperCase())}
                  required
                  className="sgn-input"
                  disabled={isManualLoading}
                />
              </div>

              <div className="sgn-input-wrap">
                <FiLock className="sgn-input-icon" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="sgn-input"
                  disabled={isManualLoading}
                />
              </div>

              <button
                type="submit"
                className="sgn-btn-primary"
                disabled={isManualLoading}
              >
                <span>{isManualLoading ? "Creating account..." : "Sign up"}</span>
                <FiArrowRight className={`sgn-btn-arrow ${isManualLoading ? "sgn-spin" : ""}`} />
              </button>
            </>
          )}

          {message && (
            <div className={`sgn-message ${isSuccess ? "sgn-message--ok" : "sgn-message--err"}`}>
              {isSuccess ? <FiCheckCircle /> : <FiAlertCircle />}
              <span>{message}</span>
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <span style={{ color: '#555', fontSize: '0.95rem' }}>Already registered? </span>
            <Link
              href="/login"
              className="sgn-link"
              style={{ display: 'inline' }}
              onClick={(e) => { e.preventDefault(); window.location.href = "/login"; }}
            >
              Login
            </Link>
          </div>

        </form>
      </div>
    </div>
  );
}
