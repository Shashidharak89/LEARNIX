"use client";

import React from "react";
import Image from "next/image";
import "./styles/AboutTitle.css";

const AboutTitle = () => {
  return (
    <section className="about-title-section">
      <div className="about-title-container">
        <div className="about-title-logo">
          <Image
            src="/logo.png"
            alt="Learnix Logo"
            fill
            style={{ objectFit: "contain" }}
            priority
          />
        </div>

        <h1 className="about-title-main">
          Learnix
          <span className="title-underline"></span>
        </h1>

        <p className="about-title-sub">Learn Smarter</p>
      </div>
    </section>
  );
};

export default AboutTitle;
