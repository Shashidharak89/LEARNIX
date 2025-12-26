"use client";

import React from "react";
import { FaUserGraduate, FaSchool, FaExternalLinkAlt } from "react-icons/fa";
import "./styles/WhoYouAre.css";

const WhoYouAre = () => {
  return (
    <section className="who-section">
      <div className="who-container">
        <div className="who-icon">
          <FaSchool />
        </div>

        <h2 className="who-title">Who We Are</h2>

        <p className="who-text">
          I am <strong>Shashidhara K</strong>, a student of <strong>MCA</strong> at{" "}
          <strong>NMAM Institute of Technology, Nitte</strong>, currently pursuing 1st year MCA.
        </p>

        <p className="who-text">
          <FaUserGraduate className="who-inline-icon" /> Learnix is a platform I built for students to
          refer to for educational purposes — sharing resources and study materials easily.
        </p>

        <p className="who-text">
          Here, you can find and download study materials directly for free, helping students learn
          smarter and access resources without barriers.
        </p>

        <p className="who-text">
          For more about me and my work, visit my portfolio:{" "}
          <a
            href="https://www.shashi-k.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="who-portfolio-link"
          >
            shashi-k.in <FaExternalLinkAlt className="who-link-icon" />
          </a>
        </p>
      </div>
    </section>
  );
};

export default WhoYouAre;
