"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Calendar, BookOpen, ImageIcon, Eye, EyeOff, User, GraduationCap, Clock, ChevronDown } from "lucide-react";
import './styles/UserDetailsPage.css';

export default function UserDetailsPage({ usn }) {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [expandedTopics, setExpandedTopics] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (usn) {
      fetchUserDetails(usn);
    }
  }, [usn]);

  const fetchUserDetails = async (usnToSearch) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/user?usn=${usnToSearch}`);
      setUser(res.data.user);
      setMessage("");
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
      <div className="user-details-container">
        <div className="user-details-loading">
          <div className="user-details-spinner"></div>
          <p>Loading user details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-details-container">
      <div className="user-details-wrapper">
        <div className="user-details-header">
        
        </div>

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
                <User size={40} />
              </div>
              <div className="user-details-profile-info">
                <div className="user-details-name-section">
                  <h2 className="user-details-name">{user.name}</h2>
                  <span className="user-details-usn">{user.usn}</span>
                </div>
                <div className="user-details-stats">
                  <div className="user-details-stat-item">
                    <span className="user-details-stat-number">{user.subjects?.length || 0}</span>
                    <span className="user-details-stat-label">Subjects</span>
                  </div>
                  <div className="user-details-stat-item">
                    <span className="user-details-stat-number">{getTotalTopics()}</span>
                    <span className="user-details-stat-label">Topics</span>
                  </div>
                  <div className="user-details-stat-item">
                    <span className="user-details-stat-number">{getTotalImages()}</span>
                    <span className="user-details-stat-label">Images</span>
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

            {/* Content Section */}
            <div className="user-details-content">
              {!user.subjects || user.subjects.length === 0 ? (
                <div className="user-details-empty-state">
                  <BookOpen size={48} />
                  <h3>No Subjects Added</h3>
                  <p>This student hasn't added any subjects yet.</p>
                </div>
              ) : (
                <div className="user-details-subjects-grid">
                  {user.subjects.map((subject, subjectIndex) => (
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
                          {subject.topics.map((topic, topicIndex) => {
                            const topicKey = `${subjectIndex}-${topicIndex}`;
                            const isExpanded = expandedTopics[topicKey];
                            const validImages = getValidImages(topic.images);
                            const displayImages = isExpanded ? validImages : validImages.slice(0, 3);
                            const hasMoreImages = validImages.length > 3;

                            return (
                              <div key={topicIndex} className="user-details-topic-card">
                                <div className="user-details-topic-header">
                                  <div className="user-details-topic-info">
                                    <h4 className="user-details-topic-title">{topic.topic}</h4>
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
                                        <div key={imageIndex} className="user-details-image-container">
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
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}