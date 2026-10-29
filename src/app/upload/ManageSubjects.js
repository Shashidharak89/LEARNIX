"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import axios from "axios";
import { useTheme } from "@/context/ThemeContext";
import {
  FiPlus,
  FiFolder,
  FiChevronDown,
  FiChevronRight,
  FiLoader,
  FiInbox,
  FiLayers,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
  FiSearch,
  FiLock,
  FiLogIn,
  FiUserPlus,
  FiBook,
  FiFileText,
  FiGlobe,
} from "react-icons/fi";
import AddSubjectForm from "./AddSubjectForm";
import SubjectsGrid from "./SubjectsGrid";
import Portal from "./components/Portal";
import "./styles/ManageSubjects.css";
import ManageSubjectsSkeleton from "./ManageSubjectsSkeleton";
import { verifyTokenAndSyncAuth } from "@/lib/clientAuth";

/* ─────────────────────────────────────────
   Toast — rendered via Portal into body
   so no parent transform/overflow can trap it
───────────────────────────────────────── */
function Toast({ toasts, onDismiss }) {
  return (
    <Portal>
      <div className="ms-toast-container" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`ms-toast ms-toast--${t.type}`} role="alert">
            <span className="ms-toast-icon">
              {t.type === "success" ? <FiCheckCircle /> : <FiAlertCircle />}
            </span>
            <span className="ms-toast-text">{t.text}</span>
            <button
              className="ms-toast-close"
              onClick={() => onDismiss(t.id)}
              aria-label="Dismiss"
            >
              <FiX />
            </button>
          </div>
        ))}
      </div>
    </Portal>
  );
}

let _toastId = 0;

