"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';
import {
  DEFAULT_IMAGE,
  SLIDER_IMAGES,
  GETTING_STARTED_STEPS,
  UPLOADING_STEPS,
  PROFILE_FEATURES,
  ACCESSING_METHODS,
  FEEDBACK_OPTIONS
} from './helpData';
import './styles/HelpContent.css';

const HelpContent = () => {
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (title) => {
    setExpandedSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const sections = [
    {
      title: "Getting Started",
      content: (
        <div className="help-steps">
          {GETTING_STARTED_STEPS.map((step, index) => (
            <div key={index} className="help-step">
              <div className="step-number">{index + 1}</div>
              <div className="step-content">
                <h4>{step.title}</h4>
                <p>{step.description}</p>
                {step.image && (
                  <div className="step-image-container">
                    <Image 
                      src={step.image}
                      alt={step.title}
                      fill
                      sizes="(max-width: 768px) 90vw, 80vw"
                      className="step-image"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )
    },
    {
      title: "Uploading Study Materials",
      content: (
        <div className="help-steps">
          {UPLOADING_STEPS.map((step, index) => (
            <div key={index} className="help-step">
              <div className="step-number">{index + 1}</div>
              <div className="step-content">
                <h4>{step.title}</h4>
                <p>{step.description}</p>
                {step.image && (
                  <div className="step-image-container">
                    <Image 
                      src={step.image}
                      alt={step.title}
                      fill
                      sizes="(max-width: 768px) 90vw, 80vw"
                      className="step-image"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )
    },
    {
      title: "Managing Your Profile",
      content: (
        <div className="feature-grid">
          {PROFILE_FEATURES.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-image-container">
                <Image 
                  src={feature.image}
                  alt={feature.alt}
                  fill
                  sizes="(max-width: 768px) 90vw, 300px"
                  className="feature-image"
                />
              </div>
              <h4>{feature.title}</h4>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      )
    },
    {
      title: "Using Study Materials",
      content: (
        <div className="help-section">
          <h4>Accessing Materials</h4>
          <p>You can access study materials by:</p>
          <ul>
            {ACCESSING_METHODS.map((method, index) => (
              <li key={index}>{method}</li>
            ))}
          </ul>
          <div className="help-image-container">
            <Image 
              src={DEFAULT_IMAGE}
              alt="Accessing Materials"
              fill
              sizes="(max-width: 768px) 90vw, 80vw"
              className="help-image"
            />
          </div>
        </div>
      )
    },
    {
      title: "Providing Feedback",
      content: (
        <div className="help-section">
          <p>Your feedback helps us improve! You can:</p>
          <ul>
            {FEEDBACK_OPTIONS.map((option, index) => (
              <li key={index}>{option}</li>
            ))}
          </ul>
          <div className="help-image-container">
            <Image 
              src={DEFAULT_IMAGE}
              alt="Feedback System"
              fill
              sizes="(max-width: 768px) 90vw, 80vw"
              className="help-image"
            />
          </div>
        </div>
      )
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-slide every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % SLIDER_IMAGES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [SLIDER_IMAGES.length]);

  return (
    <div className="help-content">
      <h1>Help Center</h1>
      <p className="help-intro">
        Welcome to Learnix! This guide will help you understand how to use all features
        of our platform effectively.
      </p>

      <div className="help-image-slider">
        <div className="slider-container" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
          {SLIDER_IMAGES.map((src, index) => (
            <div key={index} className="slide">
              <div className="slide-image-container">
                <Image 
                  src={src} 
                  alt={`Help guide slide ${index + 1}`}
                  fill
                  sizes="100vw"
                  className="slide-image"
                  priority={index === 0}
                />
              </div>
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

      {sections.map((section, index) => (
        <div key={index} className="help-expandable-section">
          <button 
            className={`help-section-header ${expandedSections[section.title] ? 'expanded' : ''}`}
            onClick={() => toggleSection(section.title)}
          >
            {expandedSections[section.title] ? <FiChevronDown /> : <FiChevronRight />}
            <h3>{section.title}</h3>
          </button>
          {expandedSections[section.title] && (
            <div className="help-section-content">
              {section.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default HelpContent;