"use client";

import React, { useRef, useEffect } from "react";
import "./styles/AutoPlayVideo.css";

const AutoPlayVideo = ({ videoUrl }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
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
  }, []);

  return (
    <div className="video-container">
      <video
        ref={videoRef}
        className="auto-video"
        src={videoUrl}
        muted={false}
        loop
        controls={false}
        playsInline
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
};

export default AutoPlayVideo;
