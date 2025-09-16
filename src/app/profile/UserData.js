"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Calendar, BookOpen, ImageIcon, Eye, EyeOff, User, GraduationCap, Clock, ChevronDown, Search } from "lucide-react";
import './styles/UserData.css';

export default function UserData() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [expandedTopics, setExpandedTopics] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [visibleTopics, setVisibleTopics] = useState({});
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const TOPICS_PER_LOAD = 3; // Load 3 topics at a time per subject

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (user) {
      handleSearch(searchQuery);
    }
  }, [user, searchQuery]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    const observers = [];
    
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
      rootMargin: '50px'
    });

    // Observe all scroll sentinels
    const sentinels = document.querySelectorAll('.user-profile-scroll-sentinel');
    sentinels.forEach((sentinel) => {
      observer.observe(sentinel);
      observers.push(observer);
    });

    return () => {
      observers.forEach(obs => obs.disconnect());
    };
  }, [filteredSubjects, visibleTopics, isLoadingMore]);

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
      
      // Initialize visible topics for each subject
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
    }, 500);
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
    
    // Reset visible topics for filtered results
    const newVisible = {};
    filtered.forEach((subject, index) => {
      newVisible[index] = Math.min(TOPICS_PER_LOAD, subject.topics?.length || 0);
    });
    setVisibleTopics(newVisible);
  };

  const toggleTopicExpansion = (subjectIndex, topicIndex) => {
    const key = `${subjectIndex}-${topicIndex}`;
    setExpandedTopics(prev => ({
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
      <div className="user-profile-container">
        <div className="user-profile-loading">
          <div className="user-profile-spinner"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile-container">
      <div className="user-profile-wrapper">

        {message && (
          <div className="user-profile-error-message">
            <div className="user-profile-error-content">
              <User size={48} />
              <h3>Profile Access Issue</h3>
              <p>{message}</p>
            </div>
          </div>
        )}

        {user && (
          <div className="user-profile-card">
            {/* Profile Header */}
            <div className="user-profile-header">
              <div className="user-profile-avatar">
                <User size={40} />
              </div>
              <div className="user-profile-info">
                <div className="user-profile-name-section">
                  <h2 className="user-profile-name">{user.name}</h2>
                  <span className="user-profile-usn">{user.usn}</span>
                </div>
                <div className="user-profile-stats">
                  <div className="user-profile-stat-item">
                    <span className="user-profile-stat-number">{user.subjects?.length || 0}</span>
                    <span className="user-profile-stat-label">Subjects</span>
                  </div>
                  <div className="user-profile-stat-item">
                    <span className="user-profile-stat-number">{getTotalTopics()}</span>
                    <span className="user-profile-stat-label">Topics</span>
                  </div>
                  <div className="user-profile-stat-item">
                    <span className="user-profile-stat-number">{getTotalImages()}</span>
                    <span className="user-profile-stat-label">Images</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Meta */}
            <div className="user-profile-meta">
              <div className="user-profile-meta-item">
                <GraduationCap size={16} />
                <span>Student</span>
              </div>
              <div className="user-profile-meta-item">
                <Calendar size={16} />
                <span>Joined {formatDate(user.createdAt)}</span>
              </div>
            </div>

            {/* Search Bar */}
            <div className="user-profile-search-section">
              <div className="user-profile-search-container">
                <Search className="user-profile-search-icon" size={18} />
                <input
                  type="text"
                  placeholder="Search your subjects, topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="user-profile-search-input"
                />
              </div>
            </div>

            {/* Content Section */}
            <div className="user-profile-content">
              {!filteredSubjects || filteredSubjects.length === 0 ? (
                <div className="user-profile-empty-state">
                  {searchQuery ? (
                    <>
                      <Search size={48} />
                      <h3>No Results Found</h3>
                      <p>Try searching with different keywords</p>
                    </>
                  ) : (
                    <>
                      <BookOpen size={48} />
                      <h3>No Subjects Added</h3>
                      <p>You haven not added any subjects yet. Start building your learning profile!</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="user-profile-subjects-grid">
                  {filteredSubjects.map((subject, subjectIndex) => {
                    const visibleCount = visibleTopics[subjectIndex] || 0;
                    const hasMoreTopics = subject.topics && subject.topics.length > visibleCount;
                    const displayTopics = subject.topics?.slice(0, visibleCount) || [];
                    
                    return (
                      <div key={subjectIndex} className="user-profile-subject-card">
                        <div className="user-profile-subject-header">
                          <div className="user-profile-subject-title">
                            <BookOpen size={20} />
                            <h3>{subject.subject}</h3>
                          </div>
                          <div className="user-profile-subject-badge">
                            {subject.topics?.length || 0} topics
                          </div>
                        </div>

                        {!subject.topics || subject.topics.length === 0 ? (
                          <div className="user-profile-empty-topics">
                            <p>No topics added yet</p>
                          </div>
                        ) : (
                          <div className="user-profile-topics-list">
                            {displayTopics.map((topic, topicIndex) => {
                              const topicKey = `${subjectIndex}-${topicIndex}`;
                              const isExpanded = expandedTopics[topicKey];
                              const validImages = getValidImages(topic.images);
                              const displayImages = isExpanded ? validImages : validImages.slice(0, 3);
                              const hasMoreImages = validImages.length > 3;

                              return (
                                <div key={topicIndex} className="user-profile-topic-card">
                                  <div className="user-profile-topic-header">
                                    <div className="user-profile-topic-info">
                                      <h4 className="user-profile-topic-title">{topic.topic}</h4>
                                      <div className="user-profile-topic-meta">
                                        <span className="user-profile-topic-date">
                                          <Clock size={12} />
                                          {formatDate(topic.timestamp)}
                                        </span>
                                        {validImages.length > 0 && (
                                          <span className="user-profile-topic-images-count">
                                            <ImageIcon size={12} />
                                            {validImages.length} images
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {validImages.length > 0 && (
                                    <div className="user-profile-images-section">
                                      <div className="user-profile-images-grid">
                                        {displayImages.map((imageUrl, imageIndex) => (
                                          <div key={imageIndex} className="user-profile-image-container">
                                            <div className="user-profile-image-wrapper">
                                              <img 
                                                src={imageUrl} 
                                                alt={`${topic.topic} - Image ${imageIndex + 1}`}
                                                className="user-profile-topic-image"
                                                loading="lazy"
                                              />
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                      
                                      {hasMoreImages && (
                                        <button 
                                          onClick={() => toggleTopicExpansion(subjectIndex, topicIndex)}
                                          className="user-profile-view-more-btn"
                                        >
                                          {isExpanded ? (
                                            <>
                                              <EyeOff size={14} />
                                              Show Less
                                            </>
                                          ) : (
                                            <>
                                              <Eye size={14} />
                                              View More ({validImages.length - 3} more)
                                            </>
                                          )}
                                          <ChevronDown 
                                            size={14} 
                                            className={`user-profile-chevron ${isExpanded ? 'user-profile-rotated' : ''}`}
                                          />
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            
                            {/* Scroll sentinel for infinite loading */}
                            {hasMoreTopics && (
                              <div 
                                className="user-profile-scroll-sentinel" 
                                data-subject-index={subjectIndex}
                              >
                                {isLoadingMore && (
                                  <div className="user-profile-loading-more">
                                    <div className="user-profile-mini-spinner"></div>
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