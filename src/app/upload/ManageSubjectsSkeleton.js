"use client";

import "./styles/ManageSubjectsSkeleton.css";
import "./styles/ManageSubSkel.css"

/* ── Reusable shimmer block ── */
function Bone({ className = "" }) {
  return <span className={`msk-bone ${className}`} aria-hidden="true" />;
}

/* ── One subject card skeleton ── */
function SubjectCardSkeleton({ topicCount = 3, delay = 0 }) {
  return (
    <div
      className="msk-card"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Card header row */}
      <div className="msk-card-header">
        <div className="msk-card-title-group">
          <Bone className="msk-bone--icon" />
          <Bone className="msk-bone--subject-name" />
        </div>
        <Bone className="msk-bone--kebab" />
      </div>

      {/* Topic pills */}
      <div className="msk-topics">
        {Array.from({ length: topicCount }).map((_, i) => (
          <Bone
            key={i}
            className="msk-bone--topic"
            style={{ width: `${60 + (i * 17) % 55}px` }}
          />
        ))}
        {/* "Add topic" ghost pill */}
        <Bone className="msk-bone--add-pill" />
      </div>

      {/* Card footer */}
      <div className="msk-card-footer">
        <Bone className="msk-bone--badge" />
        <Bone className="msk-bone--date" />
      </div>
    </div>
  );
}

/* ── Main Skeleton ── */
export default function ManageSubjectsSkeleton() {
  const cardConfigs = [
    { topics: 3, delay: 0 },
    { topics: 5, delay: 60 },
    { topics: 2, delay: 120 },
    { topics: 4, delay: 180 },
    { topics: 3, delay: 240 },
    { topics: 6, delay: 300 },
  ];

  return (
    <div className="msk-wrapper" aria-busy="true" aria-label="Loading subjects">

      {/* ── Page Header skeleton ── */}
      <header className="msk-page-header">
        {/* Yellow accent bar */}
        <div className="msk-header-accent" />

        <div className="msk-header-content">
          {/* "Workspace" label */}
          <Bone className="msk-bone--eyebrow" />
          {/* "Manage Subjects" title */}
          <Bone className="msk-bone--page-title" />
        </div>

        <div className="msk-header-right">
          {/* Subject count stat */}
          <div className="msk-header-stat">
            <Bone className="msk-bone--stat-num" />
            <Bone className="msk-bone--stat-label" />
          </div>

          {/* "New Subject" button ghost */}
          <Bone className="msk-bone--toggle-btn" />
        </div>
      </header>

      {/* ── Panel skeleton ── */}
      <main className="msk-main">
        <section className="msk-panel">

          {/* Panel header */}
          <div className="msk-panel-header">
            <Bone className="msk-bone--panel-icon" />
            <Bone className="msk-bone--panel-title" />
          </div>

          {/* Cards grid */}
          <div className="msk-panel-body">
            <div className="msk-grid">
              {cardConfigs.map((cfg, i) => (
                <SubjectCardSkeleton
                  key={i}
                  topicCount={cfg.topics}
                  delay={cfg.delay}
                />
              ))}
            </div>
          </div>

        </section>
      </main>
    </div>
  );
}