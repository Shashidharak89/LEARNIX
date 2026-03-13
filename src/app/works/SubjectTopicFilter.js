'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';
import './SubjectTopicFilter.css';
import { authFetch } from '@/lib/clientAuth';

const SubjectTopicFilter = ({ onFilterChange, initialSubjects = [], initialTopics = [] }) => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState(initialSubjects);
  const [topics, setTopics] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState(initialTopics);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  
  const subjectsScrollRef = useRef(null);
  const topicsScrollRef = useRef(null);

  // Fetch all public subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      setIsLoadingSubjects(true);
      try {
        const response = await authFetch('/api/subject/public');
        const data = await response.json();
        if (data.subjects) {
          setSubjects(data.subjects);
        }
      } catch (error) {
        console.error('Error fetching subjects:', error);
      } finally {
        setIsLoadingSubjects(false);
      }
    };

    fetchSubjects();
  }, []);

  // Fetch topics when subjects are selected (also runs on mount if initialSubjects provided)
  useEffect(() => {
    if (selectedSubjects.length > 0) {
      const fetchTopics = async () => {
        setIsLoadingTopics(true);
        try {
          const topicsSet = new Set();
          
          // Fetch topics for each selected subject
          for (const subject of selectedSubjects) {
            const response = await authFetch(`/api/topic/by-subject?subject=${encodeURIComponent(subject)}`);
            const data = await response.json();
            if (data.topics) {
              data.topics.forEach(topic => topicsSet.add(topic));
            }
          }
          
          setTopics(Array.from(topicsSet).sort());
          // Do NOT clear selectedTopics here — preserve them when restoring from URL
          // Only clear when subjects actually change (handled by tracking prev subjects)
        } catch (error) {
          console.error('Error fetching topics:', error);
        } finally {
          setIsLoadingTopics(false);
        }
      };

      fetchTopics();
    } else {
      setTopics([]);
      setSelectedTopics([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubjects]);

  // Notify parent of filter changes
  // Called inline in each handler (not via useEffect) so the URL updates immediately on click
  const notifyParent = (nextSubjects, nextTopics) => {
    onFilterChange({ subjects: nextSubjects, topics: nextTopics });
  };

  const handleSubjectClick = (subject) => {
    const next = selectedSubjects.includes(subject)
      ? selectedSubjects.filter(s => s !== subject)
      : [...selectedSubjects, subject];
    setSelectedSubjects(next);
    // When a subject is removed, topics that were selected may no longer be relevant —
    // clear selectedTopics to stay consistent, then notify parent immediately
    const nextTopics = next.length === 0 ? [] : selectedTopics;
    if (next.length === 0) setSelectedTopics([]);
    notifyParent(next, nextTopics);
  };

  const handleTopicClick = (topic) => {
    const next = selectedTopics.includes(topic)
      ? selectedTopics.filter(t => t !== topic)
      : [...selectedTopics, topic];
    setSelectedTopics(next);
    notifyParent(selectedSubjects, next);
  };

  const handleClearSubject = (e, subject) => {
    e.stopPropagation();
    const next = selectedSubjects.filter(s => s !== subject);
    setSelectedSubjects(next);
    const nextTopics = next.length === 0 ? [] : selectedTopics;
    if (next.length === 0) setSelectedTopics([]);
    notifyParent(next, nextTopics);
  };

  const handleClearTopic = (e, topic) => {
    e.stopPropagation();
    const next = selectedTopics.filter(t => t !== topic);
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
            subjects.map((subject) => (
              <button
                key={subject.name}
                className={`stf-chip stf-subject-chip ${
                  selectedSubjects.includes(subject.name) ? 'stf-active' : ''
                }`}
                onClick={() => handleSubjectClick(subject.name)}
              >
                <span className="stf-chip-text">{subject.name}</span>
                {selectedSubjects.includes(subject.name) && (
                  <FiX
                    size={16}
                    className="stf-chip-close"
                    onClick={(e) => handleClearSubject(e, subject.name)}
                  />
                )}
              </button>
            ))
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
              topics.map((topic) => (
                <button
                  key={topic}
                  className={`stf-chip stf-topic-chip ${
                    selectedTopics.includes(topic) ? 'stf-active' : ''
                  }`}
                  onClick={() => handleTopicClick(topic)}
                >
                  <span className="stf-chip-text">{topic}</span>
                  {selectedTopics.includes(topic) && (
                    <FiX
                      size={16}
                      className="stf-chip-close"
                      onClick={(e) => handleClearTopic(e, topic)}
                    />
                  )}
                </button>
              ))
            ) : (
              <div className="stf-empty-state">No topics found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectTopicFilter;
