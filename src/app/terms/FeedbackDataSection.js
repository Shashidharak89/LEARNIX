// components/legal/FeedbackDataSection.js

import React from "react";

export default function FeedbackDataSection() {
  return (
    <section
      id="feedback-data"
      className="space-y-4"
    >
      <h2 className="text-xl font-semibold">
        Feedback Information
      </h2>

      <p className="text-gray-700">
        Learnix provides users with the option to submit feedback to
        help us improve the platform and user experience.
      </p>

      <ul className="list-disc pl-6 text-gray-700 space-y-1">
        <li>Feedback message content</li>
        <li>Date and time the feedback was submitted</li>
      </ul>

      <p className="text-gray-700">
        We do not collect or store any personal information as part of
        the feedback submission process. Feedback messages are stored
        solely for review and improvement purposes.
      </p>
    </section>
  );
}
