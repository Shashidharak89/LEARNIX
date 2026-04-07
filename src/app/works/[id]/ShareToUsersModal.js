"use client";

import { useEffect, useMemo, useState } from "react";
import { FiCopy, FiMoreVertical, FiSearch, FiSend, FiX } from "react-icons/fi";
import { authFetch } from "@/lib/clientAuth";
import "./styles/ShareToUsersModal.css";

const DEFAULT_PROFILE_IMG =
  "https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp";

export default function ShareToUsersModal({ open, onClose, shareUrl, shareText }) {
  const [users, setUsers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const mode = useMemo(() => (activeSearch ? "search" : "recent"), [activeSearch]);

  useEffect(() => {
    if (!open) return;

    setUsers([]);
    setSelectedIds([]);
    setSearchInput("");
    setActiveSearch("");
    setPage(1);
    setHasMore(false);
    setError("");
    setToast(null);

    void fetchRecent(1, false);
  }, [open]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(id);
  }, [toast]);

  const fetchRecent = async (targetPage = 1, append = false) => {
    try {
      setError("");
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const res = await authFetch(`/api/chat?page=${targetPage}&limit=5`);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "Failed to load recent chats.");
        return;
      }

      const participants = (data.conversations || []).map((row) => row.participant);
      setUsers((prev) => (append ? [...prev, ...participants] : participants));
      setPage(targetPage);
      setHasMore(Boolean(data.hasMore));
    } catch {
      setError("Network error while loading recent chats.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchSearchUsers = async (term, targetPage = 1, append = false) => {
    try {
      setError("");
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const encoded = encodeURIComponent(term);
      const res = await authFetch(`/api/chat/share/users?search=${encoded}&page=${targetPage}&limit=5`);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "Failed to search users.");
        return;
      }

      setUsers((prev) => (append ? [...prev, ...(data.users || [])] : (data.users || [])));
      setPage(targetPage);
      setHasMore(Boolean(data.hasMore));
    } catch {
      setError("Network error while searching users.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSearch = async () => {
    const term = searchInput.trim();
    setSelectedIds([]);

    if (!term) {
      setActiveSearch("");
      setUsers([]);
      setPage(1);
      setHasMore(false);
      await fetchRecent(1, false);
      return;
    }

    setActiveSearch(term);
    await fetchSearchUsers(term, 1, false);
  };

  const handleViewMore = async () => {
    const nextPage = page + 1;
    if (mode === "search") {
      await fetchSearchUsers(activeSearch, nextPage, true);
    } else {
      await fetchRecent(nextPage, true);
    }
  };

  const toggleSelected = (userId) => {
    setSelectedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSend = async () => {
    if (!selectedIds.length || sending) return;

    setSending(true);
    setError("");

    const messageContent = `${shareText}\n${shareUrl}`;

    let success = 0;
    let failed = 0;

    for (const userId of selectedIds) {
      try {
        const res = await authFetch(`/api/chat/${userId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: messageContent }),
        });

        if (res.ok) {
          success += 1;
        } else {
          failed += 1;
        }
      } catch {
        failed += 1;
      }
    }

    if (success > 0) {
      setSelectedIds([]);
      setToast({
        type: failed > 0 ? "warn" : "success",
        text: failed > 0
          ? `Sent to ${success} user(s), failed for ${failed}.`
          : `Sent successfully to ${success} user(s).`,
      });
    } else {
      setToast({ type: "error", text: "Failed to send link. Try again." });
    }

    setSending(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setToast({ type: "success", text: "Link copied." });
    } catch {
      setToast({ type: "error", text: "Failed to copy link." });
    }
  };

  const handleShareMore = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Learnix Topic",
          text: shareText,
          url: shareUrl,
        });
        return;
      }

      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setToast({ type: "warn", text: "Share not supported. Copied instead." });
    } catch {
      setToast({ type: "error", text: "Could not open external share." });
    }
  };

  if (!open) return null;

  return (
    <div className="su-overlay" onClick={onClose}>
      <div className="su-modal" onClick={(e) => e.stopPropagation()}>
        {toast && <div className={`su-toast su-toast-${toast.type}`}>{toast.text}</div>}

        <div className="su-header">
          <div>
            <h3>Share to Learnix Users</h3>
            <p>Select one or more users and send this topic link.</p>
          </div>
          <button type="button" className="su-close" onClick={onClose}>
            <FiX size={18} />
          </button>
        </div>

        <div className="su-search-row">
          <div className="su-search-input-wrap">
            <FiSearch className="su-search-icon" size={16} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name or USN"
              className="su-search-input"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleSearch();
                }
              }}
            />
          </div>
          <button type="button" className="su-search-btn" onClick={() => void handleSearch()}>
            Search
          </button>
        </div>

        <div className="su-mode-label">
          {mode === "search" ? `Search results for "${activeSearch}"` : "Recent chats"}
        </div>

        {error && <div className="su-error">{error}</div>}

        <div className="su-list-wrap">
          {loading ? (
            <div className="su-empty">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="su-empty">No users found.</div>
          ) : (
            <ul className="su-user-list">
              {users.map((user) => {
                const checked = selectedIds.includes(user._id);
                return (
                  <li key={user._id}>
                    <button
                      type="button"
                      className={`su-user-item ${checked ? "su-user-item-selected" : ""}`}
                      onClick={() => toggleSelected(user._id)}
                    >
                      <img
                        src={user.profileimg || DEFAULT_PROFILE_IMG}
                        alt={user.name}
                        className="su-avatar"
                      />
                      <div className="su-user-meta">
                        <strong>{user.name}</strong>
                        <span>{user.usn}</span>
                      </div>
                      <input type="checkbox" readOnly checked={checked} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {hasMore && (
          <div className="su-view-more-wrap">
            <button
              type="button"
              className="su-view-more-btn"
              onClick={() => void handleViewMore()}
              disabled={loadingMore}
            >
              {loadingMore ? "Loading..." : "View more"}
            </button>
          </div>
        )}

        <div className="su-footer">
          <div className="su-selected-count">Selected: {selectedIds.length}</div>
          <div className="su-footer-actions">
            <button
              type="button"
              className="su-more-share-btn"
              onClick={() => void handleShareMore()}
              title="Share to other apps"
              aria-label="Share to other apps"
            >
              <FiMoreVertical size={16} />
            </button>
            <button
              type="button"
              className="su-copy-btn"
              onClick={() => void handleCopyLink()}
            >
              <FiCopy size={15} /> Copy link
            </button>
            <button
              type="button"
              className="su-send-btn"
              onClick={() => void handleSend()}
              disabled={!selectedIds.length || sending}
            >
              <FiSend size={15} /> {sending ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
