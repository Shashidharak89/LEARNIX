"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useTheme } from "@/context/ThemeContext";
import "./styles/AllUsersRecords.css";

export default function AllUsersRecords() {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [imageViewCounts, setImageViewCounts] = useState({});
  
  const { theme: contextTheme } = useTheme();

  // Check localStorage for theme, fallback to context theme
  const getTheme = () => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme');
      return storedTheme || contextTheme;
    }
    return contextTheme;
  };

  const [currentTheme, setCurrentTheme] = useState('light');

  useEffect(() => {
    setCurrentTheme(getTheme());
  }, [contextTheme]);

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/work/getall");
      const usersData = res.data.users || [];
      
      // Sort users by latest topic timestamp
      const sortedUsers = usersData.map(user => ({
        ...user,
        subjects: user.subjects.map(subject => ({
          ...subject,
          topics: subject.topics.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        }))
      }));
      
      setUsers(sortedUsers);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || "Failed to fetch records");
    } finally {
      setLoading(false);
    }
  };

  const handleViewMoreImages = (userIdx, subjectIdx, topicIdx) => {
    const key = `${userIdx}-${subjectIdx}-${topicIdx}`;
    setImageViewCounts(prev => ({
      ...prev,
      [key]: (prev[key] || 3) + 3
    }));
  };

  const getVisibleImages = (images, userIdx, subjectIdx, topicIdx) => {
    const key = `${userIdx}-${subjectIdx}-${topicIdx}`;
    const viewCount = imageViewCounts[key] || 3;
    return images.slice(0, Math.min(viewCount, images.length));
  };

  const hasMoreImages = (images, userIdx, subjectIdx, topicIdx) => {
    const key = `${userIdx}-${subjectIdx}-${topicIdx}`;
    const viewCount = imageViewCounts[key] || 3;
    return images.length > viewCount;
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInMs = now - past;
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInMs / (1000 * 60));
      return `${minutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}d ago`;
    } else {
      return past.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className={`aur-container ${currentTheme}`}>
        <div className="aur-loading">
          <div className="aur-spinner"></div>
          <span>Loading records...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`aur-container ${currentTheme}`}>
      <div className="aur-header">
        <div className="aur-title">
          <span className="aur-title-icon">📚</span>
          <h1>Community Study Records</h1>
        </div>
        <p className="aur-subtitle">Latest study topics from your classmates</p>
      </div>

      {message && (
        <div className="aur-message error">
          <span className="aur-message-icon">⚠️</span>
          {message}
        </div>
      )}

      {users.length === 0 && !loading && (
        <div className="aur-empty-state">
          <span className="aur-empty-icon">📝</span>
          <h3>No study records found</h3>
          <p>Be the first to share your study materials!</p>
        </div>
      )}

      <div className="aur-feed">
        {users.map((user, userIdx) => (
          <div key={userIdx} className="aur-user-section">
            <div className="aur-user-header">
              <div className="aur-user-avatar">
                <span>{user.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="aur-user-info">
                <h3 className="aur-user-name">{user.name}</h3>
                <p className="aur-user-usn">USN: {user.usn}</p>
              </div>
            </div>

            {user.subjects.length === 0 ? (
              <div className="aur-no-subjects">
                <span className="aur-empty-icon-sm">📖</span>
                <span>No subjects added yet</span>
              </div>
            ) : (
              <div className="aur-subjects-container">
                {user.subjects.map((subject, subjectIdx) => (
                  <div key={subjectIdx} className="aur-subject-card">
                    <div className="aur-subject-header">
                      <span className="aur-subject-icon">📖</span>
                      <h4>{subject.subject}</h4>
                    </div>

                    {subject.topics.length === 0 ? (
                      <div className="aur-no-topics">
                        <span className="aur-empty-icon-sm">📄</span>
                        <span>No topics yet</span>
                      </div>
                    ) : (
                      <div className="aur-topics-list">
                        {subject.topics.map((topic, topicIdx) => (
                          <div key={topicIdx} className="aur-topic-card">
                            <div className="aur-topic-header">
                              <div className="aur-topic-title">
                                <span className="aur-topic-icon">📝</span>
                                <h5>{topic.topic}</h5>
                              </div>
                              <div className="aur-topic-timestamp">
                                <span className="aur-timestamp-icon">🕒</span>
                                <span>{formatTimeAgo(topic.timestamp)}</span>
                              </div>
                            </div>

                            {topic.images && topic.images.length > 0 && (
                              <div className="aur-images-section">
                                <div className="aur-images-header">
                                  <span className="aur-images-icon">🖼️</span>
                                  <span>{topic.images.length} image{topic.images.length !== 1 ? 's' : ''}</span>
                                </div>
                                
                                <div className="aur-images-grid">
                                  {getVisibleImages(topic.images, userIdx, subjectIdx, topicIdx).map((image, imgIdx) => (
                                    <div key={imgIdx} className="aur-image-card">
                                      <div className="aur-image-wrapper">
                                        <img 
                                          src={image} 
                                          alt={`${topic.topic} - Image ${imgIdx + 1}`}
                                          className="aur-image"
                                          onError={(e) => {
                                            e.target.src = '/placeholder-image.png';
                                          }}
                                        />
                                        <div className="aur-image-overlay">
                                          <button 
                                            className="aur-btn aur-btn-sm aur-image-view"
                                            onClick={() => window.open(image, '_blank')}
                                          >
                                            <span className="aur-btn-icon">👁️</span>
                                            View
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                
                                {hasMoreImages(topic.images, userIdx, subjectIdx, topicIdx) && (
                                  <button 
                                    className="aur-btn aur-btn-secondary aur-view-more-btn"
                                    onClick={() => handleViewMoreImages(userIdx, subjectIdx, topicIdx)}
                                  >
                                    <span className="aur-btn-icon">➕</span>
                                    View More ({topic.images.length - (imageViewCounts[`${userIdx}-${subjectIdx}-${topicIdx}`] || 3)} more)
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}