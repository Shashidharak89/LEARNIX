'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';
import './SubjectTopicFilter.css';

const SubjectTopicFilter = ({ onFilterChange }) => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
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

  // Fetch topics when subjects are selected
  useEffect(() => {
    if (selectedSubjects.length > 0) {
      const fetchTopics = async () => {
        setIsLoadingTopics(true);
        try {
          const topicsSet = new Set();
          
          // Fetch topics for each selected subject
          for (const subject of selectedSubjects) {
            const response = await fetch(`/api/topic/by-subject?subject=${encodeURIComponent(subject)}`);
            const data = await response.json();
            if (data.topics) {
              data.topics.forEach(topic => topicsSet.add(topic));
            }
          }
          
          setTopics(Array.from(topicsSet).sort());
          setSelectedTopics([]);
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
  }, [selectedSubjects]);

  // Notify parent of filter changes
  useEffect(() => {
    onFilterChange({
      subjects: selectedSubjects,
      topics: selectedTopics
    });
  }, [selectedSubjects, selectedTopics, onFilterChange]);

  const handleSubjectClick = (subject) => {
    setSelectedSubjects(prev => 
      prev.includes(subject) 
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const handleTopicClick = (topic) => {
    setSelectedTopics(prev =>
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const handleClearSubject = (e, subject) => {
    e.stopPropagation();
    setSelectedSubjects(prev => prev.filter(s => s !== subject));
  };

  const handleClearTopic = (e, topic) => {
    e.stopPropagation();
    setSelectedTopics(prev => prev.filter(t => t !== topic));
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
              <div className="stf-loading-state">Loading...</div>
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
