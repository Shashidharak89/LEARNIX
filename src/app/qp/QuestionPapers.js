"use client";

import { useState, useEffect } from "react";
import {
  FiFileText,
  FiFolder,
  FiMessageSquare,
} from "react-icons/fi";
import DirectoryNode from "./DirectoryNode";

export default function QuestionPapers() {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [feedback, setFeedback] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchUniversities(1);
  }, []);

  const fetchUniversities = async (pageNum, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
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
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
      if (page < totalPages && !loadingMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchUniversities(nextPage, true);
      }
  };

  return (
    <div className="qp-page-container">
      <main className="qp-main" role="main">
        {/* Apple Widget: Tree Directory Section */}
        <section className="qp-card qp-directory-card" aria-labelledby="qp-papers-section">
          <header className="qp-dir-header">
            <div className="qp-dir-badge">
              <FiFolder className="qp-dir-badge-icon" aria-hidden="true" />
              <span>Hierarchy: University → College → Course → Semester → Batch → Exam Type</span>
            </div>
            <h2 id="qp-papers-section" className="qp-dir-title">Browse Question Papers Directory</h2>
            <p className="qp-dir-subtitle">
              Explore university archives through structured interactive folders.
            </p>
          </header>
          
          <div className="qp-dir-canvas">
            {loading && page === 1 ? (
              <div className="qp-dir-state-loading">
                <span className="qp-spinner-sm" aria-hidden="true" />
                <p>Loading directory tree...</p>
              </div>
            ) : error ? (
              <div className="qp-dir-state-error">
                <p>{error}</p>
              </div>
            ) : universities.length > 0 ? (
              <div className="qp-dir-tree">
                {universities.map(uni => (
                    <DirectoryNode key={uni._id} type="university" data={uni} />
                ))}
                
                {page < totalPages && (
                    <div className="qp-dir-loadmore-wrap">
                        <button 
                            type="button"
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                            className={`qp-dir-loadmore-btn ${loadingMore ? "is-loading" : ""}`}
                            aria-label="Load more universities"
                        >
                            {loadingMore ? (
                                <span className="qp-dots-loader" aria-hidden="true">
                                    <span className="qp-dot" />
                                    <span className="qp-dot" />
                                    <span className="qp-dot" />
                                </span>
                            ) : (
                                <span>Load More Universities</span>
                            )}
                        </button>
                    </div>
                )}
              </div>
            ) : (
              <p className="qp-dir-empty-msg">No universities found in directory.</p>
            )}
          </div>
        </section>

        {/* Feedback Section Widget */}
        <section className="qp-card qp-feedback-card" aria-labelledby="qp-feedback-section">
          <div className="qp-feedback-head">
            <div className="qp-feedback-icon-pill" aria-hidden="true">
              <FiMessageSquare size={18} />
            </div>
            <div>
              <h3 id="qp-feedback-section" className="qp-feedback-title">Facing Any Issues?</h3>
              <p className="qp-feedback-desc">
                Let us know if you are facing problems finding or downloading question papers, or have suggestions.
              </p>
            </div>
          </div>
          <div className="qp-feedback-body">
            <textarea
              placeholder="Describe the issue or suggestion..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="qp-feedback-textarea"
              rows={3}
            />
            <div className="qp-feedback-footer">
              <button
                type="button"
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
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
