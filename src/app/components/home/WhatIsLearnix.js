"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  CircleCheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowRightIcon,
  TriangleAlertIcon,
  BookOpenIcon,
} from "@animateicons/react/lucide";
import ImageContainer from "../ImageContainer";
import "./styles/WhatIsLearnix.css";

const KEY_POINTS = [
  "Access study materials uploaded by students without login",
  "Download complete semester-wise learning resources",
  "Study material uploads support PDF and image files only",
  "File-sharing tools support all file types (ZIP, JPEG, DOCX, etc.)",
];

function AnimatedPoint({ text }) {
  const checkRef = useRef(null);

  return (
    <li
      className="lx-what-point"
      onMouseEnter={() => checkRef.current?.startAnimation?.()}
      onMouseLeave={() => checkRef.current?.stopAnimation?.()}
    >
      <div className="lx-point-icon-box">
        <CircleCheckIcon ref={checkRef} size={16} className="lx-point-icon" />
      </div>
      <span>{text}</span>
    </li>
  );
}

export default function WhatIsLearnix() {
  const [expanded, setExpanded] = useState(false);
  const toggleRef = useRef(null);
  const readMoreRef = useRef(null);
  const bookIconRef = useRef(null);
  const alertIconRef = useRef(null);

  const handleToggle = () => {
    setExpanded((prev) => !prev);
    toggleRef.current?.startAnimation?.();
  };

  return (
    <section className="lx-what-section" aria-label="What is Learnix">
      <div className="lx-what-card">
        {/* Top Image Preview */}
        <div className="lx-what-img-wrapper">
          <ImageContainer
            imageUrl="https://res.cloudinary.com/dsojdpkgh/image/upload/v1766771789/cbvazjeytrm6u3g395nj.jpg"
            altText="Learnix Overview"
          />
        </div>

        {/* Header Tag / Badge */}
        <div
          className="lx-what-badge"
          onMouseEnter={() => bookIconRef.current?.startAnimation?.()}
          onMouseLeave={() => bookIconRef.current?.stopAnimation?.()}
        >
          <div className="lx-what-badge-icon">
            <BookOpenIcon ref={bookIconRef} size={14} />
          </div>
          <span>Platform Overview</span>
        </div>

        {/* Title */}
        <h2 className="lx-what-title">
          What is <span className="lx-what-brand">LEARNIX<span className="lx-brand-underline" /></span>?
        </h2>

        {/* Short intro */}
        <p className="lx-what-intro">
          Learnix is a collaborative educational platform where students from
          different colleges can share, access, and download study materials
          to improve their academic understanding.
        </p>

        {/* Key points as Apple widget mini rows */}
        <ul className="lx-what-points">
          {KEY_POINTS.map((point) => (
            <AnimatedPoint key={point} text={point} />
          ))}
        </ul>

        {/* Expandable content */}
        <div
          className={`lx-what-extra ${
            expanded ? "lx-expand-open" : "lx-expand-close"
          }`}
        >
          <div className="lx-extra-inner">
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

            <div
              className="lx-what-note"
              onMouseEnter={() => alertIconRef.current?.startAnimation?.()}
              onMouseLeave={() => alertIconRef.current?.stopAnimation?.()}
            >
              <TriangleAlertIcon ref={alertIconRef} size={17} className="lx-note-icon" />
              <div>
                <strong>Important Note:</strong> Do not upload personal or confidential
                documents on the platform.
              </div>
            </div>

            {/* Read further link button */}
            <div className="lx-read-more-wrap">
              <Link
                href="/about"
                className="lx-read-more-btn"
                onMouseEnter={() => readMoreRef.current?.startAnimation?.()}
                onMouseLeave={() => readMoreRef.current?.stopAnimation?.()}
              >
                <span>Read detailed guide</span>
                <ArrowRightIcon ref={readMoreRef} size={16} />
              </Link>
            </div>
          </div>
        </div>

        {/* View more / less button */}
        <div className="lx-view-actions">
          <button
            type="button"
            className="lx-view-btn"
            onClick={handleToggle}
            onMouseEnter={() => toggleRef.current?.startAnimation?.()}
            onMouseLeave={() => toggleRef.current?.stopAnimation?.()}
          >
            <span>{expanded ? "Show less" : "Explore full overview"}</span>
            {expanded ? (
              <ChevronUpIcon ref={toggleRef} size={16} />
            ) : (
              <ChevronDownIcon ref={toggleRef} size={16} />
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
