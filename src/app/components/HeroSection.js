"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FiArrowRight,
  FiSearch,
  FiUpload,
  FiShield,
  FiSmartphone,
  FiFolder,
  FiBell,
  FiFileText,
  FiBookOpen,
} from "react-icons/fi";
import { HiAcademicCap } from "react-icons/hi";
import "./styles/HeroSection.css";
import TutVideo from "./TutVideo";

/* ── Destinations the Explore button cycles through ────────────────────── */
const EXPLORE_ITEMS = [
  { label: "Explore Resources", href: "/works",     Icon: FiFolder   },
  { label: "Explore Updates",   href: "/updates",   Icon: FiBell     },
  { label: "Question Papers",   href: "/qp",        Icon: FiFileText },
  { label: "Study Materials",   href: "/materials", Icon: FiBookOpen },
];

const CYCLE_MS = 5000; // 5 seconds per item

export default function HeroSection() {
  const [idx, setIdx]           = useState(0);
  const [progress, setProgress] = useState(0);     // 0–100
  const [loggedIn, setLoggedIn] = useState(false);

  // Detect login on client only
  useEffect(() => {
    setLoggedIn(Boolean(localStorage.getItem("usn")));
  }, []);

  // Progress bar + cycle timer
  useEffect(() => {
    const startTime = performance.now();

    const raf = (now) => {
      const elapsed = now - startTime;
      const pct = Math.min((elapsed / CYCLE_MS) * 100, 100);
      setProgress(pct);

      if (elapsed < CYCLE_MS) {
        rafId = requestAnimationFrame(raf);
      } else {
        setIdx((prev) => (prev + 1) % EXPLORE_ITEMS.length);
        setProgress(0);
      }
    };

    let rafId = requestAnimationFrame(raf);
    return () => cancelAnimationFrame(rafId);
  }, [idx]);

  const current = EXPLORE_ITEMS[idx];

  return (
    <section className="learnix-hero-main">
      <div className="learnix-hero-container">
        <div className="learnix-hero-content">
          <div className="learnix-hero-layout">
            {/* ── Left side ─────────────────────────────────────────────── */}
            <div className="learnix-hero-left">
              <div className="learnix-title-wrapper">
                <h1 className="learnix-main-title">
                  Welcome to{" "}
                  <span className="learnix-brand-text">
                    LEARNIX
                    <div className="learnix-brand-underline"></div>
                  </span>
                </h1>
                <div className="learnix-slogan-tag">✨ Learn Together, Succeed Together</div>
              </div>

              <p className="learnix-hero-subtitle">
                Learnix is a platform where students share study materials and help each other do better in college.
              </p>

              <h4 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#1f2937", marginBottom: "14px" }}>
                What you can do on Learnix:
              </h4>

              <ul className="learnix-hero-points">
                <li>
                  <FiSearch className="learnix-point-icon" />
                  <span>
                    <strong>Find Study Material —</strong> Get notes, subject-wise content, and previous year question papers for your courses.
                  </span>
                </li>
                <li>
                  <HiAcademicCap className="learnix-point-icon" />
                  <span>
                    <strong>Prepare for Exams &amp; Placements —</strong> Access updated study resources to help you crack exams and ace placements.
                  </span>
                </li>
                <li>
                  <FiUpload className="learnix-point-icon" />
                  <span>
                    <strong>Upload &amp; Organize —</strong> Upload your own notes and materials, and keep everything sorted by subject and topic.
                  </span>
                </li>
                <li>
                  <FiSmartphone className="learnix-point-icon" />
                  <span>
                    <strong>Practice on Our App —</strong> Download the Learnix app to take quizzes, get feedback, and study on the go.
                  </span>
                </li>
              </ul>

              {/* ── CTA Row ────────────────────────────────────────────── */}
              <div className="learnix-hero-ctas">

                {/* Animated rotating Explore button */}
                <Link href={current.href} className="learnix-cta-button learnix-cta-rotating">
                  {/* Full-height darker-blue progress fill */}
                  <span
                    className="learnix-cta-progress-bar"
                    style={{ width: `${progress}%` }}
                    aria-hidden="true"
                  />
                  {/* Label */}
                  <span className="learnix-cta-rotating-inner">
                    <current.Icon size={17} className="learnix-cta-rotating-icon" />
                    <span className="learnix-cta-rotating-label">{current.label}</span>
                    <FiArrowRight className="learnix-button-icon" />
                  </span>
                </Link>

                {/* Secondary button: Login/Register if not logged in, Start Learning if logged in */}
                {loggedIn ? (
                  <Link href="/learn" className="learnix-cta-secondary">
                    ✔ Start Learning
                  </Link>
                ) : (
                  <Link href="/login" className="learnix-cta-secondary">
                    Login / Register
                  </Link>
                )}
              </div>

              <div className="learnix-adsense-note">
                <FiShield className="learnix-adsense-icon" />
                <span>
                  We support original &amp; permitted content. See{" "}
                  <Link href="/terms">Terms</Link>,{" "}
                  <Link href="/privacy-policy">Privacy</Link>, or{" "}
                  <Link href="/report-content">report content</Link>.
                </span>
              </div>
            </div>

            {/* ── Right side ────────────────────────────────────────────── */}
            <div className="learnix-hero-right">
              <TutVideo />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}