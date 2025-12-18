"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FiBookOpen,
  FiUsers,
  FiTrendingUp,
  FiArrowRight,
  FiSearch,
  FiTool,
  FiHelpCircle,
  FiUpload,
  FiShield,
} from "react-icons/fi";
import { HiAcademicCap } from "react-icons/hi";
import "./styles/HeroSection.css";
import TutVideo from "./TutVideo";
import WhatsNew from "./WhatsNew";
import WhatIsLearnix from "./home/WhatIsLearnix";
import WhoIsLearnixFor from "./home/WhoIsLearnixFor";
import WhatYouCanLearn from "./home/WhatYouCanLearn";
import HowLearnixWorks from "./home/HowLearnixWorks";
import SamplePublicContent from "./home/SamplePublicContent";

export default function HeroSection() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const usn = localStorage.getItem("usn");
      if (usn) {
        setLoggedIn(true);
      }
    }
  }, []);

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
              </div>

              <p className="learnix-hero-subtitle">
               Learnix is a Learning platform where students can share and explore educational resources, making learning collaborative and accessible.
              </p>

              <ul className="learnix-hero-points">
                <li>
                  <FiSearch className="learnix-point-icon" />
                  Search notes, question papers, and topic-wise resources.
                </li>
                <li>
                  <FiUpload className="learnix-point-icon" />
                  Upload your work and manage subjects/topics in one place.
                </li>
                <li>
                  <FiUsers className="learnix-point-icon" />
                  Get feedback via reviews and improve content quality.
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
                  We support original & permitted content. See{" "}
                  <Link href="/terms">Terms</Link>, <Link href="/privacy-policy">Privacy</Link>, or{" "}
                  <Link href="/report-content">report content</Link>.
                </span>
              </div>
            </div>

            <div className="learnix-hero-right">
              <TutVideo />
            </div>
          </div>

          <div className="learnix-nav-card-grid">
            <Link href="/learn" className="learnix-nav-card">
              <HiAcademicCap className="learnix-nav-card-icon" />
              <span>Learn</span>
            </Link>
            <Link href="/search" className="learnix-nav-card">
              <FiSearch className="learnix-nav-card-icon" />
              <span>Search</span>
            </Link>
            <Link href="/materials" className="learnix-nav-card">
              <FiBookOpen className="learnix-nav-card-icon" />
              <span>Materials</span>
            </Link>
            <Link href="/tools" className="learnix-nav-card">
              <FiTool className="learnix-nav-card-icon" />
              <span>Tools</span>
            </Link>
            <Link href="/help" className="learnix-nav-card">
              <FiHelpCircle className="learnix-nav-card-icon" />
              <span>Help</span>
            </Link>
            <Link href={loggedIn ? "/upload" : "/login"} className="learnix-nav-card">
              <FiUpload className="learnix-nav-card-icon" />
              <span>Upload</span>
            </Link>
            <Link href="/dashboard" className="learnix-nav-card">
              <FiTrendingUp className="learnix-nav-card-icon" />
              <span>Dashboard</span>
            </Link>
          </div>
          <WhatIsLearnix/>
          <WhoIsLearnixFor/>
          <WhatYouCanLearn/>
          <HowLearnixWorks/>
          <SamplePublicContent/>

          {/* What's New Component */}
          <WhatsNew />
        </div>
      </div>
    </section>
  );
}