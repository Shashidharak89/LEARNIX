"use client";

import React, { useRef, useEffect, useState } from "react";
import { FaVolumeMute, FaVolumeUp } from "react-icons/fa";
import "./styles/AutoPlayVideo.css";

const AutoPlayVideo = ({ videoUrl }) => {
  const videoRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    // Ensure the video starts muted
    videoEl.muted = isMuted;

    // IntersectionObserver to play/pause video when visible
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
      { threshold: 0.5 } // play when 50% visible :contentReference[oaicite:1]{index=1}
    );

    observer.observe(videoEl);

    return () => {
      observer.unobserve(videoEl);
    };
  }, [isLoading, isMuted]);

  const handleCanPlayThrough = () => {
    setIsLoading(false);
  };

  const toggleSound = () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    const newMuted = !videoEl.muted;
    videoEl.muted = newMuted;
    setIsMuted(newMuted);
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
        className={`auto-video ${isLoading ? "video-hidden" : ""}`}
        src={videoUrl}
        loop
        playsInline
        disablePictureInPicture
        controls={false}
        controlsList="nodownload nofullscreen noremoteplayback"
        onContextMenu={(e) => e.preventDefault()}
        onCanPlayThrough={handleCanPlayThrough}
      />

      {/* SOUND TOGGLE ICON */}
      <div className="sound-btn" onClick={toggleSound}>
        {isMuted ? (
          <FaVolumeMute className="sound-icon" />
        ) : (
          <FaVolumeUp className="sound-icon" />
        )}
      </div>
    </div>
  );
};

export default AutoPlayVideo;
