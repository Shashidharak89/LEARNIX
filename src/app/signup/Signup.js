"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Script from "next/script";
import Image from "next/image";
import axios from "axios";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldCheckIcon,
  UserRoundIcon,
  UserPlusIcon,
  LogInIcon,
  ArrowRightIcon,
  SparklesIcon,
  MailIcon,
} from "@animateicons/react/lucide";
import { FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { verifyTokenAndSyncAuth } from "@/lib/clientAuth";
import "./styles/Signup.css";

export default function Signup({ googleClientId = "" }) {
  const [step, setStep] = useState("verify");
  const [usn, setUsn] = useState("");
  const [googleCredential, setGoogleCredential] = useState("");
  const [googleProfile, setGoogleProfile] = useState(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isGoogleButtonRendered, setIsGoogleButtonRendered] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const googleButtonRef = useRef(null);
  const router = useRouter();

  // Animated icon refs
  const shieldIconRef = useRef(null);
  const usnIconRef = useRef(null);
  const finishBtnIconRef = useRef(null);
  const arrowBtnIconRef = useRef(null);
  const loginLinkIconRef = useRef(null);

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
        if (data.token) {
          localStorage.setItem("token", data.token);
        }
      }

      verifyTokenAndSyncAuth({ redirectOnFailure: false }).finally(() => {
        setTimeout(() => {
          router.push(targetRedirect);
        }, 1200);
      });
    },
    [router, targetRedirect]
  );

  const handleGoogleCredential = useCallback(async (response) => {
    const credential = response?.credential;
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
      setStep("finish");
      setIsSuccess(true);
      setMessage(
        res.data?.message || "Google account verified. Enter your USN to continue."
      );
    } catch (err) {
      setMessage(err.response?.data?.error || "Google verification failed.");
      setIsSuccess(false);
    } finally {
      setIsGoogleLoading(false);
    }
  }, []);

  const refreshGoogleLogin = useCallback(() => {
    if (!googleClientId || step !== "verify") return;

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
          text: "signup_with",
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
                text: "signup_with",
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
        console.error("Error refreshing Google signup:", err);
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
  }, [googleClientId, step, handleGoogleCredential]);

  const handleHardcodedGoogleClick = useCallback(() => {
    if (!googleClientId) {
      setIsSuccess(false);
      setMessage("Google signup is currently unavailable.");
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
      setMessage("Unable to open Google signup right now. Please try again.");
    }
  }, [googleClientId, handleGoogleCredential, refreshGoogleLogin]);

  useEffect(() => {
    // Entirely refresh Google login every time the user lands on this page / step
    refreshGoogleLogin();

    const handlePageShow = () => {
      refreshGoogleLogin();
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [refreshGoogleLogin]);

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

  return (
    <div className="sgn-root">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={refreshGoogleLogin}
      />

      {/* Ambient background blur elements for Apple aesthetic */}
      <div className="sgn-ambient-bg" aria-hidden="true">
        <div className="sgn-ambient-blob sgn-ambient-blob--blue" />
        <div className="sgn-ambient-blob sgn-ambient-blob--yellow" />
      </div>

      <div className="sgn-card">
        {step === "verify" ? (
          <>
            <div className="sgn-header">
              <span className="sgn-apple-badge">
                <ShieldCheckIcon
                  ref={shieldIconRef}
                  size={14}
                  className="sgn-badge-icon"
                />
                <span>STEP 1 OF 2 : VERIFY IDENTITY</span>
              </span>
              <h1 className="sgn-title">Create your Account</h1>
              <p className="sgn-subtitle">
                Verify with your Google account to get instant access to notes, updates & exams.
              </p>
            </div>

            <div className="sgn-google-wrap">
              {!isGoogleButtonRendered && (
                <button
                  type="button"
                  className="sgn-google-hardcoded-btn"
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

              {googleClientId ? (
                <div
                  ref={googleButtonRef}
                  className="sgn-google-slot"
                  style={{ display: isGoogleButtonRendered ? "flex" : "none" }}
                />
              ) : (
                <div className="sgn-google-unavail">
                  Google signup is currently unavailable.
                </div>
              )}

              {isGoogleLoading && (
                <p className="sgn-google-loading">Verifying Google account…</p>
              )}
            </div>

            <div className="sgn-divider">
              <span>ALREADY HAVE AN ACCOUNT?</span>
            </div>

            <Link
              href="/login"
              className="sgn-login-link-btn"
              onMouseEnter={() => loginLinkIconRef.current?.startAnimation?.()}
              onMouseLeave={() => loginLinkIconRef.current?.stopAnimation?.()}
            >
              <LogInIcon ref={loginLinkIconRef} size={18} />
              <span>Sign in to your account</span>
              <ArrowRightIcon size={16} className="sgn-arrow-hint" />
            </Link>
          </>
        ) : (
          <>
            <div className="sgn-header">
              <span className="sgn-apple-badge sgn-apple-badge--success">
                <SparklesIcon size={14} className="sgn-badge-icon" />
                <span>STEP 2 OF 2 : STUDENT DETAILS</span>
              </span>
              <h1 className="sgn-title">
                Welcome, {googleProfile?.name?.split(" ")[0] || "Student"}! 🎉
              </h1>
              <p className="sgn-subtitle">
                Enter your college USN or Registration Number to complete your profile.
              </p>
            </div>

            <form onSubmit={handleFinish} className="sgn-form">
              {/* Verified Profile Card */}
              <div className="sgn-verified-profile">
                <Image
                  src={
                    googleProfile?.profileimg ||
                    "https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp"
                  }
                  alt="Google Profile"
                  className="sgn-verified-avatar"
                  width={46}
                  height={46}
                />
                <div className="sgn-verified-details">
                  <p className="sgn-verified-name">
                    {googleProfile?.name || "Verified Student"}
                  </p>
                  <p className="sgn-verified-email">
                    <MailIcon size={14} />
                    <span>{googleProfile?.email || ""}</span>
                  </p>
                </div>
              </div>

              <div className="sgn-input-wrap">
                <div className="sgn-input-icon-box">
                  <UserRoundIcon ref={usnIconRef} size={18} />
                </div>
                <input
                  type="text"
                  placeholder="USN / Register Number"
                  value={usn}
                  onChange={(e) => setUsn(e.target.value.toUpperCase())}
                  onFocus={() => usnIconRef.current?.startAnimation?.()}
                  required
                  className="sgn-input"
                  disabled={isFinishing}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="sgn-btn-primary"
                disabled={isFinishing || !usn.trim()}
                onMouseEnter={() => {
                  finishBtnIconRef.current?.startAnimation?.();
                  arrowBtnIconRef.current?.startAnimation?.();
                }}
                onMouseLeave={() => {
                  finishBtnIconRef.current?.stopAnimation?.();
                  arrowBtnIconRef.current?.stopAnimation?.();
                }}
              >
                <UserPlusIcon ref={finishBtnIconRef} size={19} />
                <span>
                  {isFinishing ? "Creating your account…" : "Complete Registration"}
                </span>
                <ArrowRightIcon
                  ref={arrowBtnIconRef}
                  size={17}
                  className="sgn-btn-arrow"
                />
              </button>

              <button
                type="button"
                className="sgn-btn-back"
                onClick={() => setStep("verify")}
                disabled={isFinishing}
              >
                Use a different Google account
              </button>
            </form>
          </>
        )}

        {message && (
          <div
            className={`sgn-message ${
              isSuccess ? "sgn-message--ok" : "sgn-message--err"
            }`}
          >
            {isSuccess ? <FiCheckCircle /> : <FiAlertCircle />}
            <span>{message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
