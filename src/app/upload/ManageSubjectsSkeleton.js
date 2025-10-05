"use client";

import { 
  FiPlus, 
  FiBook, 
  FiFileText, 
  FiUpload, 
  FiImage,
  FiCalendar,
  FiFolder,
  FiCamera,
  FiFile
} from "react-icons/fi";
import './styles/ManageSubjectsSkeleton.css';

export default function ManageSubjectsSkeleton() {
  return (
    <div className="mss-container">
      {/* Add Subject Section Skeleton */}
      <div className="mss-section">
        <div className="mss-section-header">
          <div className="mss-section-icon mss-skeleton mss-skeleton-circle"></div>
          <div className="mss-section-title mss-skeleton"></div>
        </div>
        <div className="mss-input-group">
          <div className="mss-input mss-skeleton"></div>
          <div className="mss-input mss-skeleton mss-input-medium"></div>
          <div className="mss-btn mss-btn-primary mss-skeleton mss-skeleton-button">
            <div className="mss-btn-icon mss-skeleton mss-skeleton-circle"></div>
            <div className="mss-btn-text mss-skeleton"></div>
          </div>
        </div>
      </div>

      {/* Subjects List Skeleton */}
      <div className="mss-section">
        <div className="mss-section-header">
          <div className="mss-section-icon mss-skeleton mss-skeleton-circle"></div>
          <div className="mss-section-title mss-skeleton"></div>
        </div>

        <div className="mss-subjects-grid">
          {/* Subject Card Skeletons */}
          {[1, 2, 3].map((index) => (
            <div key={index} className="mss-subject-card">
              <div className="mss-subject-header">
                <div className="mss-subject-icon mss-skeleton mss-skeleton-circle"></div>
                <div className="mss-subject-title-container">
                  <div className="mss-subject-title mss-skeleton mss-skeleton-text"></div>
                </div>
              </div>

              {/* Add Topic Input Skeleton */}
              <div className="mss-topic-input-section">
                <div className="mss-input-group">
                  <div className="mss-input mss-input-sm mss-skeleton"></div>
                  <div className="mss-input mss-input-sm mss-skeleton mss-input-medium"></div>
                  <div className="mss-btn mss-btn-secondary mss-btn-sm mss-skeleton mss-skeleton-button">
                    <div className="mss-btn-icon mss-skeleton mss-skeleton-circle"></div>
                    <div className="mss-btn-text-sm mss-skeleton"></div>
                  </div>
                </div>
              </div>

              {/* Topics List Skeleton */}
              <div className="mss-topics-container">
                <div className="mss-topics-list">
                  {[1, 2].map((topicIndex) => (
                    <div key={topicIndex} className="mss-topic-card">
                      <div className="mss-topic-header">
                        <div className="mss-topic-title">
                          <div className="mss-topic-icon mss-skeleton mss-skeleton-circle"></div>
                          <div className="mss-topic-name mss-skeleton mss-skeleton-text"></div>
                        </div>
                        <div className="mss-topic-timestamp">
                          <div className="mss-timestamp-icon mss-skeleton mss-skeleton-circle"></div>
                          <div className="mss-timestamp-text mss-skeleton mss-skeleton-text"></div>
                        </div>
                      </div>

                      {/* Images Section Skeleton */}
                      <div className="mss-images-section">
                        <div className="mss-images-header">
                          <div className="mss-images-icon mss-skeleton mss-skeleton-circle"></div>
                          <div className="mss-images-count mss-skeleton mss-skeleton-text"></div>
                        </div>
                        
                        <div className="mss-images-container">
                          <div className="mss-images-grid">
                            {[1, 2, 3, 4].map((imageIndex) => (
                              <div key={imageIndex} className="mss-image-card">
                                <div className="mss-image-wrapper mss-skeleton"></div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="mss-view-more-btn mss-skeleton mss-skeleton-button">
                            <div className="mss-view-more-text mss-skeleton mss-skeleton-text"></div>
                          </div>
                        </div>
                      </div>

                      {/* Upload Section Skeleton */}
                      <div className="mss-upload-section">
                        <div className="mss-capture-options">
                          <div className="mss-capture-toggle mss-btn mss-btn-secondary mss-btn-sm mss-skeleton mss-skeleton-button">
                            <div className="mss-btn-icon mss-skeleton mss-skeleton-circle"></div>
                            <div className="mss-btn-text-sm mss-skeleton mss-skeleton-text"></div>
                          </div>
                          
                          <div className="mss-capture-methods">
                            <div className="mss-btn mss-btn-accent mss-btn-sm mss-skeleton mss-skeleton-button">
                              <div className="mss-btn-icon mss-skeleton mss-skeleton-circle"></div>
                              <div className="mss-btn-text-sm mss-skeleton mss-skeleton-text"></div>
                            </div>
                            
                            <div className="mss-btn mss-btn-accent mss-btn-sm mss-skeleton mss-skeleton-button">
                              <div className="mss-btn-icon mss-skeleton mss-skeleton-circle"></div>
                              <div className="mss-btn-text-sm mss-skeleton mss-skeleton-text"></div>
                            </div>

                            <div className="mss-btn mss-btn-accent mss-btn-sm mss-skeleton mss-skeleton-button">
                              <div className="mss-btn-icon mss-skeleton mss-skeleton-circle"></div>
                              <div className="mss-btn-text-sm mss-skeleton mss-skeleton-text"></div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Preview Section Skeleton */}
                        <div className="mss-preview-section">
                          <div className="mss-preview-wrapper mss-skeleton"></div>
                          
                          <div className="mss-upload-btn mss-btn mss-btn-primary mss-btn-sm mss-skeleton mss-skeleton-button">
                            <div className="mss-btn-icon mss-skeleton mss-skeleton-circle"></div>
                            <div className="mss-btn-text-sm mss-skeleton mss-skeleton-text"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Loading More Topics Skeleton */}
                  <div className="mss-loading-more">
                    <div className="mss-mini-spinner mss-skeleton mss-skeleton-circle"></div>
                    <div className="mss-loading-text mss-skeleton mss-skeleton-text"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}