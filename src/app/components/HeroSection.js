"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiBookOpen, FiUsers, FiTrendingUp, FiArrowRight } from "react-icons/fi";
import { HiAcademicCap } from "react-icons/hi";
import "./styles/HeroSection.css";
import TutVideo from "./TutVideo";
import WhatsNew from "./WhatsNew";
import WhatIsLearnix from "./home/WhatIsLearnix";

export default function HeroSection() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const usn = localStorage.getItem("usn");
      if (usn) {
        setLoggedIn(true);
      }
    }

    // Trigger animation after component mounts
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="learnix-hero-main">
      <div className="learnix-hero-container">
        {/* Floating Icons */}
        <div className="learnix-floating-icons">
          <FiBookOpen className="learnix-float-icon learnix-float-1" />
          <HiAcademicCap className="learnix-float-icon learnix-float-2" />
          <FiUsers className="learnix-float-icon learnix-float-3" />
          <FiTrendingUp className="learnix-float-icon learnix-float-4" />
        </div>

        <div className={`learnix-hero-content ${isVisible ? 'learnix-content-visible' : ''}`}>
          {/* Main Title with Animation */}
          <div className="learnix-title-wrapper">
            <h1 className="learnix-main-title">
              Welcome to{" "}
              <span className="learnix-brand-text">
                LEARNIX
                <div className="learnix-brand-underline"></div>
              </span>
            </h1>
          </div>



          {/* Subtitle */}
          <p className="learnix-hero-subtitle">
            Share resources, study materials, and build your profile with ease.
          </p>
          <TutVideo />
          <br />
          <br />
          <br />


          {/* Feature Cards */}
          <div className="learnix-feature-grid">
            <div className="learnix-feature-card">
              <FiBookOpen className="learnix-feature-icon" />
              <span>Study Materials</span>
            </div>
            <div className="learnix-feature-card">
              <FiUsers className="learnix-feature-icon" />
              <span>Community</span>
            </div>
            <div className="learnix-feature-card">
              <HiAcademicCap className="learnix-feature-icon" />
              <span>Build Profile</span>
            </div>
          </div>

          {/* Login Status */}
          <div className="learnix-status-section">
            {loggedIn ? (
              <div className="learnix-welcome-card">
                <div className="learnix-success-indicator"></div>
                <p className="learnix-status-text">
                  You are logged in. Enjoy all features of Learnix 🚀
                </p>
              </div>
            ) : (
              <div className="learnix-login-prompt">
                <p className="learnix-prompt-text">
                  Please login to access extra features
                </p>
                <Link href="/login" className="learnix-cta-button">
                  Login
                  <FiArrowRight className="learnix-button-icon" />
                </Link>
              </div>
            )}
          </div>
          <WhatIsLearnix/>

          {/* What's New Component */}
          <WhatsNew />
        </div>

        {/* Decorative Elements */}
        <div className="learnix-decoration-dots">
          <div className="learnix-dot learnix-dot-1"></div>
          <div className="learnix-dot learnix-dot-2"></div>
          <div className="learnix-dot learnix-dot-3"></div>
          <div className="learnix-dot learnix-dot-4"></div>
          <div className="learnix-dot learnix-dot-5"></div>
          <div className="learnix-dot learnix-dot-6"></div>
        </div>
      </div>
    </section>
  );
}