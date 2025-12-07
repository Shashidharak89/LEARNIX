"use client";

import { useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import { MdNewReleases } from "react-icons/md";
import "./styles/WhatsNew.css";

export default function WhatsNew() {
  const [expandedUpdate, setExpandedUpdate] = useState(0);

  const latestUpdates = [
    {
      title: "Quick File Share - New Feature",
      description: "Upload any file instantly and get a unique code! Share your files with anyone without login required. Perfect for quick file transfers, assignments, and documents. Simply upload, get a code, and others can download using that code on any device."
    },
    {
      title: "New Study Materials Available",
      description: "We've added comprehensive study materials for 3rd semester courses including Blockchain Technology, Cloud Computing, and AI/ML modules. All materials are now available in the Study Materials section with downloadable resources."
    },
    {
      title: "Improved File Viewer",
      description: "Experience faster document viewing with our new integrated file viewer. Preview PDFs, documents, and presentations directly without leaving the platform."
    }
  ];

  return (
    <div className="whats-new-section">
      <div className="whats-new-header">
        <MdNewReleases className="whats-new-icon" />
        <h3 className="whats-new-title">What's New</h3>
      </div>
      
      <div className="updates-container">
        {latestUpdates.map((update, index) => (
          <div 
            key={index} 
            className={`update-card ${expandedUpdate === index ? 'update-expanded' : ''}`}
          >
            <button
              className="update-toggle"
              onClick={() => setExpandedUpdate(expandedUpdate === index ? -1 : index)}
              aria-expanded={expandedUpdate === index}
            >
              <span className="update-title-text">{update.title}</span>
              <FiChevronDown className={`update-chevron ${expandedUpdate === index ? 'update-chevron-open' : ''}`} />
            </button>
            
            {expandedUpdate === index && (
              <div className="update-content">
                <p>{update.description}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
