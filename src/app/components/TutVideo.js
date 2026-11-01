'use client';

import React, { useEffect, useRef, useState } from 'react';
import './styles/TutVideo.css';

const HERO_VIDEO_URL =
  'https://res.cloudinary.com/dsojdpkgh/video/upload/v1793516234/a0kbf21xqhjcdgo1lb8s.mp4';

const TutVideo = () => {
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef(null);

  // Handle video ready to play
  const handleCanPlayThrough = () => {
    setIsLoading(false);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.src = HERO_VIDEO_URL;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;

    const tryPlay = () => {
      video.play().catch(() => {
        // Autoplay policy retry if needed
      });
    };

    // If the video is paused for any reason, immediately resume
    const onPause = () => {
      setTimeout(() => {
        if (video.paused) tryPlay();
      }, 50);
    };

    video.addEventListener('pause', onPause);
    tryPlay();

    return () => {
      video.removeEventListener('pause', onPause);
    };
  }, []);

  // Disable context menu and keyboard interaction on wrapper
  const onContextMenu = (e) => e.preventDefault();
  const onKeyDown = (e) => {
    const blocked = [' ', 'k', 'MediaPlayPause'];
    if (blocked.includes(e.key)) e.preventDefault();
  };

  return (
    <div className="tutvideo-container" onContextMenu={onContextMenu} onKeyDown={onKeyDown}>
      <div className="tutvideo-wrapper">
        {isLoading && (
          <div className="tutvideo-loader">
            <div className="tutvideo-spinner"></div>
          </div>
        )}
        <video
          ref={videoRef}
          src={HERO_VIDEO_URL}
          className={isLoading ? 'tutvideo-hidden' : ''}
          onCanPlayThrough={handleCanPlayThrough}
          muted
          autoPlay
          playsInline
          loop
          preload="auto"
          tabIndex={-1}
          controls={false}
          disablePictureInPicture
          controlsList="nodownload noplaybackrate nofullscreen"
        />
      </div>
    </div>
  );
};

export default TutVideo;
