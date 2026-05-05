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
import HeroNavCards from "./HeroNavCards";

export default function HeroSection() {
  const [loggedIn] = useState(() => {
    if (typeof window === "undefined") return false;
    return Boolean(localStorage.getItem("usn"));
  });

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

          <HeroNavCards loggedIn={loggedIn} />
          <RandomQuote/>
          <PublicQuickText />
          <DownloadAppBanner />
          <HomeGroqAskBox />
          <WhatIsLearnix/>
          <AutoPlayVideo videoUrl="https://res.cloudinary.com/dsojdpkgh/video/upload/v1766751517/zglomku8o9iuxxv99qwx.mp4" />
          <WhoIsLearnixFor/>
          <WhatYouCanLearn/>
          <AutoPlayVideo videoUrl="https://res.cloudinary.com/dsojdpkgh/video/upload/v1766752160/x0wvwwcpxgnrkwkbye1k.mp4" />

          <HowLearnixWorks/>
          <SamplePublicContent/>
          <QuestionPapersBanner/>

          {/* Updates banner placed before 'Why Learnix is trustworthy' */}
          <UpdatesBanner />

          <WhyLearnixTrustworthy/>

          {/* What's New Component */}
          <WhatsNew />
        </div>
      </div>
    </section>
  );
}