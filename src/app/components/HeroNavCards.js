"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  FiBookOpen,
  FiTrendingUp,
  FiSearch,
  FiTool,
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
    accent: "#475569",
    bg: "#f1f5f9",
    badge: "Practice Tools",
  },
  {
    id: "upload",
    href: "/upload",
    Icon: FiUpload,
    label: "Upload",
    subtitle: "Collaborative Workspace",
    description: "Upload your study notes, contribute to the community, and manage all your subjects and topics in one place.",
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
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const section = sectionRef.current;
    if (!section) return;

    const numFeatures = navItems.length;
    const pinDistance = numFeatures * 450; // Optimized scroll distance

    const ctx = gsap.context(() => {
      const masterTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: `+=${pinDistance}`,
          pin: true,
          pinSpacing: true, // Ensures next component appears immediately below
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress;
            const idx = Math.min(numFeatures - 1, Math.floor(p * numFeatures));
            setActiveIndex(idx);
          },
        },
      });

      const phaseDuration = 1.0;

      navItems.forEach((item, i) => {
        const itemEl = featureItemsRef.current[i];
        const iconBox = iconBoxesRef.current[i];
        const contentBox = contentBoxesRef.current[i];

        if (!itemEl || !iconBox || !contentBox) return;

        const startTime = i * phaseDuration;
        const isEven = i % 2 === 0;
        const isLast = i === numFeatures - 1;

        const targetIconX = isEven ? "-22vw" : "22vw";
        const initialContentX = isEven ? "40px" : "-40px";

        // Initial hidden state for each feature
        gsap.set(itemEl, { opacity: 0, visibility: "hidden" });
        gsap.set(iconBox, { scale: 0.3, x: "0vw", opacity: 0, filter: "blur(8px)" });
        gsap.set(contentBox, { opacity: 0, x: initialContentX, scale: 0.94, filter: "blur(6px)" });

        // Step 1: Icon Center Pop-up (Scale 0.3 -> 1.25, opacity 0 -> 1)
        masterTl
          .to(itemEl, { visibility: "visible", opacity: 1, duration: 0.12, ease: "none" }, startTime)
          .to(iconBox, {
            scale: 1.2,
            x: "0vw",
            opacity: 1,
            filter: "blur(0px)",
            duration: 0.22,
            ease: "power2.out",
          }, startTime);

        // Step 2: Icon shrinks & shifts to side (LEFT or RIGHT), Content details fade & slide in on opposite side!
        masterTl
          .to(iconBox, {
            scale: 0.65,
            x: targetIconX,
            duration: 0.40,
            ease: "power1.inOut",
          }, startTime + 0.20)
          .to(contentBox, {
            opacity: 1,
            x: "0px",
            scale: 1,
            filter: "blur(0px)",
            duration: 0.40,
            ease: "power1.out",
          }, startTime + 0.22);

        // Step 3: Plateau / Hold
        masterTl.to([iconBox, contentBox], { duration: 0.25 }, startTime + 0.60);

        // Step 4: Fade out (only for non-last items, so last item smoothly stays until section unpins!)
        if (!isLast) {
          masterTl
            .to(contentBox, {
              opacity: 0,
              x: initialContentX,
              scale: 0.94,
              filter: "blur(6px)",
              duration: 0.15,
              ease: "power1.in",
            }, startTime + 0.85)
            .to(iconBox, {
              opacity: 0,
              scale: 0.5,
              filter: "blur(8px)",
              duration: 0.15,
              ease: "power1.in",
            }, startTime + 0.85)
            .to(itemEl, { visibility: "hidden", opacity: 0, duration: 0.01 }, startTime + 0.99);
        }
      });

      // Refresh ScrollTrigger after mount for Lenis sync
      setTimeout(() => {
        ScrollTrigger.refresh();
      }, 300);
    });

    return () => ctx.revert();
  }, []);

  const jumpToFeature = (index) => {
    if (!sectionRef.current) return;
    const numFeatures = navItems.length;
    const pinDistance = numFeatures * 450;
    const sectionTop = sectionRef.current.offsetTop;
    const targetScrollY = sectionTop + (index + 0.45) * (pinDistance / numFeatures);

    if (typeof window !== "undefined" && window.lenis) {
      window.lenis.scrollTo(targetScrollY, { duration: 1.2 });
    } else {
      window.scrollTo({ top: targetScrollY, behavior: "smooth" });
    }
  };

  return (
    <section ref={sectionRef} className="lnx-showcase-pinned-section">
      <div className="lnx-showcase-viewport">
        
        {/* Navigation Indicator Bar at Top */}
        <div className="lnx-showcase-nav-bar">
          <div className="lnx-showcase-nav-track">
            {navItems.map((item, idx) => {
              const isActive = activeIndex === idx;
              const Icon = item.Icon;
              return (
                <button
                  key={item.id}
                  onClick={() => jumpToFeature(idx)}
                  className={`lnx-showcase-nav-btn ${isActive ? "is-active" : ""}`}
                  style={{
                    "--btn-accent": item.accent,
                    "--btn-bg": item.bg,
                  }}
                  aria-label={`Jump to ${item.label}`}
                >
                  <Icon className="lnx-showcase-nav-icon" />
                  <span className="lnx-showcase-nav-label">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center Feature Animation Stage */}
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
                {/* Center Icon Box */}
                <div
                  ref={(el) => (iconBoxesRef.current[idx] = el)}
                  className="lnx-stage-icon-box"
                  style={{
                    backgroundColor: item.bg,
                    color: item.accent,
                    borderColor: item.accent,
                    boxShadow: `0 20px 50px ${item.accent}33`,
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
        </div>

        {/* Footer Progress Indicator */}
        <div className="lnx-showcase-footer">
          <div className="lnx-progress-dots">
            {navItems.map((item, dotIdx) => (
              <div
                key={`dot-${item.id}`}
                onClick={() => jumpToFeature(dotIdx)}
                className={`lnx-progress-dot ${dotIdx === activeIndex ? "active" : ""}`}
                style={{
                  "--dot-accent": item.accent,
                }}
              />
            ))}
          </div>
          <div className="lnx-progress-text">
            <span>
              Feature <strong>0{activeIndex + 1}</strong> of 0{navItems.length}:{" "}
              <span style={{ color: navItems[activeIndex]?.accent }}>
                {navItems[activeIndex]?.label}
              </span>
            </span>
          </div>
        </div>

      </div>
    </section>
  );
}