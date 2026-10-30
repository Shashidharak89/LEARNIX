"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FiSearch,
  FiX,
  FiExternalLink,
  FiTrash2,
  FiCalendar,
  FiClock,
  FiFolder,
  FiBell,
  FiBookOpen,
  FiFileText,
  FiCheck,
} from "react-icons/fi";
import { Bookmark } from "lucide-react";
import { authFetch } from "@/lib/clientAuth";
import "./styles/LearnLater.css";

const TYPE_CONFIG = {
  resource: {
    label: "Resource",
    icon: FiFolder,
    stripeColor: "#0b74ff",
    badgeClass: "ll-badge--resource",
  },
  update: {
    label: "Update",
    icon: BellIconWrapper,
    stripeColor: "#f59e0b",
    badgeClass: "ll-badge--update",
  },
  "study-material": {
    label: "Study Material",
    icon: FiBookOpen,
    stripeColor: "#2563eb",
    badgeClass: "ll-badge--study",
  },
  "question-paper": {
    label: "Question Paper",
    icon: FiFileText,
    stripeColor: "#d97706",
    badgeClass: "ll-badge--qp",
  },
};

function BellIconWrapper(props) {
  return <FiBell {...props} />;
}

function normalizeItemType(type) {
  const t = String(type || "").toLowerCase().trim();
  if (t.includes("resource") || t.includes("topic") || t.includes("work")) {
    return "resource";
  }
  if (t.includes("update")) {
    return "update";
  }
  if (t.includes("material") || t.includes("sm")) {
    return "study-material";
  }
  if (t.includes("paper") || t.includes("qp")) {
    return "question-paper";
  }
  return "resource";
}

