// components/StepByStepGuide.jsx
"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import './styles/StepByStepGuide.css';

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
              <div className="step-image-container">
                <Image 
                  src={step.image}
                  alt={step.title}
                  fill
                  className="step-image"
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StepByStepGuide;