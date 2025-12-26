"use client";
import React from "react";
import "./styles/AboutTitle.css";
import { FaBookOpen } from "react-icons/fa";

const AboutTitle = () => {
  return (
    <div className="about-title-section">
      <div className="about-title-container">
        <FaBookOpen className="about-title-icon" />
        <h1 className="about-title-main">Learnix</h1>
        <p className="about-title-sub">Learn Smarter</p>
      </div>
    </div>
  );
};

export default AboutTitle;
