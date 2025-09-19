"use client";
import React from "react";
import { FiBookOpen } from "react-icons/fi";
import "./styles/StudyMaterials.css";

export default function StudyMaterials() {
  return (
    <section className="sm-container" aria-labelledby="sm-title">
      <div className="sm-card">
        <div className="sm-icon-wrap" aria-hidden="true">
          <FiBookOpen size={42} />
        </div>

        <h1 id="sm-title" className="sm-title">Study Materials</h1>
        <p className="sm-subtitle">
          Study materials will be uploaded soon. Keep an eye here for updates!
        </p>

        <div className="sm-info">
          <div className="sm-pill">
            <strong>Visibility:</strong> Public
          </div>
          <div className="sm-pill">
            <strong>Uploader:</strong> Admin
          </div>
        </div>

        <div className="sm-actions">
          <button className="sm-btn sm-btn-primary" disabled>
            Coming Soon
          </button>
          <button
            className="sm-btn sm-btn-outline"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            title="Scroll to top"
          >
            Back to Top
          </button>
        </div>
 
        <div className="sm-footer-note">
          <span>Tip:</span> We will notify users when materials go live.
        </div>
      </div>
    </section>
  );
}
