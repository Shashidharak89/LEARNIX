'use client';

import React, { useEffect, useRef, useState } from 'react';
import './styles/TutVideo.css';

const TutVideo = () => {
  // List of video URLs
  const videos = [
    'https://res.cloudinary.com/dsojdpkgh/video/upload/v1763215646/InShot_20251115_190620485_pttofu.mp4',
    'https://res.cloudinary.com/dsojdpkgh/video/upload/v1763215646/InShot_20251115_191654212_dm18ly.mp4',
    'https://res.cloudinary.com/dsojdpkgh/video/upload/v1763215642/InShot_20251115_192640273_vvhepx.mp4',
    'https://res.cloudinary.com/dsojdpkgh/video/upload/v1763215640/InShot_20251115_192206908_in1n3m.mp4',
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef(null);

  // When one video ends → play next
  const handleVideoEnd = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % videos.length);
  };

  // Auto-play the next video when index changes and enforce continuous play
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // set src explicitly (helps some browsers)
    video.src = videos[currentIndex];
    video.loop = false; // we handle loop by switching to next video on ended
    video.muted = true;
    video.playsInline = true;

    const tryPlay = () => {
      video
        .play()
        .catch(() => {
          console.warn('Autoplay might be blocked — video will attempt to play again when possible.');
        });
    };

    // If the video is paused for any reason, immediately resume
    const onPause = () => {
      // tiny timeout avoids some browser race conditions
      setTimeout(() => {
        if (video.paused) tryPlay();
      }, 50);
    };

    // Prevent seeking from having visible effect
    const onSeeking = () => {
      // snap back to currentTime (no-op) — prevent user seeking
      tryPlay();
    };

    video.addEventListener('pause', onPause);
    video.addEventListener('seeking', onSeeking);

    tryPlay();

    return () => {
      video.removeEventListener('pause', onPause);
      video.removeEventListener('seeking', onSeeking);
    };
  }, [currentIndex]);

  // disable context menu and keyboard interaction on wrapper
  const onContextMenu = (e) => e.preventDefault();
  const onKeyDown = (e) => {
    // prevent space, k, media keys from pausing - best-effort
    const blocked = [' ', 'k', 'MediaPlayPause'];
    if (blocked.includes(e.key)) e.preventDefault();
  };

  return (
    <div className="tutvideo-container" onContextMenu={onContextMenu} onKeyDown={onKeyDown}>
      <div className="tutvideo-wrapper">
        <video
          ref={videoRef}
          key={videos[currentIndex]}
          onEnded={handleVideoEnd}
          muted
          autoPlay
          playsInline
          preload="auto"
          loop={false}
          // make non-focusable and non-interactive
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
