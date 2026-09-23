"use client";

import { useState } from "react";
import HeroSection from "./HeroSection";
import HeroSearch from "./HeroSearch";
import DashboardNavCards from "../dashboard/DashboardNavCards";
import DownloadAppBanner from "./DownloadAppBanner";
import RandomQuote from "./home/RandomQuote";
import WhatIsLearnix from "./home/WhatIsLearnix";
import WhoIsLearnixFor from "./home/WhoIsLearnixFor";
import WhatYouCanLearn from "./home/WhatYouCanLearn";
import HowLearnixWorks from "./home/HowLearnixWorks";
import SamplePublicContent from "./home/SamplePublicContent";
import WhyLearnixTrustworthy from "./home/WhyLearnixTrustworthy";
import QuestionPapersBanner from "./home/QuestionPapersBanner";
import UpdatesBanner from "./UpdatesBanner";
import WhatsNew from "./WhatsNew";
import AutoPlayVideo from "../about/AutoPlayVideo";
import "./styles/HeroSection.css";

export default function Home() {
  const [loggedIn] = useState(() => {
    if (typeof window === "undefined") return false;
    return Boolean(localStorage.getItem("usn"));
  });

  return (
    <div className="learnix-hero-root">
      {/* Hero Banner */}
      <HeroSection />

      {/* Search Bar — right after hero */}
      <section style={{ padding: "0 24px 24px", width: "100%", boxSizing: "border-box", maxWidth: "100%", margin: "0 auto" }}>
        <HeroSearch />
        <br /><br />
      </section>

      {/* Dashboard Navigation Cards */}
      <section className="learnix-home-nav-cards-wrapper" style={{ padding: "40px 16px 20px 16px", width: "100%", boxSizing: "border-box" }}>
        <DashboardNavCards loggedIn={loggedIn} />
      </section>

      {/* Secondary Content */}
      <section className="learnix-hero-secondary">
        <div className="learnix-hero-container">
          <div className="learnix-hero-content">
            <br />
            <br />
            <br />
            <br />
            <DownloadAppBanner />
            <br />
            <br />
            <br />
            <br />
            <RandomQuote />
            {/* <HomeGroqAskBox /> */}
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