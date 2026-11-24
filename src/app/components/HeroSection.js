"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  SearchIcon,
  BookOpenIcon,
  UsersIcon,
  SmartphoneIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  FolderIcon,
  BellIcon,
  FileTextIcon,
  BookOpenTextIcon,
} from "@animateicons/react/lucide";
import "./styles/HeroSection.css";
import TutVideo from "./TutVideo";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.shashidharak.learnix";

/* ── Destinations the Explore button cycles through ───────── */
const EXPLORE_ITEMS = [
  { label: "Explore Resources", href: "/resources", Icon: FolderIcon      },
  { label: "Explore Updates",   href: "/updates",   Icon: BellIcon        },
  { label: "Question Papers",   href: "/qp",        Icon: FileTextIcon    },
  { label: "Study Materials",   href: "/materials", Icon: BookOpenTextIcon },
];

const CYCLE_MS = 5000;

/* ── Individual feature card with animated Lucide icon ─────── */
function FeatCard({ Icon, title, desc, onClick, href, isExternal }) {
  const iconRef = useRef(null);

  const handleEnter = () => iconRef.current?.startAnimation?.();
  const handleLeave = () => iconRef.current?.stopAnimation?.();

  const inner = (
    <>
      <span className="lnx-feat-icon-wrap">
        <Icon ref={iconRef} size={17} />
      </span>
      <div className="lnx-feat-text">
        <strong>{title}</strong>
        <span>{desc}</span>
      </div>
    </>
  );

  const shared = {
    className: "lnx-feat-card",
    onMouseEnter: handleEnter,
    onMouseLeave: handleLeave,
  };

  if (onClick) {
    return (
      <button type="button" {...shared} onClick={onClick}>
        {inner}
      </button>
    );
  }
  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...shared}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} {...shared}>
      {inner}
    </Link>
  );
}

/* ── Cycling Explore button ────────────────────────────────── */
function ExploreBtn({ item, progress }) {
  const iconRef  = useRef(null);
  const arrowRef = useRef(null);

  return (
    <Link
      href={item.href}
      className="lnx-btn-primary"
      onMouseEnter={() => { iconRef.current?.startAnimation?.(); arrowRef.current?.startAnimation?.(); }}
      onMouseLeave={() => { iconRef.current?.stopAnimation?.(); arrowRef.current?.stopAnimation?.(); }}
    >
      <span className="lnx-btn-progress" style={{ width: `${progress}%` }} aria-hidden="true" />
      <span className="lnx-btn-inner">
        <item.Icon ref={iconRef} size={16} className="lnx-btn-icon" />
        <span className="lnx-btn-label">{item.label}</span>
        <ArrowRightIcon ref={arrowRef} size={16} className="lnx-btn-arrow" />
      </span>
    </Link>
  );
}

/* ── Secondary CTA button ─────────────────────────────────── */
function SecondaryBtn({ href, children }) {
  const arrowRef = useRef(null);
  return (
    <Link
      href={href}
      className="lnx-btn-secondary"
      onMouseEnter={() => arrowRef.current?.startAnimation?.()}
      onMouseLeave={() => arrowRef.current?.stopAnimation?.()}
    >
      {children}
    </Link>
  );
}

export default function HeroSection() {
  const [idx, setIdx]           = useState(0);
  const [progress, setProgress] = useState(0);
  const [loggedIn, setLoggedIn] = useState(false);

  /* Disclaimer shield ref */
  const shieldRef = useRef(null);

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

  /* Focus the navbar search input */
  const focusSearch = () => {
    const input = document.querySelector(".lnx-nav-search-input");
    if (input) {
      input.focus();
      input.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const current = EXPLORE_ITEMS[idx];

  return (
    <section className="lnx-hero">
      <div className="lnx-hero-inner">
        <div className="lnx-hero-grid">

          {/* ── LEFT ──────────────────────────────────────────── */}
          <div className="lnx-left">

            <h1 className="lnx-title">
              Welcome to{" "}
              <span className="lnx-brand">
                LEARNIX
                <span className="lnx-brand-line" />
              </span>
            </h1>

            <div className="lnx-slogan">Learn Together, Succeed Together</div>

            <p className="lnx-subtitle">
              A platform where students share study materials and help each
              other do better in college.
            </p>

            {/* Feature mini-cards */}
            <div className="lnx-features">
              <FeatCard
                Icon={SearchIcon}
                title="Find Study Material"
                desc="Notes, subject-wise content & past papers."
                onClick={focusSearch}
              />
              <FeatCard
                Icon={BookOpenIcon}
                title="Exam & Placement Prep"
                desc="Updated resources to crack exams & placements."
                href="/qp"
              />
              <FeatCard
                Icon={UsersIcon}
                title="Community Sharing"
                desc="Share notes & help peers succeed."
                href="/updates"
              />
              <FeatCard
                Icon={SmartphoneIcon}
                title="Practice on the App"
                desc="Quizzes, feedback & study on the go."
                href={PLAY_STORE_URL}
                isExternal
              />
            </div>

            {/* CTAs */}
            <div className="lnx-ctas">
              <ExploreBtn item={current} progress={progress} />
              {loggedIn ? (
                <SecondaryBtn href="/learn">Start Learning</SecondaryBtn>
              ) : (
                <SecondaryBtn href="/login">Login / Register</SecondaryBtn>
              )}
            </div>

            {/* Disclaimer */}
            <div
              className="lnx-disclaimer"
              onMouseEnter={() => shieldRef.current?.startAnimation?.()}
              onMouseLeave={() => shieldRef.current?.stopAnimation?.()}
            >
              <ShieldCheckIcon ref={shieldRef} size={15} className="lnx-disclaimer-icon" />
              <span>
                We support original &amp; permitted content. See{" "}
                <Link href="/terms">Terms</Link>,{" "}
                <Link href="/privacy-policy">Privacy</Link>, or{" "}
                <Link href="/report-content">report content</Link>.
              </span>
            </div>
          </div>

          {/* ── RIGHT ─────────────────────────────────────────── */}
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
