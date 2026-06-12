"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Script from "next/script";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiUser, FiHash, FiLock, FiArrowRight,
  FiCheckCircle, FiAlertCircle, FiMail
} from "react-icons/fi";
import { verifyTokenAndSyncAuth } from "@/lib/clientAuth";
import "./styles/Login.css";

export default function Login({ googleClientId = "" }) {
  const [usn, setUsn] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleScriptReady, setGoogleScriptReady] = useState(false);
  const [isGoogleButtonRendered, setIsGoogleButtonRendered] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const googleButtonRef = useRef(null);
  const router = useRouter();

  const saveAuthAndRedirect = useCallback((data) => {
    if (typeof window !== "undefined") {
      if (data.token) localStorage.setItem("token", data.token);
    }
    verifyTokenAndSyncAuth({ redirectOnFailure: false }).finally(() => {
      setTimeout(() => router.push("/dashboard"), 1200);
    });
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    try {
      const res = await axios.post("/api/auth", { usn: usn.trim().toUpperCase(), password });
      setMessage(res.data.message);
      setIsSuccess(true);
      saveAuthAndRedirect(res.data);
    } catch (error) {
      setMessage(error.response?.data?.message || "Login failed");
      setIsSuccess(false);
      setIsLoading(false);
    }
  };

  const handleGoogleCredential = useCallback(async (response) => {
    if (!response.credential) {
      setIsSuccess(false);
      setMessage("Google did not return a valid credential.");
      return;
    }
    setIsGoogleLoading(true);
    setMessage("");
    try {
      const res = await axios.post("/api/auth/google-login", {
        credential: response.credential,
      });
      setMessage(res.data.message || "Google Login successful!");
      setIsSuccess(true);
      saveAuthAndRedirect(res.data);
    } catch (error) {
      console.error("Google login error:", error);
      setMessage(error.response?.data?.error || "Google login failed. Please try again.");
      setIsSuccess(false);
      setIsGoogleLoading(false);
    }
  }, [saveAuthAndRedirect]);

  const handleHardcodedGoogleClick = useCallback(() => {
    if (!googleClientId) { setIsSuccess(false); setMessage("Google login is currently unavailable."); return; }
    if (!window.google?.accounts?.id) { setIsSuccess(false); setMessage("Google is still loading. Please try again."); return; }
    try {
      window.google.accounts.id.initialize({ client_id: googleClientId, callback: handleGoogleCredential });
      window.google.accounts.id.prompt();
    } catch {
      setIsSuccess(false);
      setMessage("Failed to trigger Google login.");
    }
  }, [googleClientId, handleGoogleCredential]);

  useEffect(() => {
    if (!googleScriptReady || !googleButtonRef.current || !googleClientId) return;
    if (!window.google?.accounts?.id) return;
    window.google.accounts.id.initialize({ client_id: googleClientId, callback: handleGoogleCredential });
    googleButtonRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: "outline", size: "large", shape: "pill",
      text: "continue_with", logo_alignment: "center", width: 280,
    });
    setTimeout(() => {
      if (googleButtonRef.current?.childElementCount > 0) setIsGoogleButtonRendered(true);
    }, 300);
  }, [googleScriptReady, googleClientId, handleGoogleCredential]);

  return (
    <div className="lgn-root">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGoogleScriptReady(true)}
      />

      <div className="lgn-card">
        {/* LEFT SIDE: Login Form */}
        <div className="lgn-left">
          <div className="lgn-header">
            <h1 className="lgn-title">Welcome to Learnix! 👋</h1>
            <p className="lgn-subtitle">Please enter your USN and Password to login.</p>
          </div>

          <form onSubmit={handleSubmit} className="lgn-form">
            <div className="lgn-input-wrap">
              <FiHash className="lgn-input-icon" />
              <input
                type="text"
                placeholder="USN / Register Number"
                value={usn}
                onChange={(e) => setUsn(e.target.value.toUpperCase())}
                required
                className="lgn-input"
                disabled={isLoading}
              />
            </div>

            <div className="lgn-input-wrap">
              <FiLock className="lgn-input-icon" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="lgn-input"
                disabled={isLoading}
              />
            </div>

            {message && (
              <div className={`lgn-message${isSuccess ? " lgn-message--ok" : " lgn-message--err"}`}>
                {isSuccess ? <FiCheckCircle /> : <FiAlertCircle />}
                <span>{message}</span>
              </div>
            )}

            <button
              type="submit"
              className={`lgn-btn-primary${isLoading ? " lgn-btn--loading" : ""}`}
              disabled={isLoading || isGoogleLoading}
            >
              <span>{isLoading ? "Signing in…" : "Login"}</span>
              <FiArrowRight className={`lgn-btn-arrow${isLoading ? " lgn-spin" : ""}`} />
            </button>
          </form>
        </div>

        {/* RIGHT SIDE: Options */}
        <div className="lgn-right">
          <h2 className="lgn-right-title">Other Options</h2>

          <div className="lgn-google-area">
            {googleClientId ? (
              <>
                {!isGoogleButtonRendered && (
                  <button
                    type="button"
                    className="lgn-btn-outline"
                    onClick={handleHardcodedGoogleClick}
                    disabled={isGoogleLoading}
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" />
                      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" />
                      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" />
                      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" />
                    </svg>
                    Continue with Google
                  </button>
                )}
                <div
                  ref={googleButtonRef}
                  className="lgn-google-slot"
                  style={{ display: isGoogleButtonRendered ? "flex" : "none" }}
                />
              </>
            ) : (
              <div className="lgn-google-unavail">Google login is unavailable.</div>
            )}
            {isGoogleLoading && <p className="lgn-google-loading">Signing in with Google…</p>}
          </div>

          <Link href="/signup" className="lgn-btn-outline">
            <FiUser /> Create an Account
          </Link>
          
          <Link href="/login/otp" className="lgn-btn-outline">
            <FiMail /> Login with Email / OTP
          </Link>

          <Link href="/login/reset-password" className="lgn-btn-text">
            Forgot Password? Reset here.
          </Link>

          <button
            type="button"
            className="lgn-btn-text"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', marginTop: '1rem' }}
            onClick={() => {
              setUsn("GUEST092025");
              setPassword("abcd1234");
              setTimeout(() => document.querySelector("form").requestSubmit(), 100);
            }}
            disabled={isLoading || isGoogleLoading}
          >
            Or continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
}