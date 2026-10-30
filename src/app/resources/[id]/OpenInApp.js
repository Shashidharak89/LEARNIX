"use client";

import React, { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";

export default function OpenInApp({ topicId }) {
  const [packageName, setPackageName] = useState("");
  const [showAppBanner, setShowAppBanner] = useState(true);

  useEffect(() => {
    fetch("/.well-known/assetlinks.json")
      .then((res) => res.json())
      .then((data) => {
        if (data && data[0] && data[0].target && data[0].target.package_name) {
          setPackageName(data[0].target.package_name);
        }
      })
      .catch((err) => console.error("Failed to fetch assetlinks", err));
  }, []);

  if (!showAppBanner || !packageName) {
    return null;
  }

  const handleOpenInApp = () => {
    window.location.href = `intent://learnix.dev/resources/${topicId}#Intent;scheme=https;package=${packageName};end;`;
  };

  const handleInstallApp = () => {
    window.location.href = `https://play.google.com/store/apps/details?id=${packageName}`;
  };

  return (
    <div className="wtpc-app-banner">
      <div className="wtpc-app-banner-content">
        <div className="wtpc-app-banner-text">
          <h4>Learnix Android App</h4>
          <p>Experience Learnix natively on your device</p>
        </div>
      </div>
      <div className="wtpc-app-banner-actions">
        <button
          type="button"
          onClick={handleOpenInApp}
          className="wtpc-app-btn wtpc-open-btn"
        >
          Open in Learnix
        </button>
        <button
          type="button"
          onClick={handleInstallApp}
          className="wtpc-app-btn wtpc-install-btn"
        >
          Install Learnix
        </button>
        <button
          type="button"
          className="wtpc-app-close-btn"
          onClick={() => setShowAppBanner(false)}
          aria-label="Close banner"
        >
          <FiX />
        </button>
      </div>
    </div>
  );
}
