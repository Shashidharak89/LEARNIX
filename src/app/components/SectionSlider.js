"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FaArrowRight, FaCircle, FaEye } from "react-icons/fa";
import "./styles/SectionSlider.css";

export default function SectionSlider({ title, description, images, route }) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (images.length <= 1) return;
    
    const slideTimer = setInterval(() => {
      if (!isPaused) {
        setActiveImageIndex((prevIndex) => (prevIndex + 1) % images.length);
      }
    }, 4000);
    
    return () => clearInterval(slideTimer);
  }, [images.length, isPaused]);

  const handleSliderPause = () => setIsPaused(true);
  const handleSliderResume = () => setIsPaused(false);

  const handleIndicatorClick = (index) => {
    setActiveImageIndex(index);
  };

  return (
    <div className="enhanced-slider-wrapper">
      <Link 
        href={route} 
        className="enhanced-image-link"
        onMouseEnter={handleSliderPause}
        onMouseLeave={handleSliderResume}
      >
        <div className="enhanced-image-stack">
          {images.map((imageUrl, idx) => (
            <img
              key={idx}
              src={imageUrl}
              alt={`${title} showcase ${idx + 1}`}
              className={`enhanced-slider-image ${idx === activeImageIndex ? 'enhanced-image-visible' : ''}`}
              draggable="false"
              onContextMenu={(e) => e.preventDefault()}
              loading="lazy"
            />
          ))}
          
          <div className="enhanced-content-overlay">
            <div className="enhanced-overlay-content">
              <h3 className="enhanced-overlay-title">{title}</h3>
              <p className="enhanced-overlay-description">{description}</p>
            </div>
          </div>
        </div>
        
        {images.length > 1 && (
          <div className="enhanced-indicators-container">
            {images.map((_, idx) => (
              <button
                key={idx}
                className={`enhanced-indicator ${idx === activeImageIndex ? 'enhanced-indicator-current' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleIndicatorClick(idx);
                }}
                aria-label={`View image ${idx + 1}`}
              >
                <FaCircle />
              </button>
            ))}
          </div>
        )}
      </Link>
    </div>
  );
}