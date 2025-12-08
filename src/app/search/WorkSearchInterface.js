'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FiSearch, FiDownload, FiEye, FiChevronDown, FiCalendar, FiUser, FiBook, FiRefreshCw, FiRotateCcw, FiShare2 } from 'react-icons/fi';
import './styles/WorkSearchInterface.css';

const WorkSearchInterface = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [displayedTopics, setDisplayedTopics] = useState([]);
  const [allTopics, setAllTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [expandedImages, setExpandedImages] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isManualReloading, setIsManualReloading] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');

  const ITEMS_PER_LOAD = 8;

  // Request notification permission on component mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    fetchAllTopics();
  }, []);

  const requestNotificationPermission = async () => {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return;
    }

    // Check current permission status
    const currentPermission = Notification.permission;
    setNotificationPermission(currentPermission);

    // If permission hasn't been granted or denied, request it
    if (currentPermission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        
        if (permission === 'granted') {
          console.log('Notification permission granted for Learnix');
          // Show a welcome notification
          new Notification('Welcome to Learnix!', {
            body: 'You will now receive notifications about new topics and updates.',
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'learnix-welcome',
          });
        } else {
          console.log('Notification permission denied');
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
      }
    } else if (currentPermission === 'granted') {
      console.log('Notification permission already granted');
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !searchQuery && !isManualReloading) {
          loadMoreTopics();
        }
      },
      { threshold: 0.1 }
    );

    const sentinel = document.getElementById('ws-scroll-sentinel');
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, searchQuery, isManualReloading]);

  const fetchAllTopics = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/work/getall');
      const data = await response.json();

      const topics = [];
      data.users.forEach(user => {
        user.subjects?.forEach(subject => {
          const subjectPublic = subject.public !== false;
          if (!subjectPublic) return;
          subject.topics?.forEach(topic => {
            const topicPublic = topic.public !== false;
            if (!topicPublic) return;
            topics.push({
              ...topic,
              userName: user.name,
              usn: user.usn,
              subjectName: subject.subject,
              userId: user._id,
              topicId: topic._id
            });
          });
        });
      });

      const sortedTopics = topics
        .filter(topic => topic.timestamp)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setAllTopics(sortedTopics);

      const initialTopics = sortedTopics.slice(0, ITEMS_PER_LOAD);
      setDisplayedTopics(initialTopics);
      setCurrentIndex(ITEMS_PER_LOAD);
      setHasMore(sortedTopics.length > ITEMS_PER_LOAD);
    } catch (error) {
      console.error('Error fetching topics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreTopics = useCallback(() => {
    if (isLoadingMore || !hasMore || searchQuery || isManualReloading) return;

    setIsLoadingMore(true);
    setTimeout(() => {
      const nextBatch = allTopics.slice(currentIndex, currentIndex + ITEMS_PER_LOAD);
      if (nextBatch.length > 0) {
        setDisplayedTopics(prev => [...prev, ...nextBatch]);
        setCurrentIndex(prev => prev + ITEMS_PER_LOAD);
        setHasMore(currentIndex + ITEMS_PER_LOAD < allTopics.length);
      } else setHasMore(false);
      setIsLoadingMore(false);
    }, 500);
  }, [allTopics, currentIndex, hasMore, isLoadingMore, searchQuery, isManualReloading]);

  const handleManualReload = () => {
    if (!hasMore || isLoadingMore || searchQuery || isManualReloading) return;
    setIsManualReloading(true);
    setTimeout(() => {
      loadMoreTopics();
      setIsManualReloading(false);
    }, 100);
  };

  const handleEndReload = () => {
    if (isLoadingMore || isManualReloading) return;
    setIsManualReloading(true);

    const remainingTopics = allTopics.length - currentIndex;
    if (remainingTopics > 0) {
      setTimeout(() => {
        const nextBatch = allTopics.slice(currentIndex, currentIndex + ITEMS_PER_LOAD);
        if (nextBatch.length > 0) {
          setDisplayedTopics(prev => [...prev, ...nextBatch]);
          setCurrentIndex(prev => prev + ITEMS_PER_LOAD);
          setHasMore(currentIndex + ITEMS_PER_LOAD < allTopics.length);
        } else setHasMore(false);
        setIsManualReloading(false);
      }, 500);
    } else {
      fetchAllTopics().then(() => setIsManualReloading(false));
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      const initialTopics = allTopics.slice(0, ITEMS_PER_LOAD);
      setDisplayedTopics(initialTopics);
      setCurrentIndex(ITEMS_PER_LOAD);
      setHasMore(allTopics.length > ITEMS_PER_LOAD);
      return;
    }

    setIsLoading(true);
    try {
      const searchTerm = query.toLowerCase();
      const results = [];
      allTopics.forEach(topic => {
        if (
          topic.userName.toLowerCase().includes(searchTerm) ||
          topic.usn.toLowerCase().includes(searchTerm) ||
          topic.subjectName.toLowerCase().includes(searchTerm) ||
          topic.topic.toLowerCase().includes(searchTerm) ||
          topic.content.toLowerCase().includes(searchTerm)
        ) {
          results.push({ ...topic, matchType: 'search' });
        }
      });

      const uniqueResults = results.filter(
        (item, index, self) =>
          index ===
          self.findIndex(
            t => t.topic === item.topic && t.userId === item.userId && t.subjectName === item.subjectName
          )
      );

      setSearchResults(uniqueResults.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleImageExpansion = (topicKey) => {
    setExpandedImages(prev => ({ ...prev, [topicKey]: !prev[topicKey] }));
  };

  const downloadTopicAsPDF = async (topic, index) => {
    if (!topic.images || topic.images.length === 0) {
      alert('No images available for this topic');
      return;
    }
    
    try {
      // Show loading state
      const downloadBtn = document.querySelector(`[data-topic-index="${index}"] .ws-download-btn`);
      if (downloadBtn) {
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = '<span>Generating...</span>';
      }

      // Call the API to generate PDF with template
      const response = await fetch('/api/work/download-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topicId: topic._id,
          user: {
            name: topic.userName,
            usn: topic.usn,
            profileimg: topic.userProfileImg || '',
          },
          subject: {
            subject: topic.subjectName,
          },
          topic: {
            topic: topic.topic,
            timestamp: topic.timestamp,
            images: topic.images,
            content: topic.content || '',
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Get the PDF blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${topic.topic}_${topic.subjectName}_${topic.userName}`.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Restore button state
      if (downloadBtn) {
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = '<span>Download</span>';
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
      
      // Restore button state
      const downloadBtn = document.querySelector(`[data-topic-index="${index}"] .ws-download-btn`);
      if (downloadBtn) {
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = '<span>Download</span>';
      }
    }
  };

  const handleShare = (topicId) => {
    const url = `${window.location.origin}/works/${topicId}`;
    if (navigator.share) {
      navigator.share({ title: 'Check this topic', url }).catch(err => console.log(err));
    } else {
      navigator.clipboard.writeText(url)
        .then(() => alert('Link copied to clipboard!'))
        .catch(() => alert('Failed to copy link'));
    }
  };

  const SkeletonLoader = () => (
    <div className="ws-skeleton-grid">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="ws-skeleton-card">
          <div className="ws-skeleton-header">
            <div className="ws-skeleton-title"></div>
            <div className="ws-skeleton-actions">
              <div className="ws-skeleton-btn"></div>
              <div className="ws-skeleton-btn"></div>
            </div>
          </div>
          <div className="ws-skeleton-meta">
            <div className="ws-skeleton-tag"></div>
            <div className="ws-skeleton-tag"></div>
            <div className="ws-skeleton-tag"></div>
          </div>
          <div className="ws-skeleton-content"></div>
          <div className="ws-skeleton-images">
            <div className="ws-skeleton-image"></div>
            <div className="ws-skeleton-image"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderTopicCard = (topic, index) => {
    const topicKey = `${topic.userId}-${topic.subjectName}-${topic.topic}`;
    const isExpanded = expandedImages[topicKey];
    const hasImages = topic.images && topic.images.filter(img => img && img.trim() !== '').length > 0;
    const validImages = hasImages ? topic.images.filter(img => img && img.trim() !== '') : [];
    const displayImages = isExpanded ? validImages : validImages.slice(0, 2);

    return (
      <div key={`${topicKey}-${index}`} className="ws-topic-card" data-topic-index={index}>
        <div className="ws-card-header">
          <div className="ws-topic-info">
            <Link href={`/works/${topic.topicId}`} className="ws-topic-link">
              <h3 className="ws-topic-title">{topic.topic}</h3>
            </Link>
            <Link href={`/search/${topic.usn.toLowerCase()}`} className="ws-user-link">
              <p className="ws-user-name">{topic.userName} ({topic.usn})</p>
            </Link>
            <div className="ws-topic-meta">
              <span className="ws-meta-item">
                <FiBook className="ws-meta-icon" />
                {topic.subjectName}
              </span>
              <span className="ws-meta-item">
                <FiCalendar className="ws-meta-icon" />
                {new Date(topic.timestamp).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="ws-card-actions">
            <button 
              onClick={() => downloadTopicAsPDF(topic, index)}
              className="ws-action-btn ws-download-btn"
              disabled={!hasImages}
              title="Download as PDF"
            >
              <FiDownload />
            </button>
            <button 
              onClick={() => handleShare(topic.topicId)}
              className="ws-action-btn ws-share-btn"
              title="Share Topic"
            >
              <FiShare2 />
            </button>
          </div>
        </div>

        {topic.content && <p className="ws-topic-content">{topic.content}</p>}

        {hasImages && (
          <div className="ws-images-section">
            <div className="ws-images-grid">
              {displayImages.map((imageUrl, imgIndex) => (
                <div key={imgIndex} className="ws-image-container">
                  <div className="ws-image-wrapper">
                    <img 
                      src={imageUrl} 
                      alt={`${topic.topic} - Image ${imgIndex + 1}`} 
                      className="ws-topic-image" 
                      loading="lazy" 
                    />
                  </div>
                </div>
              ))}
            </div>
            {validImages.length > 2 && (
              <button onClick={() => toggleImageExpansion(topicKey)} className="ws-view-more-btn">
                <FiEye />
                {isExpanded ? 'Show Less' : `View More (${validImages.length - 2} more)`}
                <FiChevronDown className={`ws-chevron ${isExpanded ? 'ws-rotated' : ''}`} />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="ws-container">
      <div className="ws-header">
        <div className="ws-search-container">
          <div className="ws-search-box">
            <FiSearch className="ws-search-icon" />
            <input
              type="text"
              placeholder="Search by name, USN, subject, or topic..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); handleSearch(e.target.value); }}
              className="ws-search-input"
            />
          </div>
        </div>
      </div>

      <div className="ws-content">
        {isLoading && <SkeletonLoader />}

        {!searchQuery && !isLoading && (
          <div className="ws-latest-section">
            <h2 className="ws-section-title">Latest Topics</h2>
            <div className="ws-topics-grid">{displayedTopics.map(renderTopicCard)}</div>

            {hasMore && (
              <div id="ws-scroll-sentinel" className="ws-scroll-sentinel">
                {isLoadingMore && (
                  <div className="ws-loading-more">
                    <div className="ws-spinner"></div>
                    <p>Loading more topics...</p>
                  </div>
                )}
              </div>
            )}

            {hasMore && !isLoadingMore && !isManualReloading && (
              <div className="ws-reload-section">
                <button 
                  onClick={handleManualReload} 
                  className="ws-reload-btn" 
                  disabled={isLoadingMore || isManualReloading}
                >
                  <FiRefreshCw className="ws-reload-icon" />
                  <span>Load More Topics</span>
                </button>
              </div>
            )}

            {(!hasMore || displayedTopics.length === 0) && (
              <div className="ws-end-reload-section">
                {displayedTopics.length > 0 && (
                  <div className="ws-end-message">
                    🎉 You have reached the end! All topics have been loaded.
                  </div>
                )}
                <button 
                  onClick={handleEndReload} 
                  className="ws-end-reload-btn" 
                  disabled={isLoadingMore || isManualReloading}
                >
                  <FiRotateCcw className="ws-end-reload-icon" />
                  <span>{displayedTopics.length > 0 ? 'Refresh Topics' : 'Load Topics'}</span>
                </button>
                {isManualReloading && (
                  <div className="ws-loading-more">
                    <div className="ws-spinner"></div>
                    <p>Refreshing...</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {searchQuery && !isLoading && (
          <div className="ws-results-section">
            <h2 className="ws-section-title">Search Results ({searchResults.length} found)</h2>
            {searchResults.length > 0 ? (
              <div className="ws-topics-grid">{searchResults.map(renderTopicCard)}</div>
            ) : (
              <div className="ws-no-results">
                <FiSearch className="ws-no-results-icon" />
                <h3>No results found</h3>
                <p>Try searching with different keywords</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkSearchInterface;