"use client";

import React from "react";
import "./styles/ImageContainer.css";

const ImageContainer = ({ imageUrl, altText = "image" }) => {
  return (
    <div className="image-container">
      <img src={imageUrl} alt={altText} className="responsive-image" />
    </div>
  );
};

export default ImageContainer;
