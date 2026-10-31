"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Script from "next/script";
import axios from "axios";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LogInIcon,
  UserPlusIcon,
  CompassIcon,
  LockIcon,
  UserRoundIcon,
  MailIcon,
  KeyRoundIcon,
  ArrowRightIcon,
  SparklesIcon,
} from "@animateicons/react/lucide";
import { FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { verifyTokenAndSyncAuth } from "@/lib/clientAuth";
import "./styles/Login.css";

export default function Login({ googleClientId = "" }) {
  const [usn, setUsn] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGoogleButtonRendered, setIsGoogleButtonRendered] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const googleButtonRef = useRef(null);
  const router = useRouter();

  // Animated icon refs
  const usnIconRef = useRef(null);
  const lockIconRef = useRef(null);
  const loginBtnIconRef = useRef(null);
  const arrowBtnIconRef = useRef(null);
  const createIconRef = useRef(null);
  const guestIconRef = useRef(null);
  const otpIconRef = useRef(null);
  const keyIconRef = useRef(null);

  const searchParams = useSearchParams();
  const redirectFromQuery =
    searchParams.get("redirect") ||
    searchParams.get("returnUrl") ||
    searchParams.get("from");
  const [targetRedirect, setTargetRedirect] = useState("/workspace");

  useEffect(() => {
    if (redirectFromQuery) {
      setTargetRedirect(redirectFromQuery);
    } else if (typeof window !== "undefined") {
      const lastPage = window.sessionStorage.getItem("learnix_last_page");
      if (lastPage && lastPage !== "/login" && lastPage !== "/signup") {
        setTargetRedirect(lastPage);
      } else if (document.referrer) {
        try {
          const refUrl = new URL(document.referrer);
          if (
            refUrl.origin === window.location.origin &&
            refUrl.pathname !== "/login" &&
            refUrl.pathname !== "/signup"
          ) {
            setTargetRedirect(refUrl.pathname + refUrl.search);
          }
        } catch (e) {
          void e;
        }
      }
    }
  }, [redirectFromQuery]);

  const saveAuthAndRedirect = useCallback(
    (data) => {
      if (typeof window !== "undefined") {
        if (data.token) localStorage.setItem("token", data.token);
      }
      verifyTokenAndSyncAuth({ redirectOnFailure: false }).finally(() => {
        setTimeout(() => router.push(targetRedirect), 1200);
      });
    },
    [router, targetRedirect]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    try {
      const res = await axios.post("/api/auth", {
        usn: usn.trim().toUpperCase(),
        password,
      });
      setMessage(res.data.message);
      setIsSuccess(true);
      saveAuthAndRedirect(res.data);
    } catch (error) {
      setMessage(error.response?.data?.message || "Login failed");
      setIsSuccess(false);
      setIsLoading(false);
    }
  };

  const handleGoogleCredential = useCallback(
    async (response) => {
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
        setMessage(
          error.response?.data?.error || "Google login failed. Please try again."
        );
        setIsSuccess(false);
        setIsGoogleLoading(false);
      }
    },
    [saveAuthAndRedirect]
  );

  const refreshGoogleLogin = useCallback(() => {
    if (!googleClientId) return;

    setIsGoogleLoading(false);

    const renderOfficialButton = () => {
      if (!googleButtonRef.current || !window.google?.accounts?.id) return;
      try {
        window.google.accounts.id.cancel();
      } catch (e) {
        void e;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredential,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        googleButtonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: "outline",
          size: "large",
          shape: "pill",
          text: "continue_with",
          logo_alignment: "center",
          width: 280,
        });

        const checkRendered = () => {
          if (
            googleButtonRef.current &&
            (googleButtonRef.current.childElementCount > 0 ||
              googleButtonRef.current.querySelector("iframe"))
          ) {
            setIsGoogleButtonRendered(true);
            return true;
          }
          return false;
        };

        if (!checkRendered()) {
          setTimeout(checkRendered, 100);
          setTimeout(checkRendered, 300);
          setTimeout(checkRendered, 700);
        }

        setTimeout(() => {
          if (
            !checkRendered() &&
            window.google?.accounts?.id &&
            googleButtonRef.current
          ) {
            try {
              window.google.accounts.id.initialize({
                client_id: googleClientId,
                callback: handleGoogleCredential,
                auto_select: false,
              });
              window.google.accounts.id.renderButton(googleButtonRef.current, {
                theme: "outline",
                size: "large",
                shape: "pill",
                text: "continue_with",
                logo_alignment: "center",
                width: 280,
              });
              checkRendered();
            } catch (err) {
              void err;
            }
          }
        }, 1000);
      } catch (err) {
        console.error("Error refreshing Google login:", err);
      }
    };

    if (typeof window !== "undefined" && window.google?.accounts?.id) {
      renderOfficialButton();
      return;
    }

    if (typeof window !== "undefined") {
      let script = document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]'
      );
      if (!script) {
        script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }

      script.addEventListener("load", () => {
        renderOfficialButton();
      });

      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          renderOfficialButton();
        } else if (attempts > 30) {
          clearInterval(interval);
        }
      }, 50);
    }
  }, [googleClientId, handleGoogleCredential]);

  const handleHardcodedGoogleClick = useCallback(() => {
    if (!googleClientId) {
      setIsSuccess(false);
      setMessage("Google login is currently unavailable.");
      return;
    }
    if (!window.google?.accounts?.id) {
      refreshGoogleLogin();
      setIsSuccess(false);
      setMessage("Google is still loading. Please try again in a moment.");
      return;
    }
    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential,
        auto_select: false,
      });
      window.google.accounts.id.prompt();
    } catch {
      setIsSuccess(false);
      setMessage("Failed to trigger Google login.");
    }
  }, [googleClientId, handleGoogleCredential, refreshGoogleLogin]);

  useEffect(() => {
    // Entirely refresh Google login every time the user lands on this page
    refreshGoogleLogin();

    const handlePageShow = () => {
      refreshGoogleLogin();
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [refreshGoogleLogin]);

  const handleGuestLogin = () => {
    setUsn("GUEST092025");
    setPassword("abcd1234");
    setTimeout(() => {
      const form = document.querySelector(".lgn-form");
      if (form) form.requestSubmit();
    }, 80);
  };

  return (
    <div className="lgn-root">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={refreshGoogleLogin}
      />

      {/* Ambient background blur elements for unique Apple atmosphere */}
      <div className="lgn-ambient-bg" aria-hidden="true">
        <div className="lgn-ambient-blob lgn-ambient-blob--blue" />
        <div className="lgn-ambient-blob lgn-ambient-blob--amber" />
      </div>

      <div className="lgn-card">
        {/* LEFT SIDE: Login Form */}
        <div className="lgn-left">
          <div className="lgn-header">
            <span className="lgn-apple-badge">
              <SparklesIcon size={13} className="lgn-badge-icon" />
              <span>LEARNIX ACCOUNT</span>
            </span>
            <h1 className="lgn-title">Welcome back! 👋</h1>
            <p className="lgn-subtitle">
              Enter your USN and Password to access your learning space.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="lgn-form">
            <div
              className="lgn-input-wrap"
              onMouseEnter={() => usnIconRef.current?.startAnimation?.()}
              onMouseLeave={() => usnIconRef.current?.stopAnimation?.()}
            >
              <div className="lgn-input-icon-box">
                <UserRoundIcon ref={usnIconRef} size={18} />
              </div>
              <input
                type="text"
                placeholder="USN / Register Number"
                value={usn}
                onChange={(e) => setUsn(e.target.value.toUpperCase())}
                onFocus={() => usnIconRef.current?.startAnimation?.()}
                required
                className="lgn-input"
                disabled={isLoading}
                autoComplete="username"
              />
            </div>

            <div
              className="lgn-input-wrap"
              onMouseEnter={() => lockIconRef.current?.startAnimation?.()}
              onMouseLeave={() => lockIconRef.current?.stopAnimation?.()}
            >
              <div className="lgn-input-icon-box">
                <LockIcon ref={lockIconRef} size={18} />
              </div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => lockIconRef.current?.startAnimation?.()}
                required
                className="lgn-input"
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            {message && (
              <div
                className={`lgn-message${
                  isSuccess ? " lgn-message--ok" : " lgn-message--err"
                }`}
              >
                {isSuccess ? <FiCheckCircle /> : <FiAlertCircle />}
                <span>{message}</span>
              </div>
            )}

            <button
              type="submit"
              className={`lgn-btn-primary${
                isLoading ? " lgn-btn--loading" : ""
              }`}
              disabled={isLoading || isGoogleLoading}
              onMouseEnter={() => {
                loginBtnIconRef.current?.startAnimation?.();
                arrowBtnIconRef.current?.startAnimation?.();
              }}
              onMouseLeave={() => {
                loginBtnIconRef.current?.stopAnimation?.();
                arrowBtnIconRef.current?.stopAnimation?.();
              }}
            >
              <LogInIcon ref={loginBtnIconRef} size={19} />
              <span>{isLoading ? "Signing in…" : "Sign In to Workspace"}</span>
              <ArrowRightIcon ref={arrowBtnIconRef} size={17} className="lgn-btn-arrow" />
            </button>
          </form>
        </div>

        {/* RIGHT SIDE: Dedicated Apple Widget Options Panel */}
        <div className="lgn-right">
          <div className="lgn-right-head">
            <h2 className="lgn-right-title">Other Options</h2>
            <p className="lgn-right-desc">
              Create a new account or explore the platform instantly.
            </p>
          </div>

          {/* MAIN ACTION 1 (HIGH WEIGHTAGE): Create an Account */}
          <Link
            href="/signup"
            className="lgn-btn-create-account"
            onMouseEnter={() => createIconRef.current?.startAnimation?.()}
            onMouseLeave={() => createIconRef.current?.stopAnimation?.()}
          >
            <div className="lgn-btn-create-inner">
              <div className="lgn-btn-create-icon-wrap">
                <UserPlusIcon ref={createIconRef} size={21} />
              </div>
              <div className="lgn-btn-create-texts">
                <span className="lgn-btn-create-label">Create an Account</span>
                <span className="lgn-btn-create-sub">Join Learnix student community</span>
              </div>
              <ArrowRightIcon size={18} className="lgn-create-arrow" />
            </div>
            <span className="lgn-beam-glow" aria-hidden="true" />
          </Link>

          {/* MAIN ACTION 2: Continue as Guest */}
          <button
            type="button"
            className="lgn-btn-guest"
            onClick={handleGuestLogin}
            disabled={isLoading || isGoogleLoading}
            onMouseEnter={() => guestIconRef.current?.startAnimation?.()}
            onMouseLeave={() => guestIconRef.current?.stopAnimation?.()}
          >
            <div className="lgn-btn-guest-icon-wrap">
              <CompassIcon ref={guestIconRef} size={19} />
            </div>
            <div className="lgn-btn-guest-texts">
              <span className="lgn-btn-guest-label">Continue as Guest</span>
              <span className="lgn-btn-guest-sub">Explore workspace & notes instantly</span>
            </div>
            <ArrowRightIcon size={16} className="lgn-guest-arrow" />
          </button>

          <div className="lgn-divider">
            <span>OR CONNECT WITH</span>
          </div>

          {/* Google Sign-in area (Entirely refreshed) */}
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
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      aria-hidden="true"
                    >
                      <path
                        fill="#4285F4"
                        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
                      />
                      <path
                        fill="#34A853"
                        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
                      />
                      <path
                        fill="#EA4335"
                        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                )}
                <div
                  ref={googleButtonRef}
                  className="lgn-google-slot"
                  style={{ display: isGoogleButtonRendered ? "flex" : "none" }}
                />
              </>
            ) : (
              <div className="lgn-google-unavail">
                Google login is unavailable.
              </div>
            )}
            {isGoogleLoading && (
              <p className="lgn-google-loading">Signing in with Google…</p>
            )}
          </div>

          {/* Secondary Auth Actions */}
          <div className="lgn-sub-actions">
            <Link
              href="/login/otp"
              className="lgn-btn-otp"
              onMouseEnter={() => otpIconRef.current?.startAnimation?.()}
              onMouseLeave={() => otpIconRef.current?.stopAnimation?.()}
            >
              <MailIcon ref={otpIconRef} size={16} />
              <span>Sign in with Email / OTP</span>
            </Link>

            <Link
              href="/login/reset-password"
              className="lgn-btn-reset"
              onMouseEnter={() => keyIconRef.current?.startAnimation?.()}
              onMouseLeave={() => keyIconRef.current?.stopAnimation?.()}
            >
              <KeyRoundIcon ref={keyIconRef} size={15} />
              <span>Forgot Password? Reset here</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}