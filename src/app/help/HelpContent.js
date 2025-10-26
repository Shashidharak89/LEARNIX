"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';
import './styles/HelpContent.css';

const DEFAULT_IMAGE = "https://res.cloudinary.com/ddycnd409/image/upload/v1761484468/users/NU25MCA117/Research%20Methodology%20and%20Publication%20Ethics/Assignment%201%20-%20Review%20paper/jnmpibrmfnz5t1npksuq.jpg";

const ExpandableSection = ({ title, children }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="help-expandable-section">
      <button 
        className={`help-section-header ${isExpanded ? 'expanded' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
        <h3>{title}</h3>
      </button>
      {isExpanded && (
        <div className="help-section-content">
          {children}
        </div>
      )}
    </div>
  );
};

const ImageSlider = ({ images = [DEFAULT_IMAGE, DEFAULT_IMAGE, DEFAULT_IMAGE] }) => {
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

const StepByStepGuide = ({ steps }) => {
  return (
    <div className="help-steps">
      {steps.map((step, index) => (
        <div key={index} className="help-step">
          <div className="step-number">{index + 1}</div>
          <div className="step-content">
            <h4>{step.title}</h4>
            <p>{step.description}</p>
            {step.image && (
              <Image 
                src={step.image}
                alt={step.title}
                width={600}
                height={300}
                className="step-image"
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default function HelpContent() {
  const gettingStartedSteps = [
    {
      title: "Create an Account",
      description: "Click on 'Login / Register' in the sidebar and choose 'Register'. Enter your full name, University Seat Number (USN), and choose a password.",
      image: DEFAULT_IMAGE
    },
    {
      title: "Complete Your Profile",
      description: "After registration, visit your profile page to add a profile picture and update your information.",
      image: DEFAULT_IMAGE
    },
    {
      title: "Explore Study Materials",
      description: "Browse through available study materials by subject. You can view and download materials shared by others.",
      image: DEFAULT_IMAGE
    }
  ];

  const uploadingSteps = [
    {
      title: "Select Subject",
      description: "Choose the subject for which you want to upload materials. If the subject doesn't exist, you can create a new one.",
      image: DEFAULT_IMAGE
    },
    {
      title: "Choose Files",
      description: "Select the PDF files you want to upload. Make sure they're properly named and organized.",
      image: DEFAULT_IMAGE
    },
    {
      title: "Add Details",
      description: "Provide a description and any relevant tags to help others find your materials.",
      image: DEFAULT_IMAGE
    }
  ];

  return (
    <div className="help-content">
      <h1>Help Center</h1>
      <p className="help-intro">
        Welcome to Learnix! This guide will help you understand how to use all features
        of our platform effectively.
      </p>

      <ImageSlider />

      <ExpandableSection title="Getting Started">
        <StepByStepGuide steps={gettingStartedSteps} />
      </ExpandableSection>

      <ExpandableSection title="Uploading Study Materials">
        <StepByStepGuide steps={uploadingSteps} />
      </ExpandableSection>

      <ExpandableSection title="Managing Your Profile">
        <div className="feature-grid">
          <div className="feature-card">
            <Image 
              src={DEFAULT_IMAGE}
              alt="Profile Settings"
              width={300}
              height={200}
              className="feature-image"
            />
            <h4>Profile Settings</h4>
            <p>Customize your profile picture and update personal information.</p>
          </div>
          <div className="feature-card">
            <Image 
              src={DEFAULT_IMAGE}
              alt="Security Settings"
              width={300}
              height={200}
              className="feature-image"
            />
            <h4>Security</h4>
            <p>Change your password and manage account security settings.</p>
          </div>
        </div>
      </ExpandableSection>

      <ExpandableSection title="Using Study Materials">
        <div className="help-section">
          <h4>Accessing Materials</h4>
          <p>You can access study materials by:</p>
          <ul>
            <li>Browsing through subjects in the Study Materials section</li>
            <li>Using the search function to find specific topics</li>
            <li>Checking recent uploads on the dashboard</li>
          </ul>
          <Image 
            src={DEFAULT_IMAGE}
            alt="Accessing Materials"
            width={600}
            height={300}
            className="help-image"
          />
        </div>
      </ExpandableSection>

      <ExpandableSection title="Providing Feedback">
        <div className="help-section">
          <p>Your feedback helps us improve! You can:</p>
          <ul>
            <li>Rate study materials</li>
            <li>Report inappropriate content</li>
            <li>Suggest improvements</li>
            <li>Contact administrators</li>
          </ul>
          <Image 
            src={DEFAULT_IMAGE}
            alt="Feedback System"
            width={600}
            height={300}
            className="help-image"
          />
        </div>
      </ExpandableSection>
    </div>
  );
}