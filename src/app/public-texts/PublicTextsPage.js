"use client";

import { useEffect, useState } from "react";
import { FiClock, FiChevronDown } from "react-icons/fi";
import "./styles/PublicTextsPage.css";

const PAGE_LIMIT = 10;

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function PublicTextsPage() {
  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const fetchPage = async (pageNum = 1, append = false) => {
    append ? setLoadingMore(true) : setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/public-texts?page=${pageNum}&limit=${PAGE_LIMIT}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to fetch public texts");
        return;
      }

      if (append) {
        setRecords((prev) => [...prev, ...(data.records || [])]);
      } else {
        setRecords(data.records || []);
      }

      setPage(data.page || pageNum);
      setTotalPages(data.totalPages || 1);
    } catch {
      setError("Network error while loading public texts");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchPage(1, false);
  }, []);

  return (
    <main className="ptf-page">
      <section className="ptf-wrap">
        <div className="ptf-head">
          <h1 className="ptf-title">Public Quick Sharing (24h)</h1>
          <p className="ptf-sub"><FiClock size={14} /> Latest posts first · Records auto-expire after 24 hours</p>
        </div>

        {error && <p className="ptf-error">{error}</p>}

        {loading ? (
          <p className="ptf-empty">Loading...</p>
        ) : records.length === 0 ? (
          <p className="ptf-empty">No public records available right now.</p>
        ) : (
          <div className="ptf-list">
            {records.map((item) => (
              <article className="ptf-item" key={item._id}>
                <p className="ptf-item-text">{item.text}</p>
                <time className="ptf-item-time">{formatDateTime(item.createdAt)}</time>
              </article>
            ))}
          </div>
        )}

        {page < totalPages && (
          <div className="ptf-more-wrap">
            <button
              type="button"
              className="ptf-more-btn"
              disabled={loadingMore}
              onClick={() => fetchPage(page + 1, true)}
            >
              <FiChevronDown size={16} /> {loadingMore ? "Loading..." : "View More"}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
