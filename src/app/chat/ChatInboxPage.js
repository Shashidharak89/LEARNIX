"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiClock, FiMessageSquare } from "react-icons/fi";
import { authFetch } from "@/lib/clientAuth";
import "./styles/ChatInboxPage.css";

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const sameDay =
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate();

  if (sameDay) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return date.toLocaleDateString([], { day: "2-digit", month: "short" });
}

export default function ChatInboxPage() {
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const loadPage = async (targetPage, append = false) => {
    try {
      setError("");
      if (append) setLoadingMore(true);

      const token = localStorage.getItem("token") || "";
      if (!token) {
        setError("Please login to view chats.");
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      const res = await authFetch(`/api/chat?page=${targetPage}&limit=20`);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "Failed to load chats.");
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      setItems((prev) => (append ? [...prev, ...(data.conversations || [])] : (data.conversations || [])));
      setPage(targetPage);
      setHasMore(Boolean(data.hasMore));
    } catch {
      setError("Network error while loading chats.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadPage(1, false);
  }, []);

  return (
    <section className="chat-inbox-container">
      <div className="chat-inbox-card">
        <header className="chat-inbox-header">
          <h1>Chats</h1>
          <p>Recent conversations (latest first)</p>
        </header>

        {error && (
          <div className="chat-inbox-error">
            {error} {error.includes("login") && <Link href="/login">Go to login</Link>}
          </div>
        )}

        {loading ? (
          <div className="chat-inbox-empty">Loading chats...</div>
        ) : items.length === 0 ? (
          <div className="chat-inbox-empty">
            <FiMessageSquare size={18} />
            <span>No chats yet. Start from a user profile.</span>
          </div>
        ) : (
          <ul className="chat-inbox-list">
            {items.map((row) => (
              <li key={row.participant._id}>
                <Link href={`/chat/${row.participant._id}`} className="chat-inbox-item">
                  <img
                    src={row.participant.profileimg || "https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp"}
                    alt={row.participant.name}
                    className="chat-inbox-avatar"
                  />
                  <div className="chat-inbox-content">
                    <div className="chat-inbox-top">
                      <h3>{row.participant.name}</h3>
                      <span>{formatTime(row.lastTimestamp)}</span>
                    </div>
                    <p>{row.lastMessage}</p>
                    <small>@{row.participant.usn}</small>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {hasMore && (
          <div className="chat-inbox-more-wrap">
            <button
              className="chat-inbox-more-btn"
              type="button"
              onClick={() => loadPage(page + 1, true)}
              disabled={loadingMore}
            >
              <FiClock size={14} /> {loadingMore ? "Loading..." : "View more"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
