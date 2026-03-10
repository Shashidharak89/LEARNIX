"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FiClipboard,
  FiInfo,
  FiChevronDown,
  FiChevronRight,
  FiUsers,
  FiFileText,
  FiDownload,
  FiMessageSquare,
  FiHelpCircle,
  FiEye,
  FiShare2,
  FiBook,
  FiExternalLink,
} from "react-icons/fi";
import questionPapersData from "./questionPapersData";
import "./styles/QuestionPapers.css";

// Union all image arrays from imageurls object (keys like 'unknown', subject names, etc.)
const getImages = (examData) => {
  const urls = examData?.imageurls;
  if (!urls) return [];
  if (Array.isArray(urls)) return urls.filter(Boolean);
  if (typeof urls === "object") {
    return Object.values(urls).flat().filter(Boolean);
  }
  return [];
};

// Collect all unique named subject keys (exclude 'unknown') across all data, alphabetically sorted
const getAllSubjects = () => {
  const subjectSet = new Set();
  for (const sem of questionPapersData) {
    for (const batch of sem.batches) {
      for (const examKey of ["mse1", "mse2", "final"]) {
        const exam = batch[examKey];
        if (!exam?.imageurls || typeof exam.imageurls !== "object") continue;
        for (const key of Object.keys(exam.imageurls)) {
          if (key !== "unknown") subjectSet.add(key);
        }
      }
    }
  }
  return Array.from(subjectSet).sort((a, b) => a.localeCompare(b));
};

// Collect all images for a given subject across the full dataset in data order
// Order: semester index → batch index → exam order (mse1 → mse2 → final)
const getImagesBySubject = (subject) => {
  const images = [];
  for (const sem of questionPapersData) {
    for (const batch of sem.batches) {
      for (const examKey of ["mse1", "mse2", "final"]) {
        const exam = batch[examKey];
        const urls = exam?.imageurls?.[subject];
        if (Array.isArray(urls)) {
          images.push(...urls.filter(Boolean));
        }
      }
    }
  }
  return images;
};

const ALL_SUBJECTS = getAllSubjects();

