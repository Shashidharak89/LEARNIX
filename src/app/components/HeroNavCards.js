"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  FiBookOpen,
  FiTrendingUp,
  FiSearch,
  FiTool,
  FiHelpCircle,
  FiUpload,
  FiFileText,
  FiBell,
  FiArrowRight,
} from "react-icons/fi";
import { HiAcademicCap } from "react-icons/hi";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./styles/HeroNavCards.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const navItems = [
  {
    id: "learn",
    href: "/learn",
    Icon: HiAcademicCap,
    label: "Learn",
    subtitle: "Interactive Learning Hub",
    description: "Explore structured subject modules, guided concept cards, and collaborative study materials designed for academic success.",
    theme: "learn",
    accent: "#4f46e5",
    bg: "#eef2ff",
    badge: "Interactive Hub",
  },
  {
    id: "search",
    href: "/search",
    Icon: FiSearch,
    label: "Search",
    subtitle: "Smart Resource Search",
    description: "Instantly search notes, syllabus topics, and past year question papers across all engineering and college courses.",
    theme: "search",
    accent: "#0284c7",
    bg: "#e0f2fe",
    badge: "Instant Search",
  },
  {
    id: "materials",
    href: "/materials",
    Icon: FiBookOpen,
    label: "Materials",
    subtitle: "Notes & Reference Guides",
    description: "Access peer-reviewed study notes, lecture summaries, and comprehensive subject reference materials organized by semester.",
    theme: "materials",
    accent: "#0d9488",
    bg: "#f0fdfa",
    badge: "Verified Notes",
  },
  {
    id: "qp",
    href: "/qp",
    Icon: FiFileText,
    label: "Question Papers",
    subtitle: "Previous Year Exam Papers",
    description: "Practice authentic past exam question papers from top colleges and universities to boost exam confidence and score higher.",
    theme: "qp",
    accent: "#ea580c",
    bg: "#fff7ed",
    badge: "Past Papers",
  },
  {
    id: "tools",
    href: "/tools",
    Icon: FiTool,
    label: "Tools",
    subtitle: "Quizzes & Utility Tools",
    description: "Test your knowledge with daily interactive quizzes, practice card decks, and handy student utility tools.",
    theme: "tools",
    accent: "#475569",
    bg: "#f1f5f9",
    badge: "Practice Tools",
  },
  {
    id: "help",
    href: "/help",
    Icon: FiHelpCircle,
    label: "Help",
    subtitle: "Support & Help Center",
    description: "Get quick answers, platform guides, and assistance for all your academic and account questions.",
    theme: "help",
    accent: "#e11d48",
    bg: "#fff1f2",
    badge: "Support Hub",
  },
  {
    id: "upload",
    href: "/upload",
    Icon: FiUpload,
    label: "Upload",
    subtitle: "Collaborative Workspace",
    description: "Upload your study notes, contribute to the community, and manage all your subjects and topics in one place.",
    theme: "upload",
    authRequired: true,
    accent: "#2563eb",
    bg: "#eff6ff",
    badge: "Share & Earn",
  },
  {
    id: "dashboard",
    href: "/dashboard",
    Icon: FiTrendingUp,
    label: "Dashboard",
    subtitle: "Progress & Analytics",
    description: "Track your learning milestones, saved study materials, and contribution metrics in your personalized dashboard.",
    theme: "dashboard",
    accent: "#7c3aed",
    bg: "#f5f3ff",
    badge: "Personalized",
  },
  {
    id: "updates",
    href: "/updates",
    Icon: FiBell,
    label: "Updates",
    subtitle: "Free Study Updates",
    description: "Stay informed with real-time academic announcements, exam updates, and platform features for free.",
    theme: "updates",
    accent: "#d97706",
    bg: "#fffbeb",
    badge: "Real-time",
  },
];

