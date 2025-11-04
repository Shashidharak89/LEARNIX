'use client';
import { useEffect, useRef, useState } from 'react';
import './styles/TutVideo.css';

const TutVideo = () => {
  // List of video URLs
  const videos = [
    'https://res.cloudinary.com/dsojdpkgh/video/upload/v1762276525/uploaded-resources_gqgxrd.mp4',
    'https://res.cloudinary.com/dsojdpkgh/video/upload/v1762276525/uploaded-resources_gqgxrd.mp4',
    'https://res.cloudinary.com/dsojdpkgh/video/upload/v1762276525/uploaded-resources_gqgxrd.mp4',
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
