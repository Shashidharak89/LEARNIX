"use client";

import { useState, useEffect } from "react";
import { FiFolder } from "react-icons/fi";
import DirectoryNode from "./DirectoryNode";

const QPDirectorySkeleton = ({ count = 5 }) => (
  <div className="qp-dir-tree qp-dir-skeleton-tree" aria-label="Loading directory">
    {[...Array(count)].map((_, i) => (
      <div key={i} className="qp-dir-skeleton-card">
        <div className="qp-dir-skeleton-icon" />
        <div className="qp-dir-skeleton-text-wrap">
          <div
            className="qp-dir-skeleton-line"
            style={{ width: i % 3 === 0 ? "60%" : i % 3 === 1 ? "42%" : "72%" }}
          />
        </div>
        <div className="qp-dir-skeleton-chevron" />
      </div>
    ))}
  </div>
);

export default function QuestionPapers() {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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
        {/* Title Card for Question Papers Directory */}
        <header className="qp-dir-title-card">
          <div className="qp-dir-title-badge" aria-hidden="true">
            <FiFolder size={26} />
          </div>
          <div className="qp-dir-title-content">
            <h2 id="qp-papers-section" className="qp-dir-title">
              Browse Question Papers Directory
            </h2>
            <p className="qp-dir-subtitle">
              Explore university archives through structured interactive folders.
            </p>
          </div>
        </header>

        {/* Standalone Directory Section - Free, independent individual cards */}
        <section className="qp-dir-section" aria-labelledby="qp-papers-section">
          <div className="qp-dir-cards-list">
            {loading && page === 1 ? (
              <QPDirectorySkeleton count={5} />
            ) : error ? (
              <div className="qp-dir-state-error">
                <p>{error}</p>
              </div>
            ) : universities.length > 0 ? (
              <>
                <div className="qp-dir-tree">
                  {universities.map(uni => (
                      <DirectoryNode key={uni._id} type="university" data={uni} level={0} />
                  ))}
                </div>
                
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
              </>
            ) : (
              <p className="qp-dir-empty-msg">No universities found in directory.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
