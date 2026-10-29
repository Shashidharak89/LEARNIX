"use client";

import { useTheme } from "@/context/ThemeContext";
import "./styles/ManageSubSkel.css";

/* ── Base Bone Element ── */
function Bone({ className = "", style = {} }) {
  return <span className={`msk-bone ${className}`} style={style} aria-hidden="true" />;
}

/* ── Subject Card Skeleton ── */
function SubjectCardSkeleton({ titleWidth = "180px" }) {
  return (
    <div className="msk-card">
      <div className="msk-card-header">
        <div className="msk-card-left">
          <Bone className="msk-bone--chevron" />
          <Bone className="msk-bone--book-icon" />
          <Bone className="msk-bone--title" style={{ width: titleWidth }} />
        </div>
        <div className="msk-card-right">
          <Bone className="msk-bone--pill" />
          <Bone className="msk-bone--circle" />
          <Bone className="msk-bone--circle" />
        </div>
      </div>
    </div>
  );
}

/* ── Redesigned Apple-Themed Page Skeleton ── */
export default function ManageSubjectsSkeleton() {
  const { theme } = useTheme();

  return (
    <div
      className={`ms-wrapper msk-wrapper ${theme || "light"}`}
      aria-busy="true"
      aria-label="Loading workspace"
    >
      {/* ── Page Header Apple Widget Skeleton ── */}
      <header className="msk-page-header">
        <div className="msk-header-row">
          <div className="msk-header-left">
            <Bone className="msk-bone--header-icon msk-header-icon-badge" />
            <div className="msk-header-text">
              <Bone className="msk-bone--tag" />
              <Bone className="msk-bone--page-title" />
              <Bone className="msk-bone--subtitle" />
            </div>
          </div>
          <div className="msk-header-right">
            <Bone className="msk-bone--btn" />
          </div>
        </div>

        {/* Search bar inside Header Skeleton */}
        <div className="msk-search-wrap">
          <Bone className="msk-bone--search-icon" />
          <Bone className="msk-bone--search-input" />
        </div>
      </header>

      {/* ── Main Content Skeleton ── */}
      <main className="msk-main">
        <div className="msk-section-header">
          <div className="msk-section-left">
            <Bone className="msk-bone--section-icon" />
            <Bone className="msk-bone--section-title" />
          </div>
          <Bone className="msk-bone--count-pill" />
        </div>

        {/* ── Subject Cards Stack Skeleton (Clean Gray/White Shimmer) ── */}
        <div className="msk-grid">
          <SubjectCardSkeleton titleWidth="220px" />
          <SubjectCardSkeleton titleWidth="175px" />
          <SubjectCardSkeleton titleWidth="245px" />
          <SubjectCardSkeleton titleWidth="190px" />
          <SubjectCardSkeleton titleWidth="215px" />
        </div>
      </main>
    </div>
  );
}