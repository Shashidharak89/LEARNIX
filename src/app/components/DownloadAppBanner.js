"use client";

import { useState, useEffect, useRef } from "react";
import {
  FileTextIcon,
  CloudUploadIcon,
  SmartphoneIcon,
} from "@animateicons/react/lucide";
import { FaGooglePlay } from "react-icons/fa";

import googlePlaySvg from "../../animated-icons/Google Play.svg";

import "./styles/DownloadAppBanner.css";

function AnimatedFeature({ Icon, label }) {
  const iconRef = useRef(null);

  return (
    <li
      className="lrx-dlb-feature"
      onMouseEnter={() => iconRef.current?.startAnimation?.()}
      onMouseLeave={() => iconRef.current?.stopAnimation?.()}
    >
      <Icon ref={iconRef} size={15} className="lrx-dlb-feat-icon" aria-hidden="true" />
      <span>{label}</span>
    </li>
  );
}

export default function DownloadAppBanner() {
  const [appInfo, setAppInfo] = useState({ version: "", link: "" });
  const [isLoading, setIsLoading] = useState(true);

  const phoneRef = useRef(null);

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
          <span
            className="lrx-dlb-badge"
            onMouseEnter={() => phoneRef.current?.startAnimation?.()}
            onMouseLeave={() => phoneRef.current?.stopAnimation?.()}
          >
            <SmartphoneIcon ref={phoneRef} size={14} aria-hidden="true" />
            <span>Available on Google Play</span>
          </span>

          <h3 className="lrx-dlb-title">
            Take Learnix with you, everywhere
          </h3>

          <p className="lrx-dlb-subtitle">
            Install the official Android app for faster access to notes,
            uploads, question papers, and tools.
          </p>

          <ul className="lrx-dlb-features">
            <AnimatedFeature Icon={FileTextIcon} label="Notes & papers" />
            <AnimatedFeature Icon={CloudUploadIcon} label="Instant uploads" />
          </ul>

          <a
            href={appInfo.link || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="lrx-dlb-cta"
            aria-disabled={isLoading}
          >
            <FaGooglePlay size={18} className="lrx-dlb-cta-icon" aria-hidden="true" />
            <span className="lrx-dlb-cta-text">
              <span className="lrx-dlb-cta-text-small">Get it on</span>
              <span className="lrx-dlb-cta-text-main">
                {isLoading ? "Preparing…" : `Google Play (v${appInfo.version || "1.0"})`}
              </span>
            </span>
          </a>
        </div>

        <div className="lrx-dlb-visual" aria-hidden="true">
          <img
            src={googlePlaySvg.src || googlePlaySvg}
            alt="Google Play App"
            className="lrx-dlb-svg-icon"
          />
          <span className="lrx-dlb-visual-tag">
            <FaGooglePlay size={11} aria-hidden="true" />
            Google Play
          </span>
        </div>

      </div>
    </section>
  );
}
