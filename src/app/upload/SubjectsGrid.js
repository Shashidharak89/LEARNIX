"use client";

import { useState } from "react";
import { FiBook, FiPlus, FiFileText } from "react-icons/fi";
import TopicCard from "./TopicCard";
import DeleteSubjectButton from "./DeleteSubjectButton";
import axios from "axios";
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

  const handleTopicSelectForSubject = (e) => {
    setTopicName(e.target.value);
  };

  const handleAddTopicWithReset = async (subject) => {
    await onAddTopic(subject, topicName, true); // default public
    setTopicName("");
  };

  const toggleSubjectPublic = async (subjectId, currentValue) => {
    try {
      await axios.put("/api/subject/public", {
        usn,
        subjectId,
        public: !currentValue
      });
      onRefreshSubjects();
      showMessage("Subject public status updated!", "success");
    } catch (err) {
      console.error(err);
      showMessage("Failed to update subject", "error");
    }
  };

  return (
    <div className="mse-subjects-grid">
      {subjects.map((sub, idx) => {
        const topicsForThisSubject = getAllTopicsForSubject(sub.subject);
        const subjectPublic = sub.public !== undefined ? sub.public : true;

        return (
          <div key={idx} className="mse-subject-card">
            <div className="mse-subject-header flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiBook className="mse-subject-icon" />
                <h3>{sub.subject}</h3>
                <span 
                  style={{ 
                    fontSize: "0.75rem", 
                    padding: "2px 6px", 
                    borderRadius: "4px",
                    backgroundColor: subjectPublic ? "#4ade80" : "#f87171",
                    color: "white"
                  }}
                >
                  {subjectPublic ? "Public" : "Private"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <DeleteSubjectButton 
                  usn={usn} 
                  subject={sub.subject} 
                  onDelete={onSubjectDelete} 
                />
                <button
                  onClick={() => toggleSubjectPublic(sub._id, subjectPublic)}
                  className="px-2 py-1 border rounded text-sm"
                >
                  Public/Private
                </button>
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
