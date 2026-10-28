'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiX, FiChevronDown, FiFilter } from 'react-icons/fi';
import './SubjectTopicFilter.css';
import { authFetch } from '@/lib/clientAuth';

const PAGE_SIZE = 10;

const SubjectTopicFilter = ({ onFilterChange, initialSubjects = [], initialTopics = [] }) => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState(initialSubjects);
  const [subjectPage, setSubjectPage] = useState(1);
  const [hasMoreSubjects, setHasMoreSubjects] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [isLoadingMoreSubjects, setIsLoadingMoreSubjects] = useState(false);

  const [topics, setTopics] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState(initialTopics);
  const [topicPage, setTopicPage] = useState(1);
  const [hasMoreTopics, setHasMoreTopics] = useState(false);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [isLoadingMoreTopics, setIsLoadingMoreTopics] = useState(false);

  const subjectsScrollRef = useRef(null);
  const topicsScrollRef = useRef(null);
  const hasFetchedSubjectsRef = useRef(false);

  // Fetch subjects lazily on user interaction or if initialSubjects were passed in URL
  const fetchInitialSubjects = useCallback(async () => {
    if (hasFetchedSubjectsRef.current) return;
    hasFetchedSubjectsRef.current = true;

    setIsLoadingSubjects(true);
    try {
      const response = await authFetch(`/api/resources/suggestions/subjects?page=1&limit=${PAGE_SIZE}`);
      const data = await response.json();

      if (data && data.subjects) {
        let combinedSubjects = [...data.subjects];
        if (initialSubjects && initialSubjects.length > 0) {
          initialSubjects.forEach((initSubj) => {
            if (!combinedSubjects.some((s) => s.name === initSubj)) {
              combinedSubjects.push({ name: initSubj });
            }
          });
        }

        setSubjects(combinedSubjects);
        setSubjectPage(1);
        setHasMoreSubjects(Boolean(data.hasMore));
      }
    } catch (error) {
      console.error('Error fetching subjects suggestions:', error);
    } finally {
      setIsLoadingSubjects(false);
    }
  }, [initialSubjects]);

  // Only auto-fetch if initialSubjects were explicitly restored from URL
  useEffect(() => {
    if (initialSubjects && initialSubjects.length > 0) {
      fetchInitialSubjects();
    }
  }, [initialSubjects, fetchInitialSubjects]);

  // Load next page of subjects (Paging with size 10)
  const handleLoadMoreSubjects = async () => {
    if (isLoadingMoreSubjects || !hasMoreSubjects) return;

    setIsLoadingMoreSubjects(true);
    const nextPage = subjectPage + 1;
    try {
      const response = await authFetch(`/api/resources/suggestions/subjects?page=${nextPage}&limit=${PAGE_SIZE}`);
      const data = await response.json();

      if (data.subjects && data.subjects.length > 0) {
        setSubjects((prev) => {
          const existingNames = new Set(prev.map((s) => s.name));
          const newItems = data.subjects.filter((s) => !existingNames.has(s.name));
          return [...prev, ...newItems];
        });
        setSubjectPage(nextPage);
        setHasMoreSubjects(Boolean(data.hasMore));

        // Smooth scroll slightly to the right to hint at new content
        setTimeout(() => {
          if (subjectsScrollRef.current) {
            subjectsScrollRef.current.scrollBy({ left: 180, behavior: 'smooth' });
          }
        }, 50);
      } else {
        setHasMoreSubjects(false);
      }
    } catch (error) {
      console.error('Error loading more subjects:', error);
    } finally {
      setIsLoadingMoreSubjects(false);
    }
  };

  // Fetch topics when selectedSubjects change
  // Searches topic exactly by subject name
  const fetchTopicsForSubject = useCallback(async (subjectName, pageNum = 1, append = false) => {
    if (!subjectName) return;

    if (append) {
      setIsLoadingMoreTopics(true);
    } else {
      setIsLoadingTopics(true);
    }

    try {
      const response = await authFetch(
        `/api/resources/suggestions/topics?subject=${encodeURIComponent(subjectName)}&page=${pageNum}&limit=${PAGE_SIZE}`
      );
      const data = await response.json();

      if (data.topics) {
        if (append) {
          setTopics((prev) => {
            const existing = new Set(prev);
            const newTopics = data.topics.filter((t) => !existing.has(t));
            return [...prev, ...newTopics];
          });
          setTopicPage(pageNum);
          setHasMoreTopics(Boolean(data.hasMore));

          setTimeout(() => {
            if (topicsScrollRef.current) {
              topicsScrollRef.current.scrollBy({ left: 180, behavior: 'smooth' });
            }
          }, 50);
        } else {
          setTopics(data.topics);
          setTopicPage(1);
          setHasMoreTopics(Boolean(data.hasMore));
        }
      }
    } catch (error) {
      console.error('Error fetching topics suggestions:', error);
    } finally {
      if (append) {
        setIsLoadingMoreTopics(false);
      } else {
        setIsLoadingTopics(false);
      }
    }
  }, []);

  // When selectedSubjects change, fetch topics for the currently selected subject(s)
  useEffect(() => {
    if (selectedSubjects.length > 0) {
      const activeSubject = selectedSubjects[selectedSubjects.length - 1];
      fetchTopicsForSubject(activeSubject, 1, false);
    } else {
      setTopics([]);
      setSelectedTopics([]);
      setTopicPage(1);
      setHasMoreTopics(false);
    }
  }, [selectedSubjects, fetchTopicsForSubject]);

  // Load next page of topics (Paging with size 10)
  const handleLoadMoreTopics = async () => {
    if (isLoadingMoreTopics || !hasMoreTopics || selectedSubjects.length === 0) return;
    const activeSubject = selectedSubjects[selectedSubjects.length - 1];
    const nextPage = topicPage + 1;
    await fetchTopicsForSubject(activeSubject, nextPage, true);
  };

  const notifyParent = (nextSubjects, nextTopics) => {
    onFilterChange({ subjects: nextSubjects, topics: nextTopics });
  };

  const handleSubjectClick = (subjectName) => {
    const next = selectedSubjects.includes(subjectName)
      ? selectedSubjects.filter((s) => s !== subjectName)
      : [...selectedSubjects, subjectName];
    setSelectedSubjects(next);

    const nextTopics = next.length === 0 ? [] : selectedTopics;
    if (next.length === 0) setSelectedTopics([]);
    notifyParent(next, nextTopics);
  };

  const handleTopicClick = (topic) => {
    const next = selectedTopics.includes(topic)
      ? selectedTopics.filter((t) => t !== topic)
      : [...selectedTopics, topic];
    setSelectedTopics(next);
    notifyParent(selectedSubjects, next);
  };

  const handleClearSubject = (e, subjectName) => {
    e.stopPropagation();
    const next = selectedSubjects.filter((s) => s !== subjectName);
    setSelectedSubjects(next);
    const nextTopics = next.length === 0 ? [] : selectedTopics;
    if (next.length === 0) setSelectedTopics([]);
    notifyParent(next, nextTopics);
  };

  const handleClearTopic = (e, topic) => {
    e.stopPropagation();
    const next = selectedTopics.filter((t) => t !== topic);
    setSelectedTopics(next);
    notifyParent(selectedSubjects, next);
  };

  // Skeleton loader for chips - fills full width
  const SkeletonChips = () => (
    <div className="stf-skeleton-row">
      <div className="stf-skeleton-chip"></div>
      <div className="stf-skeleton-chip"></div>
      <div className="stf-skeleton-chip"></div>
      <div className="stf-skeleton-chip"></div>
      <div className="stf-skeleton-chip"></div>
      <div className="stf-skeleton-chip"></div>
      <div className="stf-skeleton-chip"></div>
      <div className="stf-skeleton-chip"></div>
      <div className="stf-skeleton-chip"></div>
      <div className="stf-skeleton-chip"></div>
    </div>
  );

  return (
    <div className="stf-container">
      {/* Subjects Section */}
      <div className="stf-scroll-wrapper">
        <div className="stf-scroll-container" ref={subjectsScrollRef}>
          {isLoadingSubjects ? (
            <SkeletonChips />
          ) : subjects.length > 0 ? (
            <>
              {subjects.map((subject) => {
                const subjectName = subject.name || subject;
                const isSelected = selectedSubjects.includes(subjectName);
                return (
                  <button
                    key={subjectName}
                    className={`stf-chip stf-subject-chip ${isSelected ? 'stf-active' : ''}`}
                    onClick={() => handleSubjectClick(subjectName)}
                  >
                    <span className="stf-chip-text">{subjectName}</span>
                    {isSelected && (
                      <FiX
                        size={16}
                        className="stf-chip-close"
                        onClick={(e) => handleClearSubject(e, subjectName)}
                      />
                    )}
                  </button>
                );
              })}

              {/* Next page '>>' button for subjects */}
              {hasMoreSubjects && (
                <button
                  type="button"
                  className="stf-more-btn"
                  onClick={handleLoadMoreSubjects}
                  disabled={isLoadingMoreSubjects}
                  title="Load next 10 subjects"
                  aria-label="Load more subjects"
                >
                  {isLoadingMoreSubjects ? (
                    <span className="stf-more-spinner" />
                  ) : (
                    <FiChevronDown className="stf-more-icon" size={16} />
                  )}
                </button>
              )}
            </>
          ) : !hasFetchedSubjectsRef.current ? (
            <button
              type="button"
              className="stf-chip stf-filter-trigger"
              onClick={fetchInitialSubjects}
              onMouseEnter={fetchInitialSubjects}
              onFocus={fetchInitialSubjects}
              title="Click to load subjects for filtering"
            >
              <FiFilter size={14} className="stf-trigger-icon" />
              <span>Filter by Subject</span>
            </button>
          ) : (
            <div className="stf-empty-state">No subjects found</div>
          )}
        </div>
      </div>

      {/* Topics Section - Shows when subjects are selected */}
      {selectedSubjects.length > 0 && (
        <div className="stf-scroll-wrapper">
          <div className="stf-scroll-container" ref={topicsScrollRef}>
            {isLoadingTopics ? (
              <SkeletonChips />
            ) : topics.length > 0 ? (
              <>
                {topics.map((topic) => {
                  const isSelected = selectedTopics.includes(topic);
                  return (
                    <button
                      key={topic}
                      className={`stf-chip stf-topic-chip ${isSelected ? 'stf-active' : ''}`}
                      onClick={() => handleTopicClick(topic)}
                    >
                      <span className="stf-chip-text">{topic}</span>
                      {isSelected && (
                        <FiX
                          size={16}
                          className="stf-chip-close"
                          onClick={(e) => handleClearTopic(e, topic)}
                        />
                      )}
                    </button>
                  );
                })}

                {/* Next page '>>' button for topics */}
                {hasMoreTopics && (
                  <button
                    type="button"
                    className="stf-more-btn"
                    onClick={handleLoadMoreTopics}
                    disabled={isLoadingMoreTopics}
                    title="Load next 10 topics"
                    aria-label="Load more topics"
                  >
                    {isLoadingMoreTopics ? (
                      <span className="stf-more-spinner" />
                    ) : (
                      <FiChevronDown className="stf-more-icon" size={16} />
                    )}
                  </button>
                )}
              </>
            ) : (
              <div className="stf-empty-state">No topics found for this subject</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectTopicFilter;

