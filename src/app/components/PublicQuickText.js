"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiClock, FiEdit3, FiChevronDown, FiSend } from "react-icons/fi";
import "./styles/PublicQuickText.css";

const HOME_LIMIT = 3;

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function PublicQuickText() {
  const [text, setText] = useState("");
  const [records, setRecords] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const fetchLatest = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/public-texts?page=1&limit=${HOME_LIMIT}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load public texts");
        return;
      }
      setRecords(data.records || []);
      setHasMore(Boolean(data.hasMore));
    } catch {
      setError("Network error while loading public texts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatest();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!text.trim() || posting) return;

    setPosting(true);
    setError("");

    try {
      const res = await fetch("/api/public-texts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to post text");
        return;
      }

      setText("");
      await fetchLatest();
    } catch {
      setError("Network error while posting text");
    } finally {
      setPosting(false);
    }
  };

  return (
    <section className="pqt-wrap" aria-label="Public quick text sharing">
      <div className="pqt-head">
        <h3 className="pqt-title"><FiEdit3 size={16} /> Write anything (public · 24h)</h3>
        <span className="pqt-chip"><FiClock size={12} /> Auto removes in 24h</span>
      </div>

      <form className="pqt-form" onSubmit={handleSubmit}>
        <textarea
          className="pqt-textarea"
          placeholder="Share any short text publicly..."
          value={text}
          maxLength={4000}
          onChange={(event) => setText(event.target.value)}
        />
        <button className="pqt-submit" type="submit" disabled={posting || !text.trim()}>
          <FiSend size={14} /> {posting ? "Posting..." : "Post"}
        </button>
      </form>

      {error && <p className="pqt-error">{error}</p>}

      <div className="pqt-list-wrap">
        <h4 className="pqt-list-title">Latest public posts</h4>

        {loading ? (
          <p className="pqt-empty">Loading...</p>
        ) : records.length === 0 ? (
          <p className="pqt-empty">No public texts yet. Be the first one.</p>
        ) : (
          <div className="pqt-list">
            {records.map((item) => (
              <article className="pqt-item" key={item._id}>
                <p className="pqt-item-text">{item.text}</p>
                <time className="pqt-item-time">{formatDateTime(item.createdAt)}</time>
              </article>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="pqt-more-wrap">
            <Link href="/public-texts" className="pqt-more-btn">
              <FiChevronDown size={15} /> View More
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
