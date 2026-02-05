"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, ClipboardList, Users, FileText } from "lucide-react";
import questionPapersData from "./questionPapersData";
import "./styles/QuestionPapers.css";

export default function QuestionPapers() {
  const [openSemesterIndex, setOpenSemesterIndex] = useState(null);
  const [openBatchIndex, setOpenBatchIndex] = useState(null);

  const toggleSemester = (index) => {
    setOpenSemesterIndex(openSemesterIndex === index ? null : index);
    setOpenBatchIndex(null); // Reset batch when semester changes
  };

  const toggleBatch = (index) => {
    setOpenBatchIndex(openBatchIndex === index ? null : index);
  };

  // Helper to get exam types from a batch
  const getExamTypes = (batch) => {
    const examTypes = [];
    if (batch.mse1) examTypes.push({ key: 'mse1', label: 'MSE 1', data: batch.mse1 });
    if (batch.mse2) examTypes.push({ key: 'mse2', label: 'MSE 2', data: batch.mse2 });
    if (batch.final) examTypes.push({ key: 'final', label: 'Final Exam', data: batch.final });
    return examTypes;
  };

  return (
    <div className="qp-wrapper">
      <div className="qp-header">
        <ClipboardList className="qp-header-icon" />
        <h2 className="qp-title">Question Papers</h2>
      </div>

      <p className="qp-description">
        Access previous year question papers organized by semester and batch. 
        Click on a semester to explore available question papers.
      </p>

      <div className="qp-content">
        {questionPapersData.map((sem, semIndex) => (
          <div key={semIndex} className="qp-semester-card">
            {/* Semester Header */}
            <button
              className={`qp-semester-toggle ${openSemesterIndex === semIndex ? "qp-semester-active" : ""}`}
              onClick={() => toggleSemester(semIndex)}
            >
              <span className="qp-semester-title">{sem.semister}</span>
              <span className="qp-semester-icon">
                {openSemesterIndex === semIndex ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              </span>
            </button>

            {/* Batches List */}
            {openSemesterIndex === semIndex && (
              <div className="qp-batches-container">
                {sem.batches.map((batch, batchIndex) => {
                  const examTypes = getExamTypes(batch);
                  const hasExams = examTypes.length > 0;

                  return (
                    <div key={batchIndex} className="qp-batch-card">
                      <button
                        className={`qp-batch-toggle ${openBatchIndex === batchIndex ? "qp-batch-active" : ""}`}
                        onClick={() => toggleBatch(batchIndex)}
                      >
                        <Users size={18} className="qp-batch-icon" />
                        <span className="qp-batch-title">{batch.batchname}</span>
                        <span className="qp-batch-chevron">
                          {openBatchIndex === batchIndex ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </span>
                      </button>

                      {/* Exam Types List */}
                      {openBatchIndex === batchIndex && (
                        <div className="qp-exams-container">
                          {!hasExams ? (
                            <div className="qp-no-exams">
                              <FileText size={18} />
                              <span>No question papers available for this batch yet</span>
                            </div>
                          ) : (
                            examTypes.map((exam) => (
                              <Link
                                key={exam.key}
                                href={`/question-papers/${exam.data.id}`}
                                className="qp-exam-card"
                              >
                                <FileText size={18} className="qp-exam-icon" />
                                <span className="qp-exam-title">{exam.label}</span>
                                <span className="qp-exam-count">
                                  {exam.data.imageurls?.length || 0} pages
                                </span>
                                <ChevronRight size={16} className="qp-exam-arrow" />
                              </Link>
                            ))
                          )}
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

      <div className="qp-footer-note">
        <ClipboardList size={16} />
        <p>
          <strong>Note:</strong> Question papers are being collected and will be updated regularly. 
          If you have any question papers to share, please upload them via the upload page.
        </p>
      </div>
    </div>
  );
}
  