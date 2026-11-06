"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FiArrowRight,
  FiSearch,
  FiShield,
  FiFolder,
  FiBell,
  FiFileText,
  FiBookOpen,
  FiUsers,
} from "react-icons/fi";
import { HiAcademicCap } from "react-icons/hi";
import "./styles/HeroSection.css";
import TutVideo from "./TutVideo";

/* ── Destinations the Explore button cycles through ────────────────────── */
const EXPLORE_ITEMS = [
  { label: "Explore Resources", href: "/resources", Icon: FiFolder },
  { label: "Explore Updates",   href: "/updates",   Icon: FiBell     },
  { label: "Question Papers",   href: "/qp",        Icon: FiFileText },
  { label: "Study Materials",   href: "/materials", Icon: FiBookOpen },
];

const CYCLE_MS = 5000;

const FEATURE_POINTS = [
  {
    Icon: FiSearch,
    title: "Find Study Material",
    desc: "Notes, subject-wise content & past papers.",
  },
  {
    Icon: HiAcademicCap,
    title: "Exam & Placement Prep",
    desc: "Updated resources to crack exams & placements.",
  },
  {
    Icon: FiUsers,
    title: "Community Sharing",
    desc: "Upload your notes & help peers succeed.",
  },
  {
    Icon: FiBookOpen,
    title: "Practice on the App",
    desc: "Quizzes, feedback & study on the go.",
  },
];

export default function HeroSection() {
  const [idx, setIdx]           = useState(0);
  const [progress, setProgress] = useState(0);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(Boolean(localStorage.getItem("usn")));
  }, []);

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
    <section className="lnx-hero">
      <div className="lnx-hero-inner">
        <div className="lnx-hero-grid">

          {/* ── LEFT ──────────────────────────────────────────────────── */}
          <div className="lnx-left">

            {/* Title */}
            <h1 className="lnx-title">
              Welcome to{" "}
              <span className="lnx-brand">
                LEARNIX
                <span className="lnx-brand-line" />
              </span>
            </h1>

            {/* Slogan */}
            <div className="lnx-slogan">✨ Learn Together, Succeed Together</div>

            {/* Subtitle */}
            <p className="lnx-subtitle">
              A platform where students share study materials and help each
              other do better in college.
            </p>

            {/* Feature mini-cards */}
            <div className="lnx-features">
              {FEATURE_POINTS.map(({ Icon, title, desc }) => (
                <div className="lnx-feat-card" key={title}>
                  <span className="lnx-feat-icon-wrap">
                    <Icon size={16} />
                  </span>
                  <div className="lnx-feat-text">
                    <strong>{title}</strong>
                    <span>{desc}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="lnx-ctas">
              {/* Cycling Explore button */}
              <Link href={current.href} className="lnx-btn-primary">
                <span
                  className="lnx-btn-progress"
                  style={{ width: `${progress}%` }}
                  aria-hidden="true"
                />
                <span className="lnx-btn-inner">
                  <current.Icon size={16} className="lnx-btn-icon" />
                  <span className="lnx-btn-label">{current.label}</span>
                  <FiArrowRight className="lnx-btn-arrow" />
                </span>
              </Link>

              {/* Secondary */}
              {loggedIn ? (
                <Link href="/learn" className="lnx-btn-secondary">
                  ✔ Start Learning
                </Link>
              ) : (
                <Link href="/login" className="lnx-btn-secondary">
                  Login / Register
                </Link>
              )}
            </div>

            {/* Disclaimer */}
            <div className="lnx-disclaimer">
              <FiShield className="lnx-disclaimer-icon" />
              <span>
                We support original &amp; permitted content. See{" "}
                <Link href="/terms">Terms</Link>,{" "}
                <Link href="/privacy-policy">Privacy</Link>, or{" "}
                <Link href="/report-content">report content</Link>.
              </span>
            </div>
          </div>

          {/* ── RIGHT ─────────────────────────────────────────────────── */}
          <div className="lnx-right">
            <div className="lnx-video-frame">
              <TutVideo />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
