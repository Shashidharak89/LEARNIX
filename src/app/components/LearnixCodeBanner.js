"use client";

import Link from "next/link";
import { FiCode, FiArrowRight, FiCheckCircle } from "react-icons/fi";
import "./styles/LearnixCodeBanner.css";

export default function LearnixCodeBanner() {
  return (
    <section className="lcb-section" aria-label="Learnix Code Coding Platform">
      <Link href="/learnix-code" className="lcb-card">
        <div className="lcb-ambient-glow" />

        <div className="lcb-content">
          <div className="lcb-badge">
            <span className="lcb-badge-dot" />
            <span>Interactive Coding Arena</span>
          </div>

          <h2 className="lcb-title">
            Introducing <span className="lcb-title-highlight">Learnix Code</span>
          </h2>

          <p className="lcb-tagline">
            Level up your algorithmic skills with our in-browser coding playground.
            Solve curated challenges, execute JavaScript in a real-time sandbox, and verify against automated test cases.
          </p>

          <div className="lcb-features">
            <span className="lcb-feat-chip">⚡ 10+ Curated Problems</span>
            <span className="lcb-feat-chip">💻 In-Browser IDE</span>
            <span className="lcb-feat-chip">🧪 Automated Test Cases</span>
            <span className="lcb-feat-chip">🚀 No Login Required</span>
          </div>

          <div>
            <span className="lcb-btn-cta">
              Start Coding Now <FiArrowRight size={18} />
            </span>
          </div>
        </div>

        {/* Visual Mockup */}
        <div className="lcb-visual">
          <div className="lcb-code-box">
            <div className="lcb-code-top">
              <div className="lcb-dots">
                <span className="lcb-dot lcb-dot-red" />
                <span className="lcb-dot lcb-dot-yellow" />
                <span className="lcb-dot lcb-dot-green" />
              </div>
              <span className="lcb-code-file">solution.js</span>
              <FiCode size={14} color="#8b949e" />
            </div>

            <div className="lcb-code-body">
              <span className="lcb-cmt">/** Add Two Numbers **/</span><br />
              <span className="lcb-kw">function</span> <span className="lcb-fn">addTwoNumbers</span>(<span className="lcb-var">a</span>, <span className="lcb-var">b</span>) &#123;<br />
              &nbsp;&nbsp;<span className="lcb-kw">return</span> <span className="lcb-var">a</span> + <span className="lcb-var">b</span>;<br />
              &#125;<br />
              <div className="lcb-status-pill">
                <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <FiCheckCircle size={14} /> Accepted
                </span>
                <span>Runtime: 1.2ms</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}
