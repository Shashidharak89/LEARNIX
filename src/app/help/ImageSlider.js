// components/ImageSlider.jsx
"use client";
import { useState, useEffect } from 'react';
import ImageContainer from './ImageContainer';
import './styles/HelpContent.css';
import { SLIDER_IMAGES } from './helpData';

const ImageSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % SLIDER_IMAGES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [SLIDER_IMAGES.length]);

  return (
    <div className="help-image-slider">
      <div className="slider-container" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
        {SLIDER_IMAGES.map((src, index) => (
          <div key={index} className="slide">
            <ImageContainer
              src={src}
              alt={`Help guide slide ${index + 1}`}
              containerClass="slide-image-container"
              className="slide-image"
              sizes="100vw"
            />
          </div>
        ))}
      </div>
      <div className="slider-dots">
        {SLIDER_IMAGES.map((_, index) => (
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