export default function LearnLaterClient() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingId, setIsDeletingId] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    const timer = setTimeout(() => {
      setToastMessage("");
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const fetchItems = useCallback(async (query = "") => {
    setIsLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        setIsLoggedIn(false);
        setIsLoading(false);
        return;
      }
      setIsLoggedIn(true);

      const params = new window.URLSearchParams();
      params.set("limit", "10");
      params.set("sort", "newest");
      if (query.trim()) {
        params.set("q", query.trim());
      }

      const res = await authFetch(`/api/learn-later?${params.toString()}`);
      if (res.status === 401) {
        setIsLoggedIn(false);
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      if (data.success) {
        // Enforce maximum 10 latest records
        const records = (data.items || []).slice(0, 10);
        setItems(records);
      }
    } catch (err) {
      console.error("Error fetching learn later items:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchItems(activeQuery);
  }, [activeQuery, fetchItems]);

  // Listen for cross-component sync
  useEffect(() => {
    const handleSync = () => {
      fetchItems(activeQuery);
    };
    window.addEventListener("learnix:learn-later-updated", handleSync);
    return () => window.removeEventListener("learnix:learn-later-updated", handleSync);
  }, [activeQuery, fetchItems]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setActiveQuery(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setActiveQuery("");
  };

  const handleDeleteItem = async (e, item) => {
    e.preventDefault();
    e.stopPropagation();

    const idToDelete = item.itemId || item.id;
    if (!idToDelete) return;

    setIsDeletingId(idToDelete);
    try {
      const res = await authFetch(`/api/learn-later/${encodeURIComponent(idToDelete)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setItems((prev) => prev.filter((it) => (it.itemId || it.id) !== idToDelete));
        showToast("Removed from Learn Later");
        window.dispatchEvent(
          new window.CustomEvent("learnix:learn-later-updated", {
            detail: { itemId: idToDelete, isSaved: false },
          })
        );
      } else {
        showToast("Could not remove item. Please try again.");
      }
    } catch (err) {
      console.error("Failed to delete item:", err);
      showToast("Could not remove item. Please try again.");
    } finally {
      setIsDeletingId(null);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="ll-page-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="ll-toast" role="status" aria-live="polite">
          <FiCheck className="ll-toast-icon" />
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="ll-main">
        {/* Intro Card - Refactored to match Updates Page Header */}
        <div className="ll-intro-card">
          <div className="ll-intro-header">
            <h1 className="ll-title">
              <Bookmark className="ll-title-icon" size={24} />
              <span>Learn Later</span>
            </h1>
          </div>

          {/* Search Form - exact Updates Page searchbar design */}
          <form className="ll-search-form" onSubmit={handleSearchSubmit}>
            <div className="ll-search-wrap">
              <FiSearch className="ll-search-icon" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="ll-search-input"
                placeholder="Search saved items by title, subject, or keywords..."
                aria-label="Search saved items"
              />
              {searchInput && (
                <button
                  type="button"
                  className="ll-search-clear-inline"
                  onClick={handleClearSearch}
                  aria-label="Clear search"
                >
                  <FiX size={14} />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="ll-search-btn"
              disabled={!searchInput.trim()}
            >
              <FiSearch className="ll-search-btn-icon" />
              <span className="ll-search-btn-text">Search</span>
            </button>
          </form>
        </div>

        {/* Content List Area */}
        <div className="ll-content">
          {!isLoggedIn ? (
            <div className="ll-auth-card">
              <div className="ll-auth-icon-wrap">
                <Bookmark size={30} />
              </div>
              <h3 className="ll-auth-title">Authentication Required</h3>
              <p className="ll-auth-desc">
                Sign in with your Learnix account to view and access your saved Learn Later queue.
              </p>
              <Link href="/login?redirect=/learn-later" className="ll-auth-btn">
                Sign In to Continue
              </Link>
            </div>
          ) : isLoading ? (
            <div className="ll-list">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="ll-card ll-card--skeleton">
                  <div className="ll-skeleton-header">
                    <div className="ll-skeleton-pill" />
                    <div className="ll-skeleton-date" />
                  </div>
                  <div className="ll-skeleton-line ll-skeleton-title" />
                  <div className="ll-skeleton-line ll-skeleton-text" />
                  <div className="ll-skeleton-actions" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="ll-empty-state">
              <FiClock className="ll-empty-icon" />
              <p className="ll-empty-text">
                {activeQuery
                  ? `No saved items found matching "${activeQuery}".`
                  : "Your Learn Later queue is empty."}
              </p>
              <p className="ll-empty-subtext">
                {activeQuery
                  ? "Try searching with a different keyword."
                  : "Bookmark updates, resources, study materials, or question papers to review them anytime."}
              </p>
              {!activeQuery && (
                <div className="ll-empty-actions">
                  <Link href="/updates" className="ll-empty-btn ll-empty-btn-primary">
                    <FiBell size={14} />
                    <span>View Updates</span>
                  </Link>
                  <Link href="/works" className="ll-empty-btn">
                    <FiFolder size={14} />
                    <span>Explore Resources</span>
                  </Link>
                  <Link href="/materials" className="ll-empty-btn">
                    <FiBookOpen size={14} />
                    <span>Study Materials</span>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="ll-list">
              {items.map((item) => {
                const normType = normalizeItemType(item.type);
                const config = TYPE_CONFIG[normType] || TYPE_CONFIG.resource;
                const IconComponent = config.icon;
                const itemId = item.itemId || item.id;
                const isDeleting = isDeletingId === itemId;
                const targetUrl = item.url || "/works";

                return (
                  <article
                    key={itemId}
                    className={`ll-card ${isDeleting ? "is-removing" : ""}`}
                    style={{ "--ll-card-accent": config.stripeColor }}
                  >
                    {/* Card Top Accent Stripe */}
                    <div className="ll-card-stripe" />

                    {/* Card Header Row: Badge & Timestamp */}
                    <div className="ll-card-header">
                      <div className="ll-card-header-left">
                        <span className={`ll-type-pill ${config.badgeClass}`}>
                          <IconComponent size={13} className="ll-pill-icon" />
                          <span>{config.label}</span>
                        </span>
                        {item.subtitle && (
                          <span className="ll-subject-tag" title={item.subtitle}>
                            {item.subtitle}
                          </span>
                        )}
                      </div>

                      <div className="ll-card-date">
                        <FiCalendar size={13} />
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                    </div>

                    {/* Card Body: Title & Content */}
                    <div className="ll-card-body">
                      <h2 className="ll-card-title">
                        <a
                          href={targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ll-card-title-link"
                          title={item.title}
                        >
                          {item.title}
                        </a>
                      </h2>

                      {item.description && (
                        <p className="ll-card-desc">{item.description}</p>
                      )}
                    </div>

                    {/* Card Footer Actions */}
                    <div className="ll-card-footer">
                      <a
                        href={targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ll-action-visit"
                        title="Open saved item in a new tab"
                      >
                        <span>Open Item</span>
                        <FiExternalLink size={13} />
                      </a>

                      <button
                        type="button"
                        className="ll-action-delete"
                        onClick={(e) => handleDeleteItem(e, item)}
                        disabled={isDeleting}
                        title="Remove from Learn Later"
                        aria-label="Remove from Learn Later"
                      >
                        <FiTrash2 size={14} />
                        <span>Remove</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