export default function HeroNavCards({ loggedIn }) {
  const sectionRef = useRef(null);
  const featureItemsRef = useRef([]);
  const iconBoxesRef = useRef([]);
  const contentBoxesRef = useRef([]);
  const finaleRef = useRef(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const section = sectionRef.current;
    if (!section) return;

    const spotlightCount = navItems.length;
    const totalPhases = spotlightCount + 1; // 9 features + 1 Finale All-in-One Grid Phase
    const pinDistance = totalPhases * 480;

    const ctx = gsap.context(() => {
      const masterTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: `+=${pinDistance}`,
          pin: true,
          pinSpacing: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });

      const phaseDuration = 1.0;

      // Setup initial state for Finale Grid
      if (finaleRef.current) {
        gsap.set(finaleRef.current, { opacity: 0, visibility: "hidden", scale: 0.92 });
      }

      // Feature Spotlight Animations (0 to 8)
      navItems.forEach((item, i) => {
        const itemEl = featureItemsRef.current[i];
        const iconBox = iconBoxesRef.current[i];
        const contentBox = contentBoxesRef.current[i];

        if (!itemEl || !iconBox || !contentBox) return;

        const startTime = i * phaseDuration;
        const isEven = i % 2 === 0;

        const targetIconX = isEven ? "-24vw" : "24vw";
        const initialContentX = isEven ? "50px" : "-50px";

        // Initial hidden state
        gsap.set(itemEl, { opacity: 0, visibility: "hidden" });
        gsap.set(iconBox, { scale: 0.3, x: "0vw", opacity: 0, filter: "blur(12px)" });
        gsap.set(contentBox, { opacity: 0, x: initialContentX, scale: 0.92, filter: "blur(8px)" });

        // Step 1: Big Icon Center Pop-up (Scale up to 1.5 in center)
        masterTl
          .to(itemEl, { visibility: "visible", opacity: 1, duration: 0.12, ease: "none" }, startTime)
          .to(iconBox, {
            scale: 1.5,
            x: "0vw",
            opacity: 1,
            filter: "blur(0px)",
            duration: 0.22,
            ease: "power2.out",
          }, startTime);

        // Step 2: Icon shrinks & shifts to side, Content details slide in
        masterTl
          .to(iconBox, {
            scale: 0.72,
            x: targetIconX,
            duration: 0.42,
            ease: "power1.inOut",
          }, startTime + 0.20)
          .to(contentBox, {
            opacity: 1,
            x: "0px",
            scale: 1,
            filter: "blur(0px)",
            duration: 0.42,
            ease: "power1.out",
          }, startTime + 0.22);

        // Step 3: Plateau / Hold
        masterTl.to([iconBox, contentBox], { duration: 0.22 }, startTime + 0.62);

        // Step 4: Fade out before next item
        masterTl
          .to(contentBox, {
            opacity: 0,
            x: initialContentX,
            scale: 0.92,
            filter: "blur(8px)",
            duration: 0.16,
            ease: "power1.in",
          }, startTime + 0.84)
          .to(iconBox, {
            opacity: 0,
            scale: 0.45,
            filter: "blur(10px)",
            duration: 0.16,
            ease: "power1.in",
          }, startTime + 0.84)
          .to(itemEl, { visibility: "hidden", opacity: 0, duration: 0.01 }, startTime + 0.99);
      });

      // Finale Phase: All-in-One Navigation Grid Card Reveal (at t = 9.0)
      const finaleStartTime = spotlightCount * phaseDuration;
      if (finaleRef.current) {
        masterTl
          .to(finaleRef.current, {
            visibility: "visible",
            opacity: 1,
            scale: 1,
            duration: 0.40,
            ease: "power2.out",
          }, finaleStartTime)
          .to(finaleRef.current, { duration: 0.35 }, finaleStartTime + 0.40);
      }

      setTimeout(() => {
        ScrollTrigger.refresh();
      }, 300);
    });

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="lnx-showcase-pinned-section">
      <div className="lnx-showcase-viewport">

        {/* Feature Showcase Stage Area */}
        <div className="lnx-showcase-stage-area">
          {navItems.map((item, idx) => {
            const isEven = idx % 2 === 0;
            const IconComponent = item.Icon;
            const resolvedHref = item.authRequired && !loggedIn ? "/login" : item.href;

            return (
              <div
                key={item.id}
                ref={(el) => (featureItemsRef.current[idx] = el)}
                className="lnx-stage-item"
              >
                {/* Center Big Icon Box */}
                <div
                  ref={(el) => (iconBoxesRef.current[idx] = el)}
                  className="lnx-stage-icon-box"
                  style={{
                    backgroundColor: item.bg,
                    color: item.accent,
                    borderColor: item.accent,
                    boxShadow: `0 25px 60px ${item.accent}35`,
                  }}
                >
                  <IconComponent className="lnx-stage-main-icon" />
                </div>

                {/* Content Details Box */}
                <div
                  ref={(el) => (contentBoxesRef.current[idx] = el)}
                  className={`lnx-stage-content-box ${
                    isEven ? "pos-right" : "pos-left"
                  }`}
                >
                  <div className="lnx-feature-badge-row">
                    <span
                      className="lnx-feature-badge"
                      style={{
                        backgroundColor: item.bg,
                        color: item.accent,
                        borderColor: item.accent + "44",
                      }}
                    >
                      {item.badge}
                    </span>
                    <span className="lnx-feature-step-num">
                      0{idx + 1} / 0{navItems.length}
                    </span>
                  </div>

                  <h3 className="lnx-feature-title">{item.subtitle}</h3>
                  <p className="lnx-feature-desc">{item.description}</p>

                  <Link
                    href={resolvedHref}
                    className="lnx-feature-cta-btn"
                    style={{
                      backgroundColor: item.accent,
                    }}
                  >
                    <span>Explore {item.label}</span>
                    <FiArrowRight />
                  </Link>
                </div>
              </div>
            );
          })}

          {/* Finale Stage: All-in-One Navigation Overview Grid */}
          <div ref={finaleRef} className="lnx-finale-grid-stage">
            <div className="lnx-finale-header">
              <h2 className="lnx-finale-title">Explore Learnix Resources</h2>
              <p className="lnx-finale-subtitle">Access all key features & modules in one place</p>
            </div>

            <nav className="lnx-finale-cards-grid" aria-label="All Features Navigation">
              {/* Top Row: 6 items */}
              <div className="lnx-finale-row top-row">
                {navItems.slice(0, 6).map(({ href, Icon, label, theme, authRequired }) => {
                  const resolvedHref = authRequired && !loggedIn ? "/login" : href;
                  return (
                    <Link
                      key={label}
                      href={resolvedHref}
                      className={`lnx-card lnx-card--${theme}`}
                    >
                      <span className="lnx-icon-wrap" aria-hidden="true">
                        <Icon className="lnx-icon" />
                      </span>
                      <span className="lnx-label">{label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Bottom Row: 3 items centered */}
              <div className="lnx-finale-row bottom-row">
                {navItems.slice(6, 9).map(({ href, Icon, label, theme, authRequired }) => {
                  const resolvedHref = authRequired && !loggedIn ? "/login" : href;
                  return (
                    <Link
                      key={label}
                      href={resolvedHref}
                      className={`lnx-card lnx-card--${theme}`}
                    >
                      <span className="lnx-icon-wrap" aria-hidden="true">
                        <Icon className="lnx-icon" />
                      </span>
                      <span className="lnx-label">{label}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>
          </div>
        </div>

        {/* Animated Mouse Scroll Indicator */}
        <div className="lnx-mouse-scroll-indicator">
          <div className="lnx-mouse-shape">
            <div className="lnx-mouse-wheel" />
          </div>
          <span className="lnx-mouse-text">Scroll to explore</span>
        </div>

      </div>
    </section>
  );
}