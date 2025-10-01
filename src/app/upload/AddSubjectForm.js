"use client";

import { useState } from "react";
import { FiPlus } from "react-icons/fi";
import "./styles/AddSubjectForm.css";

export default function AddSubjectForm({ allUsers, isLoading, onAddSubject }) {
  const [newSubject, setNewSubject] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [isPublic, setIsPublic] = useState(true);

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

  const handleSubmit = async () => {
    const subjectToAdd = isCustomSubject ? newSubject : selectedSubject;
    if (!subjectToAdd.trim()) return;

    await onAddSubject(subjectToAdd, isPublic);

    setNewSubject("");
    setSelectedSubject("");
    setIsCustomSubject(false);
    setIsPublic(true);
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
      <div className="flex items-center gap-2 mt-2">
        <label style={{ fontSize: "0.875rem" }}>Public</label>
        <input
          type="checkbox"
          checked={isPublic}
          onChange={() => setIsPublic(!isPublic)}
          disabled={isLoading}
          className="cursor-pointer"
        />
      </div>
      <button 
        onClick={handleSubmit} 
        className="mse-btn mse-btn-primary mt-2"
        disabled={isLoading || (!isCustomSubject && !selectedSubject) || (isCustomSubject && !newSubject.trim())}
      >
        <FiPlus className="mse-btn-icon" />
        Add Subject
      </button>
    </div>
  );
}
