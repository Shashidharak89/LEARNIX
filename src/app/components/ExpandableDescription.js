"use client";
import { useState, useRef, useEffect } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import MarkdownRenderer from './MarkdownRenderer';
import './styles/ExpandableDescription.css';

export default function ExpandableDescription({
  content,
  className = "",
  maxHeight = 240,
  fadeHeight,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const contentRef = useRef(null);

  const effectiveFadeHeight =
    fadeHeight !== undefined
      ? fadeHeight
      : Math.min(110, Math.max(50, Math.round(maxHeight * 0.45)));

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    // Use thresholdHeight to determine if overflowing
    const thresholdHeight = maxHeight;
    setIsOverflowing(el.scrollHeight > thresholdHeight);
  }, [content, maxHeight]);

  if (!content) return null;

  return (
    <div className="expandable-desc-wrapper">
      <div
        ref={contentRef}
        className={`expandable-desc-content ${className}`}
        style={{
          maxHeight: (!isExpanded && isOverflowing) ? `${maxHeight}px` : 'none',
          overflow: (!isExpanded && isOverflowing) ? 'hidden' : 'visible',
          position: 'relative',
        }}
      >
        <MarkdownRenderer content={content} />
      </div>

      {isOverflowing && !isExpanded && (
        <div
          className="expandable-desc-fade"
          style={{ height: `${effectiveFadeHeight}px` }}
        >
          <button
            type="button"
            className="expandable-desc-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(true);
            }}
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
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(false);
            }}
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
