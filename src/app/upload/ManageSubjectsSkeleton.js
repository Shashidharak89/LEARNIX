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
          <FiPlus className="mss-section-icon" />
          <h2>Add New Subject</h2>
        </div>
        <div className="mss-input-group">
          <div className="mss-input mss-skeleton"></div>
          <div className="mss-input mss-skeleton mss-input-medium"></div>
          <div className="mss-btn mss-btn-primary mss-skeleton">
            <FiPlus className="mss-btn-icon" />
            <div className="mss-btn-text mss-skeleton"></div>
          </div>
        </div>
      </div>

      {/* Subjects List Skeleton */}
      <div className="mss-section">
        <div className="mss-section-header">
          <FiFolder className="mss-section-icon" />
          <h2>Subjects & Topics</h2>
        </div>

        <div className="mss-subjects-grid">
          {/* Subject Card Skeletons */}
          {[1, 2, 3].map((index) => (
            <div key={index} className="mss-subject-card">
              <div className="mss-subject-header">
                <FiBook className="mss-subject-icon" />
                <div className="mss-subject-title-container">
                  <div className="mss-subject-title mss-skeleton"></div>
                </div>
              </div>

              {/* Add Topic Input Skeleton */}
              <div className="mss-topic-input-section">
                <div className="mss-input-group">
                  <div className="mss-input mss-input-sm mss-skeleton"></div>
                  <div className="mss-input mss-input-sm mss-skeleton mss-input-medium"></div>
                  <div className="mss-btn mss-btn-secondary mss-btn-sm mss-skeleton">
                    <FiPlus className="mss-btn-icon" />
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
                          <FiFileText className="mss-topic-icon" />
                          <div className="mss-topic-name mss-skeleton"></div>
                        </div>
                        <div className="mss-topic-timestamp">
                          <FiCalendar className="mss-timestamp-icon" />
                          <div className="mss-timestamp-text mss-skeleton"></div>
                        </div>
                      </div>

                      {/* Images Section Skeleton */}
                      <div className="mss-images-section">
                        <div className="mss-images-header">
                          <FiImage className="mss-images-icon" />
                          <div className="mss-images-count mss-skeleton"></div>
                        </div>
                        
                        <div className="mss-images-container">
                          <div className="mss-images-grid">
                            {[1, 2, 3, 4].map((imageIndex) => (
                              <div key={imageIndex} className="mss-image-card">
                                <div className="mss-image-wrapper mss-skeleton">
                                  <FiImage className="mss-image-placeholder" />
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="mss-view-more-btn mss-skeleton">
                            <div className="mss-view-more-text mss-skeleton"></div>
                          </div>
                        </div>
                      </div>

                      {/* Upload Section Skeleton */}
                      <div className="mss-upload-section">
                        <div className="mss-capture-options">
                          <div className="mss-capture-toggle mss-btn mss-btn-secondary mss-btn-sm mss-skeleton">
                            <FiCamera className="mss-btn-icon" />
                            <div className="mss-btn-text-sm mss-skeleton"></div>
                          </div>
                          
                          <div className="mss-capture-methods">
                            <div className="mss-btn mss-btn-accent mss-btn-sm mss-skeleton">
                              <FiCamera className="mss-btn-icon" />
                              <div className="mss-btn-text-sm mss-skeleton"></div>
                            </div>
                            
                            <div className="mss-btn mss-btn-accent mss-btn-sm mss-skeleton">
                              <FiFile className="mss-btn-icon" />
                              <div className="mss-btn-text-sm mss-skeleton"></div>
                            </div>

                            <div className="mss-btn mss-btn-accent mss-btn-sm mss-skeleton">
                              <FiFileText className="mss-btn-icon" />
                              <div className="mss-btn-text-sm mss-skeleton"></div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Preview Section Skeleton */}
                        <div className="mss-preview-section">
                          <div className="mss-preview-wrapper mss-skeleton">
                            <FiImage className="mss-preview-placeholder" />
                          </div>
                          
                          <div className="mss-upload-btn mss-btn mss-btn-primary mss-btn-sm mss-skeleton">
                            <FiUpload className="mss-btn-icon" />
                            <div className="mss-btn-text-sm mss-skeleton"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Loading More Topics Skeleton */}
                  <div className="mss-loading-more">
                    <div className="mss-mini-spinner"></div>
                    <span>Loading more topics...</span>
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