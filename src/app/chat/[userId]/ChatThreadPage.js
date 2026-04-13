"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FiSend, FiMessageSquare } from "react-icons/fi";
import { authFetch } from "@/lib/clientAuth";
import "./styles/ChatThreadPage.css";

const URL_REGEX = /((https?:\/\/|www\.)[^\s]+|learnix\.dev[^\s]*)/gi;

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

function normalizeUrl(raw) {
  const text = String(raw || "").trim();
  if (!text) return null;

  const withProtocol = /^https?:\/\//i.test(text) ? text : `https://${text}`;

  try {
    return new URL(withProtocol);
  } catch {
    return null;
  }
}

function getLearnixLinksFromText(messageText) {
  const found = String(messageText || "").match(URL_REGEX) || [];
  const unique = Array.from(new Set(found.map((value) => value.trim())));

  return unique
    .map((raw) => {
      const parsed = normalizeUrl(raw);
      if (!parsed) return null;

      const host = parsed.hostname.toLowerCase();
      const isLearnix = host === "learnix.dev" || host.endsWith(".learnix.dev") || host === "www.learnix.dev";
      if (!isLearnix) return null;

      const pathname = parsed.pathname || "/";
      const isWorksTopic = /^\/works\/.+/i.test(pathname);

      return {
        href: parsed.toString(),
        isWorksTopic,
      };
    })
    .filter(Boolean);
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
  const messagesContainerRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);

  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  };

  const loadMessages = async (cursor = null, append = false) => {
    shouldAutoScrollRef.current = !append;
    setError("");
    try {
      const token = localStorage.getItem("token") || "";
      if (!token) {
        setError("Please login to use chat.");
        setLoading(false);
        return;
      }

      const query = new globalThis.URLSearchParams({ limit: "20" });
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

  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      scrollToBottom();
    }
  }, [messages, loading]);

  const handleSend = async (event) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;

    setSending(true);
    shouldAutoScrollRef.current = true;
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

        <div className="chat-thread-list-wrap" ref={messagesContainerRef}>
          {hasMore && (
            <div className="chat-thread-more-wrap chat-thread-more-wrap-top">
              <button
                type="button"
                className="chat-thread-more-btn"
                onClick={() => loadMessages(nextCursor, true)}
              >
                View more
              </button>
            </div>
          )}

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
                const learnixLinks = getLearnixLinksFromText(msg.content);
                return (
                  <li
                    key={msg._id}
                    className={`chat-msg-row ${mine ? "chat-msg-row-right" : "chat-msg-row-left"}`}
                  >
                    <div className={`chat-msg-bubble ${mine ? "chat-msg-bubble-right" : "chat-msg-bubble-left"}`}>
                      <p>{msg.content}</p>
                      {learnixLinks.length > 0 && (
                        <div className="chat-link-preview-list">
                          {learnixLinks.map((link) => (
                            <div key={link.href} className="chat-link-preview-card">
                              <div className="chat-link-preview-head">Learnix</div>
                              <a
                                href={link.href}
                                target="_blank"
                                rel="noreferrer"
                                className="chat-link-preview-url"
                              >
                                {link.href}
                              </a>
                              {link.isWorksTopic && (
                                <a
                                  href={link.href}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="chat-link-topic-btn"
                                >
                                  View Topic
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      <span>{formatChatTime(msg.timestamp)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

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
