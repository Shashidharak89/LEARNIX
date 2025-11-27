"use client";

import { useState } from "react";
import { FiPlus, FiEye, FiEyeOff } from "react-icons/fi";
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
      
      {/* Inline Toggle Button */}
      <button
        type="button"
        onClick={() => setIsPublic(!isPublic)}
        disabled={isLoading}
        className="asf-inline-toggle"
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          border: '2px solid',
          borderRadius: '2rem',
          fontSize: '0.875rem',
          fontWeight: '600',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          minWidth: '120px',
          justifyContent: 'space-between',
          marginTop: '0.5rem',
          background: isPublic 
            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
            : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
          borderColor: isPublic ? '#059669' : '#4b5563',
          color: 'white',
          boxShadow: isPublic 
            ? '0 4px 12px rgba(16, 185, 129, 0.3)'
            : '0 4px 12px rgba(107, 114, 128, 0.3)',
          opacity: isLoading ? 0.6 : 1
        }}
        onMouseEnter={(e) => {
          if (!isLoading) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = isPublic
              ? '0 6px 16px rgba(16, 185, 129, 0.4)'
              : '0 6px 16px rgba(107, 114, 128, 0.4)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = isPublic
            ? '0 4px 12px rgba(16, 185, 129, 0.3)'
            : '0 4px 12px rgba(107, 114, 128, 0.3)';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative', zIndex: 2, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem' }}>
            {isPublic ? <FiEye /> : <FiEyeOff />}
          </div>
          <span style={{ fontSize: '0.875rem', letterSpacing: '0.025em', textTransform: 'uppercase' }}>
            {isPublic ? 'Public' : 'Private'}
          </span>
        </div>
        <div style={{
          position: 'absolute',
          right: '0.375rem',
          width: '2.5rem',
          height: '1.25rem',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '1rem',
          transition: 'all 0.3s ease',
          zIndex: 1
        }}>
          <div style={{
            position: 'absolute',
            top: '0.125rem',
            left: '0.125rem',
            width: '1rem',
            height: '1rem',
            background: 'white',
            borderRadius: '50%',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            transform: isPublic ? 'translateX(1.25rem)' : 'translateX(0)'
          }}></div>
        </div>
      </button>

      <button 
        onClick={handleSubmit} 
        className="mse-btn mse-btn-primary"
        style={{ marginTop: '0.75rem' }}
        disabled={isLoading || (!isCustomSubject && !selectedSubject) || (isCustomSubject && !newSubject.trim())}
      >
        <FiPlus className="mse-btn-icon" />
        Add Subject
      </button>
    </div>
  );
}