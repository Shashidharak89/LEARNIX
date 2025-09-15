'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, Download, Eye, ChevronDown, Calendar, User, BookOpen, RefreshCw, RotateCcw } from 'lucide-react';
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

  const ITEMS_PER_LOAD = 8; // Adjust based on your needs

  // Fetch all topics on component mount
  useEffect(() => {
    fetchAllTopics();
  }, []);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !searchQuery && !isManualReloading) {
          loadMoreTopics();
        }
      },
      { threshold: 0.1 }
    );

    const sentinel = document.getElementById('scroll-sentinel');
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
      
      // Extract and sort all topics by timestamp
      const topics = [];
      data.users.forEach(user => {
        user.subjects?.forEach(subject => {
          subject.topics?.forEach(topic => {
            topics.push({
              ...topic,
              userName: user.name,
              usn: user.usn,
              subjectName: subject.subject,
              userId: user._id
            });
          });
        });
      });

      // Sort by timestamp (newest first)
      const sortedTopics = topics
        .filter(topic => topic.timestamp)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setAllTopics(sortedTopics);
      
      // Load initial batch
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
      } else {
        setHasMore(false);
      }
      setIsLoadingMore(false);
    }, 500); // Small delay to show loading state
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
    
    // Check if there are more topics to load
    const remainingTopics = allTopics.length - currentIndex;
    if (remainingTopics > 0) {
      setTimeout(() => {
        const nextBatch = allTopics.slice(currentIndex, currentIndex + ITEMS_PER_LOAD);
        if (nextBatch.length > 0) {
          setDisplayedTopics(prev => [...prev, ...nextBatch]);
          setCurrentIndex(prev => prev + ITEMS_PER_LOAD);
          setHasMore(currentIndex + ITEMS_PER_LOAD < allTopics.length);
        } else {
          setHasMore(false);
        }
        setIsManualReloading(false);
      }, 500);
    } else {
      // Re-fetch all topics if no more are available
      fetchAllTopics().then(() => {
        setIsManualReloading(false);
      });
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      // Reset to initial state when search is cleared
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
        // Search in user details
        if (topic.userName.toLowerCase().includes(searchTerm) || 
            topic.usn.toLowerCase().includes(searchTerm) ||
            topic.subjectName.toLowerCase().includes(searchTerm) ||
            topic.topic.toLowerCase().includes(searchTerm) ||
            topic.content.toLowerCase().includes(searchTerm)) {
          results.push({
            ...topic,
            matchType: 'search'
          });
        }
      });

      // Remove duplicates and sort by timestamp
      const uniqueResults = results.filter((item, index, self) => 
        index === self.findIndex(t => t.topic === item.topic && t.userId === item.userId && t.subjectName === item.subjectName)
      );

      setSearchResults(uniqueResults.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleImageExpansion = (topicKey) => {
    setExpandedImages(prev => ({
      ...prev,
      [topicKey]: !prev[topicKey]
    }));
  };

  const downloadTopicAsPDF = async (topic, index) => {
    if (!topic.images || topic.images.length === 0) {
      alert('No images available for this topic');
      return;
    }

    try {
      // Import jsPDF dynamically
      const jsPDF = (await import('jspdf')).default;
      
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      
      // Add title page
      pdf.setFontSize(20);
      pdf.text(`${topic.topic}`, margin, 30);
      pdf.setFontSize(12);
      pdf.text(`Subject: ${topic.subjectName}`, margin, 50);
      pdf.text(`Student: ${topic.userName} (${topic.usn})`, margin, 65);
      pdf.text(`Date: ${new Date(topic.timestamp).toLocaleDateString()}`, margin, 80);
      
      let imagePromises = topic.images
        .filter(url => url && url.trim() !== '')
        .map((imageUrl, imgIndex) => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve({ img, imgIndex });
            img.onerror = () => reject(`Failed to load image ${imgIndex + 1}`);
            img.src = imageUrl;
          });
        });

      const loadedImages = await Promise.all(imagePromises);
      
      for (let i = 0; i < loadedImages.length; i++) {
        const { img } = loadedImages[i];
        
        if (i > 0) pdf.addPage();
        
        // Calculate image dimensions to fit page
        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;
        const ratio = Math.min(
          (pageWidth - 2 * margin) / imgWidth,
          (pageHeight - 2 * margin) / imgHeight
        );
        
        const width = imgWidth * ratio;
        const height = imgHeight * ratio;
        const x = (pageWidth - width) / 2;
        const y = (pageHeight - height) / 2;
        
        pdf.addImage(img, 'JPEG', x, y, width, height);
      }
      
      // Save the PDF
      const fileName = `${topic.topic}_${topic.subjectName}_${topic.userName}.pdf`.replace(/[^a-zA-Z0-9]/g, '_');
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const renderTopicCard = (topic, index) => {
    const topicKey = `${topic.userId}-${topic.subjectName}-${topic.topic}`;
    const isExpanded = expandedImages[topicKey];
    const hasImages = topic.images && topic.images.filter(img => img && img.trim() !== '').length > 0;
    const validImages = hasImages ? topic.images.filter(img => img && img.trim() !== '') : [];
    const displayImages = isExpanded ? validImages : validImages.slice(0, 2);

    return (
      <div key={`${topicKey}-${index}`} className="work-search-topic-card">
        <div className="work-search-card-header">
          <div className="work-search-topic-info">
            <Link href={`/search/${topic.usn.toLowerCase()}`} className="work-search-profile-link">
              <h3 className="work-search-topic-title">{topic.userName} ({topic.usn})</h3>
            </Link>
            <div className="work-search-topic-meta">
              <span className="work-search-meta-item">
                <BookOpen size={14} />
                {topic.subjectName}
              </span>
              <span className="work-search-meta-item">
                <User size={14} />
                {topic.topic}
              </span>
              <span className="work-search-meta-item">
                <Calendar size={14} />
                {new Date(topic.timestamp).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="work-search-card-actions">
            <button 
              onClick={() => downloadTopicAsPDF(topic, index)}
              className="work-search-action-btn work-search-download-btn"
              disabled={!hasImages}
              title="Download as PDF"
            >
              <Download size={16} />
            </button>
          </div>
        </div>

        {topic.content && (
          <p className="work-search-topic-content">{topic.content}</p>
        )}

        {hasImages && (
          <div className="work-search-images-section">
            <div className="work-search-images-grid">
              {displayImages.map((imageUrl, imgIndex) => (
                <div key={imgIndex} className="work-search-image-container">
                  <div className="work-search-image-wrapper">
                    <img 
                      src={imageUrl} 
                      alt={`${topic.topic} - Image ${imgIndex + 1}`}
                      className="work-search-topic-image"
                      loading="lazy"
                    />
                  </div>
                </div>
              ))}
            </div>
            
            {validImages.length > 2 && (
              <button 
                onClick={() => toggleImageExpansion(topicKey)}
                className="work-search-view-more-btn"
              >
                <Eye size={16} />
                {isExpanded ? 'Show Less' : `View More (${validImages.length - 2} more)`}
                <ChevronDown 
                  size={16} 
                  className={`work-search-chevron ${isExpanded ? 'work-search-rotated' : ''}`}
                />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="work-search-container">
      <div className="work-search-header">
        <h1 className="work-search-title">Work Records Search</h1>
        
        <div className="work-search-search-container">
          <div className="work-search-search-box">
            <Search className="work-search-search-icon" size={20} />
            <input
              type="text"
              placeholder="Search by name, USN, subject, or topic..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              className="work-search-search-input"
            />
          </div>
        </div>
      </div>

      <div className="work-search-content">
        {isLoading && (
          <div className="work-search-loading">
            <div className="work-search-spinner"></div>
            <p>Loading...</p>
          </div>
        )}

        {!searchQuery && !isLoading && (
          <div className="work-search-latest-section">
            <h2 className="work-search-section-title">Latest Topics</h2>
            <div className="work-search-topics-grid">
              {displayedTopics.map((topic, index) => renderTopicCard(topic, index))}
            </div>
            
            {/* Infinite scroll sentinel */}
            {hasMore && (
              <div id="scroll-sentinel" className="work-search-scroll-sentinel">
                {isLoadingMore && (
                  <div className="work-search-loading-more">
                    <div className="work-search-spinner"></div>
                    <p>Loading more topics...</p>
                  </div>
                )}
              </div>
            )}

            {/* Manual reload button - shows when there are more items and not currently loading */}
            {hasMore && !isLoadingMore && !isManualReloading && (
              <div className="work-search-reload-section">
                <button 
                  onClick={handleManualReload}
                  className="work-search-reload-btn"
                  disabled={isLoadingMore || isManualReloading}
                >
                  <RefreshCw 
                    size={20} 
                    className="work-search-reload-icon"
                  />
                  <span className="work-search-reload-text">Load More Topics</span>
                </button>
              </div>
            )}

            {/* End reload button - shows when no more items or to refresh the list */}
            {(!hasMore || displayedTopics.length === 0) && (
              <div className="work-search-end-reload-section">
                {displayedTopics.length > 0 && (
                  <div className="work-search-end-message">
                    🎉 You have reached the end! All topics have been loaded.
                  </div>
                )}
                <button 
                  onClick={handleEndReload}
                  className="work-search-end-reload-btn"
                  disabled={isLoadingMore || isManualReloading}
                >
                  <RotateCcw 
                    size={18} 
                    className="work-search-end-reload-icon"
                  />
                  <span className="work-search-reload-text">
                    {displayedTopics.length > 0 ? 'Refresh Topics' : 'Load Topics'}
                  </span>
                </button>
                {isManualReloading && (
                  <div className="work-search-loading-more">
                    <div className="work-search-spinner"></div>
                    <p>Refreshing...</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {searchQuery && !isLoading && (
          <div className="work-search-results-section">
            <h2 className="work-search-section-title">
              Search Results ({searchResults.length} found)
            </h2>
            {searchResults.length > 0 ? (
              <div className="work-search-topics-grid">
                {searchResults.map((topic, index) => renderTopicCard(topic, index))}
              </div>
            ) : (
              <div className="work-search-no-results">
                <Search size={48} />
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