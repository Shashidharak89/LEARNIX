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
import DirectoryNode from "./DirectoryNode";
import "./styles/QuestionPapers.css";

export default function QuestionPapers() {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [feedback, setFeedback] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchUniversities(1);
  }, []);

  const fetchUniversities = async (pageNum, append = false) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/qp/v1/universities?page=${pageNum}&limit=20`);
      const json = await res.json();
      if (json.success) {
        if (append) {
            setUniversities(prev => [...prev, ...json.data]);
        } else {
            setUniversities(json.data);
        }
        setTotalPages(json.pagination.totalPages);
      } else {
        setError(json.error || "Failed to load universities");
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleLoadMore = () => {
      if (page < totalPages) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchUniversities(nextPage, true);
      }
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
          
          <div className="qp-content" style={{ padding: "10px", background: "#f8f9fa", borderRadius: "12px", border: "1px solid #eaeaea" }}>
            {loading && page === 1 ? (
              <p style={{ textAlign: "center", color: "#888", padding: "20px" }}>Loading directory...</p>
            ) : error ? (
              <p style={{ color: "red", textAlign: "center", padding: "20px" }}>{error}</p>
            ) : universities.length > 0 ? (
              <div>
                  {universities.map(uni => (
                      <DirectoryNode key={uni._id} type="university" data={uni} />
                  ))}
                  
                  {page < totalPages && (
                      <div style={{ textAlign: "center", marginTop: "20px" }}>
                          <button 
                              onClick={handleLoadMore}
                              disabled={loading}
                              style={{
                                  background: loading ? "#e9ecef" : "#fff",
                                  color: loading ? "#888" : "#0b74ff",
                                  border: "1px solid #0b74ff",
                                  padding: "8px 20px",
                                  borderRadius: "6px",
                                  cursor: loading ? "default" : "pointer",
                                  fontWeight: "600"
                              }}
                          >
                              {loading ? "Loading..." : "Load More Universities"}
                          </button>
                      </div>
                  )}
              </div>
            ) : (
              <p style={{ textAlign: "center", color: "#888", padding: "20px" }}>No question papers found.</p>
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
