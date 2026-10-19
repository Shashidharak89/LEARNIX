"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FiArrowRight,
  FiPlay,
  FiZap,
  FiTerminal,
} from "react-icons/fi";
import LearnixCodeNav from "./components/LearnixCodeNav";
import "./LearnixCodeHome.css";

export default function LearnixCodeHomePage() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProblems() {
      try {
        const res = await fetch("/api/coding/problems");
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
    loadProblems();
  }, []);

  // Display the first 10 problems
  const first10 = problems.slice(0, 10);

  return (
    <div className="lch-wrapper">
      {/* Top Navbar with Exit Button */}
      <LearnixCodeNav />

      <main className="lch-main">
        {/* Hero Section */}
        <section className="lch-hero">
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
              <span className="lch-stat-num">{problems.length || "10+"}</span>
              <span className="lch-stat-label">Coding Challenges</span>
            </div>
            <div className="lch-stat-card">
              <span className="lch-stat-num">JavaScript</span>
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
              <FiTerminal size={20} color="#38bdf8" /> Featured Challenges
            </h2>
            <Link href="/learnix-code/problems" className="lch-view-more-link">
              View All Problems ({problems.length}) <FiArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
              Loading challenges from DynamoDB...
            </div>
          ) : (
            <div className="lch-problems-grid">
              {first10.map((p, index) => {
                const problemNumber = index + 1;
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
            <h3 style={{ fontSize: "1.3rem", margin: "0 0 0.5rem 0", color: "#ffffff" }}>
              Explore the Full Problem Set
            </h3>
            <p style={{ color: "#94a3b8", margin: "0 0 1.5rem 0", fontSize: "0.95rem" }}>
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
