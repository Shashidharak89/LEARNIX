"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  BookOpenIcon,
  ArrowRightIcon,
  EyeIcon,
  DownloadIcon,
  FileTextIcon,
  ChevronDownIcon,
} from "@animateicons/react/lucide";
import "./styles/WorkspaceStudyMaterials.css";

const LATEST_STUDY_MATERIALS = [
  {
    id: "sm-dcn",
    subject: "Data Communication & Networking",
    semester: "MCA Semester 1",
    totalFiles: 15,
    fileName: "Unit 1 DCN Question Bank & Notes.pdf",
    fileUrl:
      "https://raw.githubusercontent.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-And-Computer-Communication/Unit1/1.%20UNIT%201%20DCN%20QUESTION%20BANK.pdf",
    badge: "15 Documents",
  },
  {
    id: "sm-maths",
    subject: "Mathematics for Computing",
    semester: "MCA Semester 1",
    totalFiles: 4,
    fileName: "Mathematics Comprehensive Textbook.pdf",
    fileUrl:
      "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Mathematics/MATHS-TEXT-BOOK.pdf",
    badge: "Curated Textbook",
  },
  {
    id: "sm-dwdm",
    subject: "Data Warehousing & Data Mining",
    semester: "MCA Semester 2",
    totalFiles: 29,
    fileName: "DWDM Complete Syllabus & Unit Modules.pdf",
    fileUrl:
      "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/2nd-Sem-2025-26/Data-Warehousing-and-Data-Mining/25MCA204_DWDM_Syllabus.pdf",
    badge: "29 Modules",
  },
];

function StudyMaterialSubjectCard({ item }) {
  const eyeRef = useRef(null);
  const downloadRef = useRef(null);

  const googleViewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
    item.fileUrl
  )}`;

  return (
    <div
      className="wsm-subject-card"
      onMouseEnter={() => {
        eyeRef.current?.startAnimation?.();
        downloadRef.current?.startAnimation?.();
      }}
      onMouseLeave={() => {
        eyeRef.current?.stopAnimation?.();
        downloadRef.current?.stopAnimation?.();
      }}
    >
      <div className="wsm-card-header">
        <div className="wsm-header-titles">
          <div className="wsm-badges-row">
            <span className="wsm-sem-pill">{item.semester}</span>
            <span className="wsm-count-pill">
              <FileTextIcon size={12} />
              <span>{item.badge}</span>
            </span>
          </div>

          <h4 className="wsm-card-title">
            <Link
              href="/materials"
              className="wsm-title-link"
              title={`View ${item.subject} study materials`}
            >
              {item.subject}
            </Link>
          </h4>
        </div>
      </div>

      <div className="wsm-file-preview-row">
        <span className="wsm-file-label" title={item.fileName}>
          <FileTextIcon size={13} />
          <span>{item.fileName}</span>
        </span>
      </div>

      <div className="wsm-card-actions">
        <a
          href={googleViewerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="wsm-btn wsm-btn-view"
          title={`View ${item.fileName} in Google Viewer`}
          aria-label={`View ${item.fileName} in Google Viewer`}
        >
          <EyeIcon ref={eyeRef} size={14} />
          <span>View</span>
        </a>

        <a
          href={item.fileUrl}
          download={item.fileName}
          target="_blank"
          rel="noopener noreferrer"
          className="wsm-btn wsm-btn-download"
          title={`Download ${item.fileName}`}
          aria-label={`Download ${item.fileName}`}
        >
          <DownloadIcon ref={downloadRef} size={14} />
          <span>Download</span>
        </a>
      </div>
    </div>
  );
}

export default function WorkspaceStudyMaterials() {
  const [isExpanded, setIsExpanded] = useState(false);

  const bookIconRef = useRef(null);
  const topActionRef = useRef(null);

  const toggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <section className="wsm-section-wrapper" aria-label="Study Materials">
      {/* Main Apple Card Widget */}
      <div className="wsm-widget-card">
        {/* Header Row - strictly 1 row on ALL screen widths */}
        <div className="wsm-widget-header">
          <div
            className="wsm-header-title-group"
            onClick={toggleExpand}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleExpand();
              }
            }}
          >
            <div
              className="wsm-icon-badge"
              aria-hidden="true"
              onMouseEnter={() => bookIconRef.current?.startAnimation?.()}
              onMouseLeave={() => bookIconRef.current?.stopAnimation?.()}
            >
              <BookOpenIcon ref={bookIconRef} size={22} />
            </div>
            <div className="wsm-title-text-group">
              <h3 className="wsm-section-title">Study Materials</h3>
              <span className="wsm-section-subtitle">Semester modules, syllabus & study notes</span>
            </div>
            <span
              className={`wsm-chevron-toggle ${isExpanded ? "is-expanded" : ""}`}
              aria-hidden="true"
            >
              <ChevronDownIcon size={16} />
            </span>
          </div>

          <div className="wsm-header-actions">
            <Link
              href="/materials"
              className="wsm-top-visit-btn"
              onMouseEnter={() => topActionRef.current?.startAnimation?.()}
              onMouseLeave={() => topActionRef.current?.stopAnimation?.()}
              title="Explore all study materials"
            >
              <span>Explore</span>
              <ArrowRightIcon ref={topActionRef} size={15} />
            </Link>
          </div>
        </div>

        {/* Content Body - Latest 3 Subjects */}
        {isExpanded && (
          <div className="wsm-widget-body">
            <div className="wsm-cards-list">
              {LATEST_STUDY_MATERIALS.map((item) => (
                <StudyMaterialSubjectCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
