"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  MessageCircleIcon,
  ChevronDownIcon,
  CalendarIcon,
  ListOrderedIcon,
} from "@animateicons/react/lucide";
import { FiLoader } from "react-icons/fi";
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

        append
          ? setFeedbacks((prev) => [...prev, ...(data.feedbacks || [])])
          : setFeedbacks(data.feedbacks || []);
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
      <main className="adm-main af-main">
        {/* ── Apple-style Hero Intro Card ── */}
        <div className="adm-intro-card af-intro-card">
          <div className="adm-intro-header af-intro-header">
            <div className="adm-intro-left af-intro-left">
              <div className="af-header-top-row">
                <Link href="/admin" className="au-back-link">
                  <ArrowLeftIcon size={16} /> <span>Admin Dashboard</span>
                </Link>
                <div className="adm-role-badge af-header-badge">
                  <MessageCircleIcon size={15} />
                  <span>Feedback Management</span>
                </div>
              </div>

              <div className="af-title-group">
                <h1 className="adm-title af-title">
                  User <span className="adm-title-highlight af-title-highlight">Feedbacks</span>
                </h1>
                <p className="adm-subtitle af-subtitle">
                  {total > 0
                    ? `Review user thoughts and suggestions — ${total} total submissions`
                    : "No feedback entries received yet"}
                </p>
              </div>
            </div>

            <div className="adm-intro-right">
              <div className="adm-shield-orb af-orb">
                <MessageCircleIcon size={38} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Apple Summary Grid Widgets ── */}
        <section className="au-summary-grid af-summary-grid">
          <div className="au-summary-widget af-widget-pink">
            <div className="au-widget-icon af-widget-icon-pink">
              <MessageCircleIcon size={20} />
            </div>
            <div className="au-widget-content">
              <div className="au-widget-value">{total}</div>
              <div className="au-widget-label">Total Feedbacks</div>
            </div>
          </div>

          <div className="au-summary-widget au-widget-amber">
            <div className="au-widget-icon">
              <ListOrderedIcon size={20} />
            </div>
            <div className="au-widget-content">
              <div className="au-widget-value">{feedbacks.length}</div>
              <div className="au-widget-label">Loaded on Page</div>
            </div>
          </div>
        </section>

        {error && <div className="au-error-banner">{error}</div>}

        {loading ? (
          <div className="au-loading-state">
            <div className="au-spinner">
              <FiLoader size={28} />
            </div>
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
                      <CalendarIcon size={13} /> {formatDateTime(item.createdAt)}
                    </span>
                  </div>
                  <p className="af-text">{item.feedback}</p>
                </article>
              ))}
            </section>

            {feedbacks.length === 0 && !loading && (
              <div className="au-empty af-empty">
                <MessageCircleIcon size={36} />
                <p>No feedbacks submitted yet</p>
              </div>
            )}

            {page < totalPages && (
              <div className="au-view-more-wrap">
                <button
                  type="button"
                  className="au-view-more-btn"
                  onClick={() => fetchFeedbacks(page + 1, true)}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <span className="au-dots">
                        <span />
                        <span />
                        <span />
                      </span>{" "}
                      Loading…
                    </>
                  ) : (
                    <>
                      <ChevronDownIcon size={16} /> View More ({total - feedbacks.length} remaining)
                    </>
                  )}
                </button>
              </div>
            )}

            {feedbacks.length > 0 && page >= totalPages && (
              <p className="au-all-loaded">All {total} feedbacks loaded</p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
