"use client";

import React from "react";
import {
  FaSearch,
  FaShareAlt,
  FaKey,
  FaSignInAlt,
  FaUsers,
} from "react-icons/fa";
import "./styles/HowLearnixWorks.css";

const steps = [
  {
    step: "01",
    icon: <FaSearch />,
    title: "Explore study materials",
    desc: "Anyone can explore and download shared study materials without logging in. This helps students quickly access useful academic resources.",
  },
  {
    step: "02",
    icon: <FaShareAlt />,
    title: "Use file-sharing tools without login",
    desc: "Learnix provides device-to-device file-sharing tools that can be used without creating an account. Files can be shared instantly using an access code.",
  },
  {
    step: "03",
    icon: <FaKey />,
    title: "Upload files and get an access code",
    desc: "Users can upload any type of file such as ZIP, PDF, images, or documents. A unique access code is generated to download the file from any device.",
  },
  {
    step: "04",
    icon: <FaSignInAlt />,
    title: "Login only for study material uploads",
    desc: "To upload study materials like PDFs and images to the learning section, users must log in. This helps maintain content quality and organization.",
  },
  {
    step: "05",
    icon: <FaUsers />,
    title: "Learn and contribute",
    desc: "Students can learn from shared materials and optionally contribute resources after logging in, helping others in the learning community.",
  },
];

const HowLearnixWorks = () => {
  return (
    <section className="hlw-section">
      <div className="hlw-container">
        <h2 className="hlw-title">How Learnix Works</h2>
        <p className="hlw-subtitle">
          Learnix follows a simple and transparent process that allows students
          to access learning resources and share files easily.
        </p>

        <div className="hlw-steps">
          {steps.map((item, index) => (
            <div className="hlw-card" key={index}>
              <div className="hlw-step">{item.step}</div>
              <div className="hlw-icon">{item.icon}</div>
              <h3 className="hlw-card-title">{item.title}</h3>
              <p className="hlw-card-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowLearnixWorks;
