"use client";
import { useState, useRef, useEffect } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import MarkdownRenderer from './MarkdownRenderer';
import './styles/ExpandableDescription.css';

export default function ExpandableDescription({ content, className = "" }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    // Use a stable height limit (240px) to prevent layout thrashing on mobile browser address bar collapse/expand
    const thresholdHeight = 240;
    setIsOverflowing(el.scrollHeight > thresholdHeight);
  }, [content]);

  if (!content) return null;

  return (
    <div className="expandable-desc-wrapper">
      <div
        ref={contentRef}
        className={`expandable-desc-content ${className}`}
        style={{
          maxHeight: (!isExpanded && isOverflowing) ? '240px' : 'none',
          overflow: (!isExpanded && isOverflowing) ? 'hidden' : 'visible',
          position: 'relative',
        }}
      >
        <MarkdownRenderer content={content} />
      </div>

      {isOverflowing && !isExpanded && (
        <div className="expandable-desc-fade">
          <button
            type="button"
            className="expandable-desc-btn"
            onClick={() => setIsExpanded(true)}
            aria-label="Read more description"
          >
            <span>Read More</span>
            <FiChevronDown className="expandable-desc-btn-icon" />
          </button>
        </div>
      )}

      {isOverflowing && isExpanded && (
        <div className="expandable-desc-collapse-wrapper">
          <button
            type="button"
            className="expandable-desc-btn expandable-desc-btn-collapse"
            onClick={() => setIsExpanded(false)}
            aria-label="Show less description"
          >
            <span>Show Less</span>
            <FiChevronUp className="expandable-desc-btn-icon" />
          </button>
        </div>
      )}
    </div>
  );
}
