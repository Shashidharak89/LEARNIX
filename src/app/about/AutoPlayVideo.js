"use client";

import React, { useRef, useEffect, useState } from "react";
import "./styles/AutoPlayVideo.css";

const AutoPlayVideo = ({ videoUrl }) => {
  const videoRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLoading) {
            videoEl.play().catch(() => {});
          } else {
            videoEl.pause();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(videoEl);

    return () => {
      observer.unobserve(videoEl);
    };
  }, [isLoading]);

  const handleCanPlayThrough = () => {
    setIsLoading(false);
  };

  return (
    <div className="video-container">
      {isLoading && (
        <div className="video-loader">
          <div className="video-spinner"></div>
        </div>
      )}
      <video
        ref={videoRef}
        className={`auto-video ${isLoading ? 'video-hidden' : ''}`}
        src={videoUrl}
        muted={false}
        loop
        controls={false}
        playsInline
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        onContextMenu={(e) => e.preventDefault()}
        onCanPlayThrough={handleCanPlayThrough}
      />
    </div>
  );
};

export default AutoPlayVideo;
