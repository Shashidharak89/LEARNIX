"use client";

import { FiCheck, FiClock } from "react-icons/fi";
import "./ProblemStatusBadge.css";

/**
 * ProblemStatusBadge
 * Displays:
 *  - Solved: Clean simple tick (FiCheck) when all test cases passed
 *  - Attempting: Clock icon (FiClock) when submitted but not all passed
 *  - Nothing: when unattempted or no status
 *
 * @param {Object} props
 * @param {'solved'|'attempting'|null|undefined} props.status
 * @param {boolean} [props.showText=false] Whether to display "Solved" / "Attempted" text
 * @param {number} [props.size=14] Icon size
 * @param {string} [props.className] Additional CSS class
 * @param {string} [props.title] Custom tooltip title
 * @param {boolean} [props.compact=false] Smaller badge padding
 */
export default function ProblemStatusBadge({
  status,
  showText = false,
  size = 14,
  className = "",
  title,
  compact = false,
}) {
  if (!status || (status !== "solved" && status !== "attempting")) {
    return null;
  }

  const isSolved = status === "solved";
  const defaultTitle = isSolved
    ? "Solved — All test cases passed"
    : "Attempted — Not all test cases passed";

  return (
    <span
      className={`psb-badge psb-${status} ${showText ? "psb-with-text" : "psb-icon-only"} ${
        compact ? "psb-compact" : ""
      } ${className}`.trim()}
      title={title || defaultTitle}
      role="status"
      aria-label={defaultTitle}
    >
      <span className="psb-icon-wrap">
        {isSolved ? (
          <FiCheck
            size={size}
            className="psb-icon-solved"
          />
        ) : (
          <FiClock
            size={size}
            className="psb-icon-attempting"
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
