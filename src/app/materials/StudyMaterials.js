"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, BookOpen, FileText, Download, Eye, FolderOpen, BookMarked } from "lucide-react";
import materialsData from "./materialsData";
import "./styles/StudyMaterials.css";

function FilesList({ files, cssClass = "sm-files-list" }) {
  return (
    <div className={cssClass}>
      {files.map((file, fIndex) => {
        const rawFileName = file.name || file.url.split("/").pop().split("?")[0];
        const fileName = decodeURIComponent(rawFileName);
        const encodedUrl = encodeURIComponent(file.url);
        const viewUrl = `https://docs.google.com/gview?embedded=true&url=${encodedUrl}`;

        return (
          <div key={fIndex} className="sm-file-card">
            <a
              href={viewUrl}
              target="_blank"
              rel="noreferrer"
              className="sm-file-link"
              title="Click to view file"
              aria-label={`View ${fileName}`}
            >
              <div className="sm-file-info">
                <div className="sm-file-icon">📄</div>
                <span className="sm-file-name">{fileName}</span>
              </div>
            </a>
            <div className="sm-file-actions">
              <a
                href={viewUrl}
                target="_blank"
                rel="noreferrer"
                className="sm-action-btn sm-view-btn"
                title="View file"
                aria-label={`View ${fileName}`}
                onClick={(e) => e.stopPropagation()}
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
                onClick={(e) => e.stopPropagation()}
              >
                <Download size={16} />
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function StudyMaterials() {
  const [openSemesterIndex, setOpenSemesterIndex] = useState(null);
  const [openSubjectIndex, setOpenSubjectIndex] = useState(null);
  // tracks which subject's "Unofficial Resources" section is open — key: "semIndex-subjIndex"
  const [openUnofficialKey, setOpenUnofficialKey] = useState(null);

  const toggleSemester = (index) => {
    setOpenSemesterIndex(openSemesterIndex === index ? null : index);
    setOpenSubjectIndex(null);
    setOpenUnofficialKey(null);
  };

  const toggleSubject = (index) => {
    setOpenSubjectIndex(openSubjectIndex === index ? null : index);
    setOpenUnofficialKey(null);
  };

  const toggleUnofficial = (key) => {
    setOpenUnofficialKey(openUnofficialKey === key ? null : key);
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
                  {sem.subjects.map((subj, subjIndex) => {
                    const unofficialKey = `${semIndex}-${subjIndex}`;
                    const hasExternalFiles = subj.externalfiles && subj.externalfiles.length > 0;
                    const isSubjOpen = openSubjectIndex === subjIndex;
                    const isUnofficialOpen = openUnofficialKey === unofficialKey;

                    return (
                      <div key={subjIndex} className="sm-subject-block">
                        {/* Subject Header */}
                        <button
                          className={`sm-subject-btn ${isSubjOpen ? "sm-subject-open" : ""}`}
                          onClick={() => toggleSubject(subjIndex)}
                        >
                          <div className="sm-subject-left">
                            <FileText size={18} />
                            <span className="sm-subject-name">{subj.subject}</span>
                            <span className="sm-file-count">{subj.files.length} files</span>
                          </div>
                          <div className="sm-subject-icon">
                            {isSubjOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          </div>
                        </button>

                        {/* Expanded subject content */}
                        {isSubjOpen && (
                          <div className="sm-subject-content">

                            {/* ── Unofficial Resources (only if externalfiles exist) ── */}
                            {hasExternalFiles && (
                              <div className="sm-unofficial-block">
                                <button
                                  className={`sm-unofficial-btn ${isUnofficialOpen ? "sm-unofficial-open" : ""}`}
                                  onClick={() => toggleUnofficial(unofficialKey)}
                                >
                                  <div className="sm-unofficial-left">
                                    <BookMarked size={16} />
                                    <span className="sm-unofficial-label">External Resources</span>
                                    <span className="sm-unofficial-badge">{subj.externalfiles.length} files</span>
                                  </div>
                                  <div className="sm-unofficial-chevron">
                                    {isUnofficialOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                  </div>
                                </button>

                                {isUnofficialOpen && (
                                  <FilesList files={subj.externalfiles} cssClass="sm-unofficial-files-list" />
                                )}
                              </div>
                            )}

                            {/* ── Official Files ── */}
                            <FilesList files={subj.files} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}