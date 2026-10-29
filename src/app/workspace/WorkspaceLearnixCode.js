"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRightIcon,
  PlayIcon,
  SparklesIcon,
} from "@animateicons/react/lucide";
import "./styles/WorkspaceLearnixCode.css";

const FALLBACK_PROBLEMS = [
  {
    order: 1,
    problemId: "add-two-numbers",
    title: "Add Two Numbers",
    difficulty: "Easy",
    tags: ["Math", "Basics"],
  },
  {
    order: 2,
    problemId: "longest-consecutive-sequence",
    title: "Longest Consecutive Sequence",
    difficulty: "Medium",
    tags: ["Arrays", "Hash Table"],
  },
  {
    order: 3,
    problemId: "fizz-buzz",
    title: "Fizz Buzz",
    difficulty: "Easy",
    tags: ["Math"],
  },
];

function ProblemCard({ problem, index }) {
  const playIconRef = useRef(null);
  const problemNumber = problem.order || index + 1;
  const problemUrl = `/learnix-code/problems/${problemNumber}`;

  const diffClass =
    problem.difficulty === "Hard"
      ? "wlc-diff-hard"
      : problem.difficulty === "Medium"
      ? "wlc-diff-medium"
      : "wlc-diff-easy";

  return (
    <div
      className="wlc-problem-card"
      onMouseEnter={() => playIconRef.current?.startAnimation?.()}
      onMouseLeave={() => playIconRef.current?.stopAnimation?.()}
    >
      <div className="wlc-card-header">
        <div className="wlc-header-titles">
          <div className="wlc-badges-row">
            <span className="wlc-order-badge">#{problemNumber}</span>
            <span className={`wlc-diff-pill ${diffClass}`}>
              {problem.difficulty || "Easy"}
            </span>

            {Array.isArray(problem.tags) && problem.tags.slice(0, 2).map((tag, idx) => (
              <span key={idx} className="wlc-tag-pill" title={tag}>
                <span>{tag}</span>
              </span>
            ))}
          </div>

          <h4 className="wlc-card-title">
            <Link
              href={problemUrl}
              className="wlc-title-link"
              title={`Solve ${problem.title}`}
            >
              {problemNumber}. {problem.title || `Problem ${problemNumber}`}
            </Link>
          </h4>
        </div>
      </div>

      <div className="wlc-card-meta">
        <div className="wlc-meta-left">
          <span className="wlc-meta-hint">
            <SparklesIcon size={13} />
            <span>Interactive IDE & Tests</span>
          </span>
        </div>

        <Link
          href={problemUrl}
          className="wlc-card-solve-btn"
          title={`Open Problem ${problemNumber} in code editor`}
        >
          <span>Solve</span>
          <PlayIcon ref={playIconRef} size={13} />
        </Link>
      </div>
    </div>
  );
}

export default function WorkspaceLearnixCode() {
  const [problems, setProblems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const topActionRef = useRef(null);
  const footerActionRef = useRef(null);

  const fetchProblems = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/coding/problems?page=1&size=3");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.problems) && data.problems.length > 0) {
          setProblems(data.problems.slice(0, 3));
          return;
        }
      }
      setProblems(FALLBACK_PROBLEMS);
    } catch (err) {
      console.error("Failed to fetch coding problems:", err);
      setProblems(FALLBACK_PROBLEMS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  return (
    <section className="wlc-section-wrapper" aria-label="Learnix Code">
      {/* Main Apple Card Widget */}
      <div className="wlc-widget-card">
        {/* Header Row - strictly 1 row on ALL screen widths */}
        <div className="wlc-widget-header">
          <div className="wlc-header-title-group">
            <div className="wlc-icon-badge" aria-hidden="true">
              <Image
                src="/learnix-code-logo.png"
                alt="Learnix Code"
                width={26}
                height={26}
                style={{ objectFit: "contain", borderRadius: "6px" }}
                priority
              />
            </div>
            <div className="wlc-title-text-group">
              <h3 className="wlc-section-title">Learnix Code</h3>
            </div>
          </div>

          <div className="wlc-header-actions">
            <Link
              href="/learnix-code"
              className="wlc-top-visit-btn"
              onMouseEnter={() => topActionRef.current?.startAnimation?.()}
              onMouseLeave={() => topActionRef.current?.stopAnimation?.()}
              title="Check out Learnix Code arena"
            >
              <span>Check it out</span>
              <ArrowRightIcon ref={topActionRef} size={15} />
            </Link>
          </div>
        </div>

        {/* Content Body - Problems 1, 2, 3 */}
        <div className="wlc-widget-body">
          {isLoading ? (
            <div className="wlc-skeleton-stack">
              <div className="wlc-skeleton-card" />
              <div className="wlc-skeleton-card" />
              <div className="wlc-skeleton-card" />
            </div>
          ) : (
            <div className="wlc-cards-list">
              {problems.map((problem, index) => (
                <ProblemCard
                  key={problem.problemId || problem.order || index}
                  problem={problem}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer Navigation Button - strictly 1 row, single button: Explore Learnix Code */}
        <div className="wlc-widget-footer">
          <Link
            href="/learnix-code"
            className="wlc-footer-btn wlc-btn-explore"
            onMouseEnter={() => footerActionRef.current?.startAnimation?.()}
            onMouseLeave={() => footerActionRef.current?.stopAnimation?.()}
            title="Explore all coding challenges and the interactive editor"
          >
            <span>Explore Learnix Code</span>
            <ArrowRightIcon ref={footerActionRef} size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
