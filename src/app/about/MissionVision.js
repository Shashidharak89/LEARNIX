"use client";

import React from "react";
import { FaBullseye, FaEye } from "react-icons/fa";
import "./styles/MissionVision.css";

const MissionVision = () => {
  return (
    <section className="mv-section">
      <div className="mv-container">
        <h2 className="mv-title">Mission & Vision</h2>

        <div className="mv-cards">

          <div className="mv-card mv-mission">
            <div className="mv-icon">
              <FaBullseye />
            </div>
            <div className="mv-text">
              <h3 className="mv-card-title">Our Mission</h3>
              <p className="mv-card-desc">
                To empower students with easy access to high-quality study
                materials and collaborative tools, helping learners grow
                academically and share knowledge seamlessly.
              </p>
            </div>
          </div>

          <div className="mv-card mv-vision">
            <div className="mv-icon">
              <FaEye />
            </div>
            <div className="mv-text">
              <h3 className="mv-card-title">Our Vision</h3>
              <p className="mv-card-desc">
                To become the go-to learning platform where students can
                learn smarter, contribute resources, and build a thriving
                community of shared academic success.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default MissionVision;
