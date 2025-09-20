"use client";

import { useState } from "react";
import materialsData from "./materialsData";
import "./styles/StudyMaterials.css";

export default function StudyMaterials() {
  const [openSemesterIndex, setOpenSemesterIndex] = useState(null);
  const [openSubjectIndex, setOpenSubjectIndex] = useState(null);

  const toggleSemester = (index) => {
    setOpenSemesterIndex(openSemesterIndex === index ? null : index);
    setOpenSubjectIndex(null); // reset subject when semester changes
  };

  const toggleSubject = (index) => {
    setOpenSubjectIndex(openSubjectIndex === index ? null : index);
  };

  return (
    <div className="study-materials-container">
      <h2>Study Materials</h2>
      <div className="semesters-list">
        {materialsData.map((sem, semIndex) => (
          <div key={semIndex} className="semester-item">
            <button
              className="semester-button"
              onClick={() => toggleSemester(semIndex)}
            >
              {sem.semester}
            </button>

            {openSemesterIndex === semIndex && (
              <div className="subjects-list">
                {sem.subjects.map((subj, subjIndex) => (
                  <div key={subjIndex} className="subject-item">
                    <button
                      className="subject-button"
                      onClick={() => toggleSubject(subjIndex)}
                    >
                      {subj.subject}
                    </button>

                    {openSubjectIndex === subjIndex && (
                      <ul className="files-list">
                        {subj.files.map((file, fIndex) => {
                          const fileName =
                            file.name ||
                            file.url.split("/").pop().split("?")[0];

                          return (
                            <li key={fIndex}>
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noreferrer"
                                className="file-link"
                              >
                                {fileName}
                              </a>
                            </li>
                          );
                        })}
                      </ul>
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
