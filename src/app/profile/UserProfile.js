"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
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
  FiGrid,
  FiCamera,
  FiLogIn,
  FiAlertCircle
} from "react-icons/fi";
import { HiAcademicCap } from "react-icons/hi";
import { formatActiveTime } from '@/lib/utils';
import ChangeName from './ChangeName';
import ChangePassword from './ChangePassword';
import ProfileImageEditor from './ProfileImageEditor';
import UserProfileSkeleton from './UserProfileSkeleton'; // Import the skeleton
import './styles/UserProfile.css';

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [hasError, setHasError] = useState(false);
  const [expandedUploads, setExpandedUploads] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [visibleTopics, setVisibleTopics] = useState({});
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [profileImage, setProfileImage] = useState("https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp");
  const [quote, setQuote] = useState("");
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  
  const TOPICS_PER_LOAD = 5;

  useEffect(() => {
    fetchUserProfile();
    fetchQuote();
  }, []);

  // NEW: interval to call POST /api/user/active every 60s and update local user.active
  useEffect(() => {
    let intervalId = null;

    const tick = async () => {
      try {
        const usn = localStorage.getItem("usn");
        if (!usn) return; // not logged in

        const res = await axios.post("/api/user/active", { usn });
        const updatedActive = res?.data?.active;

        // Update local user state with new active value (if user already loaded)
        if (typeof updatedActive !== "undefined") {
          setUser(prev => {
            if (!prev) return prev; // if user not loaded yet, keep it null
            return { ...prev, active: updatedActive };
          });
        }
      } catch (err) {
        // Fail silently but log for debugging
        console.error("Failed to update active time:", err);
      }
    };

    // Start interval
    intervalId = setInterval(tick, 60000); // 60s

    // Optionally, you can run once immediately to sync right away.
    // If you prefer NOT to increment on mount, comment the next line out.
    // tick();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (user) {
      handleSearch(searchQuery);
    }
  }, [user, searchQuery]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLoadingMore) {
            const subjectIndex = parseInt(entry.target.dataset.subjectIndex);
            loadMoreTopics(subjectIndex);
          }
        });
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const sentinels = document.querySelectorAll('.up-scroll-sentinel');
    sentinels.forEach((sentinel) => observer.observe(sentinel));

    return () => observer.disconnect();
  }, [filteredSubjects, visibleTopics, isLoadingMore]);

  useEffect(() => {
    const imageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const imageKey = img.dataset.imageKey;
            if (imageKey && !loadedImages.has(imageKey)) {
              setLoadedImages((prev) => new Set([...prev, imageKey]));
              imageObserver.unobserve(img);
            }
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    const imageContainers = document.querySelectorAll('.up-image-lazy');
    imageContainers.forEach((container) => imageObserver.observe(container));

    return () => imageObserver.disconnect();
  }, [expandedUploads, loadedImages]);

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
      setQuote("Every journey begins with a single step.");
    } finally {
      setIsLoadingQuote(false);
    }
  };

  const fetchUserProfile = async () => {
    setLoading(true);
    setHasError(false);
    try {
      const usn = localStorage.getItem("usn");
      if (!usn) {
        setMessage("Please login to view your profile.");
        setHasError(true);
        setLoading(false);
        return;
      }

      const res = await axios.get(`/api/user?usn=${usn}`);
      setUser(res.data.user);
      setProfileImage(res.data.user.profileimg || "https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp");
      setMessage("");
      setHasError(false);
      
      const initialVisible = {};
      if (res.data.user.subjects) {
        res.data.user.subjects.forEach((subject, index) => {
          initialVisible[index] = Math.min(TOPICS_PER_LOAD, subject.topics?.length || 0);
        });
      }
      setVisibleTopics(initialVisible);
    } catch (err) {
      console.error(err);
      setHasError(true);
      if (err.response?.status === 404) {
        setMessage("Profile not found! Something went wrong, please login again.");
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        setMessage("Authentication failed! Please login again.");
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        setMessage("Network error occurred! Please check your connection and login again.");
      } else {
        setMessage("Something went wrong! Please login again.");
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
      setVisibleTopics((prev) => ({
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
    const filtered = user.subjects.map((subject) => {
      const filteredTopics = subject.topics?.filter((topic) => 
        subject.subject.toLowerCase().includes(searchTerm) ||
        topic.topic.toLowerCase().includes(searchTerm)
      ) || [];
      
      return {
        ...subject,
        topics: filteredTopics
      };
    }).filter((subject) => 
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
    setExpandedUploads((prev) => ({
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
        return topicTotal + (topic.images?.filter((img) => img && img.trim() !== '').length || 0);
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
    return images ? images.filter((img) => img && img.trim() !== '') : [];
  };

  if (loading) {
    return <UserProfileSkeleton />;
  }

  if (hasError) {
    return (
      <div className="up-container">
        <div className="up-wrapper">
          <div className="up-error-container">
            <div className="up-error-content">
              <FiAlertCircle className="up-error-icon" />
              <h3 className="up-error-title">Oops! Something went wrong</h3>
              <p className="up-error-message">{message}</p>
              <Link href="/login" className="up-login-btn">
                <FiLogIn className="up-login-icon" />
                Login Again
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="up-container">
      <div className="up-wrapper">
        {user && (
          <div className="up-card">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="up-settings-btn"
            >
              <FiSettings />
            </button>

            {showSettings && (
              <div className="up-settings-panel">
                <h2 className="up-settings-title">Account Settings</h2>
                <ProfileImageEditor 
                  profileImage={profileImage} 
                  setProfileImage={setProfileImage}
                  usn={localStorage.getItem("usn")}
                />
                <ChangeName usn={localStorage.getItem("usn")} />
                <ChangePassword usn={localStorage.getItem("usn")} />
              </div>
            )}

            <div className="up-header">
              <div className="up-avatar-container">
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  className="up-avatar-image"
                />
              </div>
              <div className="up-user-info">
                <div className="up-name-section">
                  <h1 className="up-user-name">{user.name}</h1>
                  <span className="up-user-usn">{user.usn}</span>
                </div>
                <div className="up-stats">
                  <div className="up-stat">
                    <span className="up-stat-number">{user.subjects?.length || 0}</span>
                    <span className="up-stat-label">Subjects</span>
                  </div>
                  <div className="up-stat">
                    <span className="up-stat-number">{getTotalTopics()}</span>
                    <span className="up-stat-label">Topics</span>
                  </div>
                  <div className="up-stat">
                    <span className="up-stat-number">{getTotalImages()}</span>
                    <span className="up-stat-label">Uploads</span>
                  </div>
                  <div className="up-stat">
                    <span className="up-stat-number">{formatActiveTime(user.active || 0)}</span>
                    <span className="up-stat-label">Active</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="up-meta">
              <div className="up-meta-item">
                <HiAcademicCap className="up-meta-icon" />
                <span>Student</span>
              </div>
              <div className="up-meta-item">
                <FiCalendar className="up-meta-icon" />
                <span>Joined {formatDate(user.createdAt)}</span>
              </div>
            </div>

            <div className="up-search">
              <FiSearch className="up-search-icon" />
              <input
                type="text"
                placeholder="Search subjects and topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="up-search-input"
              />
            </div>

            {/* Quote Section */}
            <div className="up-quote-section">
              {isLoadingQuote ? (
                <div className="up-quote-skeleton up-shimmer"></div>
              ) : (
                <p className="up-quote">{quote}</p>
              )}
            </div>

            <div className="up-content">
              {!filteredSubjects || filteredSubjects.length === 0 ? (
                <div className="up-empty">
                  {searchQuery ? (
                    <>
                      <FiSearch className="up-empty-icon" />
                      <h3 className="up-empty-title">No Results Found</h3>
                      <p className="up-empty-text">Try different search terms</p>
                    </>
                  ) : (
                    <>
                      <FiBook className="up-empty-icon" />
                      <h3 className="up-empty-title">No Subjects Added</h3>
                      <p className="up-empty-text">Start building your learning profile!</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="up-subjects">
                  {filteredSubjects.map((subject, subjectIndex) => {
                    const visibleCount = visibleTopics[subjectIndex] || 0;
                    const hasMoreTopics = subject.topics && subject.topics.length > visibleCount;
                    const displayTopics = subject.topics?.slice(0, visibleCount) || [];

                    return (
                      <div key={subjectIndex} className="up-subject-card">
                        <div className="up-subject-header">
                          <div className="up-subject-title">
                            <FiBook className="up-subject-icon" />
                            <h3 className="up-subject-name">{subject.subject}</h3>
                          </div>
                          <div className="up-subject-badge">
                            {subject.topics?.length || 0} topics
                          </div>
                        </div>

                        {!subject.topics || subject.topics.length === 0 ? (
                          <div className="up-empty-topics">
                            <p>No topics added yet</p>
                          </div>
                        ) : (
                          <div className="up-topics">
                            {displayTopics.map((topic, topicIndex) => {
                              const uploadKey = `${subjectIndex}-${topicIndex}`;
                              const showUploads = expandedUploads[uploadKey];
                              const validImages = getValidImages(topic.images);

                              return (
                                <div key={topicIndex} className="up-topic-card">
                                  <div className="up-topic-header">
                                    <div className="up-topic-info">
                                      <h4 className="up-topic-title">{topic.topic}</h4>
                                      <div className="up-topic-meta">
                                        <span className="up-topic-date">
                                          <FiClock className="up-meta-icon" />
                                          {formatDate(topic.timestamp)}
                                        </span>
                                        {validImages.length > 0 && (
                                          <span className="up-topic-uploads">
                                            <FiUpload className="up-meta-icon" />
                                            {validImages.length} uploads
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {validImages.length > 0 && (
                                    <div className="up-uploads">
                                      <button 
                                        onClick={() => toggleUploadsView(subjectIndex, topicIndex)}
                                        className="up-view-uploads"
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
                                          className={`up-chevron ${showUploads ? 'up-chevron-active' : ''}`}
                                        />
                                      </button>

                                      {showUploads && (
                                        <div className="up-uploads-grid">
                                          {validImages.map((imageUrl, imageIndex) => {
                                            const imageKey = `${uploadKey}-${imageIndex}`;
                                            const isLoaded = loadedImages.has(imageKey);
                                            
                                            return (
                                              <div 
                                                key={imageIndex} 
                                                className="up-upload-item up-image-lazy"
                                                data-image-key={imageKey}
                                              >
                                                <div className="up-upload-wrapper">
                                                  {isLoaded ? (
                                                    <img 
                                                      src={imageUrl} 
                                                      alt={`${topic.topic} - Upload ${imageIndex + 1}`}
                                                      className="up-upload-image"
                                                      loading="lazy"
                                                    />
                                                  ) : (
                                                    <div className="up-upload-placeholder">
                                                      <FiImage className="up-placeholder-icon" />
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
                                className="up-scroll-sentinel" 
                                data-subject-index={subjectIndex}
                              >
                                {isLoadingMore && (
                                  <div className="up-loading-more">
                                    <div className="up-mini-spinner"></div>
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
