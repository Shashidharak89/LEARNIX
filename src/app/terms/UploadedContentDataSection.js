// components/legal/UploadedContentDataSection.js

import React from "react";

export default function UploadedContentDataSection() {
  return (
    <section
      id="uploaded-content-data"
      className="space-y-4"
    >
      <h2 className="text-xl font-semibold">
        Uploaded Subjects and Topics Information
      </h2>

      <p className="text-gray-700">
        When you upload subjects, topics, or related study materials
        on Learnix, we collect and process certain information to
        properly identify ownership, manage content visibility, and
        provide platform features.
      </p>

      <ul className="list-disc pl-6 text-gray-700 space-y-1">
        <li>Your University Seat Number (USN) and name, used as identifiers and to grant upload authority</li>
        <li>Metadata related to uploaded files, stored securely in our database</li>
        <li>Upload date and time</li>
        <li>Last modified date and time</li>
      </ul>

      <p className="text-gray-700">
        The actual files and images you upload are stored securely on
        the Cloudinary cloud platform. We do not store the raw files
        directly on our servers. Instead, we save and use the secure
        URLs provided by Cloudinary to retrieve and display the
        uploaded content.
      </p>

      <p className="text-gray-700">
        You have full control over the visibility of the content you
        upload and may change its visibility settings according to
        the options provided on the platform.
      </p>
    </section>
  );
}
