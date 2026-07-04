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
      } else {
        setError(json.error || "Failed to load question papers");
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

    // Unused legacy subject functions removed

  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  const renderTree = (data, path = "", depth = 0) => {
    return Object.entries(data).map(([key, value]) => {
      const nodeId = `${path}-${key}`;
      
      // If it's a leaf node (ExamType)
      if (value && value.isLeaf) {
        const { batchId, examTypeId, collegeId, courseId, semesterId } = value;
        const url = `/qp/compiled?batchId=${batchId}&examTypeId=${examTypeId}&collegeId=${collegeId}&courseId=${courseId}&semesterId=${semesterId}`;
        return (
          <div key={nodeId} style={{ marginLeft: "15px", marginTop: "8px", marginBottom: "8px" }}>
             <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "#0b74ff", fontWeight: "600", padding: "10px 14px", background: "#f8faff", borderRadius: "8px", border: "1px solid #0b74ff", transition: "all 0.2s" }} onMouseOver={(e) => { e.currentTarget.style.background = "#0b74ff"; e.currentTarget.style.color = "#fff"; }} onMouseOut={(e) => { e.currentTarget.style.background = "#f8faff"; e.currentTarget.style.color = "#0b74ff"; }}>
                 <FiFileText size={16} /> View {key} Papers
             </a>
          </div>
        );
      }

      // Normal intermediate nodes
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
            <strong>University → College → Course → Semester → Batch → Exam Type</strong>.
          </p>
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
