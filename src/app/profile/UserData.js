"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { 
  FiCalendar, 
  FiBook, 
  FiImage, 
  FiEye, 
  FiEyeOff, 
  FiUser, 
  FiClock, 
  FiChevronDown, 
  FiSearch, 
  FiSettings,
  FiUpload,
  FiGrid
} from "react-icons/fi";
import { HiAcademicCap } from "react-icons/hi";
import './styles/UserData.css';
import ChangeName from './ChangeName';
import ChangePassword from './ChangePassword';

export default function UserData() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [expandedUploads, setExpandedUploads] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [visibleTopics, setVisibleTopics] = useState({});
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loadedImages, setLoadedImages] = useState(new Set());
  
  const TOPICS_PER_LOAD = 5;

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (user) {
      handleSearch(searchQuery);
    }
  }, [user, searchQuery]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !isLoadingMore) {
          const subjectIndex = parseInt(entry.target.dataset.subjectIndex);
          loadMoreTopics(subjectIndex);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.1,
      rootMargin: '100px'
    });

    const sentinels = document.querySelectorAll('.profile-scroll-trigger');
    sentinels.forEach((sentinel) => observer.observe(sentinel));

    return () => observer.disconnect();
  }, [filteredSubjects, visibleTopics, isLoadingMore]);

  // Image lazy loading observer
  useEffect(() => {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const imageKey = img.dataset.imageKey;
          if (imageKey && !loadedImages.has(imageKey)) {
            setLoadedImages(prev => new Set([...prev, imageKey]));
            imageObserver.unobserve(img);
          }
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '50px'
    });

    const imageContainers = document.querySelectorAll('.profile-image-lazy');
    imageContainers.forEach(container => imageObserver.observe(container));

    return () => imageObserver.disconnect();
  }, [expandedUploads, loadedImages]);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const usn = localStorage.getItem("usn");
      if (!usn) {
        setMessage("Please login to view your profile.");
        setLoading(false);
        return;
      }

      const res = await axios.get(`/api/work/get?usn=${usn}`);
      setUser(res.data);
      setMessage("");
      
      const initialVisible = {};
      if (res.data.subjects) {
        res.data.subjects.forEach((subject, index) => {
          initialVisible[index] = Math.min(TOPICS_PER_LOAD, subject.topics?.length || 0);
        });
      }
      setVisibleTopics(initialVisible);
      
    } catch (err) {
      console.error(err);
      if (err.response?.status === 404) {
        setMessage("Profile not found!");
      } else {
        setMessage(err.response?.data?.error || "Failed to fetch profile data");
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreTopics = useCallback((subjectIndex) => {
    if (isLoadingMore) return;
    
    const subject = filteredSubjects[subjectIndex];
    if (!subject || !subject.topics) return;
    
    const currentVisible = visibleTopics[subjectIndex] || 0;
    const totalTopics = subject.topics.length;
    
    if (currentVisible >= totalTopics) return;
    
    setIsLoadingMore(true);
    
    setTimeout(() => {
      setVisibleTopics(prev => ({
        ...prev,
        [subjectIndex]: Math.min(currentVisible + TOPICS_PER_LOAD, totalTopics)
      }));
      setIsLoadingMore(false);
    }, 300);
  }, [filteredSubjects, visibleTopics, isLoadingMore]);

  const handleSearch = (query) => {
    if (!user || !user.subjects) return;
    
    if (!query.trim()) {
      setFilteredSubjects(user.subjects);
      return;
    }

    const searchTerm = query.toLowerCase();
    const filtered = user.subjects.map(subject => {
      const filteredTopics = subject.topics?.filter(topic => 
        subject.subject.toLowerCase().includes(searchTerm) ||
        topic.topic.toLowerCase().includes(searchTerm)
      ) || [];
      
      return {
        ...subject,
        topics: filteredTopics
      };
    }).filter(subject => 
      subject.subject.toLowerCase().includes(searchTerm) || 
      subject.topics.length > 0
    );
    
    setFilteredSubjects(filtered);
    
    const newVisible = {};
    filtered.forEach((subject, index) => {
      newVisible[index] = Math.min(TOPICS_PER_LOAD, subject.topics?.length || 0);
    });
    setVisibleTopics(newVisible);
  };

  const toggleUploadsView = (subjectIndex, topicIndex) => {
    const key = `${subjectIndex}-${topicIndex}`;
    setExpandedUploads(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getTotalTopics = () => {
    if (!user || !user.subjects) return 0;
    return user.subjects.reduce((total, subject) => total + (subject.topics?.length || 0), 0);
  };

  const getTotalImages = () => {
    if (!user || !user.subjects) return 0;
    return user.subjects.reduce((total, subject) => {
      return total + (subject.topics?.reduce((topicTotal, topic) => {
        return topicTotal + (topic.images?.filter(img => img && img.trim() !== '').length || 0);
      }, 0) || 0);
    }, 0);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getValidImages = (images) => {
    return images ? images.filter(img => img && img.trim() !== '') : [];
  };

  if (loading) {
    return (
      <div className="profile-main-container">
        <div className="profile-loading-state">
          <div className="profile-loading-spinner"></div>
          <p className="profile-loading-text">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-main-container">
      <div className="profile-content-wrapper">

        {message && (
          <div className="profile-error-display">
            <div className="profile-error-content">
              <FiUser className="profile-error-icon" />
              <h3 className="profile-error-title">Profile Access Issue</h3>
              <p className="profile-error-message">{message}</p>
            </div>
          </div>
        )}

        {user && (
          <div className="profile-main-card">
            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="profile-settings-btn"
            >
              <FiSettings />
            </button>

            {/* Settings Panel */}
            {showSettings && (
              <div className="profile-settings-panel">
                <h2 className="profile-settings-title">Account Settings</h2>
                <div className="profile-settings-content">
                  <ChangeName usn={localStorage.getItem("usn")} />
                  <ChangePassword usn={localStorage.getItem("usn")} />
                </div>
              </div>
            )}

            {/* Profile Header */}
            <div className="profile-header-section">
              <div className="profile-avatar-container">
                <FiUser className="profile-avatar-icon" />
              </div>
              <div className="profile-user-info">
                <div className="profile-name-section">
                  <h1 className="profile-user-name">{user.name}</h1>
                  <span className="profile-user-usn">{user.usn}</span>
                </div>
                <div className="profile-stats-grid">
                  <div className="profile-stat-item">
                    <span className="profile-stat-number">{user.subjects?.length || 0}</span>
                    <span className="profile-stat-label">Subjects</span>
                  </div>
                  <div className="profile-stat-item">
                    <span className="profile-stat-number">{getTotalTopics()}</span>
                    <span className="profile-stat-label">Topics</span>
                  </div>
                  <div className="profile-stat-item">
                    <span className="profile-stat-number">{getTotalImages()}</span>
                    <span className="profile-stat-label">Uploads</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Meta Info */}
            <div className="profile-meta-section">
              <div className="profile-meta-item">
                <HiAcademicCap className="profile-meta-icon" />
                <span>Student</span>
              </div>
              <div className="profile-meta-item">
                <FiCalendar className="profile-meta-icon" />
                <span>Joined {formatDate(user.createdAt)}</span>
              </div>
            </div>

            {/* Search Section */}
            <div className="profile-search-section">
              <div className="profile-search-container">
                <FiSearch className="profile-search-icon" />
                <input
                  type="text"
                  placeholder="Search subjects and topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="profile-search-input"
                />
              </div>
            </div>

            {/* Main Content */}
            <div className="profile-content-section">
              {!filteredSubjects || filteredSubjects.length === 0 ? (
                <div className="profile-empty-state">
                  {searchQuery ? (
                    <>
                      <FiSearch className="profile-empty-icon" />
                      <h3 className="profile-empty-title">No Results Found</h3>
                      <p className="profile-empty-text">Try different search terms</p>
                    </>
                  ) : (
                    <>
                      <FiBook className="profile-empty-icon" />
                      <h3 className="profile-empty-title">No Subjects Added</h3>
                      <p className="profile-empty-text">Start building your learning profile!</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="profile-subjects-grid">
                  {filteredSubjects.map((subject, subjectIndex) => {
                    const visibleCount = visibleTopics[subjectIndex] || 0;
                    const hasMoreTopics = subject.topics && subject.topics.length > visibleCount;
                    const displayTopics = subject.topics?.slice(0, visibleCount) || [];
                    
                    return (
                      <div key={subjectIndex} className="profile-subject-card">
                        <div className="profile-subject-header">
                          <div className="profile-subject-title">
                            <FiBook className="profile-subject-icon" />
                            <h3 className="profile-subject-name">{subject.subject}</h3>
                          </div>
                          <div className="profile-subject-badge">
                            {subject.topics?.length || 0} topics
                          </div>
                        </div>

                        {!subject.topics || subject.topics.length === 0 ? (
                          <div className="profile-empty-topics">
                            <p>No topics added yet</p>
                          </div>
                        ) : (
                          <div className="profile-topics-container">
                            {displayTopics.map((topic, topicIndex) => {
                              const uploadKey = `${subjectIndex}-${topicIndex}`;
                              const showUploads = expandedUploads[uploadKey];
                              const validImages = getValidImages(topic.images);

                              return (
                                <div key={topicIndex} className="profile-topic-card">
                                  <div className="profile-topic-header">
                                    <div className="profile-topic-info">
                                      <h4 className="profile-topic-title">{topic.topic}</h4>
                                      <div className="profile-topic-meta">
                                        <span className="profile-topic-date">
                                          <FiClock className="profile-meta-icon" />
                                          {formatDate(topic.timestamp)}
                                        </span>
                                        {validImages.length > 0 && (
                                          <span className="profile-topic-uploads">
                                            <FiUpload className="profile-meta-icon" />
                                            {validImages.length} uploads
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {validImages.length > 0 && (
                                    <div className="profile-uploads-section">
                                      <button 
                                        onClick={() => toggleUploadsView(subjectIndex, topicIndex)}
                                        className="profile-view-uploads-btn"
                                      >
                                        {showUploads ? (
                                          <>
                                            <FiEyeOff />
                                            Hide Uploads
                                          </>
                                        ) : (
                                          <>
                                            <FiGrid />
                                            View Uploads ({validImages.length})
                                          </>
                                        )}
                                        <FiChevronDown 
                                          className={`profile-chevron ${showUploads ? 'profile-rotated' : ''}`}
                                        />
                                      </button>

                                      {showUploads && (
                                        <div className="profile-uploads-grid">
                                          {validImages.map((imageUrl, imageIndex) => {
                                            const imageKey = `${uploadKey}-${imageIndex}`;
                                            const isLoaded = loadedImages.has(imageKey);
                                            
                                            return (
                                              <div 
                                                key={imageIndex} 
                                                className="profile-upload-container profile-image-lazy"
                                                data-image-key={imageKey}
                                              >
                                                <div className="profile-upload-wrapper">
                                                  {isLoaded ? (
                                                    <img 
                                                      src={imageUrl} 
                                                      alt={`${topic.topic} - Upload ${imageIndex + 1}`}
                                                      className="profile-upload-image"
                                                      loading="lazy"
                                                    />
                                                  ) : (
                                                    <div className="profile-upload-placeholder">
                                                      <FiImage className="profile-placeholder-icon" />
                                                      <span>Loading...</span>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            
                            {hasMoreTopics && (
                              <div 
                                className="profile-scroll-trigger" 
                                data-subject-index={subjectIndex}
                              >
                                {isLoadingMore && (
                                  <div className="profile-loading-more">
                                    <div className="profile-mini-spinner"></div>
                                    <span>Loading more topics...</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}