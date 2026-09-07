"use client";
import { useState, useRef, useEffect } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import './styles/ExpandableDescription.css';

export default function ExpandableDescription({ content, className = "" }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const checkOverflow = () => {
      const thresholdHeight = window.innerHeight * 0.3;
      setIsOverflowing(el.scrollHeight > thresholdHeight);
    };

    checkOverflow();

    const resizeObserver = new ResizeObserver(() => {
      checkOverflow();
    });
    resizeObserver.observe(el);

    window.addEventListener('resize', checkOverflow);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', checkOverflow);
    };
  }, [content]);

  if (!content) return null;

  return (
    <div className="expandable-desc-wrapper">
      <div
        ref={contentRef}
        className={`expandable-desc-content ${className}`}
        style={{
          maxHeight: (!isExpanded && isOverflowing) ? '30vh' : 'none',
          overflow: (!isExpanded && isOverflowing) ? 'hidden' : 'visible',
          position: 'relative',
        }}
      >
        {content}
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
