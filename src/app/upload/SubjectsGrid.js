"use client";

import { useState } from "react";
import { FiBook, FiPlus, FiFileText } from "react-icons/fi"; // ✅ added FiFileText
import TopicCard from "./TopicCard";
import DeleteSubjectButton from "./DeleteSubjectButton";
import "./styles/SubjectsGrid.css";

export default function SubjectsGrid({ 
  subjects, 
  allUsers, 
  usn, 
  isLoading, 
  onAddTopic, 
  onSubjectDelete, 
  onTopicDelete, 
  onRefreshSubjects,
  showMessage 
}) {
  const [topicName, setTopicName] = useState("");

  // Get all topics for a specific subject
  const getAllTopicsForSubject = (subjectName) => {
    const topicSet = new Set();
    allUsers.forEach(user => {
      if (user.subjects && Array.isArray(user.subjects)) {
        user.subjects.forEach(subjectObj => {
          if (subjectObj.subject === subjectName && subjectObj.topics && Array.isArray(subjectObj.topics)) {
            subjectObj.topics.forEach(topicObj => {
              if (topicObj.topic && topicObj.topic.trim()) {
                topicSet.add(topicObj.topic.trim());
              }
            });
          }
        });
      }
    });
    return Array.from(topicSet).sort();
  };

  // Handle topic selection for adding to current subject
  const handleTopicSelectForSubject = (e) => {
    const value = e.target.value;
    setTopicName(value);
  };

  // Handle add topic with reset
  const handleAddTopicWithReset = async (subject) => {
    await onAddTopic(subject, topicName);
    setTopicName("");
  };

  return (
    <div className="mse-subjects-grid">
      {subjects.map((sub, idx) => {
        const topicsForThisSubject = getAllTopicsForSubject(sub.subject);
        
        return (
          <div key={idx} className="mse-subject-card">
            <div className="mse-subject-header">
              <FiBook className="mse-subject-icon" />
              <div className="mse-subject-title-container">
                <h3>
                  {sub.subject} 
                  <DeleteSubjectButton 
                    usn={usn} 
                    subject={sub.subject} 
                    onDelete={onSubjectDelete} 
                  />
                </h3>
              </div>
            </div>

            {/* Add Topic Input */}
            <div className="mse-topic-input-section">
              <div className="mse-input-group">
                <select
                  value=""
                  onChange={handleTopicSelectForSubject}
                  className="mse-input mse-input-sm"
                  disabled={isLoading}
                >
                  <option value="">Select existing topic for {sub.subject}</option>
                  {topicsForThisSubject.map(topic => (
                    <option key={topic} value={topic}>{topic}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Or enter new topic name..."
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  className="mse-input mse-input-sm"
                  disabled={isLoading}
                />
                <button 
                  onClick={() => handleAddTopicWithReset(sub.subject)} 
                  className="mse-btn mse-btn-secondary mse-btn-sm"
                  disabled={isLoading || !topicName.trim()}
                >
                  <FiPlus className="mse-btn-icon" />
                  Add Topic
                </button>
              </div>
            </div>

            {/* Topics List */}
            <div className="mse-topics-container">
              {!sub.topics || sub.topics.length === 0 ? (
                <div className="mse-empty-topics">
                  <FiFileText className="mse-empty-icon-sm" />
                  <span>No topics yet</span>
                </div>
              ) : (
                <div className="mse-topics-list">
                  {sub.topics.map((topic, tIdx) => (
                    <TopicCard
                      key={tIdx}
                      subject={sub.subject}
                      topic={topic}
                      usn={usn}
                      isLoading={isLoading}
                      onTopicDelete={onTopicDelete}
                      onRefreshSubjects={onRefreshSubjects}
                      showMessage={showMessage}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
