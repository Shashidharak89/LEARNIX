"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Script from "next/script";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiUser, FiHash, FiLock, FiArrowRight, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
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
      localStorage.setItem("usn", data.user.usn);
      localStorage.setItem("name", data.user.name);
      if (data.user.role) {
        localStorage.setItem("role", data.user.role);
      }
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
    }

    setTimeout(() => {
      router.push("/dashboard");
    }, 1200);
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
    } catch (err) {
      setMessage(err.response?.data?.error || "Something went wrong");
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleCredential = useCallback(async (response) => {
    const credential = String(response?.credential || "").trim();
    if (!credential) {
      setIsSuccess(false);
      setMessage("Google did not return a valid credential.");
      return;
    }

    setIsGoogleLoading(true);
    setMessage("");
    try {
      const res = await axios.post("/api/auth/google-login", { credential });
      setMessage(res.data.message || "Logged in with Google successfully.");
      setIsSuccess(true);
      saveAuthAndRedirect(res.data);
    } catch (err) {
      setIsSuccess(false);
      setMessage(err.response?.data?.error || "Google login failed.");
    } finally {
      setIsGoogleLoading(false);
    }
  }, [saveAuthAndRedirect]);

  const handleHardcodedGoogleClick = useCallback(() => {
    if (!googleClientId) {
      setIsSuccess(false);
      setMessage("Google login is currently unavailable.");
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
      setMessage("Unable to open Google login right now. Please try again.");
    }
  }, [googleClientId, handleGoogleCredential]);

  useEffect(() => {
    if (!googleScriptReady || !googleButtonRef.current || !googleClientId) return;
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
      text: "continue_with",
      logo_alignment: "left",
      width: 320,
    });
    setIsGoogleButtonRendered(true);
  }, [googleScriptReady, googleClientId, handleGoogleCredential]);

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
          <h1 className="auth-title">Sign In</h1>
          <p className="auth-subtitle">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Name not required for login - only required for signup */}

          <div className="input-group">
            <div className="input-wrapper">
              <FiHash className="input-icon" />
              <input
                type="text"
                placeholder="USN / Register Number"
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
            disabled={isLoading || isGoogleLoading}
          >
            <span className="btn-text">
              {isLoading ? "Processing..." : "Continue"}
            </span>
            <FiArrowRight className={`btn-icon ${isLoading ? "spinning" : ""}`} />
          </button>

          <div className="auth-google-wrap">
            <div className="auth-google-divider">
              <span>or</span>
            </div>
            {googleClientId ? (
              <>
                {!isGoogleButtonRendered && (
                  <button
                    type="button"
                    className="auth-google-hardcoded-btn"
                    onClick={handleHardcodedGoogleClick}
                    disabled={isGoogleLoading}
                  >
                    Continue with Google
                  </button>
                )}
                <div
                  ref={googleButtonRef}
                  className="auth-google-button-slot"
                  style={{ display: isGoogleButtonRendered ? "flex" : "none" }}
                />
              </>
            ) : (
              <div className="auth-google-missing">
                Google login is currently unavailable.
              </div>
            )}
            {isGoogleLoading && <p className="auth-google-loading">Signing in with Google...</p>}
          </div>

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
            <span>New here? </span>
            <Link href="/signup" className="auth-switch-link">
              Register
            </Link>
          </div>

          <button
            type="button"
            className="auth-guest-btn"
            onClick={() => {
              setUsn("GUEST092025");
              setPassword("abcd1234");
              setTimeout(() => {
                document.querySelector('form').requestSubmit();
              }, 100);
            }}
            disabled={isLoading || isGoogleLoading}
          >
            Continue as Guest
          </button>
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