"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ClipboardIcon,
  ArrowRightIcon,
  FileTextIcon,
} from "@animateicons/react/lucide";
import "./styles/WorkspaceQuestionPapers.css";

const FALLBACK_PAPERS = [
  {
    id: "1_2024-2026_MSE1",
    paperId: "1_2024-2026_MSE1",
    subject: "Computer Organization & Architecture",
    semester: 1,
    semesterLabel: "MCA Semester 1",
    batch: "2024-2026",
    examType: "MSE1",
    totalImages: 6,
  },
  {
    id: "1_2024-2026_MSE1_DSA",
    paperId: "1_2024-2026_MSE1",
    subject: "Data Structures with Algorithms",
    semester: 1,
    semesterLabel: "MCA Semester 1",
    batch: "2024-2026",
    examType: "MSE1",
    totalImages: 6,
  },
  {
    id: "1_2024-2026_MSE1_SET",
    paperId: "1_2024-2026_MSE1",
    subject: "Software Engineering & Testing",
    semester: 1,
    semesterLabel: "MCA Semester 1",
    batch: "2024-2026",
    examType: "MSE1",
    totalImages: 6,
  },
];

function QuestionPaperCard({ paper }) {
  const extRef = useRef(null);
  const targetUrl = `/qp/${paper.paperId || paper.id}`;

  return (
    <div
      className="wqp-paper-card"
      onMouseEnter={() => extRef.current?.startAnimation?.()}
      onMouseLeave={() => extRef.current?.stopAnimation?.()}
    >
      <div className="wqp-card-header">
        <div className="wqp-header-titles">
          <div className="wqp-badges-row">
            <span className="wqp-exam-pill">{paper.examType || "EXAM"}</span>
            <span className="wqp-sem-pill">
              {paper.semesterLabel || `Semester ${paper.semester || 1}`} • {paper.batch || "2024-2026"}
            </span>
          </div>

          <h4 className="wqp-card-title">
            <Link
              href={targetUrl}
              className="wqp-title-link"
              title={`Navigate to ${paper.subject} question paper`}
            >
              {paper.subject || "Question Paper"}
            </Link>
          </h4>
        </div>
      </div>

      <div className="wqp-card-meta">
        <div className="wqp-meta-left">
          <span className="wqp-meta-pill">
            <FileTextIcon size={12} />
            <span>
              {paper.totalImages || paper.imageCount || 1}{" "}
              {(paper.totalImages || paper.imageCount || 1) === 1 ? "Sheet" : "Sheets"}
            </span>
          </span>
        </div>

        <Link
          href={targetUrl}
          className="wqp-card-nav-btn"
          title={`Open ${paper.subject} question paper`}
        >
          <span>Navigate</span>
          <ArrowRightIcon ref={extRef} size={14} />
        </Link>
      </div>
    </div>
  );
}

export default function WorkspaceQuestionPapers() {
  const [papers, setPapers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const clipboardIconRef = useRef(null);
  const topActionRef = useRef(null);
  const footerActionRef = useRef(null);

  const fetchQuestionPapers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/question-papers");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.papers) && data.papers.length > 0) {
          // Flatten into subjects list if subjects array exists
          const extracted = [];
          for (const p of data.papers) {
            if (Array.isArray(p.subjects) && p.subjects.length > 0) {
              for (const s of p.subjects) {
                extracted.push({
                  id: `${p.id}_${s.subject}`,
                  paperId: p.paperId || p.id,
                  subject: s.subject,
                  semester: p.semester,
                  semesterLabel: p.semesterLabel,
                  batch: p.batch,
                  examType: p.examType,
                  totalImages: s.imageCount || p.totalImages || 1,
                });
                if (extracted.length >= 3) break;
              }
            } else {
              extracted.push({
                id: p.id,
                paperId: p.paperId || p.id,
                subject: p.examType ? `${p.batch} ${p.examType}` : "Question Paper",
                semester: p.semester,
                semesterLabel: p.semesterLabel,
                batch: p.batch,
                examType: p.examType,
                totalImages: p.totalImages,
              });
            }
            if (extracted.length >= 3) break;
          }

          if (extracted.length > 0) {
            setPapers(extracted.slice(0, 3));
            return;
          }
        }
      }
      setPapers(FALLBACK_PAPERS);
    } catch (err) {
      console.error("Failed to fetch question papers:", err);
      setPapers(FALLBACK_PAPERS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestionPapers();
  }, [fetchQuestionPapers]);

  return (
    <section className="wqp-section-wrapper" aria-label="Question Papers">
      {/* Main Apple Card Widget */}
      <div className="wqp-widget-card">
        {/* Header Row - strictly 1 row on ALL screen widths */}
        <div className="wqp-widget-header">
          <div className="wqp-header-title-group">
            <div
              className="wqp-icon-badge"
              aria-hidden="true"
              onMouseEnter={() => clipboardIconRef.current?.startAnimation?.()}
              onMouseLeave={() => clipboardIconRef.current?.stopAnimation?.()}
            >
              <ClipboardIcon ref={clipboardIconRef} size={22} />
            </div>
            <div className="wqp-title-text-group">
              <h3 className="wqp-section-title">Question Papers</h3>
            </div>
          </div>

          <div className="wqp-header-actions">
            <Link
              href="/qp"
              className="wqp-top-visit-btn"
              onMouseEnter={() => topActionRef.current?.startAnimation?.()}
              onMouseLeave={() => topActionRef.current?.stopAnimation?.()}
              title="Explore all question papers"
            >
              <span>View All</span>
              <ArrowRightIcon ref={topActionRef} size={15} />
            </Link>
          </div>
        </div>

        {/* Content Body - Latest 3 Subjects */}
        <div className="wqp-widget-body">
          {isLoading ? (
            <div className="wqp-skeleton-stack">
              <div className="wqp-skeleton-card" />
              <div className="wqp-skeleton-card" />
              <div className="wqp-skeleton-card" />
            </div>
          ) : (
            <div className="wqp-cards-list">
              {papers.map((paper) => (
                <QuestionPaperCard key={paper.id} paper={paper} />
              ))}
            </div>
          )}
        </div>

        {/* Footer Navigation Button - strictly 1 row, single button: Explore Question Papers */}
        <div className="wqp-widget-footer">
          <Link
            href="/qp"
            className="wqp-footer-btn wqp-btn-explore"
            onMouseEnter={() => footerActionRef.current?.startAnimation?.()}
            onMouseLeave={() => footerActionRef.current?.stopAnimation?.()}
            title="Browse all previous semester question papers and solutions"
          >
            <span>Explore Question Papers</span>
            <ArrowRightIcon ref={footerActionRef} size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
