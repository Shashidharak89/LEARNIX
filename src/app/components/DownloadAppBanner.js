"use client";

import { useState, useEffect } from "react";
import {
  FiFileText,
  FiUploadCloud,
  FiMessageCircle,
} from "react-icons/fi";
import { FaGooglePlay } from "react-icons/fa";

import "./styles/DownloadAppBanner.css";

const FEATURES = [
  { icon: FiFileText, label: "Notes & papers" },
  { icon: FiUploadCloud, label: "Instant uploads" },
  { icon: FiMessageCircle, label: "Live chat" },
];

export default function DownloadAppBanner() {
  const [appInfo, setAppInfo] = useState({ version: "", link: "" });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAppInfo() {
      try {
        const res = await fetch("/api/app-info");
        const data = await res.json();
        setAppInfo(data);
      } catch (error) {
        console.error("Failed to fetch app info:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAppInfo();
  }, []);

  return (
    <section className="lrx-dlb-section" aria-label="Download Learnix Android App">
      <div className="lrx-dlb-inner">

        <div className="lrx-dlb-content">
          <span className="lrx-dlb-badge">
            <FaGooglePlay size={13} aria-hidden="true" />
            Available on Google Play
          </span>

          <h3 className="lrx-dlb-title">
            Take Learnix with you, everywhere
          </h3>

          <p className="lrx-dlb-subtitle">
            Install the official Android app for faster access to notes,
            uploads, question papers, tools, and real-time chat.
          </p>

          <ul className="lrx-dlb-features">
            {FEATURES.map(({ icon: Icon, label }) => (
              <li className="lrx-dlb-feature" key={label}>
                <Icon size={14} aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>

          <a
            href={appInfo.link || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="lrx-dlb-cta"
            aria-disabled={isLoading}
          >
            <FaGooglePlay size={17} className="lrx-dlb-cta-icon" aria-hidden="true" />
            <span className="lrx-dlb-cta-text">
              <span className="lrx-dlb-cta-text-small">Get it on</span>
              <span className="lrx-dlb-cta-text-main">
                {isLoading ? "Preparing…" : `Google Play (v${appInfo.version || "1.0"})`}
              </span>
            </span>
          </a>
        </div>

        <div className="lrx-dlb-visual" aria-hidden="true">
          <div className="lrx-dlb-accent-shape" />
          <div className="lrx-dlb-phone">
            <div className="lrx-dlb-phone-notch" />
            <div className="lrx-dlb-phone-screen">
              <div className="lrx-dlb-phone-bar lrx-dlb-phone-bar--blue" />
              <div className="lrx-dlb-phone-bar lrx-dlb-phone-bar--yellow" />
              <div className="lrx-dlb-phone-bar" />
              <div className="lrx-dlb-phone-bar lrx-dlb-phone-bar--short" />
            </div>
          </div>
          <span className="lrx-dlb-visual-tag">
            <FaGooglePlay size={11} aria-hidden="true" />
            Google Play
          </span>
        </div>

      </div>
    </section>
  );
}