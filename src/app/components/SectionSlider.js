"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";

import "./styles/SectionSlider.css";

export default function SectionSlider({ title, images, route }) {
  const [currIndex, setCurrIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrIndex((prev) => (prev + 1) % images.length);
    }, 1000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="section-slider-unique">
      <h3 className="section-title-unique">{title}</h3>
      <Link href={route} className="slide-wrapper-unique">
        <img
          src={images[currIndex]}
          alt={`${title} image ${currIndex}`}
          className="slide-img-unique"
        />
        <div className="slide-caption-unique">
          <span>{title}</span>
          <FaArrowRight className="slide-arrow-unique" />
        </div>
      </Link>
    </div>
  );
}
