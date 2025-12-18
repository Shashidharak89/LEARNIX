"use client";
import "./styles/SamplePublicContent.css";
import { useState } from "react";
import Link from "next/link";

export default function SamplePublicContent() {
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const correctIndex = 1; // O(log n)

  const options = [
    "O(n)",
    "O(log n)",
    "O(n²)",
    "O(1)",
  ];

  const submitQuiz = () => {
    if (selected !== null) {
      setSubmitted(true);
    }
  };

  return (
    <section className="lx-sample-section">
      <div className="lx-sample-container">
        {/* Header */}
        <h2 className="lx-sample-title">Sample public content</h2>
        <p className="lx-sample-subtitle">
          Learnix provides public learning content where students can attempt
          quizzes and instantly view their results — no login required.
        </p>

        <div className="lx-sample-layout">
          {/* Info side */}
          <div className="lx-sample-info">
            <h4>Practice before you join</h4>
            <p>
              In the Learn section, students can attempt quizzes based on
              academic and technical topics. These quizzes are publicly
              accessible and help learners evaluate their understanding.
            </p>

            <p>
              After completing a quiz, the score and result are shown
              immediately. This allows learners to practice freely before
              registering.
            </p>

            <Link href="/learn" className="lx-sample-link">
              Explore Learn section →
            </Link>
          </div>

          {/* Quiz side */}
          <div className="lx-sample-quiz">
            <h5 className="lx-quiz-heading">Sample quiz</h5>

            <p className="lx-quiz-question">
              What is the time complexity of Binary Search?
            </p>

            <ul className="lx-quiz-options">
              {options.map((opt, idx) => {
                let cls = "lx-quiz-option";

                if (submitted) {
                  if (idx === correctIndex) cls += " lx-correct";
                  else if (idx === selected) cls += " lx-wrong";
                } else if (idx === selected) {
                  cls += " lx-selected";
                }

                return (
                  <li
                    key={idx}
                    className={cls}
                    onClick={() => !submitted && setSelected(idx)}
                  >
                    {opt}
                  </li>
                );
              })}
            </ul>

            {!submitted ? (
              <button
                className="lx-quiz-submit"
                onClick={submitQuiz}
                disabled={selected === null}
              >
                Submit answer
              </button>
            ) : (
              <div className="lx-quiz-result">
                {selected === correctIndex ? (
                  <span className="lx-result-correct">✔ Correct answer</span>
                ) : (
                  <span className="lx-result-wrong">✖ Wrong answer</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
