// components/ImageSlider.jsx
"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import '../styles/HelpContent.css';

const ImageSlider = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-slide every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="help-image-slider">
      <div className="slider-container" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
        {images.map((src, index) => (
          <div key={index} className="slide">
            <Image 
              src={src} 
              alt={`Help guide slide ${index + 1}`}
              width={1280}
              height={720}
              className="slide-image"
              priority={index === 0}
            />
          </div>
        ))}
      </div>
      <div className="slider-dots">
        {images.map((_, index) => (
          <button
            key={index}
            className={`dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageSlider;