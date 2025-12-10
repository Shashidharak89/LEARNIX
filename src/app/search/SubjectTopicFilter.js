'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';
import './SubjectTopicFilter.css';

const SubjectTopicFilter = ({ onFilterChange }) => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  
  const subjectsScrollRef = useRef(null);
  const topicsScrollRef = useRef(null);

  // Fetch all public subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      setIsLoadingSubjects(true);
      try {
        const response = await fetch('/api/subject/public');
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

  // Fetch topics when subject is selected
  useEffect(() => {
    if (selectedSubject) {
      const fetchTopics = async () => {
        setIsLoadingTopics(true);
        try {
          const response = await fetch(`/api/topic/by-subject?subject=${encodeURIComponent(selectedSubject)}`);
          const data = await response.json();
          if (data.topics) {
            setTopics(data.topics);
            setSelectedTopic(null);
          }
        } catch (error) {
          console.error('Error fetching topics:', error);
        } finally {
          setIsLoadingTopics(false);
        }
      };

      fetchTopics();
    } else {
      setTopics([]);
      setSelectedTopic(null);
    }
  }, [selectedSubject]);

  // Notify parent of filter changes
  useEffect(() => {
    onFilterChange({
      subject: selectedSubject,
      topic: selectedTopic
    });
  }, [selectedSubject, selectedTopic, onFilterChange]);

  const handleSubjectClick = (subject) => {
    setSelectedSubject(selectedSubject === subject ? null : subject);
  };

  const handleTopicClick = (topic) => {
    setSelectedTopic(selectedTopic === topic ? null : topic);
  };

  const handleClearSubject = (e) => {
    e.stopPropagation();
    setSelectedSubject(null);
  };

  const handleClearTopic = (e) => {
    e.stopPropagation();
    setSelectedTopic(null);
  };

  return (
    <div className="stf-container">
      {/* Subjects Section */}
      <div className="stf-scroll-wrapper">
        <div className="stf-scroll-container" ref={subjectsScrollRef}>
          {isLoadingSubjects ? (
            <div className="stf-loading-state">Loading...</div>
          ) : subjects.length > 0 ? (
            subjects.map((subject) => (
              <button
                key={subject.name}
                className={`stf-chip stf-subject-chip ${
                  selectedSubject === subject.name ? 'stf-active' : ''
                }`}
                onClick={() => handleSubjectClick(subject.name)}
              >
                <span className="stf-chip-text">{subject.name}</span>
                {selectedSubject === subject.name && (
                  <FiX
                    size={16}
                    className="stf-chip-close"
                    onClick={handleClearSubject}
                  />
                )}
              </button>
            ))
          ) : (
            <div className="stf-empty-state">No subjects found</div>
          )}
        </div>
      </div>

      {/* Topics Section - Shows when subject is selected */}
      {selectedSubject && (
        <div className="stf-scroll-wrapper">
          <div className="stf-scroll-container" ref={topicsScrollRef}>
            {isLoadingTopics ? (
              <div className="stf-loading-state">Loading...</div>
            ) : topics.length > 0 ? (
              topics.map((topic) => (
                <button
                  key={topic}
                  className={`stf-chip stf-topic-chip ${
                    selectedTopic === topic ? 'stf-active' : ''
                  }`}
                  onClick={() => handleTopicClick(topic)}
                >
                  <span className="stf-chip-text">{topic}</span>
                  {selectedTopic === topic && (
                    <FiX
                      size={16}
                      className="stf-chip-close"
                      onClick={handleClearTopic}
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
