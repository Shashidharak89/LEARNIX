"use client";

import React, { useState } from "react";
import { FiYoutube } from "react-icons/fi";
import "./styles/YouTubeEmbed.css";

export default function YouTubeEmbed({ ytId, wrapperClass = "", iframeClass = "" }) {
  const [isLoaded, setIsLoaded] = useState(false);

  if (!ytId) return null;

  return (
    <div className={`yt-embed-container ${wrapperClass} ${isLoaded ? "is-loaded" : "is-loading"}`}>
      {!isLoaded && (
        <div className="yt-embed-skeleton">
          <div className="yt-embed-skeleton-pulse" />
          <div className="yt-embed-skeleton-icon">
            <FiYoutube size={40} />
          </div>
        </div>
      )}
      <iframe
        className={`yt-embed-iframe ${iframeClass}`}
        src={`https://www.youtube.com/embed/${ytId}`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  );
}
