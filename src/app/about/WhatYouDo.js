"use client";

import React from "react";
import { FaTools, FaDownload, FaUpload } from "react-icons/fa";
import "./styles/WhatYouDo.css";
import ImageContainer from "../components/ImageContainer";

const items = [
  {
    icon: <FaTools />,
    text: `Learnix is a student-focused educational platform built to help learners find and share academic resources easily.`,
  },
  {
    icon: <FaUpload />,
    text: `Registered users can log in to upload study materials in the form of PDF or images, helping the community grow with more valuable content.`,
  },
  {
    icon: <FaDownload />,
    text: `Browse and download study materials such as notes, question papers, and resources shared by other students — all completely free.`,
  },
  {
    icon: <FaTools />,
    text: `Use the built-in file sharing tool to upload raw files and download them across devices using a unique 4-digit code that expires after 24 hours.`,
  },
];

const WhatYouDo = () => {
  return (
    <section className="what-section">
      <div className="what-container">
        <ImageContainer imageUrl="https://res.cloudinary.com/dsojdpkgh/image/upload/v1766771794/ibzasezt7fvrym0mt7xm.jpg" altText="What We Do" />
        <h2 className="what-title">What We Do</h2>
        {items.map((item, index) => (
          <div key={index} className="what-card">
            <div className="what-card-icon">{item.icon}</div>
            <p className="what-card-text">{item.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WhatYouDo;
