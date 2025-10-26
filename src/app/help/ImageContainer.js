// components/shared/ImageContainer.jsx
"use client";
import Image from 'next/image';
import './styles/HelpContent.css';

const ImageContainer = ({ src, alt, className = '', sizes = "(max-width: 768px) 90vw, 80vw", containerClass = '' }) => {
  return (
    <div className={`image-container ${containerClass}`}>
      <Image 
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className={`responsive-image ${className}`}
      />
    </div>
  );
};

export default ImageContainer;