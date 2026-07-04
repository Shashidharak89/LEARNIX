"use client";

import { useState, useEffect } from "react";
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
import "./styles/QuestionPapers.css";

export default function QuestionPapers() {
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedNodes, setExpandedNodes] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [searchSubject, setSearchSubject] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [subjectDownloading, setSubjectDownloading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchTree();
  }, []);

  const fetchTree = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/qp/tree");
      const json = await res.json();
      if (json.success) {
        setTree(json.tree);
        extractSubjects(json.tree);
      } else {
        setError(json.error || "Failed to load question papers");
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const extractSubjects = (treeData) => {
    const subs = new Set();
    Object.values(treeData).forEach(colleges => {
      Object.values(colleges).forEach(courses => {
        Object.values(courses).forEach(semesters => {
          Object.values(semesters).forEach(subjectsObj => {
            Object.keys(subjectsObj).forEach(sub => subs.add(sub));
          });
        });
      });
    });
    setSubjects(Array.from(subs).sort());
  };

  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  const getImagesBySubject = (subName) => {
    const imagesList = [];
    if (!tree) return imagesList;
    Object.values(tree).forEach(colleges => {
      Object.values(colleges).forEach(courses => {
        Object.values(courses).forEach(semesters => {
          Object.values(semesters).forEach(subjectsObj => {
            if (subjectsObj[subName]) {
              subjectsObj[subName].forEach(item => {
                imagesList.push(...item.images);
              });
            }
          });
        });
      });
    });
    return imagesList;
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

  const renderTree = (data, path = "", depth = 0) => {
    if (Array.isArray(data)) {
      return (
        <div className="qp-exams-container">
          {data.map((item, idx) => (
            <div key={`${path}-${idx}`} className="qp-exam-card-wrapper" style={{ padding: "10px", flexDirection: "column", alignItems: "flex-start", gap: "10px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <span className="qp-batch-active" style={{ padding: "4px 8px", background: "#f2c200", color: "#111", borderRadius: "4px", fontSize: "12px", fontWeight: "bold" }}>
                  {item.batch}
                </span>
                <span style={{ padding: "4px 8px", background: "#0b74ff", color: "#fff", borderRadius: "4px", fontSize: "12px", fontWeight: "bold" }}>
                  {item.examType}
                </span>
              </div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "10px" }}>
                {item.images.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "#0b74ff", border: "1px solid #0b74ff", padding: "6px 12px", borderRadius: "6px", fontSize: "13px" }}>
                    View Image {i + 1}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return Object.entries(data).map(([key, value]) => {
      const nodeId = `${path}-${key}`;
      const isExpanded = expandedNodes[nodeId];
      const isTopLevel = depth === 0;
      
      return (
        <div key={nodeId} className={isTopLevel ? "qp-semester-card" : "qp-batch-card"} style={isTopLevel ? { marginBottom: "12px" } : { marginLeft: "15px", marginTop: "8px" }}>
          <button
            className={isTopLevel ? `qp-semester-toggle ${isExpanded ? "qp-semester-active" : ""}` : `qp-batch-toggle ${isExpanded ? "qp-batch-active" : ""}`}
            onClick={() => toggleNode(nodeId)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {!isTopLevel && <FiUsers size={18} />}
              <span className={isTopLevel ? "qp-semester-title" : ""}>{key}</span>
            </div>
            {isExpanded ? <FiChevronDown size={isTopLevel ? 20 : 16} /> : <FiChevronRight size={isTopLevel ? 20 : 16} />}
          </button>

          {isExpanded && (
            <div className={isTopLevel ? "qp-batches-container" : ""}>
              {renderTree(value, nodeId, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="qp-page-container">
      <header className="qp-header" aria-hidden={true}>
        <FiClipboard className="qp-header-icon" />
      </header>

      <main className="qp-main" role="main">
        <section className="qp-card qp-intro" aria-labelledby="qp-title">
          <h1 id="qp-title" className="qp-title">Question Papers</h1>
          <p className="qp-plain">
            Explore and download previous year question papers organized by{" "}
            <strong>University → College → Course → Semester → Subject</strong>. View papers directly or download them as PDFs.
          </p>
        </section>

        {/* Download by Subject Section */}
        <section className="qp-card" aria-labelledby="qp-subject-section">
          <div className="qp-section-header">
            <FiBook className="qp-section-icon" />
            <h2 id="qp-subject-section" className="qp-subtitle">Download by Subject</h2>
          </div>
          <p className="qp-plain">
            Select a subject to download all its available question papers across all semesters, batches, and exam types.
          </p>
          <div className="qp-subject-row">
            <div className="qp-subject-select-wrap">
              <div className="qp-subject-search">
                <input
                  type="text"
                  className="qp-subject-search-input"
                  placeholder="Search subjects..."
                  value={searchSubject}
                  onChange={(e) => { setSearchSubject(e.target.value); setSelectedSubject(''); }}
                  aria-label="Search subjects"
                />
                <button
                  type="button"
                  className="qp-subject-clear"
                  onClick={() => { setSearchSubject(''); setSelectedSubject(''); }}
                  title="Clear"
                >
                  ×
                </button>

                <select
                  className="qp-subject-select"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  aria-label="Select subject"
                >
                  <option value="">-- Select subject --</option>
                  {subjects
                    .filter(s => s.toLowerCase().includes(searchSubject.toLowerCase()))
                    .map((subj) => (
                      <option key={subj} value={subj}>{subj}</option>
                    ))}
                </select>
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
                    style={{ display: "flex", alignItems: "center", gap: "6px", background: "#0b74ff", color: "#fff", padding: "10px 16px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold" }}
                  >
                    <FiEye size={16} />
                    <span>View All</span>
                  </Link>
                </div>
              );
            })()}
          </div>
        </section>

        {/* Tree Directory Section */}
        <section className="qp-card" aria-labelledby="qp-papers-section">
          <div className="qp-section-header">
            <FiFileText className="qp-section-icon" />
            <h2 id="qp-papers-section" className="qp-subtitle">Browse Question Papers Directory</h2>
          </div>
          
          <div className="qp-content">
            {loading ? (
              <p>Loading directory...</p>
            ) : error ? (
              <p style={{ color: "red" }}>{error}</p>
            ) : tree && Object.keys(tree).length > 0 ? (
              renderTree(tree, "root", 0)
            ) : (
              <p>No question papers found.</p>
            )}
          </div>
        </section>

        <section className="qp-card qp-feedback" aria-labelledby="qp-feedback-section">
          <div className="qp-section-header">
            <FiMessageSquare className="qp-section-icon" />
            <h2 id="qp-feedback-section" className="qp-subtitle">Facing Any Issues?</h2>
          </div>
          <p className="qp-plain">
            Let us know if you're facing problems finding or downloading question papers, or if you have suggestions.
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
