"use client";

import { useRef, useEffect } from "react";
import { CircleCheckBigIcon, ClockIcon } from "@animateicons/react/lucide";
import "./ProblemStatusBadge.css";

/**
 * ProblemStatusBadge
 * Displays:
 *  - Solved: Animated green tick mark (CircleCheckBigIcon) when all test cases passed
 *  - Attempting: Animated amber clock (ClockIcon) when submitted but not all passed
 *  - Nothing: when unattempted or no status
 *
 * @param {Object} props
 * @param {'solved'|'attempting'|null|undefined} props.status
 * @param {boolean} [props.showText=false] Whether to display "Solved" / "Attempted" text
 * @param {number} [props.size=16] Icon size
 * @param {string} [props.className] Additional CSS class
 * @param {string} [props.title] Custom tooltip title
 * @param {boolean} [props.compact=false] Smaller badge padding
 */
export default function ProblemStatusBadge({
  status,
  showText = false,
  size = 16,
  className = "",
  title,
  compact = false,
}) {
  const iconRef = useRef(null);

  // Play animation once on mount or when status changes
  useEffect(() => {
    if (status) {
      const timer = setTimeout(() => {
        iconRef.current?.startAnimation?.();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [status]);

  if (!status || (status !== "solved" && status !== "attempting")) {
    return null;
  }

  const isSolved = status === "solved";
  const defaultTitle = isSolved
    ? "Solved — All test cases passed"
    : "Attempted — Not all test cases passed";

  const handleMouseEnter = () => {
    iconRef.current?.startAnimation?.();
  };

  return (
    <span
      className={`psb-badge psb-${status} ${showText ? "psb-with-text" : "psb-icon-only"} ${
        compact ? "psb-compact" : ""
      } ${className}`.trim()}
      title={title || defaultTitle}
      onMouseEnter={handleMouseEnter}
      role="status"
      aria-label={defaultTitle}
    >
      <span className="psb-icon-wrap">
        {isSolved ? (
          <CircleCheckBigIcon
            ref={iconRef}
            size={size}
            className="psb-animated-icon psb-icon-solved"
          />
        ) : (
          <ClockIcon
            ref={iconRef}
            size={size}
            className="psb-animated-icon psb-icon-attempting"
          />
        )}
      </span>
      {showText && (
        <span className="psb-label">
          {isSolved ? "Solved" : "Attempting"}
        </span>
      )}
    </span>
  );
}
