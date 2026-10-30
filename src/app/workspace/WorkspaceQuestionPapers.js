"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ClipboardIcon,
  ArrowRightIcon,
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
  return (
    <div className="wqp-paper-card">
      <div className="wqp-card-header">
        <div className="wqp-header-titles">
          <div className="wqp-badges-row">
            <span className="wqp-exam-pill">{paper.examType || "EXAM"}</span>
            <span className="wqp-sem-pill">
              {paper.semesterLabel || `Semester ${paper.semester || 1}`} • {paper.batch || "2024-2026"}
            </span>
          </div>

          <h4 className="wqp-card-title">
            <span className="wqp-title-text">
              {paper.subject || "Question Paper"}
            </span>
          </h4>
        </div>
      </div>
    </div>
  );
}

export default function WorkspaceQuestionPapers() {
  const [papers, setPapers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const clipboardIconRef = useRef(null);
  const topActionRef = useRef(null);

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

  const toggleExpand = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      if (next && !hasFetched) {
        fetchQuestionPapers();
        setHasFetched(true);
      }
      return next;
    });
  };

  return (
    <section className="wqp-section-wrapper" aria-label="Question Papers">
      {/* Main Apple Card Widget */}
      <div className="wqp-widget-card">
        {/* Header Row - strictly 1 row on ALL screen widths */}
        <div className="wqp-widget-header">
          <div
            className="wqp-header-title-group"
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
              className="wqp-icon-badge"
              aria-hidden="true"
              onMouseEnter={() => clipboardIconRef.current?.startAnimation?.()}
              onMouseLeave={() => clipboardIconRef.current?.stopAnimation?.()}
            >
              <ClipboardIcon ref={clipboardIconRef} size={22} />
            </div>
            <div className="wqp-title-text-group">
              <h3 className="wqp-section-title">Question Papers</h3>
              <span className="wqp-section-subtitle">Previous semester exam papers & reference solutions</span>
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
        {isExpanded && (
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
        )}
      </div>
    </section>
  );
}
