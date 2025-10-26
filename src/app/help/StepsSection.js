// components/StepsSection.jsx
"use client";
import ImageContainer from './ImageContainer';
import './styles/StepByStepGuide.css';

const StepsSection = ({ steps, title }) => {
  return (
    <div className="help-steps">
      {steps.map((step, index) => (
        <div key={index} className="help-step">
          <div className="step-number">{index + 1}</div>
          <div className="step-content">
            <h4>{step.title}</h4>
            <p>{step.description}</p>
            {step.image && (
              <ImageContainer
                src={step.image}
                alt={step.title}
                containerClass="step-image-container"
                className="step-image"
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StepsSection;