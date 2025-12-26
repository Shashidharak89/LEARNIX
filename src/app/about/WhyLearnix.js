"use client";

import React from "react";
import { FaClipboardList, FaUsers, FaRegLightbulb, FaRocket } from "react-icons/fa";
import "./styles/WhyLearnix.css";

const points = [
  {
    icon: <FaUsers />,
    title: "Easy Access for Everyone",
    desc: "Students can explore and download study materials without logging in, making learning open and accessible.",
  },
  {
    icon: <FaRegLightbulb />,
    title: "Boost Your Learning",
    desc: "Find organized study resources that help strengthen your understanding and support academic success.",
  },
  {
    icon: <FaClipboardList />,
    title: "Structured Study Materials",
    desc: "Materials are categorized and easy to browse, which helps save time and keeps learning focused.",
  },
  {
    icon: <FaRocket />,
    title: "Grow Your Impact",
    desc: "Upload your own resources to help others — contribute to a collaborative learning community.",
  },
];

const WhyLearnix = () => {
  return (
    <section className="why-section">
      <div className="why-container">
        <h2 className="why-title">Why Choose Learnix</h2>
        <p className="why-subtitle">
          Learnix is built with students in mind — offering simplicity, openness, and community-driven value so everyone can learn smarter.
        </p>

        <div className="why-cards">
          {points.map((item, i) => (
            <div key={i} className="why-card">
              <div className="why-icon">{item.icon}</div>
              <h3 className="why-card-title">{item.title}</h3>
              <p className="why-card-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyLearnix;
