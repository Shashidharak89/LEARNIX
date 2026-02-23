"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, BookOpen, FileText, Download, Eye, FolderOpen } from "lucide-react";
import materialsData from "./materialsData";
import "./styles/StudyMaterials.css";

export default function StudyMaterials() {
  const [openSemesterIndex, setOpenSemesterIndex] = useState(null);
  const [openSubjectIndex, setOpenSubjectIndex] = useState(null);

  const toggleSemester = (index) => {
    setOpenSemesterIndex(openSemesterIndex === index ? null : index);
    setOpenSubjectIndex(null);
  };

  const toggleSubject = (index) => {
    setOpenSubjectIndex(openSubjectIndex === index ? null : index);
  };

  return (
    <div className="sm-wrapper">
      <div className="sm-container">
        {/* Header */}
        <div className="sm-header">
          <div className="sm-header-content">
            <div className="sm-header-icon">
              <BookOpen size={28} />
            </div>
            <div className="sm-header-text">
              <h1 className="sm-title">Study Materials</h1>
              <p className="sm-subtitle">Access your course materials by semester and subject</p>
            </div>
          </div>
        </div>

        {/* Materials List */}
        <div className="sm-materials-list">
          {materialsData.map((sem, semIndex) => (
            <div key={semIndex} className="sm-semester-block">
              {/* Semester Header */}
              <button
                className={`sm-semester-btn ${openSemesterIndex === semIndex ? "sm-semester-open" : ""}`}
                onClick={() => toggleSemester(semIndex)}
              >
                <div className="sm-semester-left">
                  <FolderOpen size={20} />
                  <span className="sm-semester-name">{sem.semester}</span>
                  <span className="sm-subject-count">{sem.subjects.length} subjects</span>
                </div>
                <div className="sm-semester-icon">
                  {openSemesterIndex === semIndex ? (
                    <ChevronDown size={20} />
                  ) : (
                    <ChevronRight size={20} />
                  )}
                </div>
              </button>

              {/* Subjects Container */}
              {openSemesterIndex === semIndex && (
                <div className="sm-subjects-wrapper">
                  {sem.subjects.map((subj, subjIndex) => (
                    <div key={subjIndex} className="sm-subject-block">
                      {/* Subject Header */}
                      <button
                        className={`sm-subject-btn ${openSubjectIndex === subjIndex ? "sm-subject-open" : ""}`}
                        onClick={() => toggleSubject(subjIndex)}
                      >
                        <div className="sm-subject-left">
                          <FileText size={18} />
                          <span className="sm-subject-name">{subj.subject}</span>
                          <span className="sm-file-count">{subj.files.length} files</span>
                        </div>
                        <div className="sm-subject-icon">
                          {openSubjectIndex === subjIndex ? (
                            <ChevronDown size={18} />
                          ) : (
                            <ChevronRight size={18} />
                          )}
                        </div>
                      </button>

                      {/* Files List */}
                      {openSubjectIndex === subjIndex && (
                        <div className="sm-files-list">
                          {subj.files.map((file, fIndex) => {
                            const rawFileName = file.name || file.url.split("/").pop().split("?")[0];
                            const fileName = decodeURIComponent(rawFileName);
                            const encodedUrl = encodeURIComponent(file.url);
                            const viewUrl = `https://docs.google.com/gview?embedded=true&url=${encodedUrl}`;

                            return (
                              <div key={fIndex} className="sm-file-card">
                                <div className="sm-file-info">
                                  <div className="sm-file-icon">📄</div>
                                  <span className="sm-file-name">{fileName}</span>
                                </div>
                                <div className="sm-file-actions">
                                  <a
                                    href={viewUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="sm-action-btn sm-view-btn"
                                    title="View file"
                                    aria-label={`View ${fileName}`}
                                  >
                                    <Eye size={16} />
                                  </a>
                                  <a
                                    href={file.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="sm-action-btn sm-download-btn"
                                    title="Download file"
                                    aria-label={`Download ${fileName}`}
                                  >
                                    <Download size={16} />
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}