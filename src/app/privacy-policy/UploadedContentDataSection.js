// components/legal/UploadedContentDataSection.js

import React from "react";
import { FiUpload } from "react-icons/fi";

export default function UploadedContentDataSection() {
  return (
    <section
      id="uploaded-content-data"
      className="tp-card"
      aria-labelledby="tp-uploaded"
    >
      <div className="tp-section-header">
        <FiUpload className="tp-section-icon" />
        <h2 id="tp-uploaded" className="tp-subtitle">
          Uploaded Subjects and Topics Information
        </h2>
      </div>

      <p className="tp-plain">
        When you upload subjects, topics, or related study materials
        on Learnix, we collect and process certain information to
        properly identify ownership, manage content visibility, and
        provide platform features.
      </p>

      <ul className="tp-list">
        <li>Your University Seat Number (USN) and name, used as identifiers and to grant upload authority</li>
        <li>Metadata related to uploaded files, stored securely in our database</li>
        <li>Upload date and time</li>
        <li>Last modified date and time</li>
      </ul>

      <p className="tp-plain">
        The actual files and images you upload are stored securely on
        the Cloudinary cloud platform. We do not store the raw files
        directly on our servers. Instead, we save and use the secure
        URLs provided by Cloudinary to retrieve and display the
        uploaded content.
      </p>

      <p className="tp-plain">
        You have full control over the visibility of the content you
        upload and may change its visibility settings according to
        the options provided on the platform.
      </p>
    </section>
  );
}
