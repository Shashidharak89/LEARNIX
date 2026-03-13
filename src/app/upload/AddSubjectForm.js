"use client";

import { useState } from "react";
import { FiPlus } from "react-icons/fi";
import "./styles/AddSubjectForm.css";

export default function AddSubjectForm({ allUsers, isLoading, onAddSubject }) {
  const [newSubject, setNewSubject] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [isCustomSubject, setIsCustomSubject] = useState(true);
  const [visibility, setVisibility] = useState("public");

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

    await onAddSubject(subjectToAdd, visibility);

    setNewSubject("");
    setSelectedSubject("");
    setIsCustomSubject(true);
    setVisibility("public");
  };

  const uniqueSubjects = getAllSubjects();

  return (
    <div className="asf-compact-form">
      <div className="asf-form-row">
        {/* System Dropdown */}
        <select
          value={isCustomSubject ? "custom" : selectedSubject}
          onChange={handleSubjectSelect}
          className="asf-select"
          disabled={isLoading}
        >
          <option value="custom">+ Custom Subject</option>
          {uniqueSubjects.length > 0 && <option disabled>──────────</option>}
          {uniqueSubjects.map(subject => (
            <option key={subject} value={subject}>{subject}</option>
          ))}
        </select>

        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
          className="asf-visibility-select"
          disabled={isLoading}
          aria-label="Subject visibility"
          title="Subject visibility"
        >
          <option value="public">Public</option>
          <option value="private">Private</option>
          <option value="unlisted">Unlisted</option>
        </select>

        {/* Add Button */}
        <button 
          onClick={handleSubmit} 
          className="asf-add-btn"
          disabled={isLoading || (!isCustomSubject && !selectedSubject) || (isCustomSubject && !newSubject.trim())}
          title="Add Subject"
        >
          <FiPlus />
        </button>
      </div>

      {/* Input Field */}
      {isCustomSubject && (
        <input
          type="text"
          placeholder="Enter subject name..."
          value={newSubject}
          onChange={(e) => setNewSubject(e.target.value)}
          className="asf-input"
          disabled={isLoading}
          autoFocus
        />
      )}
    </div>
  );
}