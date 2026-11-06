"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  SparklesIcon,
  ZapIcon,
  CircleCheckIcon,
  XIcon,
  ArrowRightIcon,
  RefreshCwIcon,
} from "@animateicons/react/lucide";
import { GraduationCapIcon } from "../icons/GraduationCapIcon";
import "./styles/SamplePublicContent.css";

const OPTIONS = [
  { label: "O(n)", desc: "Linear search traversal" },
  { label: "O(log n)", desc: "Divide and conquer halves" },
  { label: "O(n²)", desc: "Nested loop iteration" },
  { label: "O(1)", desc: "Constant time access" },
];

export default function SamplePublicContent() {
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const badgeIconRef = useRef(null);
  const learnLinkRef = useRef(null);
  const resetBtnRef = useRef(null);
  const checkIconRef = useRef(null);

  const correctIndex = 1; // O(log n)

  const submitQuiz = () => {
    if (selected !== null) {
      setSubmitted(true);
      checkIconRef.current?.startAnimation?.();
    }
  };

  const resetQuiz = () => {
    setSelected(null);
    setSubmitted(false);
    resetBtnRef.current?.startAnimation?.();
  };

  return (
    <section className="lx-learn-hub-section" aria-label="Interactive Learn Hub Preview">
      <div className="lx-learn-hub-card">
        {/* Header Tag / Badge */}
        <div
          className="lx-learn-hub-badge"
          onMouseEnter={() => badgeIconRef.current?.startAnimation?.()}
          onMouseLeave={() => badgeIconRef.current?.stopAnimation?.()}
        >
          <div className="lx-learn-hub-badge-icon">
            <GraduationCapIcon ref={badgeIconRef} size={15} />
          </div>
          <span>Interactive Learning Hub</span>
        </div>

        {/* Title */}
        <div className="lx-learn-hub-header">
          <h2 className="lx-learn-hub-title">
            Test Your Knowledge in the <span className="lx-learn-hub-brand">LEARN SECTION<span className="lx-learn-hub-underline" /></span>
          </h2>
          <p className="lx-learn-hub-subtitle">
            Experience our interactive quizzes with instant evaluation, step-by-step solutions, and curated problem sets — completely free and open to all learners.
          </p>
        </div>

        <div className="lx-learn-hub-layout">
          {/* Info Side (Left Apple Widget) */}
          <div className="lx-learn-hub-info">
            <div className="lx-info-header">
              <div className="lx-info-icon-squircle">
                <SparklesIcon size={18} />
              </div>
              <h4>Practice &amp; Learn in Real Time</h4>
            </div>

            <p>
              In the <strong>Learn Hub</strong>, you can practice topic-wise Computer Science questions, solve QuizDecks, and test your fundamentals before exams or technical interviews.
            </p>

            <ul className="lx-hub-feature-list">
              <li>
                <span className="lx-hub-dot lx-hub-dot--blue" />
                <span>Over <strong>3,000+</strong> curated practice questions</span>
              </li>
              <li>
                <span className="lx-hub-dot lx-hub-dot--yellow" />
                <span>Instant scoring with detailed explanations</span>
              </li>
              <li>
                <span className="lx-hub-dot lx-hub-dot--blue" />
                <span>Zero barriers — practice freely with no mandatory login</span>
              </li>
            </ul>

            <div className="lx-hub-cta-wrap">
              <Link
                href="/learn"
                className="lx-hub-cta-btn"
                onMouseEnter={() => learnLinkRef.current?.startAnimation?.()}
                onMouseLeave={() => learnLinkRef.current?.stopAnimation?.()}
              >
                <span>Launch Full Learn Hub</span>
                <ArrowRightIcon ref={learnLinkRef} size={16} />
              </Link>
            </div>
          </div>

          {/* Quiz Side (Right Apple Widget) */}
          <div className="lx-quiz-interactive-widget">
            <div className="lx-quiz-widget-header">
              <div className="lx-quiz-badge-wrap">
                <span className="lx-quiz-chip">
                  <ZapIcon size={12} />
                  <span>Live Concept Check</span>
                </span>
                <span className="lx-quiz-topic">Algorithms</span>
              </div>
              {submitted && (
                <button
                  type="button"
                  className="lx-quiz-retry-btn"
                  onClick={resetQuiz}
                  title="Try again"
                  onMouseEnter={() => resetBtnRef.current?.startAnimation?.()}
                  onMouseLeave={() => resetBtnRef.current?.stopAnimation?.()}
                >
                  <RefreshCwIcon ref={resetBtnRef} size={13} />
                  <span>Reset</span>
                </button>
              )}
            </div>

            <p className="lx-quiz-question">
              What is the time complexity of searching an element in a balanced Binary Search Tree?
            </p>

            <div className="lx-quiz-options">
              {OPTIONS.map((opt, idx) => {
                let statusCls = "";
                if (submitted) {
                  if (idx === correctIndex) statusCls = "lx-opt--correct";
                  else if (idx === selected) statusCls = "lx-opt--wrong";
                } else if (idx === selected) {
                  statusCls = "lx-opt--selected";
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    className={`lx-quiz-option ${statusCls}`}
                    onClick={() => !submitted && setSelected(idx)}
                    disabled={submitted}
                  >
                    <div className="lx-option-indicator">
                      {submitted && idx === correctIndex ? (
                        <CircleCheckIcon size={16} />
                      ) : submitted && idx === selected ? (
                        <XIcon size={16} />
                      ) : (
                        <span>{String.fromCharCode(65 + idx)}</span>
                      )}
                    </div>
                    <div className="lx-option-text">
                      <strong>{opt.label}</strong>
                      <span className="lx-option-desc">{opt.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {!submitted ? (
              <button
                type="button"
                className="lx-quiz-submit-btn"
                onClick={submitQuiz}
                disabled={selected === null}
              >
                <span>Check Answer</span>
                <CircleCheckIcon ref={checkIconRef} size={16} />
              </button>
            ) : (
              <div className={`lx-quiz-feedback ${selected === correctIndex ? "lx-feedback--success" : "lx-feedback--error"}`}>
                {selected === correctIndex ? (
                  <div className="lx-feedback-content">
                    <CircleCheckIcon size={18} className="lx-feedback-icon" />
                    <div>
                      <strong>Correct Answer!</strong>
                      <span>Binary search repeatedly halves the search interval, yielding O(log n) logarithmic complexity.</span>
                    </div>
                  </div>
                ) : (
                  <div className="lx-feedback-content">
                    <XIcon size={18} className="lx-feedback-icon" />
                    <div>
                      <strong>Not quite!</strong>
                      <span>The correct answer is <strong>O(log n)</strong> because each comparison reduces the search space by half.</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
