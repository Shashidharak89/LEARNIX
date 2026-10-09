"use client";

import { 
  FiBook, 
  FiList,
  FiZap,
  FiTrendingUp,
  FiUser,
  FiCalendar,
  FiChevronRight
} from "react-icons/fi";
import { HiAcademicCap } from "react-icons/hi";
import "./styles/UserDetailsPageSkeleton.css";

export default function UserDetailsPageSkeleton() {
  return (
    <div className="uds-container">
      <div className="uds-wrapper">
        {/* Centered LEARNIX PROFILE Badge Skeleton */}
        <div className="uds-badge-card-container">
          <div className="uds-badge-card-skeleton uds-shimmer" />
        </div>

        {/* Main Profile Card Skeleton with broader height */}
        <div className="uds-main-card">
          <div className="uds-card-accent-blue" />
          <div className="uds-card-accent-yellow">
            <div className="uds-card-dots" />
          </div>
          <div className="uds-card-dots-left" />

          <div className="uds-main-card-body">
            {/* Left Profile Info Skeleton */}
            <div className="uds-profile-left">
              <div className="uds-avatar-wrapper uds-shimmer">
                <FiUser className="uds-avatar-icon" />
              </div>

              <div className="uds-user-details">
                <div className="uds-name-skeleton uds-shimmer" />
                <div className="uds-usn-skeleton uds-shimmer" />

                <div className="uds-quote-container">
                  <p className="uds-quote-text">&ldquo;Every journey begins with a single step.&rdquo;</p>
                </div>

                <div className="uds-meta-list">
                  <div className="uds-meta-pill-skeleton uds-shimmer">
                    <HiAcademicCap className="uds-meta-icon" />
                    <div className="uds-pill-line" />
                  </div>
                  <div className="uds-meta-pill-skeleton uds-shimmer">
                    <FiCalendar className="uds-meta-icon" />
                    <div className="uds-pill-line" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right 4 Stat Cards Grid Skeleton (Uploads removed) */}
            <div className="uds-stats-grid">
              <div className="uds-stat-card is-subjects">
                <div className="uds-stat-icon-wrapper">
                  <FiBook />
                </div>
                <div className="uds-stat-val-skeleton uds-shimmer" />
                <div className="uds-stat-label">Subjects</div>
              </div>

              <div className="uds-stat-card is-topics">
                <div className="uds-stat-icon-wrapper">
                  <FiList />
                </div>
                <div className="uds-stat-val-skeleton uds-shimmer" />
                <div className="uds-stat-label">Topics</div>
              </div>

              <div className="uds-stat-card is-streak">
                <div className="uds-stat-icon-wrapper">
                  <FiZap />
                </div>
                <div className="uds-stat-val-skeleton uds-shimmer" />
                <div className="uds-stat-label">Streak</div>
              </div>

              <div className="uds-stat-card is-highest-streak">
                <div className="uds-stat-icon-wrapper">
                  <FiTrendingUp />
                </div>
                <div className="uds-stat-val-skeleton uds-shimmer" />
                <div className="uds-stat-label">Highest streak</div>
              </div>
            </div>
          </div>
        </div>

        {/* Resources Banner Card Skeleton */}
        <div className="uds-resources-banner-card">
          <div className="uds-banner-center">
            <div className="uds-banner-heading-skeleton uds-shimmer" />
            <div className="uds-banner-subtext-skeleton uds-shimmer" />
            <div className="uds-banner-btn-skeleton uds-shimmer">
              <span style={{ opacity: 0 }}>View Resources</span>
              <FiChevronRight style={{ opacity: 0.5 }} />
            </div>
          </div>
        </div>

        {/* Subjects & Topics List Skeleton */}
        <div className="uds-subjects-section">
          {[1, 2].map((idx) => (
            <div key={idx} className="uds-subject-card">
              <div className="uds-subject-header">
                <div className="uds-subject-title">
                  <FiBook className="uds-subject-icon" />
                  <div className="uds-subj-name-skeleton uds-shimmer" />
                </div>
                <div className="uds-subj-badge-skeleton uds-shimmer" />
              </div>
              <div className="uds-topics-list">
                {[1, 2].map((tIdx) => (
                  <div key={tIdx} className="uds-topic-item">
                    <div className="uds-topic-name-skeleton uds-shimmer" />
                    <div className="uds-topic-meta-skeleton uds-shimmer" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}