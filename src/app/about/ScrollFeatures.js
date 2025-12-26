"use client";

import React, { useEffect } from "react";
import {
  FaBook,
  FaUsers,
  FaCloudUploadAlt,
  FaDownload,
  FaComments,
} from "react-icons/fa";
import "./styles/ScrollFeatures.css";

const features = [
  {
    icon: <FaBook />,
    title: "Explore Resources Effortlessly",
    desc: "Browse and download study materials without logging in — fast, open, and free.",
  },
  {
    icon: <FaUsers />,
    title: "Community-Driven Sharing",
    desc: "Students can contribute their own materials to help others succeed.",
  },
  {
    icon: <FaCloudUploadAlt />,
    title: "Upload Files Easily",
    desc: "Upload images, PDFs, or docs with a few clicks and share them with access codes.",
  },
  {
    icon: <FaDownload />,
    title: "Access Anywhere",
    desc: "Downloaded files are accessible on any device with the code.",
  },
  {
    icon: <FaComments />,
    title: "Feedback & Interaction",
    desc: "Receive private feedback and engage with contributors to improve content.",
  },
];

const ScrollFeatures = () => {
  useEffect(() => {
    const items = document.querySelectorAll(".sf-card");
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("sf-visible");
          }
        });
      },
      { threshold: 0.15 }
    );

    items.forEach(item => observer.observe(item));
  }, []);

  return (
    <section className="sf-section">
      <div className="sf-container">
        <h2 className="sf-title">Learnix Highlights</h2>
        <p className="sf-subtitle">
          Experience a smarter way to access, share, and contribute educational resources.
        </p>

        <div className="sf-cards">
          {features.map((feat, index) => (
            <div key={index} className="sf-card">
              <div className="sf-icon">{feat.icon}</div>
              <div className="sf-text">
                <h3 className="sf-card-title">{feat.title}</h3>
                <p className="sf-card-desc">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ScrollFeatures;
