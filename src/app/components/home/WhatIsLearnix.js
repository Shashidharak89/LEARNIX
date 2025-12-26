"use client";

import "./styles/WhatIsLearnix.css";
import { useState } from "react";
import Link from "next/link";

export default function WhatIsLearnix() {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="lx-what-section">
      <div className="lx-what-container">

        {/* IMAGE BEFORE TITLE */}
        <div className="lx-what-image-wrapper">
          <img
            src="https://res.cloudinary.com/dsojdpkgh/image/upload/v1766771789/cbvazjeytrm6u3g395nj.jpg"
            alt="Learnix Overview"
            className="lx-what-image"
          />
        </div>

        {/* Title */}
        <h2 className="lx-what-title">
          What is <span>Learnix?</span>
        </h2>

        {/* Short intro */}
        <p className="lx-what-intro">
          Learnix is a collaborative educational platform where students from
          different colleges can share, access, and download study materials
          to improve their academic understanding.
        </p>

        {/* Key points */}
        <ul className="lx-what-points">
          <li>Access study materials uploaded by students without login</li>
          <li>Download complete semester-wise learning resources</li>
          <li>Study material uploads support PDF and image files only</li>
          <li>File-sharing tools support all file types (ZIP, JPEG, DOCX, etc.)</li>
        </ul>

        {/* Expandable content */}
        <div
          className={`lx-what-extra ${
            expanded ? "lx-expand-open" : "lx-expand-close"
          }`}
        >
          <p>
            Learnix provides separate tools for learning and file sharing.
            For study materials, users can upload only PDFs and images, which
            are securely stored in the cloud and optimized for direct viewing.
          </p>

          <p>
            For device-to-device file sharing, users can upload any type of
            file such as ZIP, JPEG, DOCX, or other formats. After uploading,
            a unique access code is generated that allows downloading from
            any device at any time.
          </p>

          <p>
            Uploaded files can be accessed by others without login using the
            access code. However, to upload files or study materials, users
            must log in. Learnix also supports private uploads for restricted
            access.
          </p>

          <div className="lx-what-note">
            <strong>Note:</strong> Do not upload personal or confidential
            documents on the platform.
          </div>

          {/* Read further button (only when expanded) */}
          <div className="lx-read-more-wrap">
            <Link href="/about" className="lx-read-more-btn">
              Read further →
            </Link>
          </div>
        </div>

        {/* View more button */}
        <button
          className="lx-view-btn"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "View less" : "View more"}
        </button>
      </div>
    </section>
  );
}
