"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CodeIcon,
  ArrowRightIcon,
  CircleCheckIcon,
  ZapIcon,
  LaptopIcon,
  CheckCheckIcon,
} from "@animateicons/react/lucide";
import "./styles/LearnixCodeBanner.css";

function AnimatedFeatureChip({ icon: Icon, text }) {
  const iconRef = useRef(null);

  return (
    <span
      className="lcb-feat-chip"
      onMouseEnter={() => iconRef.current?.startAnimation?.()}
      onMouseLeave={() => iconRef.current?.stopAnimation?.()}
    >
      <Icon ref={iconRef} size={14} className="lcb-chip-icon" aria-hidden="true" />
      <span>{text}</span>
    </span>
  );
}

export default function LearnixCodeBanner() {
  const arrowRef = useRef(null);
  const codeTopRef = useRef(null);
  const acceptedRef = useRef(null);

  const handleCardEnter = () => {
    arrowRef.current?.startAnimation?.();
    codeTopRef.current?.startAnimation?.();
    acceptedRef.current?.startAnimation?.();
  };

  const handleCardLeave = () => {
    arrowRef.current?.stopAnimation?.();
    codeTopRef.current?.stopAnimation?.();
    acceptedRef.current?.stopAnimation?.();
  };

  return (
    <section className="lcb-section" aria-label="Learnix Code Coding Platform">
      <Link
        href="/learnix-code"
        className="lcb-card"
        onMouseEnter={handleCardEnter}
        onMouseLeave={handleCardLeave}
      >
        <div className="lcb-ambient-glow" />

        <div className="lcb-content">
          <div className="lcb-badge">
            <Image
              src="/learnix-code-logo.png"
              alt="Learnix Code Logo"
              width={20}
              height={20}
              className="lcb-badge-logo"
            />
            <span>Interactive Coding Arena</span>
          </div>

          <h2 className="lcb-title">
            Introducing <span className="lcb-title-highlight">Learnix Code</span>
          </h2>

          <p className="lcb-tagline">
            Level up your algorithmic skills with our interactive coding playground.
            Solve curated challenges and verify against automated test cases.
          </p>

          <div className="lcb-features">
            <AnimatedFeatureChip icon={ZapIcon} text="10+ Curated Problems" />
            <AnimatedFeatureChip icon={LaptopIcon} text="Interactive IDE" />
            <AnimatedFeatureChip icon={CheckCheckIcon} text="Automated Test Cases" />
          </div>

          <div>
            <span className="lcb-btn-cta">
              <span>Start Coding Now</span>
              <ArrowRightIcon ref={arrowRef} size={17} className="lcb-btn-arrow" />
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
              <span className="lcb-code-file">Solution.java</span>
              <CodeIcon ref={codeTopRef} size={15} color="#8b949e" />
            </div>

            <div className="lcb-code-body">
              <span className="lcb-cmt">{"// Solution.java"}</span><br />
              <span className="lcb-kw">class</span> <span className="lcb-fn">Solution</span> &#123;<br />
              &nbsp;&nbsp;<span className="lcb-kw">public int</span> <span className="lcb-fn">addTwoNumbers</span>(<span className="lcb-kw">int</span> <span className="lcb-var">a</span>, <span className="lcb-kw">int</span> <span className="lcb-var">b</span>) &#123;<br />
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="lcb-kw">return</span> <span className="lcb-var">a</span> + <span className="lcb-var">b</span>;<br />
              &nbsp;&nbsp;&#125;<br />
              &#125;<br />
              <div className="lcb-status-pill">
                <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <CircleCheckIcon ref={acceptedRef} size={14} /> Accepted
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
