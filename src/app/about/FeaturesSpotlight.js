"use client";

import React from "react";
import {
  FaSearch,
  FaFileUpload,
  FaFileDownload,
  FaCommentDots,
} from "react-icons/fa";
import "./styles/FeaturesSpotlight.css";

const features = [
  {
    icon: <FaSearch />,
    title: "Discover Study Materials",
    desc: "Easily search, explore, and download shared study materials without logging in — fast and free access to what you need.",
  },
  {
    icon: <FaFileUpload />,
    title: "Upload & Share Your Resources",
    desc: "Logged-in users can upload PDF or image study materials and help others learn with your shared resources.",
  },
  {
    icon: <FaFileDownload />,
    title: "Universal File Sharing",
    desc: "Share any type of file across devices using a unique access code — perfect for private exchanges and quick sharing.",
  },
  {
    icon: <FaCommentDots />,
    title: "Feedback & Interaction",
    desc: "View and reply to private feedback on your uploaded content — build interaction and improve contributions.",
  },
];

const FeaturesSpotlight = () => {
  return (
    <section className="fs-section">
      <div className="fs-container">
        <h2 className="fs-title">Learnix Features Spotlight</h2>
        <p className="fs-subtitle">
          Learnix brings powerful yet simple features together to support students in every step of their learning journey.
        </p>

        {features.map((feature, index) => (
          <div
            key={index}
            className={`fs-feature-row fs-feature-${index % 2 === 0 ? "left" : "right"}`}
          >
            <div className="fs-icon">{feature.icon}</div>
            <div className="fs-text">
              <h3 className="fs-feature-title">{feature.title}</h3>
              <p className="fs-feature-desc">{feature.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturesSpotlight;
