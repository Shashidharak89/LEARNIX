'use client';
import { useEffect, useRef, useState } from 'react';
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

  // Auto-play the next video when index changes
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.load();
      video.play().catch(() => {
        console.warn('Autoplay might be blocked — check browser settings.');
      });
    }
  }, [currentIndex]);

  return (
    <div className="video-container">
      <video
        ref={videoRef}
        key={videos[currentIndex]} // helps reload new src properly
        onEnded={handleVideoEnd}
        muted
        autoPlay
        playsInline
        preload="auto"
      >
        <source src={videos[currentIndex]} type="video/mp4" />
      </video>
    </div>
  );
};

export default TutVideo;
