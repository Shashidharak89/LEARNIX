"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FiArrowRight,
  FiPlay,
  FiZap,
  FiTerminal,
} from "react-icons/fi";
import LearnixCodeNav from "./components/LearnixCodeNav";
import ProblemStatusBadge from "./components/ProblemStatusBadge";
import "./LearnixCodeHome.css";

const THEME_KEY = "learnix-code-theme";

export default function LearnixCodeHomePage() {
  const [problems, setProblems] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY);
    setTheme(saved === "light" ? "light" : "dark");

    async function loadProblems() {
      try {
        const res = await fetch("/api/coding/problems?page=1&size=10");
        const data = await res.json();
        if (data.success) {
          setProblems(data.problems || []);
        }
      } catch (err) {
        console.error("Failed to load problems:", err);
      } finally {
        setLoading(false);
      }
    }

    async function loadUserStatus() {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
      if (!token) return;
      try {
        const res = await fetch("/api/coding/user-status", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.statusMap) {
          setStatusMap(data.statusMap);
        }
      } catch (err) {
        console.error("Failed to load user coding status:", err);
      }
    }

    loadProblems();
    loadUserStatus();
  }, []);

  function toggleTheme() {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem(THEME_KEY, next);
      return next;
    });
  }

  return (
    <div className={`lch-wrapper lch-theme-${theme}`}>
      {/* Top Navbar */}
      <LearnixCodeNav theme={theme} onToggleTheme={toggleTheme} />

      <main className="lch-main">
        {/* Hero Section */}
        <section className="lch-hero">
          <div className="lch-hero-logo-wrap">
            <Image
              src="/learnix-code-logo.png"
              alt="Learnix Code"
              width={88}
              height={88}
              className="lch-hero-logo"
              priority
            />
          </div>

          <div className="lch-badge">
            <FiZap size={14} />
            <span>Interactive Code Arena</span>
          </div>

          <h1 className="lch-title">
            Level Up With <span className="lch-title-gradient">Learnix Code</span>
          </h1>

          <p className="lch-subtitle">
            Sharpen your programming skills with real-time test execution. Solve curated challenges,
            test your algorithms against automated test cases, and prepare for top technical interviews.
          </p>

          <div className="lch-stats-row">
            <div className="lch-stat-card">
              <span className="lch-stat-num">{problems.length > 0 ? `${problems.length}+` : "10+"}</span>
              <span className="lch-stat-label">Coding Challenges</span>
            </div>
            <div className="lch-stat-card">
              <span className="lch-stat-num">Real-Time</span>
              <span className="lch-stat-label">Execution Engine</span>
            </div>
            <div className="lch-stat-card">
              <span className="lch-stat-num">&lt; 5ms</span>
              <span className="lch-stat-label">Automated Evaluation</span>
            </div>
            <div className="lch-stat-card">
              <span className="lch-stat-num">100% Free</span>
              <span className="lch-stat-label">No Login Required</span>
            </div>
          </div>
        </section>

        {/* First 10 Problems Section */}
        <section>
          <div className="lch-section-header">
            <h2 className="lch-section-title">
              <FiTerminal size={20} /> Featured Challenges
            </h2>
            <Link href="/learnix-code/problems" className="lch-view-more-link">
              View All Problems <FiArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="lch-skeleton-list">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="lch-skeleton-row lch-shimmer" />
              ))}
            </div>
          ) : (
            <div className="lch-problems-grid">
              {problems.map((p, index) => {
                const problemNumber = p.order || index + 1;
                const pStatus =
                  statusMap[p.problemId] ||
                  (p.order !== undefined ? statusMap[String(p.order)] : null) ||
                  statusMap[String(problemNumber)];

                return (
                  <Link
                    key={p.problemId || index}
                    href={`/learnix-code/problems/${problemNumber}`}
                    className="lch-prob-row"
                  >
                    <div className="lch-prob-left">
                      <span className="lch-prob-id">{problemNumber}.</span>
                      <div className="lch-prob-info">
                        <h3 className="lch-prob-title">{p.title}</h3>
                        <div className="lch-prob-tags">
                          {(p.tags || []).map((t, idx) => (
                            <span key={idx} className="lch-prob-tag">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="lch-prob-right">
                      {pStatus && (
                        <ProblemStatusBadge
                          status={pStatus}
                          showText={true}
                          compact={true}
                          size={13}
                        />
                      )}

                      <span
                        className={`lch-diff-badge ${
                          p.difficulty === "Easy"
                            ? "lch-diff-easy"
                            : p.difficulty === "Medium"
                            ? "lch-diff-medium"
                            : "lch-diff-hard"
                        }`}
                      >
                        {p.difficulty}
                      </span>

                      <span className="lch-solve-btn">
                        <FiPlay size={13} /> Solve
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* View More CTA Card */}
          <div className="lch-view-all-cta">
            <h3 className="lch-cta-title">Explore the Full Problem Set</h3>
            <p className="lch-cta-desc">
              Browse all algorithmic problems, test your limits, and master data structures.
            </p>
            <Link href="/learnix-code/problems" className="lch-cta-btn">
              <span>View All Problems</span>
              <FiArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
