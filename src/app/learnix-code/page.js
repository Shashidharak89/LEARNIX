"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FiArrowRight,
  FiPlay,
  FiZap,
  FiTerminal,
  FiTag,
  FiCode,
  FiFolder,
  FiCheckCircle,
  FiLayers,
} from "react-icons/fi";
import LearnixCodeNav from "./components/LearnixCodeNav";
import ProblemStatusBadge from "./components/ProblemStatusBadge";
import "./LearnixCodeHome.css";

const THEME_KEY = "learnix-code-theme";

export default function LearnixCodeHomePage() {
  const [problems, setProblems] = useState([]);
  const [totalProblems, setTotalProblems] = useState(0);
  const [topics, setTopics] = useState([]);
  const [totalTopics, setTotalTopics] = useState(0);
  const [statusMap, setStatusMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY);
    setTheme(saved === "light" ? "light" : "dark");

    async function loadData() {
      try {
        const [probRes, topRes] = await Promise.all([
          fetch("/api/coding/problems?page=1&size=20"),
          fetch("/api/coding/topics"),
        ]);

        const probData = await probRes.json();
        const topData = await topRes.json();

        if (probData.success) {
          setProblems(probData.problems || []);
          setTotalProblems(probData.total || (probData.problems || []).length);
        }
        if (topData.success && Array.isArray(topData.topics)) {
          setTopics(topData.topics);
          setTotalTopics(topData.count || topData.topics.length);
        }
      } catch (err) {
        console.error("Failed to load playground data:", err);
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

    loadData();
    loadUserStatus();
  }, []);

  function toggleTheme() {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem(THEME_KEY, next);
      return next;
    });
  }

  // First 3 problems
  const first3Problems = problems.slice(0, 3);
  const moreProblemsCount = Math.max(0, (totalProblems || problems.length) - 3);

  // First 3 topics
  const first3Topics = topics.slice(0, 3);
  const moreTopicsCount = Math.max(0, (totalTopics || topics.length) - 3);

  return (
    <div className={`lch-wrapper lch-theme-${theme}`}>
      {/* Top Navbar */}
      <LearnixCodeNav theme={theme} onToggleTheme={toggleTheme} />

      <main className="lch-main">
        {/* Header Card / Hero Card */}
        <section className="lch-header-card">
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

          <div className="lch-hero-cta-row">
            <Link href="/learnix-code/problems" className="lch-hero-primary-btn">
              <FiPlay size={16} />
              <span>Start Practicing Now</span>
              <FiArrowRight size={16} />
            </Link>
            <a href="#problem-topics" className="lch-hero-secondary-btn">
              <FiTag size={15} />
              <span>Browse by Topic</span>
            </a>
          </div>

          <div className="lch-stats-row">
            <div className="lch-stat-card">
              <span className="lch-stat-num">{totalProblems > 0 ? `${totalProblems}+` : "10+"}</span>
              <span className="lch-stat-label">Coding Challenges</span>
            </div>
            <div className="lch-stat-card">
              <span className="lch-stat-num">{totalTopics > 0 ? `${totalTopics}` : "22"}</span>
              <span className="lch-stat-label">Core Topics</span>
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

        {/* 2-Column Split Row (Problems List & Topics List) */}
        <section className="lch-two-col-section">
          {/* Column 1: Problems Card (First 3 Problems) */}
          <div className="lch-col-card">
            <div className="lch-col-card-header">
              <div className="lch-col-card-title-group">
                <div className="lch-col-icon lch-col-icon-orange">
                  <FiTerminal size={18} />
                </div>
                <div>
                  <h2 className="lch-col-title">Featured Problems</h2>
                  <p className="lch-col-subtitle">Master algorithm fundamentals</p>
                </div>
              </div>
              <span className="lch-col-pill">Top 3</span>
            </div>

            <div className="lch-col-card-body">
              {loading ? (
                <div className="lch-col-skeleton-list">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="lch-col-skeleton-row lch-shimmer" />
                  ))}
                </div>
              ) : first3Problems.length === 0 ? (
                <div className="lch-col-empty">No problems available right now.</div>
              ) : (
                <div className="lch-compact-list">
                  {first3Problems.map((p, index) => {
                    const problemNumber = p.order || index + 1;
                    const pStatus =
                      statusMap[p.problemId] ||
                      (p.order !== undefined ? statusMap[String(p.order)] : null) ||
                      statusMap[String(problemNumber)];

                    return (
                      <Link
                        key={p.problemId || index}
                        href={`/learnix-code/problems/${problemNumber}`}
                        className="lch-compact-row"
                      >
                        <div className="lch-compact-left">
                          <span className="lch-compact-id">#{problemNumber}</span>
                          <div className="lch-compact-info">
                            <span className="lch-compact-title">{p.title}</span>
                            <div className="lch-compact-tags">
                              {(p.tags || p.topicIds || []).slice(0, 2).map((t, idx) => (
                                <span key={idx} className="lch-compact-tag">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="lch-compact-right">
                          {pStatus && (
                            <ProblemStatusBadge
                              status={pStatus}
                              showText={false}
                              compact={true}
                              size={12}
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
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="lch-col-card-footer">
              <Link href="/learnix-code/problems" className="lch-explore-more-btn">
                <span>
                  {moreProblemsCount > 0
                    ? `Explore more ${moreProblemsCount} problems`
                    : "Explore all problems"}
                </span>
                <FiArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Column 2: Topics Card (First 3 Topics) */}
          <div className="lch-col-card">
            <div className="lch-col-card-header">
              <div className="lch-col-card-title-group">
                <div className="lch-col-icon lch-col-icon-blue">
                  <FiLayers size={18} />
                </div>
                <div>
                  <h2 className="lch-col-title">Core Topics</h2>
                  <p className="lch-col-subtitle">Targeted problem collections</p>
                </div>
              </div>
              <span className="lch-col-pill">Top 3</span>
            </div>

            <div className="lch-col-card-body">
              {loading ? (
                <div className="lch-col-skeleton-list">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="lch-col-skeleton-row lch-shimmer" />
                  ))}
                </div>
              ) : first3Topics.length === 0 ? (
                <div className="lch-col-empty">No topics available right now.</div>
              ) : (
                <div className="lch-compact-list">
                  {first3Topics.map((top, idx) => {
                    const topicQuery = top.topicId || top.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                    return (
                      <Link
                        key={top.topicId || idx}
                        href={`/learnix-code/problems?topic=${encodeURIComponent(topicQuery)}`}
                        className="lch-compact-row lch-topic-row"
                      >
                        <div className="lch-compact-left">
                          <span className="lch-topic-icon-wrap">
                            <FiTag size={13} />
                          </span>
                          <div className="lch-compact-info">
                            <span className="lch-compact-title">{top.name}</span>
                            <span className="lch-topic-desc">
                              {top.description || `Curated ${top.name} interview challenges`}
                            </span>
                          </div>
                        </div>

                        <div className="lch-compact-right">
                          <span className="lch-topic-count-badge">
                            {top.problemsCount !== undefined ? `${top.problemsCount} Qs` : "Practice"}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="lch-col-card-footer">
              <a href="#problem-topics" className="lch-explore-more-btn">
                <span>
                  {moreTopicsCount > 0
                    ? `Explore more ${moreTopicsCount} topics`
                    : "Explore all topics"}
                </span>
                <FiArrowRight size={16} />
              </a>
            </div>
          </div>
        </section>

        {/* Problem Topics Section */}
        <section id="problem-topics" className="lch-topics-section">
          <div className="lch-section-header">
            <div>
              <h2 className="lch-section-title">
                <FiTag size={20} /> Problem Topics
              </h2>
              <p className="lch-section-desc">
                Select any topic below to filter and solve problems specifically curated for that concept.
              </p>
            </div>
            <Link href="/learnix-code/problems" className="lch-view-more-link">
              View All Problems <FiArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="lch-topics-skeleton-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="lch-topic-skeleton-card lch-shimmer" />
              ))}
            </div>
          ) : topics.length === 0 ? (
            <div className="lch-col-empty">No topics found.</div>
          ) : (
            <div className="lch-topics-grid">
              {topics.map((t) => {
                const topicQuery = t.topicId || t.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                return (
                  <Link
                    key={t.topicId}
                    href={`/learnix-code/problems?topic=${encodeURIComponent(topicQuery)}`}
                    className="lch-topic-card"
                    title={`Browse all ${t.name} problems`}
                  >
                    <div className="lch-topic-card-top">
                      <div className="lch-topic-card-icon">
                        <FiTag size={16} />
                      </div>
                      {t.problemsCount !== undefined && (
                        <span className="lch-topic-card-count">
                          {t.problemsCount} {t.problemsCount === 1 ? "problem" : "problems"}
                        </span>
                      )}
                    </div>
                    <h3 className="lch-topic-card-name">{t.name}</h3>
                    {t.description && (
                      <p className="lch-topic-card-desc">{t.description}</p>
                    )}
                    <span className="lch-topic-card-link">
                      <span>Practice {t.name}</span>
                      <FiArrowRight size={13} />
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* View All Problems Banner */}
        <section className="lch-view-all-cta">
          <h3 className="lch-cta-title">Explore the Full Problem Set</h3>
          <p className="lch-cta-desc">
            Browse all algorithmic problems, test your limits, and master data structures with our automated code runner.
          </p>
          <Link href="/learnix-code/problems" className="lch-cta-btn">
            <span>View All Problems</span>
            <FiArrowRight size={18} />
          </Link>
        </section>
      </main>
    </div>
  );
}
