"use client";

import Link from "next/link";
import {
  FiArrowRight,
  FiSearch,
  FiUpload,
  FiShield,
  FiSmartphone,
} from "react-icons/fi";
import { HiAcademicCap } from "react-icons/hi";
import "./styles/HeroSection.css";
import TutVideo from "./TutVideo";

export default function HeroSection() {
  return (
    <section className="learnix-hero-main">
      <div className="learnix-hero-container">
        <div className="learnix-hero-content">
          <div className="learnix-hero-layout">
            <div className="learnix-hero-left">
              <div className="learnix-title-wrapper">
                <h1 className="learnix-main-title">
                  Welcome to{" "}
                  <span className="learnix-brand-text">
                    LEARNIX
                    <div className="learnix-brand-underline"></div>
                  </span>
                </h1>
                <div className="learnix-slogan-tag">✨ Learn Together, Succeed Together</div>
              </div>

              <p className="learnix-hero-subtitle">
                Learnix is a platform where students share study materials and help each other do better in college.
              </p>

              <h4 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#1f2937", marginBottom: "14px" }}>
                What you can do on Learnix:
              </h4>

              <ul className="learnix-hero-points">
                <li>
                  <FiSearch className="learnix-point-icon" />
                  <span>
                    <strong>Find Study Material —</strong> Get notes, subject-wise content, and previous year question papers for your courses.
                  </span>
                </li>
                <li>
                  <HiAcademicCap className="learnix-point-icon" />
                  <span>
                    <strong>Prepare for Exams &amp; Placements —</strong> Access updated study resources to help you crack exams and ace placements.
                  </span>
                </li>
                <li>
                  <FiUpload className="learnix-point-icon" />
                  <span>
                    <strong>Upload &amp; Organize —</strong> Upload your own notes and materials, and keep everything sorted by subject and topic.
                  </span>
                </li>
                <li>
                  <FiSmartphone className="learnix-point-icon" />
                  <span>
                    <strong>Practice on Our App —</strong> Download the Learnix app to take quizzes, get feedback, and study on the go.
                  </span>
                </li>
              </ul>

              <div className="learnix-hero-ctas">
                <Link href="/works" className="learnix-cta-button">
                  ✔ Explore Resources
                  <FiArrowRight className="learnix-button-icon" />
                </Link>
                <Link href="/learn" className="learnix-cta-secondary">
                  ✔ Start Learning
                </Link>
              </div>

              <div className="learnix-adsense-note">
                <FiShield className="learnix-adsense-icon" />
                <span>
                  We support original &amp; permitted content. See{" "}
                  <Link href="/terms">Terms</Link>, <Link href="/privacy-policy">Privacy</Link>, or{" "}
                  <Link href="/report-content">report content</Link>.
                </span>
              </div>
            </div>

            <div className="learnix-hero-right">
              <TutVideo />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}