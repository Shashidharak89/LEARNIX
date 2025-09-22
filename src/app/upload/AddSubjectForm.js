"use client";

import { useState, useEffect } from "react";
import { FiPlus } from "react-icons/fi";
import "./styles/AddSubjectForm.css";

export default function AddSubjectForm({ allUsers, isLoading, onAddSubject }) {
  const [newSubject, setNewSubject] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [isCustomSubject, setIsCustomSubject] = useState(false);

  // Get unique subjects from all users
  const getAllSubjects = () => {
    const subjectSet = new Set();
    allUsers.forEach(user => {
      if (user.subjects && Array.isArray(user.subjects)) {
        user.subjects.forEach(subjectObj => {
          if (subjectObj.subject && subjectObj.subject.trim()) {
            subjectSet.add(subjectObj.subject.trim());
          }
        });
      }
    });
    return Array.from(subjectSet).sort();
  };

  // Handle subject selection
  const handleSubjectSelect = (e) => {
    const value = e.target.value;
    if (value === "custom") {
      setIsCustomSubject(true);
      setSelectedSubject("");
      setNewSubject("");
    } else {
      setIsCustomSubject(false);
      setSelectedSubject(value);
      setNewSubject(value);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    const subjectToAdd = isCustomSubject ? newSubject : selectedSubject;
    if (!subjectToAdd.trim()) return;
    
    await onAddSubject(subjectToAdd);
    
    // Reset form
    setNewSubject("");
    setSelectedSubject("");
    setIsCustomSubject(false);
  };

  const uniqueSubjects = getAllSubjects();

  return (
    <div className="mse-input-group">
      <select
        value={isCustomSubject ? "custom" : selectedSubject}
        onChange={handleSubjectSelect}
        className="mse-input"
        disabled={isLoading}
      >
        <option value="">Select existing subject</option>
        {uniqueSubjects.map(subject => (
          <option key={subject} value={subject}>{subject}</option>
        ))}
        <option value="custom">Custom Subject</option>
      </select>
      {isCustomSubject && (
        <input
          type="text"
          placeholder="Enter custom subject name..."
          value={newSubject}
          onChange={(e) => setNewSubject(e.target.value)}
          className="mse-input"
          disabled={isLoading}
        />
      )}
      <button 
        onClick={handleSubmit} 
        className="mse-btn mse-btn-primary"
        disabled={isLoading || (!isCustomSubject && !selectedSubject) || (isCustomSubject && !newSubject.trim())}
      >
        <FiPlus className="mse-btn-icon" />
        Add Subject
      </button>
    </div>
  );
}