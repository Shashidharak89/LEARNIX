// components/legal/ToolsDataSection.js

import React from "react";

export default function ToolsDataSection() {
  return (
    <section
      id="tools-data"
      className="space-y-4"
    >
      <h2 className="text-xl font-semibold">
        Tools and Temporary Sharing Information
      </h2>

      <p className="text-gray-700">
        Learnix provides tools that allow users to temporarily share
        files and text content across devices. These tools are
        designed for short-term usage and convenience.
      </p>

      <h3 className="text-lg font-medium">
        File Upload and Sharing Tool
      </h3>

      <p className="text-gray-700">
        When you upload a file using the file sharing tool, the file
        is stored on the Cloudinary cloud platform for a maximum
        duration of 24 hours. After uploading, a unique access code
        is generated, which can be used to retrieve the file on other
        devices.
      </p>

      <p className="text-gray-700">
        Both the uploaded file and its associated access code will
        automatically expire after 24 hours. Once expired, the file
        and code can no longer be accessed or recovered.
      </p>

      <p className="text-gray-700">
        You may upload any type of file using this tool for instant
        sharing. However, users are strongly advised not to upload
        confidential, sensitive, or personal files.
      </p>

      <h3 className="text-lg font-medium">
        Text Sharing Tool
      </h3>

      <p className="text-gray-700">
        When using the text sharing tool, the text you submit is
        stored temporarily in our database for up to 24 hours. This
        allows short-term access across devices.
      </p>

      <p className="text-gray-700">
        After 24 hours, the stored text content is automatically
        deleted and cannot be accessed, retrieved, or restored.
      </p>
    </section>
  );
}
