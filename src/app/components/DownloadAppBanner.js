"use client";

import { FiArrowDownCircle, FiDownload, FiSmartphone } from "react-icons/fi";
import "./styles/DownloadAppBanner.css";

export default function DownloadAppBanner() {
  return (
    <section className="dab-wrap" aria-label="Download Learnix Android App">
      <div className="dab-glow dab-glow-1" />
      <div className="dab-glow dab-glow-2" />

      <div className="dab-content">
        <div className="dab-badge">
          <FiSmartphone size={14} /> Android App
        </div>

        <h3 className="dab-title">Download LEARNIX on your phone</h3>
        <p className="dab-subtitle">
          Install the official Android app for faster access to notes, uploads,
          question papers, tools, and real-time chat.
        </p>

        <div className="dab-actions">
          <a href="/LEARNIX.apk" download className="dab-download-btn">
            <FiDownload size={16} /> Click to Download
          </a>
        </div>
      </div>
    </section>
  );
}
