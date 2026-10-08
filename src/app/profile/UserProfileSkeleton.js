"use client";

import { useState, useEffect } from "react";
import { 
  FiBook, 
  FiList,
  FiZap,
  FiTrendingUp,
  FiUser,
  FiSettings,
  FiCalendar,
  FiChevronRight
} from "react-icons/fi";
import { HiAcademicCap } from "react-icons/hi";
import './styles/UserProfileSkeleton.css';

export default function UserProfileSkeleton() {
  const [quote, setQuote] = useState("");
  const [isLoadingQuote, setIsLoadingQuote] = useState(true);

  useEffect(() => {
    fetchQuote();
  }, []);

  const fetchQuote = async () => {
    try {
      setIsLoadingQuote(true);
      const response = await fetch('https://zenquotes.io/api/random');
      const data = await response.json();
      if (data && data[0] && data[0].q) {
        setQuote(data[0].q);
      } else {
        setQuote("Loading your personalized learning experience...");
      }
    } catch {
      setQuote("Loading your personalized learning experience...");
    } finally {
      setIsLoadingQuote(false);
    }
  };

  return (
    <div className="ups-container">
      <div className="ups-wrapper">
        {/* Page Title Skeleton (Breadcrumb removed) */}
        <div className="ups-page-header">
          <div className="ups-page-title-skeleton ups-shimmer" />
        </div>

        {/* Main Profile Card Skeleton with broader height */}
        <div className="ups-main-card">
          <div className="ups-card-accent-blue" />
          <div className="ups-card-accent-yellow">
            <div className="ups-card-dots" />
          </div>
          <div className="ups-card-dots-left" />

          {/* Settings Gear Button Skeleton */}
          <div className="ups-settings-gear-btn">
            <FiSettings className="ups-spin-icon" />
          </div>

          <div className="ups-main-card-body">
            {/* Left Profile Info Skeleton */}
            <div className="ups-profile-left">
              <div className="ups-avatar-wrapper ups-shimmer">
                <FiUser className="ups-avatar-icon" />
              </div>

              <div className="ups-user-details">
                <div className="ups-name-skeleton ups-shimmer" />
                <div className="ups-usn-skeleton ups-shimmer" />

                <div className="ups-quote-container">
                  {isLoadingQuote ? (
                    <div className="ups-quote-skeleton ups-shimmer" />
                  ) : (
                    <p className="ups-quote-text">{quote}</p>
                  )}
                </div>

                <div className="ups-meta-list">
                  <div className="ups-meta-pill-skeleton ups-shimmer">
                    <HiAcademicCap className="ups-meta-icon" />
                    <div className="ups-pill-line" />
                  </div>
                  <div className="ups-meta-pill-skeleton ups-shimmer">
                    <FiCalendar className="ups-meta-icon" />
                    <div className="ups-pill-line" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right 4 Stat Cards Grid Skeleton (Uploads removed) */}
            <div className="ups-stats-grid">
              <div className="ups-stat-card is-subjects">
                <div className="ups-stat-icon-wrapper">
                  <FiBook />
                </div>
                <div className="ups-stat-val-skeleton ups-shimmer" />
                <div className="ups-stat-label">Subjects</div>
              </div>

              <div className="ups-stat-card is-topics">
                <div className="ups-stat-icon-wrapper">
                  <FiList />
                </div>
                <div className="ups-stat-val-skeleton ups-shimmer" />
                <div className="ups-stat-label">Topics</div>
              </div>

              <div className="ups-stat-card is-streak">
                <div className="ups-stat-icon-wrapper">
                  <FiZap />
                </div>
                <div className="ups-stat-val-skeleton ups-shimmer" />
                <div className="ups-stat-label">Streak</div>
              </div>

              <div className="ups-stat-card is-highest-streak">
                <div className="ups-stat-icon-wrapper">
                  <FiTrendingUp />
                </div>
                <div className="ups-stat-val-skeleton ups-shimmer" />
                <div className="ups-stat-label">Highest streak</div>
              </div>
            </div>
          </div>
        </div>

        {/* Resources Banner Card Skeleton */}
        <div className="ups-resources-banner-card">
          <div className="ups-banner-center">
            <div className="ups-banner-heading-skeleton ups-shimmer" />
            <div className="ups-banner-subtext-skeleton ups-shimmer" />
            <div className="ups-banner-btn-skeleton ups-shimmer">
              <span style={{ opacity: 0 }}>View Resources</span>
              <FiChevronRight style={{ opacity: 0.5 }} />
            </div>
          </div>
        </div>

        {/* Subjects & Topics List Skeleton */}
        <div className="ups-subjects-section">
          {[1, 2].map((idx) => (
            <div key={idx} className="ups-subject-card">
              <div className="ups-subject-header">
                <div className="ups-subject-title">
                  <FiBook className="ups-subject-icon" />
                  <div className="ups-subj-name-skeleton ups-shimmer" />
                </div>
                <div className="ups-subj-badge-skeleton ups-shimmer" />
              </div>
              <div className="ups-topics-list">
                {[1, 2].map((tIdx) => (
                  <div key={tIdx} className="ups-topic-item">
                    <div className="ups-topic-name-skeleton ups-shimmer" />
                    <div className="ups-topic-meta-skeleton ups-shimmer" />
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