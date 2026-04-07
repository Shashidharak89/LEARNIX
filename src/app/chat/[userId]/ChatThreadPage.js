"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiSend, FiMessageSquare } from "react-icons/fi";
import { authFetch } from "@/lib/clientAuth";
import "./styles/ChatThreadPage.css";

function formatChatTime(value) {
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleString([], {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  });
}

function toChronological(messages) {
  return [...messages].reverse();
}

export default function ChatThreadPage({ userId }) {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [participant, setParticipant] = useState(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);

  const loadMessages = async (cursor = null, append = false) => {
    setError("");
    try {
      const token = localStorage.getItem("token") || "";
      if (!token) {
        setError("Please login to use chat.");
        setLoading(false);
        return;
      }

      const query = new URLSearchParams({ limit: "20" });
      if (cursor) query.set("cursor", cursor);

      const res = await authFetch(`/api/chat/${userId}?${query.toString()}`);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "Failed to load chat messages.");
        setLoading(false);
        return;
      }

      setParticipant(data.participant || null);
      setCurrentUserId(data.currentUserId || "");
      setHasMore(Boolean(data.hasMore));
      setNextCursor(data.nextCursor || null);

      const incoming = toChronological(data.messages || []);

      if (append) {
        setMessages((prev) => [...incoming, ...prev]);
      } else {
        setMessages(incoming);
      }
    } catch (err) {
      setError("Network error while loading chat.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setMessages([]);
    setHasMore(false);
    setNextCursor(null);
    loadMessages();
  }, [userId]);

  const handleSend = async (event) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;

    setSending(true);
    setError("");

    try {
      const res = await authFetch(`/api/chat/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Failed to send message.");
        setSending(false);
        return;
      }

      if (data?.message) {
        setMessages((prev) => [...prev, data.message]);
      }
      setDraft("");
    } catch {
      setError("Network error while sending message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="chat-thread-container">
      <div className="chat-thread-card">
        <header className="chat-thread-header">
          <div>
            <h1>Chat</h1>
            <p>
              {participant
                ? `${participant.name} (${participant.usn})`
                : "Direct messages"}
            </p>
          </div>
          {participant?._id && (
            <Link href={`/search/${participant.usn}`} className="chat-thread-profile-link">
              View profile
            </Link>
          )}
        </header>

        {error && (
          <div className="chat-thread-error">
            {error} {error.includes("login") && <Link href="/login">Go to login</Link>}
          </div>
        )}

        <div className="chat-thread-list-wrap">
          {loading ? (
            <div className="chat-thread-empty">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="chat-thread-empty">
              <FiMessageSquare size={20} />
              <span>No messages yet. Start chatting now.</span>
            </div>
          ) : (
            <ul className="chat-thread-list">
              {messages.map((msg) => {
                const mine = String(msg.from) === String(currentUserId);
                return (
                  <li
                    key={msg._id}
                    className={`chat-msg-row ${mine ? "chat-msg-row-right" : "chat-msg-row-left"}`}
                  >
                    <div className={`chat-msg-bubble ${mine ? "chat-msg-bubble-right" : "chat-msg-bubble-left"}`}>
                      <p>{msg.content}</p>
                      <span>{formatChatTime(msg.timestamp)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {hasMore && (
          <div className="chat-thread-more-wrap">
            <button
              type="button"
              className="chat-thread-more-btn"
              onClick={() => loadMessages(nextCursor, true)}
            >
              View more
            </button>
          </div>
        )}

        <form className="chat-thread-form" onSubmit={handleSend}>
          <textarea
            className="chat-thread-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type your message..."
            rows={2}
            maxLength={5000}
          />
          <button type="submit" className="chat-thread-send-btn" disabled={sending || !draft.trim()}>
            <FiSend size={16} /> {sending ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </section>
  );
}
