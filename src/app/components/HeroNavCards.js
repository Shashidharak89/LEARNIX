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

const scatteredOffsets = [
  { x: -160, y: -110, scale: 0.5, rotate: -15 },
  { x: 0,    y: -150, scale: 0.4, rotate: 10 },
  { x: 160,  y: -110, scale: 0.5, rotate: 15 },
  { x: -180, y: -20,  scale: 0.4, rotate: -12 },
  { x: 0,    y: 0,    scale: 0.2, rotate: 0 },
  { x: 180,  y: -20,  scale: 0.4, rotate: 12 },
  { x: -140, y: 120,  scale: 0.5, rotate: -10 },
  { x: 0,    y: 160,  scale: 0.4, rotate: 8 },
  { x: 140,  y: 120,  scale: 0.5, rotate: 10 },
];

export default function HeroNavCards({ loggedIn }) {
  const sectionRef = useRef(null);
  const viewportRef = useRef(null);
  const featureItemsRef = useRef([]);
  const iconBoxesRef = useRef([]);
  const contentBoxesRef = useRef([]);

  // Ref arrays for staggered text entrance transitions
  const badgeRefs = useRef([]);
  const titleRefs = useRef([]);
  const descRefs = useRef([]);
  const ctaRefs = useRef([]);

  const finaleRef = useRef(null);
  const finaleHeaderRef = useRef(null);
  const finaleCardsRef = useRef([]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const section = sectionRef.current;
    if (!section) return;

    const spotlightCount = navItems.length;
    const totalPhases = spotlightCount + 1.2;
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

      // Initial setup for Finale Grid & Viewport
      if (viewportRef.current) {
        gsap.set(viewportRef.current, { backgroundColor: navItems[0].bg });
      }

      if (finaleRef.current) {
        gsap.set(finaleRef.current, { opacity: 1, visibility: "hidden" });
      }

      if (finaleHeaderRef.current) {
        gsap.set(finaleHeaderRef.current, { opacity: 0, y: 25, filter: "blur(6px)" });
      }

      finaleCardsRef.current.forEach((card, idx) => {
        if (card) {
          const offset = scatteredOffsets[idx] || { x: 0, y: 40, scale: 0.5, rotate: 0 };
          gsap.set(card, {
            x: offset.x,
            y: offset.y,
            scale: offset.scale,
            rotate: offset.rotate,
            opacity: 0,
            filter: "blur(10px)",
          });
        }
      });

      // Feature Spotlight Animations (0 to 8)
      navItems.forEach((item, i) => {
        const itemEl = featureItemsRef.current[i];
        const iconBox = iconBoxesRef.current[i];
        const contentBox = contentBoxesRef.current[i];

        const badgeEl = badgeRefs.current[i];
        const titleEl = titleRefs.current[i];
        const descEl = descRefs.current[i];
        const ctaEl = ctaRefs.current[i];

        if (!itemEl || !iconBox || !contentBox) return;

        const startTime = i * phaseDuration;
        const isEven = i % 2 === 0;

        const targetIconX = isEven ? "-24vw" : "24vw";
        const initialContentX = isEven ? "50px" : "-50px";

        // Smooth background color transition for active icon color
        if (viewportRef.current) {
          masterTl.to(
            viewportRef.current,
            {
              backgroundColor: item.bg,
              duration: 0.45,
              ease: "sine.inOut",
            },
            startTime
          );
        }

        // Initial hidden state for stage item, icon, and content container
        gsap.set(itemEl, { opacity: 0, visibility: "hidden" });
        gsap.set(iconBox, { scale: 0.3, x: "0vw", opacity: 0, filter: "blur(12px)" });
        gsap.set(contentBox, { opacity: 0, x: initialContentX, scale: 0.92, filter: "blur(8px)" });

        // Initial state for text elements (staggered entrance)
        if (badgeEl && titleEl && descEl && ctaEl) {
          gsap.set([badgeEl, titleEl, descEl, ctaEl], { opacity: 0, y: 16 });
        }

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

        // Step 2: Icon shrinks & shifts to side, Content box slides in
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

        // Step 3: Staggered Text Entrance (Badge -> Title -> Description -> CTA Button)
        if (badgeEl && titleEl && descEl && ctaEl) {
          masterTl
            .to(badgeEl, { opacity: 1, y: 0, duration: 0.18, ease: "power2.out" }, startTime + 0.24)
            .to(titleEl, { opacity: 1, y: 0, duration: 0.20, ease: "power2.out" }, startTime + 0.27)
            .to(descEl,  { opacity: 1, y: 0, duration: 0.20, ease: "power2.out" }, startTime + 0.30)
            .to(ctaEl,   { opacity: 1, y: 0, duration: 0.20, ease: "power2.out" }, startTime + 0.33);
        }

        // Step 4: Plateau / Hold
        masterTl.to([iconBox, contentBox], { duration: 0.22 }, startTime + 0.62);

        // Step 5: Smooth Fade Out before next item
        if (badgeEl && titleEl && descEl && ctaEl) {
          masterTl.to([badgeEl, titleEl, descEl, ctaEl], {
            opacity: 0,
            y: 10,
            duration: 0.14,
            ease: "power1.in",
          }, startTime + 0.84);
        }

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

      // Finale Phase Entrance: Scattered Icons Converge + Header Reveal
      const finaleStartTime = spotlightCount * phaseDuration;

      if (viewportRef.current) {
        masterTl.to(
          viewportRef.current,
          {
            backgroundColor: "#ffffff",
            duration: 0.45,
            ease: "sine.inOut",
          },
          finaleStartTime
        );
      }

      masterTl.to(finaleRef.current, { visibility: "visible", duration: 0.01 }, finaleStartTime);

      // Step A: Scattered Icons Converge into Grid Positions
      finaleCardsRef.current.forEach((card, idx) => {
        if (card) {
          masterTl.to(
            card,
            {
              x: 0,
              y: 0,
              scale: 1,
              rotate: 0,
              opacity: 1,
              filter: "blur(0px)",
              duration: 0.45,
              ease: "back.out(1.2)",
            },
            finaleStartTime + 0.02 + (idx % 3) * 0.03
          );
        }
      });

      // Step B: Header Fades In & Slides Up after cards settle
      if (finaleHeaderRef.current) {
        masterTl.to(
          finaleHeaderRef.current,
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.35,
            ease: "power2.out",
          },
          finaleStartTime + 0.32
        );
      }

      // Step C: Hold plateau
      masterTl.to(finaleRef.current, { duration: 0.40 }, finaleStartTime + 0.65);

      setTimeout(() => {
        ScrollTrigger.refresh();
      }, 300);
    });

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="lnx-showcase-pinned-section">
      <div ref={viewportRef} className="lnx-showcase-viewport">

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

                {/* Content Details Box with Staggered Entrance Elements */}
                <div
                  ref={(el) => (contentBoxesRef.current[idx] = el)}
                  className={`lnx-stage-content-box ${
                    isEven ? "pos-right" : "pos-left"
                  }`}
                >
                  <div ref={(el) => (badgeRefs.current[idx] = el)} className="lnx-feature-badge-row">
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

                  <h3 ref={(el) => (titleRefs.current[idx] = el)} className="lnx-feature-title">
                    {item.subtitle}
                  </h3>
                  <p ref={(el) => (descRefs.current[idx] = el)} className="lnx-feature-desc">
                    {item.description}
                  </p>

                  <Link
                    ref={(el) => (ctaRefs.current[idx] = el)}
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

          {/* Finale Stage: Scattered Convergence Grid + Title Reveal */}
          <div ref={finaleRef} className="lnx-finale-grid-stage">
            <div ref={finaleHeaderRef} className="lnx-finale-header">
              <h2 className="lnx-finale-title">Explore Learnix Resources</h2>
              <p className="lnx-finale-subtitle">Access all key features & modules in one place</p>
            </div>

            <nav className="lnx-finale-cards-grid" aria-label="All Features Navigation">
              {/* Top Row: 6 items */}
              <div className="lnx-finale-row top-row">
                {navItems.slice(0, 6).map(({ href, Icon, label, theme, authRequired }, cardIdx) => {
                  const resolvedHref = authRequired && !loggedIn ? "/login" : href;
                  return (
                    <Link
                      key={label}
                      ref={(el) => (finaleCardsRef.current[cardIdx] = el)}
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
                {navItems.slice(6, 9).map(({ href, Icon, label, theme, authRequired }, cardIdx) => {
                  const realIdx = cardIdx + 6;
                  const resolvedHref = authRequired && !loggedIn ? "/login" : href;
                  return (
                    <Link
                      key={label}
                      ref={(el) => (finaleCardsRef.current[realIdx] = el)}
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