"use client";
import React from "react";
import { FaUniversity, FaUserGraduate } from "react-icons/fa";
import "./styles/WhoYouAre.css";

const WhoYouAre = () => {
  return (
    <section className="who-section">
      <div className="who-container">
        <div className="who-icon-wrapper">
          <FaUniversity className="who-icon" />
        </div>

        <h2 className="who-title">Who We Are</h2>

        <p className="who-text">
          I am a student of <strong>MCA</strong> at{" "}
          <strong>NMAM Institute of Technology, Nitte</strong>, currently
          pursuing 1st year MCA.
        </p>

        <p className="who-text">
          <FaUserGraduate className="who-inline-icon" /> Learnix is a platform I
          built for students to refer to for educational purposes — sharing
          resources and study materials easily.
        </p>

        <p className="who-text">
          Here, you can find and download study materials directly for free.
          The goal is to help students learn smarter and access resources
          without barriers.
        </p>
      </div>
    </section>
  );
};

export default WhoYouAre;
