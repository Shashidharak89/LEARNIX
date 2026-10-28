"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FiBookmark,
  FiSearch,
  FiX,
  FiExternalLink,
  FiTrash2,
  FiFolder,
  FiBell,
  FiBookOpen,
  FiClipboard,
  FiCalendar,
  FiLayers,
  FiArrowRight,
  FiCheck,
} from "react-icons/fi";
import { authFetch } from "@/lib/clientAuth";
import "./styles/LearnLater.css";

const CATEGORIES = [
  { id: "all", label: "All Items", icon: FiLayers, color: "#007aff", bg: "#eff6ff" },
  { id: "resource", label: "Resources", icon: FiFolder, color: "#0284c7", bg: "#e0f2fe" },
  { id: "update", label: "Updates", icon: FiBell, color: "#8b5cf6", bg: "#f3e8ff" },
  { id: "study-material", label: "Study Materials", icon: FiBookOpen, color: "#10b981", bg: "#ecfdf5" },
  { id: "question-paper", label: "Question Papers", icon: FiClipboard, color: "#f59e0b", bg: "#fffbeb" },
];

export default function LearnLaterClient() {
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({
    all: 0,
    resource: 0,
    update: 0,
    "study-material": 0,
    "question-paper": 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingId, setIsDeletingId] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3000);
  }, []);

  const fetchItems = useCallback(async (cat = activeCategory, query = searchQuery) => {
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
      if (cat && cat !== "all") params.set("type", cat);
      if (query.trim()) params.set("q", query.trim());

      const res = await authFetch(`/api/learn-later?${params.toString()}`);
      if (res.status === 401) {
        setIsLoggedIn(false);
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
        if (data.counts) {
          setCounts(data.counts);
        }
      }
    } catch (err) {
      console.error("Error fetching learn later items:", err);
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory, searchQuery]);

  // Initial load
  useEffect(() => {
    fetchItems(activeCategory, searchQuery);
  }, [activeCategory, searchQuery, fetchItems]);

  // Listen to cross-component updates
  useEffect(() => {
    const handleSync = () => {
      fetchItems(activeCategory, searchQuery);
    };
    window.addEventListener("learnix:learn-later-updated", handleSync);
    return () => window.removeEventListener("learnix:learn-later-updated", handleSync);
  }, [activeCategory, searchQuery, fetchItems]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

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
        setCounts((prev) => {
          const typeKey = itType(item.type);
          return {
            ...prev,
            all: Math.max(0, prev.all - 1),
            [typeKey]: Math.max(0, (prev[typeKey] || 1) - 1),
          };
        });
        showToast("Removed from Learn Later");
        window.dispatchEvent(
          new window.CustomEvent("learnix:learn-later-updated", {
            detail: { itemId: idToDelete, isSaved: false },
          })
        );
      }
    } catch (err) {
      console.error("Failed to delete item:", err);
      showToast("Could not remove item. Please try again.");
    } finally {
      setIsDeletingId(null);
    }
  };

  const itType = (rawType) => {
    const t = String(rawType || "").toLowerCase();
    if (t.includes("resource") || t.includes("topic") || t.includes("work")) return "resource";
    if (t.includes("update")) return "update";
    if (t.includes("material") || t.includes("sm")) return "study-material";
    if (t.includes("paper") || t.includes("qp")) return "question-paper";
    return "resource";
  };

  const getTypeMeta = (type) => {
    const norm = itType(type);
    return CATEGORIES.find((c) => c.id === norm) || CATEGORIES[1];
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
    <div className="ll-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="ll-toast" role="status" aria-live="polite">
          <FiCheck className="ll-toast-icon" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero / Header Section */}
      <header className="ll-header">
        <div className="ll-header-meta">
          <div className="ll-header-badge">
            <FiBookmark className="ll-badge-icon" />
            <span>Personal Queue</span>
          </div>
          <h1 className="ll-title">Learn Later</h1>
          <p className="ll-subtitle">
            Your high-priority learning stack. Review saved resources, updates, study materials, and question papers stored securely in your queue.
          </p>
        </div>

        {/* iPhone-Style Summary Widgets */}
        <div className="ll-widgets-grid">
          {/* Main Total Widget */}
          <div
            className={`ll-widget ll-widget--primary ${activeCategory === "all" ? "is-selected" : ""}`}
            onClick={() => setActiveCategory("all")}
            role="button"
            tabIndex={0}
          >
            <div className="ll-widget-top">
              <span className="ll-widget-icon-pill" style={{ background: "#007aff", color: "#ffffff" }}>
                <FiLayers size={18} />
              </span>
              <span className="ll-widget-pill-badge">DynamoDB Synced</span>
            </div>
            <div className="ll-widget-body">
              <span className="ll-widget-value">{counts.all}</span>
              <span className="ll-widget-label">Total in Queue</span>
            </div>
            <div className="ll-widget-footer">
              <span>View all saved items</span>
              <FiArrowRight size={14} className="ll-widget-arrow" />
            </div>
          </div>

          {/* Resources Widget */}
          <div
            className={`ll-widget ${activeCategory === "resource" ? "is-selected" : ""}`}
            onClick={() => setActiveCategory("resource")}
            role="button"
            tabIndex={0}
          >
            <div className="ll-widget-top">
              <span className="ll-widget-icon-pill" style={{ background: "#e0f2fe", color: "#0284c7" }}>
                <FiFolder size={18} />
              </span>
              <span className="ll-widget-counter">{counts.resource}</span>
            </div>
            <div className="ll-widget-body">
              <span className="ll-widget-name">Resources</span>
              <span className="ll-widget-sub">Topics & Notes</span>
            </div>
          </div>

          {/* Updates Widget */}
          <div
            className={`ll-widget ${activeCategory === "update" ? "is-selected" : ""}`}
            onClick={() => setActiveCategory("update")}
            role="button"
            tabIndex={0}
          >
            <div className="ll-widget-top">
              <span className="ll-widget-icon-pill" style={{ background: "#f3e8ff", color: "#8b5cf6" }}>
                <FiBell size={18} />
              </span>
              <span className="ll-widget-counter">{counts.update}</span>
            </div>
            <div className="ll-widget-body">
              <span className="ll-widget-name">Updates</span>
              <span className="ll-widget-sub">Announcements</span>
            </div>
          </div>

          {/* Study Materials Widget */}
          <div
            className={`ll-widget ${activeCategory === "study-material" ? "is-selected" : ""}`}
            onClick={() => setActiveCategory("study-material")}
            role="button"
            tabIndex={0}
          >
            <div className="ll-widget-top">
              <span className="ll-widget-icon-pill" style={{ background: "#ecfdf5", color: "#10b981" }}>
                <FiBookOpen size={18} />
              </span>
              <span className="ll-widget-counter">{counts["study-material"]}</span>
            </div>
            <div className="ll-widget-body">
              <span className="ll-widget-name">Materials</span>
              <span className="ll-widget-sub">PDFs & Guides</span>
            </div>
          </div>

          {/* Question Papers Widget */}
          <div
            className={`ll-widget ${activeCategory === "question-paper" ? "is-selected" : ""}`}
            onClick={() => setActiveCategory("question-paper")}
            role="button"
            tabIndex={0}
          >
            <div className="ll-widget-top">
              <span className="ll-widget-icon-pill" style={{ background: "#fffbeb", color: "#f59e0b" }}>
                <FiClipboard size={18} />
              </span>
              <span className="ll-widget-counter">{counts["question-paper"]}</span>
            </div>
            <div className="ll-widget-body">
              <span className="ll-widget-name">QP Papers</span>
              <span className="ll-widget-sub">Previous Exams</span>
            </div>
          </div>
        </div>
      </header>

      {/* Controls: Search and Segmented Bar */}
      <section className="ll-controls">
        {/* iOS-Style Searchbar */}
        <div className="ll-search-wrapper">
          <FiSearch className="ll-search-icon" />
          <input
            type="text"
            placeholder="Search your saved queue by title, subject, or keywords..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="ll-search-input"
            aria-label="Search saved items"
          />
          {searchInput && (
            <button
              type="button"
              className="ll-search-clear"
              onClick={() => {
                setSearchInput("");
                setSearchQuery("");
              }}
              aria-label="Clear search"
            >
              <FiX size={14} />
            </button>
          )}
        </div>

        {/* Segmented Control Bar */}
        <div className="ll-segmented-bar" role="tablist">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const count = counts[cat.id] || 0;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                role="tab"
                aria-selected={isActive}
                className={`ll-segment-btn ${isActive ? "is-active" : ""}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <Icon size={15} className="ll-segment-icon" />
                <span className="ll-segment-label">{cat.label}</span>
                <span className="ll-segment-count">{count}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Content Area */}
      <main className="ll-content">
        {!isLoggedIn ? (
          <div className="ll-auth-card">
            <div className="ll-auth-icon-wrap">
              <FiBookmark size={32} />
            </div>
            <h3 className="ll-auth-title">Authentication Required</h3>
            <p className="ll-auth-desc">
              Sign in with your Learnix account to view and manage your personalized Learn Later queue.
            </p>
            <Link href="/login?redirect=/learn-later" className="ll-auth-btn">
              Sign In to Continue
            </Link>
          </div>
        ) : isLoading ? (
          <div className="ll-cards-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="ll-card ll-card--skeleton">
                <div className="ll-skeleton-top" />
                <div className="ll-skeleton-title" />
                <div className="ll-skeleton-text" />
                <div className="ll-skeleton-footer" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="ll-empty-state">
            <div className="ll-empty-icon-wrap">
              <FiBookmark size={36} />
            </div>
            <h3 className="ll-empty-title">
              {searchQuery ? "No matches found" : "Your queue is empty"}
            </h3>
            <p className="ll-empty-desc">
              {searchQuery
                ? `No saved items match "${searchQuery}". Try a different keyword or category.`
                : "Whenever you encounter helpful resources, important updates, study materials, or question papers, click the 3-dot menu and select 'Learn Later'."}
            </p>
            <div className="ll-empty-actions">
              <Link href="/works" className="ll-empty-btn ll-empty-btn--primary">
                <FiFolder size={16} />
                <span>Explore Resources</span>
              </Link>
              <Link href="/updates" className="ll-empty-btn">
                <FiBell size={16} />
                <span>Check Updates</span>
              </Link>
              <Link href="/materials" className="ll-empty-btn">
                <FiBookOpen size={16} />
                <span>Study Materials</span>
              </Link>
              <Link href="/qp" className="ll-empty-btn">
                <FiClipboard size={16} />
                <span>Question Papers</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="ll-cards-grid">
            {items.map((item) => {
              const meta = getTypeMeta(item.type);
              const Icon = meta.icon;
              const itemId = item.itemId || item.id;
              const isDeleting = isDeletingId === itemId;
              const targetUrl = item.url || "/works";

              return (
                <article key={itemId} className={`ll-card ${isDeleting ? "is-removing" : ""}`}>
                  {/* Card Header with Category Pill & Date */}
                  <div className="ll-card-header">
                    <span
                      className="ll-type-badge"
                      style={{ background: meta.bg, color: meta.color }}
                    >
                      <Icon size={13} className="ll-badge-type-icon" />
                      <span>{meta.label}</span>
                    </span>
                    <div className="ll-card-date">
                      <FiCalendar size={13} />
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                  </div>

                  {/* Title & Subtitle */}
                  <div className="ll-card-body">
                    <h2 className="ll-card-title">
                      <a
                        href={targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ll-card-link"
                      >
                        {item.title}
                      </a>
                    </h2>

                    {item.subtitle && (
                      <div className="ll-card-subtitle" title={item.subtitle}>
                        {item.subtitle}
                      </div>
                    )}

                    {item.description && (
                      <p className="ll-card-description">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="ll-card-footer">
                    <a
                      href={targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ll-action-view"
                      title="Open item in new tab"
                    >
                      <span>Open Now</span>
                      <FiExternalLink size={14} />
                    </a>

                    <button
                      type="button"
                      className="ll-action-delete"
                      onClick={(e) => handleDeleteItem(e, item)}
                      disabled={isDeleting}
                      title="Remove from Learn Later"
                      aria-label="Remove from Learn Later"
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