/* ─────────────────────────────────────────
   Main Component
───────────────────────────────────────── */
export default function ManageSubjects() {
  const pathname = usePathname();
  const currentPath = pathname || "/resources/upload";
  const loginHref = `/login?redirect=${encodeURIComponent(currentPath)}`;
  const signupHref = `/signup?redirect=${encodeURIComponent(currentPath)}`;

  const [authStatus, setAuthStatus] = useState("verifying"); // "verifying" | "authenticated" | "unauthenticated"
  const [usn, setUsn] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const drawerRef = useRef(null);

  const { theme } = useTheme();

  useEffect(() => {
    async function verifyAuthAndInit() {
      const storedToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const storedUsn = typeof window !== "undefined" ? localStorage.getItem("usn") : null;

      if (!storedToken && !storedUsn) {
        setAuthStatus("unauthenticated");
        return;
      }

      try {
        const user = await verifyTokenAndSyncAuth({ redirectOnFailure: false });
        if (user && user.usn) {
          const userUsn = String(user.usn).toUpperCase();
          setUsn(userUsn);
          setAuthStatus("authenticated");
          fetchSubjects(userUsn, 1, false, "");
          fetchAllUsers();
        } else if (storedUsn) {
          setUsn(storedUsn);
          setAuthStatus("authenticated");
          fetchSubjects(storedUsn, 1, false, "");
          fetchAllUsers();
        } else {
          setAuthStatus("unauthenticated");
        }
      } catch {
        if (storedUsn) {
          setUsn(storedUsn);
          setAuthStatus("authenticated");
          fetchSubjects(storedUsn, 1, false, "");
          fetchAllUsers();
        } else {
          setAuthStatus("unauthenticated");
        }
      }
    }

    verifyAuthAndInit();
  }, []);

  useEffect(() => {
    if (addOpen && drawerRef.current) {
      setTimeout(
        () => drawerRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" }),
        260
      );
    }
  }, [addOpen]);

  /* ── Toast helpers ── */
  const pushToast = (text, type = "success", duration = 3500) => {
    const id = ++_toastId;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
  };

  const dismissToast = (id) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  /* legacy signature for child components */
  const showMessage = (text, type = "") =>
    pushToast(text, type === "error" ? "error" : "success");

  /* ── API with Auth Headers ── */
  const fetchSubjects = async (userUsn, pageNum = 1, append = false, query = activeQuery) => {
    if (pageNum === 1) setIsLoading(true);
    else setLoadingMore(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const params = {
        usn: userUsn || usn,
        page: pageNum,
        limit,
      };
      if (typeof query === "string" && query.trim()) {
        params.q = query.trim();
      }

      const res = await axios.get("/api/work/get", { params, headers });
      const fetched = res.data.subjects || [];
      const total = res.data.paging?.total || 0;
      if (append) setSubjects((prev) => [...prev, ...fetched]);
      else setSubjects(fetched);
      setPage(pageNum);
      setHasMore(pageNum * limit < total);
    } catch (err) {
      console.error(err);
      pushToast("Failed to fetch subjects", "error");
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
      setIsSearching(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await axios.get("/api/work/getall");
      setAllUsers(res.data.users || []);
    } catch (err) {
      console.error("Failed to fetch all users:", err);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const q = searchInput.trim();
    setActiveQuery(q);
    setIsSearching(true);
    fetchSubjects(usn, 1, false, q);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setActiveQuery("");
    setIsSearching(true);
    fetchSubjects(usn, 1, false, "");
  };

  const handleSubjectDelete = () => {
    fetchSubjects(usn, 1);
    pushToast("Subject deleted successfully!");
  };

  const handleTopicDelete = () => {
    fetchSubjects(usn, 1);
    pushToast("Topic deleted successfully!");
  };

  const handleAddSubject = async (subjectName, visibility) => {
    setIsLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post("/api/subject", { usn, subject: subjectName, visibility }, { headers });
      fetchSubjects(usn, 1);
      pushToast("Subject added successfully!");
      setAddOpen(false);
    } catch (err) {
      console.error(err);
      pushToast(err.response?.data?.error || "Error adding subject", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTopic = async (subject, topicName, visibility) => {
    if (!subject || !topicName.trim()) return;
    setIsLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post("/api/topic", { usn, subject, topic: topicName, images: [], visibility }, { headers });
      fetchSubjects(usn, 1);
      pushToast("Topic added successfully!");
    } catch (err) {
      console.error(err);
      pushToast(err.response?.data?.error || "Error adding topic", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSubjects = () => fetchSubjects(usn, 1);

  if (authStatus === "verifying") {
    return <ManageSubjectsSkeleton />;
  }

  if (authStatus === "unauthenticated") {
    return (
      <div className={`ms-wrapper ${theme}`}>
        {/* Page Header (Apple Card Widget) */}
        <header className="ms-page-header">
          <div className="ms-header-row">
            <div className="ms-header-left">
              <div className="ms-header-icon-badge" aria-hidden="true">
                <FiLayers />
              </div>

              <div className="ms-header-text">
                <div className="ms-header-tag">WORKSPACE</div>
                <h1 className="ms-page-title">Upload Resources</h1>
                <p className="ms-page-subtitle">
                  Upload and manage your subjects, topics, and study resources
                </p>
              </div>
            </div>

            <div className="ms-header-right">
              <Link
                href={loginHref}
                className="ms-guest-quick-login-btn"
                title="Sign in to your account"
              >
                <FiLogIn />
                <span className="ms-add-btn-text">Sign In</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Gentle Apple-Themed Guest Callout */}
        <main className="ms-main">
          <div className="ms-guest-card">
            <div className="ms-guest-icon-badge" aria-hidden="true">
              <FiLock />
            </div>

            <div className="ms-guest-badge-pill">
              Workspace Access
            </div>

            <h2 className="ms-guest-title">Ready to manage your study resources?</h2>

            <p className="ms-guest-description">
              Sign in or create a Learnix account to create subjects, upload notes and topics, and share study materials with your classmates.
            </p>

            <div className="ms-guest-features">
              <div className="ms-guest-feature-pill">
                <FiFolder />
                <span>Create Subjects &amp; Topics</span>
              </div>
              <div className="ms-guest-feature-pill">
                <FiFileText />
                <span>Upload Notes &amp; PDF Resources</span>
              </div>
              <div className="ms-guest-feature-pill">
                <FiGlobe />
                <span>Public &amp; Private Visibility</span>
              </div>
            </div>

            <div className="ms-guest-actions">
              <Link href={loginHref} className="ms-guest-primary-btn">
                <FiLogIn />
                <span>Log In</span>
              </Link>
              <Link href={signupHref} className="ms-guest-secondary-btn">
                <FiUserPlus />
                <span>Create Account</span>
              </Link>
            </div>
          </div>

          {/* Gentle Preview Section */}
          <div className="ms-section-header-row">
            <div className="ms-section-title-group">
              <span className="ms-section-icon-badge" aria-hidden="true">
                <FiFolder />
              </span>
              <h2 className="ms-section-title">Workspace Preview</h2>
            </div>
            <span className="ms-section-count-pill">Preview Mode</span>
          </div>

          <div className="ms-guest-preview-stack">
            <div className="ms-guest-preview-card">
              <div className="ms-guest-preview-left">
                <span className="sg-chevron"><FiChevronRight /></span>
                <div className="sg-book-icon-badge"><FiBook /></div>
                <span className="ms-guest-preview-title">Data Structures &amp; Algorithms</span>
              </div>
              <span className="ms-guest-preview-lock-pill">
                <FiLock size={12} /> Sign in to view
              </span>
            </div>

            <div className="ms-guest-preview-card">
              <div className="ms-guest-preview-left">
                <span className="sg-chevron"><FiChevronRight /></span>
                <div className="sg-book-icon-badge"><FiBook /></div>
                <span className="ms-guest-preview-title">Computer Networks &amp; Security</span>
              </div>
              <span className="ms-guest-preview-lock-pill">
                <FiLock size={12} /> Sign in to view
              </span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (isLoading && subjects.length === 0 && !isSearching) return <ManageSubjectsSkeleton />;

  return (
    <div className={`ms-wrapper ${theme}`}>

      {/* Toast — portaled to body, always above everything */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Page Header (Apple Card Widget) */}
      <header className="ms-page-header">
        {/* Same-Row Header: Logo on left, immediate right title & text (left-aligned), + icon right-aligned */}
        <div className="ms-header-row">
          <div className="ms-header-left">
            <div className="ms-header-icon-badge" aria-hidden="true">
              <FiLayers />
            </div>

            <div className="ms-header-text">
              <div className="ms-header-tag">WORKSPACE</div>
              <h1 className="ms-page-title">Upload Resources</h1>
              <p className="ms-page-subtitle">
                Upload and manage your subjects, topics, and study resources
              </p>
            </div>
          </div>

          <div className="ms-header-right">
            <button
              type="button"
              className={`ms-add-toggle-btn${addOpen ? " ms-add-toggle-btn--open" : ""}`}
              onClick={() => setAddOpen((v) => !v)}
              aria-expanded={addOpen}
              aria-controls="ms-add-drawer"
              title={addOpen ? "Close Add Drawer" : "Create New Subject"}
            >
              <FiPlus className="ms-add-toggle-plus" />
              <span className="ms-add-btn-text">New Subject</span>
            </button>
          </div>
        </div>

        {/* Searchbar inside Header Card (Updates Searchbar Pattern) */}
        <form className="upd-search-form ms-search-form" onSubmit={handleSearchSubmit}>
          <div className="upd-search-wrap ms-search-wrap">
            <FiSearch className="upd-search-icon ms-search-icon" />
            <input
              type="text"
              placeholder="Search your subjects or topics..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="upd-search-input ms-search-input"
              aria-label="Search your subjects or topics"
            />
            {searchInput && (
              <button
                type="button"
                className="upd-search-clear-inline ms-search-clear-inline"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                <FiX size={14} />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="upd-search-btn ms-search-submit-btn"
            disabled={isSearching || !searchInput.trim()}
            aria-label="Search"
          >
            {isSearching ? (
              <FiLoader className="ms-search-spinner" />
            ) : (
              <FiSearch className="upd-search-btn-icon" />
            )}
            <span className="upd-search-btn-text ms-search-btn-text">Search</span>
          </button>
        </form>

        {activeQuery && (
          <div className="ms-search-active-pill">
            <span className="ms-search-active-text">
              Showing results for: <strong>&ldquo;{activeQuery}&rdquo;</strong>
              {!isLoading && ` (${subjects.length} subject${subjects.length === 1 ? "" : "s"} found)`}
            </span>
            <button
              type="button"
              className="ms-search-clear-badge"
              onClick={handleClearSearch}
              title="Clear search filter"
            >
              <FiX size={13} />
              <span>Clear</span>
            </button>
          </div>
        )}
      </header>

      {/* Collapsible Add Drawer */}
      <div
        id="ms-add-drawer"
        className={`ms-add-drawer${addOpen ? " ms-add-drawer--open" : ""}`}
        aria-hidden={!addOpen}
        ref={drawerRef}
      >
        <div className="ms-add-drawer-inner">
          <p className="ms-add-drawer-eyebrow">
            <FiPlus /> Create a new subject
          </p>
          <AddSubjectForm
            allUsers={allUsers}
            isLoading={isLoading}
            onAddSubject={handleAddSubject}
          />
        </div>
      </div>

      {/* Subjects & Topics (Individual Apple Cards) */}
      <main className="ms-main">
        <div className="ms-section-header-row">
          <div className="ms-section-title-group">
            <span className="ms-section-icon-badge" aria-hidden="true">
              <FiFolder />
            </span>
            <h2 className="ms-section-title">Subjects &amp; Topics</h2>
          </div>
          {subjects.length > 0 && (
            <span className="ms-section-count-pill">
              {subjects.length} {subjects.length === 1 ? "Subject" : "Subjects"}
            </span>
          )}
        </div>

        {isLoading && subjects.length === 0 && (
          <div className="ms-state ms-state--loading">
            <FiLoader className="ms-spinner-icon" />
            <span>Loading subjects…</span>
          </div>
        )}

        {subjects.length === 0 && !isLoading && (
          <div className="ms-state ms-state--empty">
            {activeQuery ? (
              <div className="ms-search-empty-content">
                <FiSearch className="ms-empty-icon" />
                <h3 className="ms-empty-title">No subjects or topics match &ldquo;{activeQuery}&rdquo;</h3>
                <p className="ms-empty-desc">
                  Try checking for spelling errors or search with different keywords.
                </p>
                <button
                  type="button"
                  className="ms-reset-search-btn"
                  onClick={handleClearSearch}
                >
                  Clear search
                </button>
              </div>
            ) : (
              <>
                <FiInbox className="ms-empty-icon" />
                <p>No subjects yet. Hit <strong>New Subject</strong> above to get started.</p>
              </>
            )}
          </div>
        )}

        <SubjectsGrid
          subjects={subjects}
          allUsers={allUsers}
          usn={usn}
          isLoading={isLoading}
          onAddTopic={handleAddTopic}
          onSubjectDelete={handleSubjectDelete}
          onTopicDelete={handleTopicDelete}
          onRefreshSubjects={refreshSubjects}
          showMessage={showMessage}
        />

        {hasMore && (
          <div className="ms-load-more-wrap">
            <button
              onClick={() => fetchSubjects(usn, page + 1, true)}
              disabled={loadingMore}
              className="ms-load-more-btn"
            >
              {loadingMore
                ? <><FiLoader className="ms-spinner-icon" /> Loading…</>
                : <><FiChevronDown /> View more subjects</>}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}