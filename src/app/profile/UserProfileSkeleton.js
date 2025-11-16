"use client";

import { useState, useEffect } from "react";
import { 
  FiBook, 
  FiImage, 
  FiClock, 
  FiUpload,
  FiGrid,
  FiCalendar,
  FiUser,
  FiSearch,
  FiSettings
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
      }
    } catch (error) {
      console.error('Error fetching quote:', error);
      setQuote("Loading your experience...");
    } finally {
      setIsLoadingQuote(false);
    }
  };

  return (
    <div className="ups-container">
      <div className="ups-wrapper">
        <div className="ups-card">
          {/* Settings Button Skeleton */}
          <div className="ups-settings-btn">
            <FiSettings className="ups-shimmer" />
          </div>

          {/* Header Skeleton */}
          <div className="ups-header">
            <div className="ups-avatar-container">
              <div className="ups-avatar-skeleton ups-shimmer">
                <FiUser className="ups-avatar-icon" />
              </div>
            </div>
            <div className="ups-user-info">
              <div className="ups-name-section">
                <div className="ups-user-name-skeleton ups-shimmer"></div>
                <div className="ups-user-usn-skeleton ups-shimmer"></div>
              </div>
              <div className="ups-stats">
                <div className="ups-stat">
                  <div className="ups-stat-number-skeleton ups-shimmer"></div>
                  <span className="ups-stat-label">Subjects</span>
                </div>
                <div className="ups-stat">
                  <div className="ups-stat-number-skeleton ups-shimmer"></div>
                  <span className="ups-stat-label">Topics</span>
                </div>
                <div className="ups-stat">
                  <div className="ups-stat-number-skeleton ups-shimmer"></div>
                  <span className="ups-stat-label">Uploads</span>
                </div>
              </div>
            </div>
          </div>

          {/* Meta Skeleton */}
          <div className="ups-meta">
            <div className="ups-meta-item">
              <HiAcademicCap className="ups-meta-icon" />
              <div className="ups-meta-text-skeleton ups-shimmer"></div>
            </div>
            <div className="ups-meta-item">
              <FiCalendar className="ups-meta-icon" />
              <div className="ups-meta-text-skeleton ups-shimmer"></div>
            </div>
          </div>

          {/* Search Skeleton */}
          <div className="ups-search">
            <FiSearch className="ups-search-icon" />
            <div className="ups-search-skeleton ups-shimmer"></div>
          </div>

          {/* Quote Section */}
          <div className="ups-quote-section">
            {isLoadingQuote ? (
              <div className="ups-quote-skeleton ups-shimmer"></div>
            ) : (
              <p className="ups-quote">{quote}</p>
            )}
          </div>

          {/* Content Skeleton */}
          <div className="ups-content">
            <div className="ups-subjects">
              {/* Subject Card 1 */}
              <div className="ups-subject-card">
                <div className="ups-subject-header">
                  <div className="ups-subject-title">
                    <FiBook className="ups-subject-icon" />
                    <div className="ups-subject-name-skeleton ups-shimmer"></div>
                  </div>
                  <div className="ups-subject-badge-skeleton ups-shimmer"></div>
                </div>
                <div className="ups-topics">
                  {/* Topic 1 */}
                  <div className="ups-topic-card">
                    <div className="ups-topic-header">
                      <div className="ups-topic-info">
                        <div className="ups-topic-title-skeleton ups-shimmer"></div>
                        <div className="ups-topic-meta">
                          <div className="ups-topic-date">
                            <FiClock className="ups-meta-icon" />
                            <div className="ups-topic-date-skeleton ups-shimmer"></div>
                          </div>
                          <div className="ups-topic-uploads">
                            <FiUpload className="ups-meta-icon" />
                            <div className="ups-topic-uploads-skeleton ups-shimmer"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="ups-uploads">
                      <div className="ups-view-uploads-skeleton ups-shimmer">
                        <FiGrid />
                      </div>
                    </div>
                  </div>
                  
                  {/* Topic 2 */}
                  <div className="ups-topic-card">
                    <div className="ups-topic-header">
                      <div className="ups-topic-info">
                        <div className="ups-topic-title-skeleton ups-shimmer"></div>
                        <div className="ups-topic-meta">
                          <div className="ups-topic-date">
                            <FiClock className="ups-meta-icon" />
                            <div className="ups-topic-date-skeleton ups-shimmer"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subject Card 2 */}
              <div className="ups-subject-card">
                <div className="ups-subject-header">
                  <div className="ups-subject-title">
                    <FiBook className="ups-subject-icon" />
                    <div className="ups-subject-name-skeleton ups-shimmer"></div>
                  </div>
                  <div className="ups-subject-badge-skeleton ups-shimmer"></div>
                </div>
                <div className="ups-topics">
                  <div className="ups-topic-card">
                    <div className="ups-topic-header">
                      <div className="ups-topic-info">
                        <div className="ups-topic-title-skeleton ups-shimmer"></div>
                        <div className="ups-topic-meta">
                          <div className="ups-topic-date">
                            <FiClock className="ups-meta-icon" />
                            <div className="ups-topic-date-skeleton ups-shimmer"></div>
                          </div>
                          <div className="ups-topic-uploads">
                            <FiUpload className="ups-meta-icon" />
                            <div className="ups-topic-uploads-skeleton ups-shimmer"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="ups-uploads">
                      <div className="ups-view-uploads-skeleton ups-shimmer">
                        <FiGrid />
                      </div>
                      <div className="ups-uploads-grid">
                        {[1, 2, 3, 4].map((index) => (
                          <div key={index} className="ups-upload-item">
                            <div className="ups-upload-wrapper">
                              <div className="ups-upload-skeleton ups-shimmer">
                                <FiImage className="ups-upload-icon" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subject Card 3 */}
              <div className="ups-subject-card">
                <div className="ups-subject-header">
                  <div className="ups-subject-title">
                    <FiBook className="ups-subject-icon" />
                    <div className="ups-subject-name-skeleton ups-shimmer"></div>
                  </div>
                  <div className="ups-subject-badge-skeleton ups-shimmer"></div>
                </div>
                <div className="ups-topics">
                  <div className="ups-topic-card">
                    <div className="ups-topic-header">
                      <div className="ups-topic-info">
                        <div className="ups-topic-title-skeleton ups-shimmer"></div>
                        <div className="ups-topic-meta">
                          <div className="ups-topic-date">
                            <FiClock className="ups-meta-icon" />
                            <div className="ups-topic-date-skeleton ups-shimmer"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}