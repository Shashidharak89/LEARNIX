// components/ListSection.jsx
"use client";
import ImageContainer from './ImageContainer';
import './styles/HelpContent.css';

const ListSection = ({ subtitle, intro, items, imageAlt, imageSrc }) => {
  return (
    <div className="help-section">
      {subtitle && <h4>{subtitle}</h4>}
      <p>{intro}</p>
      <ul>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
      <ImageContainer
        src={imageSrc}
        alt={imageAlt}
        containerClass="help-image-container"
        className="help-image"
      />
    </div>
  );
};

export default ListSection;