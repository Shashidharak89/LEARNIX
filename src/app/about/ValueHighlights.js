"use client";

import React from "react";
import { FaGraduationCap, FaHandHoldingHeart, FaGlobe, FaRocket } from "react-icons/fa";
import "./styles/ValueHighlights.css";

const highlights = [
  {
    icon: <FaGraduationCap />,
    title: "Accessible Content for All",
    desc: "Explore study materials without login — helping students access useful academic resources quickly.",
  },
  {
    icon: <FaHandHoldingHeart />,
    title: "Community Contribution",
    desc: "Upload and share your study notes and resources after logging in — contribute back to the learning community.",
  },
  {
    icon: <FaGlobe />,
    title: "Device-to-Device Sharing",
    desc: "Share files using a unique access code that works across devices — simple and effective for peer collaboration.",
  },
  {
    icon: <FaRocket />,
    title: "Grow and Learn Smarter",
    desc: "Learn from uploaded materials and gain insights — build better study habits and expand your academic knowledge.",
  },
];

const ValueHighlights = () => {
  return (
    <section className="vh-section">
      <div className="vh-container">
        {highlights.map((item, idx) => (
          <div
            key={idx}
            className={`vh-row vh-row-${idx % 2 === 0 ? "left" : "right"}`}
          >
            <div className="vh-icon-wrapper">
              <div className="vh-icon">{item.icon}</div>
            </div>
            <div className="vh-text">
              <h3 className="vh-title">{item.title}</h3>
              <p className="vh-desc">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ValueHighlights;
