"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Calendar, BookOpen, ImageIcon, Eye, EyeOff, User, GraduationCap, Clock, ChevronDown, Search } from "lucide-react";
import { formatActiveTime } from '@/lib/utils';
import './styles/UserDetailsPage.css';
import UserDetailsPageSkeleton from "./UserDetailsPageSkeleton";

export default function UserDetailsPage({ usn }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [expandedTopics, setExpandedTopics] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [visibleTopics, setVisibleTopics] = useState({});
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [publicSubjectsCount, setPublicSubjectsCount] = useState(0);
  const [publicTotalTopics, setPublicTotalTopics] = useState(0);
  const [publicTotalImages, setPublicTotalImages] = useState(0);
  const [showResources, setShowResources] = useState(false);
  const [visibleSubjectsCount, setVisibleSubjectsCount] = useState(3);
  
  
  const TOPICS_PER_LOAD = 3; // Load 3 topics at a time per subject
  const SUBJECTS_PER_LOAD = 3;
  const DEFAULT_PROFILE_IMAGE = "https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp";

  const filterSubjects = useCallback((subjects, searchTerm = '') => {
    return subjects
      .filter(subject => subject.public !== false)
      .map(subject => {
        const filteredTopics = subject.topics?.filter(topic => {
          if (!(topic.public !== false)) return false;
          if (searchTerm) {
            return (
              topic.topic.toLowerCase().includes(searchTerm) ||
              (topic.content && topic.content.toLowerCase().includes(searchTerm))
            );
          }
          return true;
        }) || [];
        if (searchTerm) {
          if (
            !subject.subject.toLowerCase().includes(searchTerm) &&
            filteredTopics.length === 0
          ) {
            return null;
          }
        }
        return {
          ...subject,
          topics: filteredTopics
        };
      })
      .filter(Boolean);
  }, []);

  useEffect(() => {
    if (usn) {
      fetchUserDetails(usn);
    }
  }, [usn]);

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
    const sentinels = document.querySelectorAll('.user-details-scroll-sentinel');
    sentinels.forEach((sentinel) => {
      observer.observe(sentinel);
      observers.push(observer);
    });

    return () => {
      observers.forEach(obs => obs.disconnect());
    };
  }, [filteredSubjects, visibleTopics, isLoadingMore]);

  const fetchUserDetails = async (usnToSearch) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/user?usn=${usnToSearch}`);
      const rawUser = res.data.user;
      setUser(rawUser);
      setMessage("");
      
      const publicSubjectsForStats = filterSubjects(rawUser.subjects || [], '');
      let topicsCount = 0;
      let imagesCount = 0;
      publicSubjectsForStats.forEach(subject => {
        topicsCount += subject.topics.length;
        subject.topics.forEach(topic => {
          const validImages = getValidImages(topic.images || []);
          imagesCount += validImages.length;
        });
      });
      setPublicSubjectsCount(publicSubjectsForStats.length);
      setPublicTotalTopics(topicsCount);
      setPublicTotalImages(imagesCount);
      
    } catch (err) {
      console.error(err);
      if (err.response?.status === 404) {
        setMessage("User not found!");
      } else {
        setMessage(err.response?.data?.error || "Failed to fetch user details");
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

  const handleSearch = useCallback((query) => {
    if (!user || !user.subjects) return;
    
    const searchTerm = query.toLowerCase();
    const filtered = filterSubjects(user.subjects, searchTerm);
    setFilteredSubjects(filtered);
    
    // Reset visible topics for filtered results
    const newVisible = {};
    filtered.forEach((subject, index) => {
      newVisible[index] = Math.min(TOPICS_PER_LOAD, subject.topics?.length || 0);
    });
    setVisibleTopics(newVisible);
  }, [user, filterSubjects]);

  const toggleTopicExpansion = (subjectIndex, topicIndex) => {
    const key = `${subjectIndex}-${topicIndex}`;
    setExpandedTopics(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getValidImages = (images) => {
    return images ? images.filter(img => img && img.trim() !== '') : [];
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="user-details-container">
        <UserDetailsPageSkeleton/>
      </div>
    );
  }

  return (
    <div className="user-details-container">
      <div className="user-details-wrapper">

        {message && (
          <div className="user-details-error-message">
            <div className="user-details-error-content">
              <User size={48} />
              <h3>User Not Found</h3>
              <p>{message}</p>
            </div>
          </div>
        )}

        {user && (
          <div className="user-details-profile">
            {/* Profile Header */}
            <div className="user-details-profile-header">
              <div className="user-details-avatar">
                <img
                  src={user.profileimg || DEFAULT_PROFILE_IMAGE}
                  alt={`${user.name}'s profile`}
                  className="user-details-avatar-image"
                />
              </div>
              <div className="user-details-profile-info">
                <div className="user-details-name-section">
                  <h2 className="user-details-name">{user.name}</h2>
                  <span className="user-details-usn">{user.usn}</span>
                </div>
                <div className="user-details-stats">
                  <div className="user-details-stat-item">
                    <span className="user-details-stat-number">{publicSubjectsCount}</span>
                    <span className="user-details-stat-label">Subjects</span>
                  </div>
                  <div className="user-details-stat-item">
                    <span className="user-details-stat-number">{publicTotalTopics}</span>
                    <span className="user-details-stat-label">Topics</span>
                  </div>
                  <div className="user-details-stat-item">
                    <span className="user-details-stat-number">{publicTotalImages}</span>
                    <span className="user-details-stat-label">Images</span>
                  </div>
                  <div className="user-details-stat-item">
                    <span className="user-details-stat-number">{formatActiveTime(user.active || 0)}</span>
                    <span className="user-details-stat-label">Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Meta */}
            <div className="user-details-profile-meta">
              <div className="user-details-meta-item">
                <GraduationCap size={16} />
                <span>Student</span>
              </div>
              <div className="user-details-meta-item">
                <Calendar size={16} />
                <span>Joined {formatDate(user.createdAt)}</span>
              </div>
            </div>

            {/* Quote & College Section */}
            <div className="user-details-quote-section">
              <p className="user-details-quote">"Every journey begins with a single step."</p>
              <p className="user-details-college">
                <GraduationCap size={14} />
                College: NMAM Institute of Technology, Nitte
              </p>
            </div>

            {/* Content Section */}
            <div className="user-details-content">
              {/* View Uploaded Resources Toggle Button */}
              {!showResources ? (
                <div className="user-details-resources-toggle-container">
                  <button 
                    className="user-details-show-resources-btn"
                    onClick={() => setShowResources(true)}
                  >
                    <Eye size={18} />
                    View Uploaded Resources
                  </button>
                </div>
              ) : (
                <>
                  <div className="user-details-resources-toggle-container">
                    <button 
                      className="user-details-hide-resources-btn"
                      onClick={() => {
                        setShowResources(false);
                        setVisibleSubjectsCount(SUBJECTS_PER_LOAD);
                      }}
                    >
                      <EyeOff size={16} />
                      Hide Resources
                    </button>
                  </div>

                  {/* Search Bar - only visible when resources are shown */}
                  <div className="user-details-search-section">
                    <div className="user-details-search-container">
                      <Search className="user-details-search-icon" size={18} />
                      <input
                        type="text"
                        placeholder="Search subjects, topics, or content..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="user-details-search-input"
                      />
                    </div>
                  </div>

                  {!filteredSubjects || filteredSubjects.length === 0 ? (
                    <div className="user-details-empty-state">
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
                          <p>This student has not added any subjects yet.</p>
                        </>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="user-details-subjects-grid">
                        {filteredSubjects.slice(0, visibleSubjectsCount).map((subject, subjectIndex) => {
                          const visibleCount = visibleTopics[subjectIndex] || 0;
                          const hasMoreTopics = subject.topics && subject.topics.length > visibleCount;
                          const displayTopics = subject.topics?.slice(0, visibleCount) || [];
                    
                          return (
                            <div key={subjectIndex} className="user-details-subject-card">
                              <div className="user-details-subject-header">
                                <div className="user-details-subject-title">
                                  <BookOpen size={20} />
                                  <h3>{subject.subject}</h3>
                                </div>
                                <div className="user-details-subject-badge">
                                  {subject.topics?.length || 0} topics
                          </div>
                        </div>

                        {!subject.topics || subject.topics.length === 0 ? (
                          <div className="user-details-empty-topics">
                            <p>No topics added yet</p>
                          </div>
                        ) : (
                          <div className="user-details-topics-list">
                            {displayTopics.map((topic, topicIndex) => {
                              const topicKey = `${subjectIndex}-${topicIndex}`;
                              const isExpanded = expandedTopics[topicKey];
                              const validImages = getValidImages(topic.images);
                              const displayImages = isExpanded ? validImages : validImages.slice(0, 3);
                              const hasMoreImages = validImages.length > 3;

                              return (
                                <div key={topicIndex} className="user-details-topic-card">
                                  <div className="user-details-topic-header">
                                    <div className="user-details-topic-info">
                                      <h4 
                                        className="user-details-topic-title user-details-clickable-title"
                                        onClick={() => router.push(`/works/${topic._id}`)}
                                      >
                                        {topic.topic}
                                      </h4>
                                      <div className="user-details-topic-meta">
                                        <span className="user-details-topic-date">
                                          <Clock size={12} />
                                          {formatDate(topic.timestamp)}
                                        </span>
                                        {validImages.length > 0 && (
                                          <span className="user-details-topic-images-count">
                                            <ImageIcon size={12} />
                                            {validImages.length} images
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {topic.content && topic.content.trim() && (
                                    <div className="user-details-topic-content">
                                      <p>{topic.content}</p>
                                    </div>
                                  )}

                                  {validImages.length > 0 && (
                                    <div className="user-details-images-section">
                                      <div className="user-details-images-grid">
                                        {displayImages.map((imageUrl, imageIndex) => (
                                          <div 
                                            key={imageIndex} 
                                            className="user-details-image-container user-details-clickable-image"
                                            onClick={() => router.push(`/works/${topic._id}`)}
                                          >
                                            <div className="user-details-image-wrapper">
                                              <img 
                                                src={imageUrl} 
                                                alt={`${topic.topic} - Image ${imageIndex + 1}`}
                                                className="user-details-topic-image"
                                                loading="lazy"
                                              />
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                      
                                      {hasMoreImages && (
                                        <button 
                                          onClick={() => toggleTopicExpansion(subjectIndex, topicIndex)}
                                          className="user-details-view-more-btn"
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
                                            className={`user-details-chevron ${isExpanded ? 'user-details-rotated' : ''}`}
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
                                className="user-details-scroll-sentinel" 
                                data-subject-index={subjectIndex}
                              >
                                {isLoadingMore && (
                                  <div className="user-details-loading-more">
                                    <div className="user-details-mini-spinner"></div>
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
                      
                      {/* View More Subjects Button */}
                      {filteredSubjects.length > visibleSubjectsCount && (
                        <div className="user-details-view-more-subjects-container">
                          <button 
                            className="user-details-view-more-subjects-btn"
                            onClick={() => setVisibleSubjectsCount(prev => prev + SUBJECTS_PER_LOAD)}
                          >
                            <Eye size={16} />
                            View More Subjects ({filteredSubjects.length - visibleSubjectsCount} more)
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}