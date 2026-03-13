"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  FiArrowLeft,
  FiMessageCircle,
  FiChevronDown,
  FiLoader,
  FiCalendar,
  FiHash,
} from "react-icons/fi";
import "../styles/AdminDashboard.css";
import "../users/AdminUsers.css";
import "./AdminFeedbacks.css";

const PAGE_LIMIT = 10;

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function AdminFeedbacks() {
  const [token, setToken] = useState("");
  const [myRole, setMyRole] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const [feedbacks, setFeedbacks] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("role") || "";
    const tok = localStorage.getItem("token") || "";
    setMyRole(role);
    setToken(tok);
    setTimeout(() => setIsLoaded(true), 80);
  }, []);

  const fetchFeedbacks = useCallback(
    async (pageNum, append = false) => {
      if (!token) return;
      append ? setLoadingMore(true) : setLoading(true);
      setError("");

      try {
        const res = await fetch(`/api/admin/feedbacks?page=${pageNum}&limit=${PAGE_LIMIT}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to fetch feedbacks");
          return;
        }

        append ? setFeedbacks((prev) => [...prev, ...(data.feedbacks || [])]) : setFeedbacks(data.feedbacks || []);
        setTotal(data.total || 0);
        setPage(data.page || 1);
        setTotalPages(data.totalPages || 1);
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (token && (myRole === "admin" || myRole === "superadmin")) {
      fetchFeedbacks(1, false);
    }
  }, [token, myRole, fetchFeedbacks]);

  if (myRole === null) return null;

  return (
    <div className={`adm-wrapper ${isLoaded ? "adm-loaded" : ""}`}>
      <header className="adm-header">
        <div className="adm-header-content">
          <div className="adm-header-left">
            <Link href="/admin" className="au-back-link">
              <FiArrowLeft size={15} /> Admin Dashboard
            </Link>
            <div className="adm-role-badge" style={{ backgroundColor: "#ec4899", marginTop: "0.75rem" }}>
              <FiMessageCircle size={15} />
              <span>Feedbacks</span>
            </div>
            <h1 className="adm-title">
              User <span className="adm-title-highlight">Feedbacks</span>
            </h1>
            <p className="adm-subtitle">
              {total > 0 ? `${total} total feedbacks` : "No feedback entries yet"}
            </p>
          </div>
          <div className="adm-header-deco">
            <div className="adm-deco-circle" style={{ background: "#fce7f3", border: "2px solid #fbcfe8" }}>
              <FiMessageCircle size={44} color="#ec4899" />
            </div>
          </div>
        </div>
      </header>

      <section className="adm-summary">
        <div className="adm-summary-card adm-summary-blue">
          <div className="adm-summary-icon"><FiMessageCircle size={20} /></div>
          <div>
            <div className="adm-summary-value">{total}</div>
            <div className="adm-summary-label">Total Feedbacks</div>
          </div>
        </div>
        <div className="adm-summary-card adm-summary-yellow">
          <div className="adm-summary-icon"><FiHash size={20} /></div>
          <div>
            <div className="adm-summary-value">{feedbacks.length}</div>
            <div className="adm-summary-label">Loaded</div>
          </div>
        </div>
      </section>

      {error && <div className="au-error-banner">{error}</div>}

      {loading ? (
        <div className="au-loading-state">
          <div className="au-spinner"><FiLoader size={28} /></div>
          <p>Loading feedbacks…</p>
        </div>
      ) : (
        <>
          <section className="af-list">
            {feedbacks.map((item, idx) => (
              <article
                key={item._id || idx}
                className="af-card"
                style={{ animationDelay: `${idx * 0.03}s` }}
              >
                <div className="af-row-top">
                  <span className="af-id">#{item._id?.slice(-6) || idx + 1}</span>
                  <span className="af-time">
                    <FiCalendar size={12} /> {formatDateTime(item.createdAt)}
                  </span>
                </div>
                <p className="af-text">{item.feedback}</p>
              </article>
            ))}
          </section>

          {feedbacks.length === 0 && !loading && (
            <div className="au-empty">
              <FiMessageCircle size={36} />
              <p>No feedbacks found</p>
            </div>
          )}

          {page < totalPages && (
            <div className="au-view-more-wrap">
              <button
                className="au-view-more-btn"
                onClick={() => fetchFeedbacks(page + 1, true)}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <><span className="au-dots"><span /><span /><span /></span> Loading…</>
                ) : (
                  <><FiChevronDown size={16} /> View More ({total - feedbacks.length} remaining)</>
                )}
              </button>
            </div>
          )}

          {feedbacks.length > 0 && page >= totalPages && (
            <p className="au-all-loaded">All {total} feedbacks loaded</p>
          )}
        </>
      )}
    </div>
  );
}
