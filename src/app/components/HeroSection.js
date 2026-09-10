"use client";

import { useState } from "react";
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
  FiFileText,
  FiBell,
  FiSmartphone,
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
import WhyLearnixTrustworthy from "./home/WhyLearnixTrustworthy";
import QuestionPapersBanner from "./home/QuestionPapersBanner";
import AutoPlayVideo from "../about/AutoPlayVideo";
import UpdatesBanner from './UpdatesBanner';
import RandomQuote from "../test/RandomQuote";
import PublicQuickText from "./PublicQuickText";
import DownloadAppBanner from "./DownloadAppBanner";
import HomeGroqAskBox from "./HomeGroqAskBox";
import DashboardNavCards from "../dashboard/DashboardNavCards";

export default function HeroSection() {
  const [loggedIn] = useState(() => {
    if (typeof window === "undefined") return false;
    return Boolean(localStorage.getItem("usn"));
  });

  return (
    <div className="learnix-hero-root">
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
                      <strong>Prepare for Exams & Placements —</strong> Access updated study resources to help you crack exams and ace placements.
                    </span>
                  </li>
                  <li>
                    <FiUpload className="learnix-point-icon" />
                    <span>
                      <strong>Upload & Organize —</strong> Upload your own notes and materials, and keep everything sorted by subject and topic.
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
          </div>
        </div>
      </section>

      {/* Dashboard Navigation Section */}
      <section className="learnix-home-nav-cards-wrapper" style={{ padding: "40px 16px 20px 16px", width: "100%", boxSizing: "border-box" }}>
        <DashboardNavCards loggedIn={loggedIn} />
      </section>

      {/* Standalone Full-Window Pinned Quote of the Month */}


      {/* Standalone Full-Window Pinned Public Quick Text */}
      {/* <PublicQuickText /> */}

      <section className="learnix-hero-secondary">
        <div className="learnix-hero-container">
          <div className="learnix-hero-content">
            <br />
            <br />
            <br />
            <br />
            <DownloadAppBanner />
            <RandomQuote />
            <HomeGroqAskBox />
            <WhatIsLearnix />
            <AutoPlayVideo videoUrl="https://res.cloudinary.com/dsojdpkgh/video/upload/v1766751517/zglomku8o9iuxxv99qwx.mp4" />
            <WhoIsLearnixFor />
            <WhatYouCanLearn />
            <AutoPlayVideo videoUrl="https://res.cloudinary.com/dsojdpkgh/video/upload/v1766752160/x0wvwwcpxgnrkwkbye1k.mp4" />

            <HowLearnixWorks />
            <SamplePublicContent />
            <QuestionPapersBanner />

            {/* Updates banner placed before 'Why Learnix is trustworthy' */}
            <UpdatesBanner />

            <WhyLearnixTrustworthy />

            {/* What's New Component */}
            <WhatsNew />
          </div>
        </div>
      </section>
    </div>
  );
}