export default function QuestionPapers() {
  const [openSemesterIndex, setOpenSemesterIndex] = useState(null);
  const [openBatchIndex, setOpenBatchIndex] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [subjectDownloading, setSubjectDownloading] = useState(false);
  const [searchSubject, setSearchSubject] = useState("");
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);

  const toggleSemester = (index) => {
    setOpenSemesterIndex(openSemesterIndex === index ? null : index);
    setOpenBatchIndex(null);
  };

  const toggleBatch = (index) => {
    setOpenBatchIndex(openBatchIndex === index ? null : index);
  };

  const getExamTypes = (batch) => {
    const examTypes = [];
    if (batch.mse1) examTypes.push({ key: "mse1", label: "MSE 1", data: batch.mse1 });
    if (batch.mse2) examTypes.push({ key: "mse2", label: "MSE 2", data: batch.mse2 });
    if (batch.final) examTypes.push({ key: "final", label: "Final Exam", data: batch.final });
    return examTypes;
  };

  const handleDownload = async (e, exam, semester, batchName) => {
    e.preventDefault();
    e.stopPropagation();

    const validImages = getImages(exam.data);

    if (!validImages.length) {
      alert("No images available for download");
      return;
    }

    try {
      setDownloadingId(exam.data.id);
      const { jsPDF } = await import("jspdf");

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < validImages.length; i++) {
        const response = await fetch(validImages[i]);
        const blob = await response.blob();

        const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });

        if (i > 0) pdf.addPage();
        pdf.addImage(base64, "JPEG", 0, 0, pageWidth, pageHeight);
      }

      const fileName = `${exam.label}_${semester}_${batchName}_LEARNIX.pdf`.replace(
        /\s+/g,
        "_"
      );
      pdf.save(fileName);
    } catch (err) {
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleSubjectDownload = async () => {
    if (!selectedSubject) return;
    const images = getImagesBySubject(selectedSubject);
    if (!images.length) {
      alert("No images found for this subject.");
      return;
    }
    try {
      setSubjectDownloading(true);
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      for (let i = 0; i < images.length; i++) {
        const response = await fetch(images[i]);
        const blob = await response.blob();
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
        if (i > 0) pdf.addPage();
        pdf.addImage(base64, "JPEG", 0, 0, pageWidth, pageHeight);
      }
      const fileName = `${selectedSubject}_All_QP_LEARNIX.pdf`.replace(/\s+/g, "_");
      pdf.save(fileName);
    } catch (err) {
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setSubjectDownloading(false);
    }
  };

  return (
    <div className="qp-page-container">
      {/* Header Icon */}
      <header className="qp-header" aria-hidden={true}>
        <FiClipboard className="qp-header-icon" />
      </header>

      <main className="qp-main" role="main">
        {/* Intro Card */}
        <section className="qp-card qp-intro" aria-labelledby="qp-title">
          <h1 id="qp-title" className="qp-title">Question Papers</h1>
          <p className="qp-plain">
            Explore and download previous year question papers organized by{" "}
            <strong>Semester → Batch → Exam Type</strong>. View papers directly or download them as PDFs for offline study.
          </p>
          <p className="qp-meta">MCA Program • All Semesters</p>
        </section>

        {/* Question Papers Section */}
        <section className="qp-card" aria-labelledby="qp-papers-section">
          <div className="qp-section-header">
            <FiFileText className="qp-section-icon" />
            <h2 id="qp-papers-section" className="qp-subtitle">Browse Question Papers</h2>
          </div>
          
          <div className="qp-content">
            {questionPapersData.map((sem, semIndex) => (
              <div key={semIndex} className="qp-semester-card">
                <button
                  className={`qp-semester-toggle ${
                    openSemesterIndex === semIndex ? "qp-semester-active" : ""
                  }`}
                  onClick={() => toggleSemester(semIndex)}
                >
                  <span className="qp-semester-title">{sem.semister}</span>
                  {openSemesterIndex === semIndex ? (
                    <FiChevronDown size={20} />
                  ) : (
                    <FiChevronRight size={20} />
                  )}
                </button>

                {openSemesterIndex === semIndex && (
                  <div className="qp-batches-container">
                    {sem.batches.map((batch, batchIndex) => {
                      const examTypes = getExamTypes(batch);
                      return (
                        <div key={batchIndex} className="qp-batch-card">
                          <button
                            className={`qp-batch-toggle ${
                              openBatchIndex === batchIndex ? "qp-batch-active" : ""
                            }`}
                            onClick={() => toggleBatch(batchIndex)}
                          >
                            <FiUsers size={18} />
                            <span>{batch.batchname}</span>
                            {openBatchIndex === batchIndex ? (
                              <FiChevronDown size={16} />
                            ) : (
                              <FiChevronRight size={16} />
                            )}
                          </button>

                          {openBatchIndex === batchIndex && (
                            <div className="qp-exams-container">
                              {examTypes.length === 0 ? (
                                <p className="qp-no-exams">
                                  No question papers available yet.
                                </p>
                              ) : (
                                examTypes.map((exam) => (
                                  <div
                                    key={exam.key}
                                    className="qp-exam-card-wrapper"
                                  >
                                    <Link
                                      href={`/qp/${exam.data.id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="qp-exam-card"
                                    >
                                      <FiFileText size={18} />
                                      <span>{exam.label}</span>
                                      <FiChevronRight size={16} />
                                    </Link>

                                    <button
                                      className={`qp-download-btn ${
                                        downloadingId === exam.data.id
                                          ? "qp-downloading"
                                          : ""
                                      }`}
                                      onClick={(e) =>
                                        handleDownload(
                                          e,
                                          exam,
                                          sem.semister,
                                          batch.batchname
                                        )
                                      }
                                      disabled={downloadingId === exam.data.id}
                                      title="Download as PDF"
                                    >
                                      <FiDownload size={16} />
                                    </button>
                                  </div>
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
        </section>

        {/* Download by Subject Section */}
        {ALL_SUBJECTS.length > 0 && (
          <section className="qp-card" aria-labelledby="qp-subject-section">
            <div className="qp-section-header">
              <FiBook className="qp-section-icon" />
              <h2 id="qp-subject-section" className="qp-subtitle">Download by Subject</h2>
            </div>
            <p className="qp-plain">
              Select a subject to download all its available question papers across all semesters, batches, and exam types — compiled into a single PDF in order.
            </p>
            <div className="qp-subject-row">
              <div className="qp-subject-select-wrap">
                <div className="qp-subject-search">
                  <input
                    type="text"
                    className="qp-subject-search-input"
                    placeholder="Search subjects..."
                    value={searchSubject}
                    onChange={(e) => { setSearchSubject(e.target.value); setShowSubjectDropdown(true); setSelectedSubject(''); }}
                    onFocus={() => setShowSubjectDropdown(true)}
                    onBlur={() => setTimeout(() => setShowSubjectDropdown(false), 120)}
                    aria-label="Search subjects"
                  />
                  <button
                    type="button"
                    className="qp-subject-clear"
                    onClick={() => { setSearchSubject(''); setSelectedSubject(''); setShowSubjectDropdown(false); }}
                    title="Clear"
                  >
                    ×
                  </button>

                  <ul className={`qp-subject-dropdown ${showSubjectDropdown ? 'open' : ''}`} role="listbox">
                    {ALL_SUBJECTS.filter(s => s.toLowerCase().includes(searchSubject.toLowerCase())).map((subj) => (
                      <li
                        key={subj}
                        role="option"
                        tabIndex={0}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => { setSelectedSubject(subj); setSearchSubject(subj); setShowSubjectDropdown(false); }}
                        className="qp-subject-dropdown-item"
                      >
                        {subj}
                      </li>
                    ))}
                    {ALL_SUBJECTS.filter(s => s.toLowerCase().includes(searchSubject.toLowerCase())).length === 0 && (
                      <li className="qp-subject-dropdown-empty">No subjects found</li>
                    )}
                  </ul>
                </div>
              </div>

              {selectedSubject && (() => {
                const imgs = getImagesBySubject(selectedSubject);
                return (
                  <div className="qp-subject-info">
                    <span className="qp-subject-count">
                      {imgs.length} image{imgs.length !== 1 ? "s" : ""} found
                    </span>
                    <Link
                      href={`/qp/query/${encodeURIComponent(selectedSubject)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="qp-subject-view-btn"
                      title={`View all ${selectedSubject} question papers`}
                    >
                      <FiEye size={15} />
                      <span>View</span>
                    </Link>
                    <button
                      className={`qp-subject-dl-btn ${subjectDownloading ? "qp-downloading" : ""}`}
                      onClick={handleSubjectDownload}
                      disabled={subjectDownloading || imgs.length === 0}
                      title={`Download all ${selectedSubject} question papers as PDF`}
                    >
                      <FiDownload size={16} />
                      <span>{subjectDownloading ? "Generating PDF..." : "Download PDF"}</span>
                    </button>
                  </div>
                );
              })()}
            </div>
          </section>
        )}

        {/* How It Works Section */}
        <section className="qp-card" aria-labelledby="qp-how-section">
          <div className="qp-section-header">
            <FiHelpCircle className="qp-section-icon" />
            <h2 id="qp-how-section" className="qp-subtitle">How It Works</h2>
          </div>
          
          <div className="qp-steps">
            <div className="qp-step">
              <span className="qp-step-number">1</span>
              <p className="qp-plain">Select your <strong>semester</strong> from the list above.</p>
            </div>
            <div className="qp-step">
              <span className="qp-step-number">2</span>
              <p className="qp-plain">Choose your <strong>batch</strong> (e.g., 2022-2024, 2023-2025).</p>
            </div>
            <div className="qp-step">
              <span className="qp-step-number">3</span>
              <p className="qp-plain">Pick an exam type like <strong>MSE 1, MSE 2, or Final</strong>.</p>
            </div>
            <div className="qp-step">
              <span className="qp-step-number">4</span>
              <p className="qp-plain">View online or download as PDF for offline study.</p>
            </div>
          </div>
        </section>

        {/* Features Card */}
        <section className="qp-card" aria-labelledby="qp-features-section">
          <div className="qp-section-header">
            <FiInfo className="qp-section-icon" />
            <h2 id="qp-features-section" className="qp-subtitle">What You Can Do</h2>
          </div>
          
          <div className="qp-features-grid">
            <div className="qp-feature">
              <FiEye className="qp-feature-icon" />
              <div className="qp-feature-content">
                <strong>View Online</strong>
                <p className="qp-plain">Browse question papers directly in the viewer.</p>
              </div>
            </div>
            <div className="qp-feature">
              <FiDownload className="qp-feature-icon" />
              <div className="qp-feature-content">
                <strong>Download PDF</strong>
                <p className="qp-plain">Download entire papers or select specific pages.</p>
              </div>
            </div>
            <div className="qp-feature">
              <FiShare2 className="qp-feature-icon" />
              <div className="qp-feature-content">
                <strong>Share</strong>
                <p className="qp-plain">Share papers with friends across devices.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Feedback Section */}
        <section className="qp-card qp-feedback" aria-labelledby="qp-feedback-section">
          <div className="qp-section-header">
            <FiMessageSquare className="qp-section-icon" />
            <h2 id="qp-feedback-section" className="qp-subtitle">Facing Any Issues?</h2>
          </div>
          
          <p className="qp-plain">
            Let us know if you&apos;re facing problems finding or downloading question papers, or if you have suggestions to improve this section.
          </p>

          <textarea
            placeholder="Describe the issue or suggestion..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="qp-feedback-textarea"
          />

          <button
            className="qp-feedback-btn"
            disabled={sending || !feedback.trim()}
            onClick={async () => {
              try {
                setSending(true);
                await fetch("/api/feedback", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ feedback }),
                });
                setFeedback("");
                alert("Thank you! Your feedback has been sent.");
              } catch {
                alert("Failed to send feedback. Please try again.");
              } finally {
                setSending(false);
              }
            }}
          >
            {sending ? "Sending..." : "Send Feedback"}
          </button>
        </section>
      </main>
    </div>
  );
}
