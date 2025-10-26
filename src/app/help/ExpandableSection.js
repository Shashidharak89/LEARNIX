// components/ExpandableSection.jsx
"use client";
import { useState } from 'react';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';
import './styles/ExpandableSection.css';

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

export default ExpandableSection;