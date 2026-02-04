// components/legal/FeedbackDataSection.js

import React from "react";
import { FiMessageCircle } from "react-icons/fi";

export default function FeedbackDataSection() {
  return (
    <section
      id="feedback-data"
      className="tp-card"
      aria-labelledby="tp-feedback"
    >
      <div className="tp-section-header">
        <FiMessageCircle className="tp-section-icon" />
        <h2 id="tp-feedback" className="tp-subtitle">
          Feedback Information
        </h2>
      </div>

      <p className="tp-plain">
        Learnix provides users with the option to submit feedback to
        help us improve the platform and user experience.
      </p>

      <ul className="tp-list">
        <li>Feedback message content</li>
        <li>Date and time the feedback was submitted</li>
      </ul>

      <p className="tp-plain">
        We do not collect or store any personal information as part of
        the feedback submission process. Feedback messages are stored
        solely for review and improvement purposes.
      </p>
    </section>
  );
}
