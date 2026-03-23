'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { FiSearch, FiDownload, FiEye, FiChevronDown, FiCalendar, FiBook, FiShare2, FiMoreVertical, FiExternalLink, FiFilter, FiCheck, FiZap } from 'react-icons/fi';
import { FaBookmark, FaRegBookmark } from 'react-icons/fa';
import SubjectTopicFilter from './SubjectTopicFilter';
import Ads from '../components/ads/Ads';
import ImageLoader from '../components/ImageLoader';
import './styles/WorkSearchInterface.css';
import { authFetch } from '@/lib/clientAuth';

// LocalStorage key for saved topics (same as in /works/[id])
const SAVED_TOPICS_KEY = 'learnix_saved_topics';

// Helper functions for localStorage
const getSavedTopics = () => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(SAVED_TOPICS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const isTopicSaved = (topicId) => {
  const savedTopics = getSavedTopics();
  return savedTopics.some(t => t.topic._id === topicId);
};

const saveTopic = (topic) => {
  if (typeof window === 'undefined' || !topic) return false;
  try {
    const savedTopics = getSavedTopics();
    const existingIndex = savedTopics.findIndex(t => t.topic._id === topic.topicId);

    const topicToSave = {
      topic: {
        _id: topic.topicId,
        topic: topic.topic,
        content: topic.content,
        images: topic.images,
        timestamp: topic.timestamp,
      },
      subject: {
        subject: topic.subjectName,
      },
      user: {
        name: topic.userName,
        usn: topic.usn,
        profileimg: topic.profileimg || '',
      },
      savedAt: new Date().toISOString(),
    };

    if (existingIndex !== -1) {
      savedTopics[existingIndex] = topicToSave;
    } else {
      savedTopics.push(topicToSave);
    }

    localStorage.setItem(SAVED_TOPICS_KEY, JSON.stringify(savedTopics));
    return true;
  } catch (err) {
    console.error('Error saving topic:', err);
    return false;
  }
};

const removeSavedTopic = (topicId) => {
  if (typeof window === 'undefined') return false;
  try {
    const savedTopics = getSavedTopics();
    const filtered = savedTopics.filter(t => t.topic._id !== topicId);
    localStorage.setItem(SAVED_TOPICS_KEY, JSON.stringify(filtered));
    return true;
  } catch (err) {
    console.error('Error removing saved topic:', err);
    return false;
  }
};

const WorkSearchInterface = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const updatesTickerMessages = [
    'See newly posted notes',
    'See newly posted files',
    'See newly posted announcements',
    'Click here to open updates',
  ];

  // Restore state from URL params so refresh keeps the search/filter state
  const initialQuery = searchParams.get('q') || '';
  const initialSubjects = searchParams.get('subjects')
    ? searchParams.get('subjects').split(',').filter(Boolean)
    : [];
  const initialTopics = searchParams.get('topics')
    ? searchParams.get('topics').split(',').filter(Boolean)
    : [];

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState([]);
  const [displayedTopics, setDisplayedTopics] = useState([]);
  const [allTopics, setAllTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [expandedImages, setExpandedImages] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedSubjects, setSelectedSubjects] = useState(initialSubjects);
  const [selectedTopics, setSelectedTopics] = useState(initialTopics);
  const [savedTopicIds, setSavedTopicIds] = useState([]);
  const [cachedSavedTopics, setCachedSavedTopics] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [sortOrder, setSortOrder] = useState('latest'); // 'latest' or 'oldest'
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const menuRef = useRef(null);
  const filterRef = useRef(null);

  const ITEMS_PER_LOAD = 8;
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotalPages, setSearchTotalPages] = useState(1);
  const [searchTotal, setSearchTotal] = useState(0); // real total count from API

  // Relevant (AI) results state
  const [relevantResults, setRelevantResults] = useState([]);
  const [relevantPage, setRelevantPage] = useState(1);
  const [relevantTotalPages, setRelevantTotalPages] = useState(1);
  const [relevantTotal, setRelevantTotal] = useState(0);
  const [relevantKeywords, setRelevantKeywords] = useState([]);
  const [isLoadingRelevant, setIsLoadingRelevant] = useState(false);
  const [isLoadingMoreRelevant, setIsLoadingMoreRelevant] = useState(false);
  const [showRelevant, setShowRelevant] = useState(false);
  const [updatesTickerIndex, setUpdatesTickerIndex] = useState(0);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilterPopup(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setUpdatesTickerIndex((prev) => (prev + 1) % updatesTickerMessages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [updatesTickerMessages.length]);

  // Load saved topics from localStorage immediately on mount (before server data)
  useEffect(() => {
    const saved = getSavedTopics();
    setSavedTopicIds(saved.map(t => t.topic._id));

    // Convert saved topics to display format for immediate rendering
    const savedForDisplay = saved.map(s => ({
      ...s.topic,
      topic: s.topic.topic,
      content: s.topic.content || '',
      images: s.topic.images || [],
      timestamp: s.topic.timestamp,
      topicId: s.topic._id,
      userName: s.user?.name || 'Unknown',
      usn: s.user?.usn || '',
      profileimg: s.user?.profileimg || '',
      subjectName: s.subject?.subject || 'Unknown Subject',
      userId: s.user?._id || '',
      isCached: true, // Mark as cached for visual indicator
    })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    setCachedSavedTopics(savedForDisplay);
  }, []);

  useEffect(() => {
    if (initialQuery || initialSubjects.length > 0 || initialTopics.length > 0) {
      // Restore search from URL params
      handleSearch(initialQuery, 1, initialSubjects, initialTopics);
    } else {
      fetchPagedTopics(1, true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  const fetchPagedTopics = async (pageToFetch = 1, reset = false) => {
    // Only show the full-page skeleton when doing an initial/reset load.
    if (reset) setIsLoading(true);
    try {
      // Use oldest API when sortOrder is 'oldest', otherwise use default (latest first)
      const apiEndpoint = sortOrder === 'oldest' ? '/api/work/oldest/paged' : '/api/work/paged';
      const response = await authFetch(`${apiEndpoint}?page=${pageToFetch}&pageSize=${ITEMS_PER_LOAD}`);
      const data = await response.json();
      if (data && Array.isArray(data.topics)) {
        const newTopics = data.topics.map(topic => ({
          ...topic,
          topicId: topic._id,
          subjectName: topic.subject,
          userName: topic.userName,
          usn: topic.usn,
          profileimg: topic.profileimg,
          userId: topic.userId,
        }));
        if (reset) {
          setAllTopics(newTopics);
          setDisplayedTopics(newTopics);
          setCurrentIndex(newTopics.length);
        } else {
          setAllTopics(prev => [...prev, ...newTopics]);
          setDisplayedTopics(prev => [...prev, ...newTopics]);
          setCurrentIndex(prev => prev + newTopics.length);
        }
        setPage(data.page);
        setTotalPages(data.totalPages);
        setHasMore(data.page < data.totalPages);
      }
    } catch (error) {
      console.error('Error fetching paged topics:', error);
    } finally {
      if (reset) setIsLoading(false);
    }
  };

  const handleSearch = async (query, pageNum = 1, subjectsOverride, topicsOverride) => {
    // Use overrides (from URL restore on mount) or current state
    const activeSubjects = subjectsOverride !== undefined ? subjectsOverride : selectedSubjects;
    const activeTopics   = topicsOverride   !== undefined ? topicsOverride   : selectedTopics;

    if (!query.trim() && activeSubjects.length === 0 && activeTopics.length === 0) {
      setSearchResults([]);
      setSearchPage(1);
      setSearchTotalPages(1);
      setSearchTotal(0);
      const filteredTopics = getFilteredTopics(allTopics);
      const firstBatch = filteredTopics.slice(0, ITEMS_PER_LOAD);
      setDisplayedTopics(firstBatch);
      setCurrentIndex(ITEMS_PER_LOAD);
      setHasMore(filteredTopics.length > ITEMS_PER_LOAD);
      window.history.replaceState({}, '', pathname);
      return;
    }
    // Page 1 = full skeleton; page > 1 = only button loading state (no skeleton)
    if (pageNum === 1) {
      setIsLoading(true);
      // Reset relevant section whenever the user triggers a fresh search
      setShowRelevant(false);
      setRelevantResults([]);
      setRelevantPage(1);
      setRelevantTotalPages(1);
      setRelevantTotal(0);
      setRelevantKeywords([]);
    } else setIsLoadingMore(true);
    try {
      // Build URL with query, subjects, and topics params
      const urlParams = new globalThis.URLSearchParams();
      if (query.trim()) urlParams.set('q', query);
      if (activeSubjects.length > 0) urlParams.set('subjects', activeSubjects.join(','));
      if (activeTopics.length > 0) urlParams.set('topics', activeTopics.join(','));
      urlParams.set('page', pageNum.toString());
      urlParams.set('pageSize', ITEMS_PER_LOAD.toString());

      const browserUrl = `${pathname}?${urlParams.toString()}`;
      window.history.replaceState({}, '', browserUrl);

      // Use oldest API when sortOrder is 'oldest', otherwise use default (latest first)
      const apiEndpoint = sortOrder === 'oldest' ? '/api/work/search-oldest' : '/api/work/search';
      const response = await authFetch(`${apiEndpoint}?${urlParams.toString()}`);
      const data = await response.json();
      if (data && Array.isArray(data.topics)) {
        const newTopics = data.topics.map(topic => ({
          ...topic,
          topicId: topic._id,
          subjectName: topic.subject,
          userName: topic.userName,
          usn: topic.usn,
          profileimg: topic.profileimg,
          userId: topic.userId,
        }));
        if (pageNum === 1) {
          setSearchResults(newTopics);
          setDisplayedTopics(newTopics);
          setSearchTotal(data.totalResults ?? data.total ?? newTopics.length);
          // Auto-load relevant if normal search returned nothing
          if (newTopics.length === 0 && query.trim()) {
            fetchRelevant(1, query);
          }
        } else {
          // Append for subsequent pages (View More)
          setSearchResults(prev => [...prev, ...newTopics]);
          setDisplayedTopics(prev => [...prev, ...newTopics]);
          // keep searchTotal unchanged — it was set on page 1
        }
        setSearchPage(data.page);
        setSearchTotalPages(data.totalPages);
        setHasMore(data.page < data.totalPages);
      }
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      if (pageNum === 1) setIsLoading(false);
      else setIsLoadingMore(false);
    }
  };

  const loadMoreTopics = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    fetchPagedTopics(page + 1);
  }, [hasMore, isLoadingMore, page]);

  const fetchRelevant = async (pageNum = 1, queryOverride) => {
    const query = queryOverride || searchParams.get('q') || searchQuery;
    if (!query.trim()) return;
    if (pageNum === 1) setIsLoadingRelevant(true);
    else setIsLoadingMoreRelevant(true);
    try {
      const res = await authFetch(`/api/work/relevant?q=${encodeURIComponent(query)}&page=${pageNum}`);
      const data = await res.json();
      if (data && Array.isArray(data.topics)) {
        const mapped = data.topics.map(topic => ({
          ...topic,
          topicId: topic._id,
          subjectName: topic.subject,
          userName: topic.userName,
          usn: topic.usn,
          profileimg: topic.profileimg,
          userId: topic.userId,
        }));
        if (pageNum === 1) {
          setRelevantResults(mapped);
          setRelevantTotal(data.totalResults ?? data.total ?? mapped.length);
          setRelevantKeywords(data.keywords || []);
        } else {
          setRelevantResults(prev => [...prev, ...mapped]);
        }
        setRelevantPage(data.page);
        setRelevantTotalPages(data.totalPages);
        setShowRelevant(true);
      }
    } catch (err) {
      console.error('Relevant fetch error:', err);
    } finally {
      if (pageNum === 1) setIsLoadingRelevant(false);
      else setIsLoadingMoreRelevant(false);
    }
  };


  const getFilteredTopics = (topics) => {
    let filtered = topics.filter(topic => {
      // Filter by saved if showSavedOnly is enabled
      if (showSavedOnly) {
        const topicId = topic.topicId || topic._id;
        if (!savedTopicIds.includes(topicId)) {
          return false;
        }
      }

      // If no subjects selected, show all
      if (selectedSubjects.length === 0) {
        return true;
      }

      // OR logic for subjects - if topic matches any selected subject
      const subjectMatch = selectedSubjects.includes(topic.subjectName);
      if (!subjectMatch) {
        return false;
      }

      // OR logic for topics - if no topics selected, show all from matched subjects
      if (selectedTopics.length === 0) {
        return true;
      }

      // If topics are selected, topic must match any selected topic
      return selectedTopics.includes(topic.topic);
    });

    // Apply sorting based on sortOrder
    filtered = filtered.sort((a, b) => {
      if (sortOrder === 'oldest') {
        return new Date(a.timestamp) - new Date(b.timestamp);
      }
      return new Date(b.timestamp) - new Date(a.timestamp); // latest by default
    });

    return filtered;
  };

  const handleFilterChange = (filters) => {
    const newSubjects = filters.subjects || [];
    const newTopics = filters.topics || [];
    setSelectedSubjects(newSubjects);
    setSelectedTopics(newTopics);

    // Immediately sync the URL so deselecting a chip removes it from the address bar
    const urlParams = new globalThis.URLSearchParams();
    if (searchQuery.trim()) urlParams.set('q', searchQuery);
    if (newSubjects.length > 0) urlParams.set('subjects', newSubjects.join(','));
    if (newTopics.length > 0) urlParams.set('topics', newTopics.join(','));
    const newUrl = urlParams.toString() ? `${pathname}?${urlParams.toString()}` : pathname;
    window.history.replaceState({}, '', newUrl);
  };

  // Apply filters when they change (subject/topic filters trigger search immediately)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // If subject or topic filters are applied, trigger search with current query
    if (selectedSubjects.length > 0 || selectedTopics.length > 0) {
      handleSearch(searchQuery, 1);
    } else if (showSavedOnly) {
      // Show saved only - client-side filter
      const filteredTopics = getFilteredTopics(allTopics);
      const initialTopics = filteredTopics.slice(0, ITEMS_PER_LOAD);
      setDisplayedTopics(initialTopics);
      setCurrentIndex(ITEMS_PER_LOAD);
      setHasMore(filteredTopics.length > ITEMS_PER_LOAD);
    } else if (!searchQuery) {
      // No filters and no search query - fetch fresh from backend based on sortOrder
      // Reset to page 1 and fetch from appropriate API (latest or oldest)
      setPage(1);
      fetchPagedTopics(1, true);
    }
  }, [selectedSubjects, selectedTopics, sortOrder, showSavedOnly, savedTopicIds]);

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
      const response = await authFetch('/api/work/download-pdf', {
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

  const handleShare = (topic) => {
    const url = `${window.location.origin}/works/${topic.topicId}`;
    const title = `${topic.topic} - ${topic.subjectName}`;
    const text = `Check out "${topic.topic}" uploaded by ${topic.userName} on Learnix`;

    if (navigator.share) {
      navigator.share({ title, text, url }).catch(err => console.log(err));
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`)
        .then(() => alert('Link copied to clipboard!'))
        .catch(() => alert('Failed to copy link'));
    }
  };

  const handleSaveToggle = (topic) => {
    const topicId = topic.topicId || topic._id;
    const isSaved = savedTopicIds.includes(topicId);

    if (isSaved) {
      removeSavedTopic(topicId);
      setSavedTopicIds(prev => prev.filter(id => id !== topicId));
    } else {
      saveTopic(topic);
      setSavedTopicIds(prev => [...prev, topicId]);
    }
  };

  // Ad component wrapper
  const AdSlot = ({ index }) => (
    <div className="ws-ad-slot" key={`ad-${index}`}>
      <Ads />
    </div>
  );

  // Render topics with ads after every 2 topics
  const renderTopicsWithAds = (topics) => {
    const elements = [];
    topics.forEach((topic, index) => {
      elements.push(renderTopicCard(topic, index));
      // After every 2 topics, insert an ad (after index 1, 3, 5, etc.)
      if ((index + 1) % 2 === 0) {
        elements.push(<AdSlot key={`ad-${index}`} index={index} />);
      }
    });
    return elements;
  };

  const SkeletonLoader = () => (
    <div className="ws-skeleton-grid">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="ws-skeleton-card">
          <div className="ws-skeleton-header">
            <div className="ws-skeleton-info">
              <div className="ws-skeleton-title"></div>
              <div className="ws-skeleton-subtitle"></div>
            </div>
            <div className="ws-skeleton-actions">
              <div className="ws-skeleton-btn"></div>
              <div className="ws-skeleton-btn"></div>
            </div>
          </div>
          <div className="ws-skeleton-meta">
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
    const topicId = topic.topicId || topic._id;
    const isSaved = savedTopicIds.includes(topicId);
    const isMenuOpen = openMenuId === topicId;

    const handleMenuToggle = (e) => {
      e.stopPropagation();
      setOpenMenuId(isMenuOpen ? null : topicId);
    };

    const handleOpenClick = () => {
      setOpenMenuId(null);
      window.open(`/works/${topic.topicId}`, "_blank", "noopener,noreferrer");
    };

    const handleShareClick = () => {
      setOpenMenuId(null);
      handleShare(topic);
    };

    const handleSaveClick = () => {
      setOpenMenuId(null);
      handleSaveToggle(topic);
    };

    return (
      <div key={`${topicKey}-${index}`} className={`ws-topic-card ${isSaved ? 'ws-saved-card' : ''}`} data-topic-index={index}>
        <div className="ws-card-header">
          <div className="ws-topic-info">
            <Link href={`/works/${topic.topicId}`} className="ws-topic-link" target="_blank" rel="noopener noreferrer">
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
                {new Date(topic.timestamp).toLocaleDateString('en-GB')}
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
            <div className="ws-menu-container" ref={isMenuOpen ? menuRef : null}>
              <button
                onClick={handleMenuToggle}
                className="ws-action-btn ws-more-btn"
                title="More options"
              >
                <FiMoreVertical />
              </button>
              {isMenuOpen && (
                <div className="ws-dropdown-menu">
                  <button className="ws-menu-item" onClick={handleOpenClick}>
                    <FiExternalLink className="ws-menu-icon" />
                    <span>Open</span>
                  </button>
                  <button className="ws-menu-item" onClick={handleShareClick}>
                    <FiShare2 className="ws-menu-icon" />
                    <span>Share</span>
                  </button>
                  <button className="ws-menu-item" onClick={handleSaveClick}>
                    {isSaved ? <FaBookmark className="ws-menu-icon" /> : <FaRegBookmark className="ws-menu-icon" />}
                    <span>{isSaved ? 'Unsave' : 'Save'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {topic.content && <p className="ws-topic-content">{topic.content}</p>}

        {hasImages && (
          <div className="ws-images-section">
            <div className="ws-images-grid">
              {displayImages.map((imageUrl, imgIndex) => (
                <Link key={imgIndex} href={`/works/${topic.topicId}`} className="ws-image-link" target="_blank" rel="noopener noreferrer">
                  <div className="ws-image-container">
                    <div className="ws-image-wrapper">
                      <ImageLoader
                        src={imageUrl}
                        alt={`${topic.topic} - Image ${imgIndex + 1}`}
                        className="ws-topic-image"
                        loading="lazy"
                      />
                    </div>
                  </div>
                </Link>
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
        <div className="ws-updates-banner-wrap">
          <Link href="/updates" className="ws-updates-banner" aria-label="Open updates page">
            <span className="ws-updates-banner-title">UPDATES</span>
            <span className="ws-updates-banner-ticker" aria-live="polite">
              <span key={updatesTickerIndex} className="ws-updates-banner-slide">
                {updatesTickerMessages[updatesTickerIndex]}
              </span>
            </span>
          </Link>
        </div>
        <div className="ws-search-container">
          <div className="ws-search-box">
            <input
              type="text"
              placeholder="Search by name, USN, subject, or topic..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value, 1);
              }}
              className="ws-search-input"
            />
            <button 
              type="button"
              className="ws-search-btn"
              onClick={() => handleSearch(searchQuery, 1)}
              aria-label="Search"
            >
              <FiSearch className="ws-search-icon" />
            </button>
          </div>
        </div>
        <SubjectTopicFilter
          onFilterChange={handleFilterChange}
          initialSubjects={initialSubjects}
          initialTopics={initialTopics}
        />
      </div>

      <div className="ws-content">
        {/* Show cached saved topics immediately while loading */}
        {isLoading && cachedSavedTopics.length > 0 && (
          <div className="ws-saved-section">
            <h2 className="ws-section-title ws-saved-title">
              <FaBookmark className="ws-saved-icon" />
              Your Saved Topics
            </h2>
            <div className="ws-topics-grid">
              {cachedSavedTopics.map((topic, index) => renderTopicCard(topic, index))}
            </div>
          </div>
        )}

        {/* Show skeleton loader below cached topics or alone if no cached */}
        {isLoading && <SkeletonLoader />}

        {!searchQuery && selectedSubjects.length === 0 && selectedTopics.length === 0 && !isLoading && (
          <div className="ws-latest-section">
            <div className="ws-section-header">
              <h2 className="ws-section-title">
                {showSavedOnly ? 'Saved Topics' : (sortOrder === 'oldest' ? 'Oldest Topics' : 'Latest Topics')}
              </h2>
              <div className="ws-filter-container" ref={filterRef}>
                <button
                  className={`ws-filter-btn ${(sortOrder !== 'latest' || showSavedOnly) ? 'ws-filter-active' : ''}`}
                  onClick={() => setShowFilterPopup(!showFilterPopup)}
                  title="Filter & Sort"
                >
                  <FiFilter />
                </button>
                {showFilterPopup && (
                  <div className="ws-filter-popup">
                    <div className="ws-filter-section">
                      <h4 className="ws-filter-label">Sort by</h4>
                      <button
                        className={`ws-filter-option ${sortOrder === 'latest' ? 'ws-filter-selected' : ''}`}
                        onClick={() => setSortOrder('latest')}
                      >
                        <span>Latest</span>
                        {sortOrder === 'latest' && <FiCheck className="ws-filter-check" />}
                      </button>
                      <button
                        className={`ws-filter-option ${sortOrder === 'oldest' ? 'ws-filter-selected' : ''}`}
                        onClick={() => setSortOrder('oldest')}
                      >
                        <span>Oldest</span>
                        {sortOrder === 'oldest' && <FiCheck className="ws-filter-check" />}
                      </button>
                    </div>
                    <div className="ws-filter-divider"></div>
                    <div className="ws-filter-section">
                      <h4 className="ws-filter-label">Filter</h4>
                      <button
                        className={`ws-filter-option ${showSavedOnly ? 'ws-filter-selected' : ''}`}
                        onClick={() => setShowSavedOnly(!showSavedOnly)}
                      >
                        <span>Saved Only</span>
                        {showSavedOnly && <FiCheck className="ws-filter-check" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="ws-topics-grid">{renderTopicsWithAds(displayedTopics)}</div>

            {hasMore && (
              <div className="ws-load-more-section">
                <button
                  onClick={loadMoreTopics}
                  className="ws-load-more-btn"
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <span className="ws-load-more-dots">
                      <span /><span /><span />
                    </span>
                  ) : (
                    'View More'
                  )}
                </button>
              </div>
            )}

            {!hasMore && displayedTopics.length > 0 && (
              <div className="ws-end-message">🎉 All topics loaded.</div>
            )}
          </div>
        )}

        {(searchQuery || selectedSubjects.length > 0 || selectedTopics.length > 0) && !isLoading && (
          <div className="ws-results-section">
            <h2 className="ws-section-title">Search Results ({searchTotal} found)</h2>
            {searchResults.length > 0 ? (
              <>
                <div className="ws-topics-grid">{renderTopicsWithAds(searchResults)}</div>
                {hasMore && (
                  <div className="ws-load-more-section">
                    <button
                      onClick={() => handleSearch(searchQuery, searchPage + 1)}
                      className="ws-load-more-btn"
                      disabled={isLoadingMore}
                    >
                      {isLoadingMore ? (
                        <span className="ws-load-more-dots">
                          <span /><span /><span />
                        </span>
                      ) : (
                        'View More'
                      )}
                    </button>
                  </div>
                )}
                {!hasMore && searchResults.length > 0 && (
                  <div className="ws-end-message">✅ All matching results loaded.</div>
                )}

                {/* Show Relevant button — only after all exact results are exhausted */}
                {!hasMore && !showRelevant && (
                  <div className="ws-relevant-trigger">
                    <button
                      className="ws-relevant-btn"
                      onClick={() => fetchRelevant(1)}
                      disabled={isLoadingRelevant}
                    >
                      {isLoadingRelevant ? (
                        <span className="ws-load-more-dots"><span /><span /><span /></span>
                      ) : (
                        <><FiZap className="ws-relevant-btn-icon" /> Show Relevant</>)
                      }
                    </button>
                    <p className="ws-relevant-hint">Find related topics using AI</p>
                  </div>
                )}
              </>
            ) : (
              /* No exact results — show relevant inline (auto-loaded) */
              <div className="ws-relevant-inline">
                {isLoadingRelevant ? (
                  <div className="ws-relevant-inline-loading">
                    <span className="ws-load-more-dots"><span /><span /><span /></span>
                    <p className="ws-relevant-auto-hint">
                      <FiZap className="ws-relevant-auto-hint-icon" /> Finding relevant topics…
                    </p>
                  </div>
                ) : relevantResults.length > 0 ? (
                  <>
                    <div className="ws-relevant-header">
                      <h3 className="ws-relevant-inline-title">
                        <FiZap className="ws-relevant-title-icon" /> Relevant Results
                        <span className="ws-relevant-count">({relevantTotal} found)</span>
                      </h3>
                      {relevantKeywords.length > 0 && (
                        <div className="ws-relevant-keywords">
                          <span className="ws-relevant-keywords-label">Related to:</span>
                          {relevantKeywords.map((kw, i) => (
                            <span key={i} className="ws-relevant-keyword-chip">{kw}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="ws-topics-grid">{renderTopicsWithAds(relevantResults)}</div>
                    {relevantPage < relevantTotalPages && (
                      <div className="ws-load-more-section">
                        <button
                          className="ws-load-more-btn ws-relevant-more-btn"
                          onClick={() => fetchRelevant(relevantPage + 1)}
                          disabled={isLoadingMoreRelevant}
                        >
                          {isLoadingMoreRelevant ? (
                            <span className="ws-load-more-dots"><span /><span /><span /></span>
                          ) : 'View More Relevant'}
                        </button>
                      </div>
                    )}
                    {relevantPage >= relevantTotalPages && (
                      <div className="ws-end-message">✅ All relevant results loaded.</div>
                    )}
                  </>
                ) : showRelevant ? (
                  /* AI ran but found nothing */
                  <div className="ws-no-results">
                    <FiZap className="ws-no-results-icon" />
                    <h3>No relevant results found</h3>
                    <p>The AI could not find related topics for this query</p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}

        {/* ── Relevant section below normal results (only when normal results existed) ── */}
        {showRelevant && searchResults.length > 0 && (
          <div className="ws-relevant-section">
            <div className="ws-relevant-header">
              <h2 className="ws-section-title">
                <FiZap className="ws-relevant-title-icon" />
                Relevant Results
                <span className="ws-relevant-count">({relevantTotal} found)</span>
              </h2>
              {relevantKeywords.length > 0 && (
                <div className="ws-relevant-keywords">
                  <span className="ws-relevant-keywords-label">Related to:</span>
                  {relevantKeywords.map((kw, i) => (
                    <span key={i} className="ws-relevant-keyword-chip">{kw}</span>
                  ))}
                </div>
              )}
            </div>
            {relevantResults.length > 0 ? (
              <>
                <div className="ws-topics-grid">{renderTopicsWithAds(relevantResults)}</div>
                {relevantPage < relevantTotalPages && (
                  <div className="ws-load-more-section">
                    <button
                      className="ws-load-more-btn ws-relevant-more-btn"
                      onClick={() => fetchRelevant(relevantPage + 1)}
                      disabled={isLoadingMoreRelevant}
                    >
                      {isLoadingMoreRelevant ? (
                        <span className="ws-load-more-dots"><span /><span /><span /></span>
                      ) : 'View More Relevant'}
                    </button>
                  </div>
                )}
                {relevantPage >= relevantTotalPages && (
                  <div className="ws-end-message">✅ All relevant results loaded.</div>
                )}
              </>
            ) : (
              <div className="ws-no-results">
                <FiZap className="ws-no-results-icon" />
                <h3>No relevant results found</h3>
                <p>The AI could not find related topics for this query</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkSearchInterface;