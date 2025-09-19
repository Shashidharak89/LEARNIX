"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { 
  FiCalendar, 
  FiBook, 
  FiImage, 
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
import ChangeName from './ChangeName';
import ChangePassword from './ChangePassword';
import ProfileImageEditor from './ProfileImageEditor';
import './styles/UserProfile.css';

export default function UserProfile() {
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
  const [profileImage, setProfileImage] = useState("https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp");
  
  const TOPICS_PER_LOAD = 5;

  useEffect(() => {
    fetchUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) {
      handleSearch(searchQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, searchQuery]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLoadingMore) {
            const subjectIndex = parseInt(entry.target.dataset.subjectIndex);
            if (!Number.isNaN(subjectIndex)) loadMoreTopics(subjectIndex);
          }
        });
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const sentinels = document.querySelectorAll('.up-scroll-sentinel');
    sentinels.forEach((sentinel) => observer.observe(sentinel));

    return () => observer.disconnect();
  }, [filteredSubjects, visibleTopics, isLoadingMore, loadMoreTopics]);

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

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      let usn = localStorage.getItem("usn");
      if (!usn) {
        setMessage("Please login to view your profile.");
        setLoading(false);
        return;
      }

      // Normalize USN: trim and uppercase to avoid mismatches caused by case/whitespace
      usn = usn.trim().toUpperCase();

      // encode the param to be safe
      const res = await axios.get(`/api/user?usn=${encodeURIComponent(usn)}`);

      // backend returns { user: { ... } } as per your API
      const fetchedUser = res.data?.user;
      if (!fetchedUser) {
        setMessage("Profile not found!");
        setUser(null);
        setFilteredSubjects([]);
        setLoading(false);
        return;
      }

      setUser(fetchedUser);
      setProfileImage(fetchedUser.profileimg || "https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp");
      setMessage("");

      // <-- IMPORTANT: initialize filteredSubjects immediately so content appears
      setFilteredSubjects(fetchedUser.subjects || []);

      const initialVisible = {};
      if (fetchedUser.subjects) {
        fetchedUser.subjects.forEach((subject, index) => {
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
      setFilteredSubjects([]);
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
      (subject.topics && subject.topics.length > 0)
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
    if (!timestamp) return "";
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
    return (
      <div className="up-container">
        <div className="up-loading">
          <div className="up-spinner"></div>
          <p className="up-loading-text">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="up-container">
      <div className="up-wrapper">
        {message && (
          <div className="up-error">
            <FiUser className="up-error-icon" />
            <h3 className="up-error-title">Profile Access Issue</h3>
            <p className="up-error-message">{message}</p>
          </div>
        )}

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
