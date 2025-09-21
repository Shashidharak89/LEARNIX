"use client";

import { 
  Calendar, 
  BookOpen, 
  ImageIcon, 
  Eye, 
  User, 
  GraduationCap, 
  Clock, 
  ChevronDown, 
  Search 
} from "lucide-react";
import './styles/UserDetailsPageSkeleton.css';

export default function UserDetailsPageSkeleton() {
  return (
    <div className="uds-container">
      <div className="uds-wrapper">
        <div className="uds-profile">
          {/* Profile Header Skeleton */}
          <div className="uds-profile-header">
            <div className="uds-avatar uds-skeleton">
              <User className="uds-avatar-placeholder" size={32} />
            </div>
            <div className="uds-profile-info">
              <div className="uds-name-section">
                <div className="uds-name uds-skeleton"></div>
                <div className="uds-usn uds-skeleton"></div>
              </div>
              <div className="uds-stats">
                <div className="uds-stat-item">
                  <div className="uds-stat-number uds-skeleton"></div>
                  <span className="uds-stat-label">Subjects</span>
                </div>
                <div className="uds-stat-item">
                  <div className="uds-stat-number uds-skeleton"></div>
                  <span className="uds-stat-label">Topics</span>
                </div>
                <div className="uds-stat-item">
                  <div className="uds-stat-number uds-skeleton"></div>
                  <span className="uds-stat-label">Images</span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Meta Skeleton */}
          <div className="uds-profile-meta">
            <div className="uds-meta-item">
              <GraduationCap size={16} />
              <div className="uds-meta-text uds-skeleton"></div>
            </div>
            <div className="uds-meta-item">
              <Calendar size={16} />
              <div className="uds-meta-text uds-skeleton"></div>
            </div>
          </div>

          {/* Search Section Skeleton */}
          <div className="uds-search-section">
            <div className="uds-search-container">
              <Search className="uds-search-icon" size={18} />
              <div className="uds-search-input uds-skeleton"></div>
            </div>
          </div>

          {/* Content Section Skeleton */}
          <div className="uds-content">
            <div className="uds-subjects-grid">
              {/* Subject Card Skeletons */}
              {[1, 2, 3].map((index) => (
                <div key={index} className="uds-subject-card">
                  <div className="uds-subject-header">
                    <div className="uds-subject-title">
                      <BookOpen size={20} />
                      <div className="uds-subject-name uds-skeleton"></div>
                    </div>
                    <div className="uds-subject-badge uds-skeleton"></div>
                  </div>

                  <div className="uds-topics-list">
                    {/* Topic Card Skeletons */}
                    {[1, 2, 3].map((topicIndex) => (
                      <div key={topicIndex} className="uds-topic-card">
                        <div className="uds-topic-header">
                          <div className="uds-topic-info">
                            <div className="uds-topic-title uds-skeleton"></div>
                            <div className="uds-topic-meta">
                              <div className="uds-topic-date">
                                <Clock size={12} />
                                <div className="uds-topic-date-text uds-skeleton"></div>
                              </div>
                              <div className="uds-topic-images-count">
                                <ImageIcon size={12} />
                                <div className="uds-topic-count-text uds-skeleton"></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Topic Content Skeleton */}
                        <div className="uds-topic-content">
                          <div className="uds-content-line uds-skeleton"></div>
                          <div className="uds-content-line uds-skeleton"></div>
                          <div className="uds-content-line uds-skeleton uds-content-line-short"></div>
                        </div>

                        {/* Images Section Skeleton */}
                        <div className="uds-images-section">
                          <div className="uds-images-grid">
                            {[1, 2, 3, 4].map((imageIndex) => (
                              <div key={imageIndex} className="uds-image-container">
                                <div className="uds-image-wrapper uds-skeleton">
                                  <ImageIcon className="uds-image-placeholder" size={24} />
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="uds-view-more-btn uds-skeleton">
                            <Eye size={14} />
                            <div className="uds-btn-text uds-skeleton"></div>
                            <ChevronDown size={14} />
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Loading More Skeleton */}
                    <div className="uds-scroll-sentinel">
                      <div className="uds-loading-more">
                        <div className="uds-mini-spinner"></div>
                        <span>Loading more topics...</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}