"use client";

import { useState, useEffect } from "react";
import {
  FiDownload,
  FiSmartphone,
} from "react-icons/fi";

import "./styles/DownloadAppBanner.css";

export default function DownloadAppBanner() {
  const [appInfo, setAppInfo] = useState({ version: "", link: "" });

  useEffect(() => {
    async function fetchAppInfo() {
      try {
        const res = await fetch("/api/app-info");
        const data = await res.json();
        setAppInfo(data);
      } catch (error) {
        console.error("Failed to fetch app info:", error);
      }
    }
    fetchAppInfo();
  }, []);

  return (

    <section
      className="dab-wrap"
      aria-label="Download Learnix Android App"
    >

      <div className="dab-glow dab-glow-1" />

      <div className="dab-glow dab-glow-2" />

      <div className="dab-content">

        <div className="dab-badge">
          <FiSmartphone size={14} />
          {" "}
          Android App
        </div>

        <h3 className="dab-title">
          Download LEARNIX on your phone
        </h3>

        <p className="dab-subtitle">
          Install the official Android app for faster access
          to notes, uploads, question papers, tools,
          and real-time chat.
        </p>

        <div className="dab-actions">

          <a
            href={appInfo.link || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="dab-download-btn"
          >
            <FiDownload size={16} />
            {" "}
            {appInfo.version ? `Click to Download (v${appInfo.version})` : "Loading..."}
          </a>

        </div>
      </div>
    </section>
  );
}