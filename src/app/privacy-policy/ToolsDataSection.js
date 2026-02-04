// components/legal/ToolsDataSection.js

import React from "react";
import { FiTool } from "react-icons/fi";

export default function ToolsDataSection() {
  return (
    <section
      id="tools-data"
      className="tp-card"
      aria-labelledby="tp-tools"
    >
      <div className="tp-section-header">
        <FiTool className="tp-section-icon" />
        <h2 id="tp-tools" className="tp-subtitle">
          Tools and Temporary Sharing Information
        </h2>
      </div>

      <p className="tp-plain">
        Learnix provides tools that allow users to temporarily share
        files and text content across devices. These tools are
        designed for short-term usage and convenience.
      </p>

      <h3 className="tp-subheading">
        File Upload and Sharing Tool
      </h3>

      <p className="tp-plain">
        When you upload a file using the file sharing tool, the file
        is stored on the Cloudinary cloud platform for a maximum
        duration of 24 hours. After uploading, a unique access code
        is generated, which can be used to retrieve the file on other
        devices.
      </p>

      <p className="tp-plain">
        Both the uploaded file and its associated access code will
        automatically expire after 24 hours. Once expired, the file
        and code can no longer be accessed or recovered.
      </p>

      <p className="tp-plain tp-warning">
        You may upload any type of file using this tool for instant
        sharing. However, users are strongly advised not to upload
        confidential, sensitive, or personal files.
      </p>

      <h3 className="tp-subheading">
        Text Sharing Tool
      </h3>

      <p className="tp-plain">
        When using the text sharing tool, the text you submit is
        stored temporarily in our database for up to 24 hours. This
        allows short-term access across devices.
      </p>

      <p className="tp-plain">
        After 24 hours, the stored text content is automatically
        deleted and cannot be accessed, retrieved, or restored.
      </p>
    </section>
  );
}
