"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, BookOpen, FileText, Download, Eye } from "lucide-react";
import materialsData from "./materialsData";
import "./styles/StudyMaterials.css";

export default function StudyMaterials() {
  const [openSemesterIndex, setOpenSemesterIndex] = useState(null);
  const [openSubjectIndex, setOpenSubjectIndex] = useState(null);

  const toggleSemester = (index) => {
    setOpenSemesterIndex(openSemesterIndex === index ? null : index);
    setOpenSubjectIndex(null); // Reset subject when semester changes
  };

  const toggleSubject = (index) => {
    setOpenSubjectIndex(openSubjectIndex === index ? null : index);
  };

  return (
    <div className="study-materials-wrapper">
      <div className="study-materials-header">
        <BookOpen className="header-icon" />
        <h2 className="study-materials-title">Study Materials</h2>
      </div>

      <div className="study-materials-content">
        {materialsData.map((sem, semIndex) => (
          <div key={semIndex} className="semester-card">
            {/* Semester Header */}
            <button
              className={`semester-toggle ${openSemesterIndex === semIndex ? "semester-active" : ""}`}
              onClick={() => toggleSemester(semIndex)}
            >
              <span className="semester-title">{sem.semester}</span>
              <span className="semester-icon">
                {openSemesterIndex === semIndex ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              </span>
            </button>

            {/* Subjects List */}
            {openSemesterIndex === semIndex && (
              <div className="subjects-container">
                {sem.subjects.map((subj, subjIndex) => (
                  <div key={subjIndex} className="subject-card">
                    <button
                      className={`subject-toggle ${openSubjectIndex === subjIndex ? "subject-active" : ""}`}
                      onClick={() => toggleSubject(subjIndex)}
                    >
                      <FileText size={18} className="subject-icon" />
                      <span className="subject-title">{subj.subject}</span>
                      <span className="subject-chevron">
                        {openSubjectIndex === subjIndex ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </span>
                    </button>

                    {/* Files List */}
                    {openSubjectIndex === subjIndex && (
                      <div className="files-container">
                        {subj.files.map((file, fIndex) => {
                          const fileName = file.name || file.url.split("/").pop().split("?")[0];
                          // construct view URL: view.shashi-k.in/[encoded original file url]
                          const viewPath = encodeURIComponent(file.url);
                          const viewUrl = `https://view.shashi-k.in/${viewPath}`;

                          return (
                            <div key={fIndex} className="file-link-card">
                              {/* Download link (keeps existing behavior) */}
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noreferrer"
                                className="file-action download-action"
                                title="Open / Download file"
                                aria-label={`Download ${fileName}`}
                              >
                                <Download size={16} className="download-icon" />
                              </a>

                              {/* File name */}
                              <span className="file-name">{fileName}</span>

                              {/* Eye (view) link - using inline style only as requested */}
                              <a
                                href={viewUrl}
                                target="_blank"
                                rel="noreferrer"
                                title="View file in viewer"
                                aria-label={`View ${fileName}`}
                                className="file-action view-action"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: 34,
                                  height: 34,
                                  marginLeft: 12,
                                  background: "rgba(255,255,255,0.04)",
                                  borderRadius: 8,
                                  border: "1px solid rgba(255,255,255,0.03)",
                                  textDecoration: "none",
                                }}
                              >
                                <Eye size={16} />
                              </a>
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
  );
}
