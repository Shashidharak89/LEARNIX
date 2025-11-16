// components/ProfileSection.jsx
"use client";
import ImageContainer from './ImageContainer';
import './styles/FeatureGrid.css';

const ProfileSection = ({ features }) => {
  return (
    <div className="feature-grid">
      {features.map((feature, index) => (
        <div key={index} className="feature-card">
          <ImageContainer
            src={feature.image}
            alt={feature.alt}
            containerClass="feature-image-container"
            className="feature-image"
            sizes="(max-width: 768px) 90vw, 300px"
          />
          <h4>{feature.title}</h4>
          <p>{feature.description}</p>
        </div>
      ))}
    </div>
  );
};

export default ProfileSection;