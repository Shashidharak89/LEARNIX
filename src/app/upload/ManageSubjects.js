"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useTheme } from "@/context/ThemeContext";
import {
  FiPlus,
  FiFolder,
  FiChevronDown,
  FiChevronUp,
  FiLoader,
  FiInbox,
  FiLayers,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
} from "react-icons/fi";
import AddSubjectForm from "./AddSubjectForm";
import SubjectsGrid from "./SubjectsGrid";
import "./styles/ManageSubjects.css";
import LoginRequired from "../components/LoginRequired";
import ManageSubjectsSkeleton from "./ManageSubjectsSkeleton";

/* ─────────────────────────────────────────
   Toast Popup Component
───────────────────────────────────────── */
function Toast({ toasts, onDismiss }) {
  return (
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
            aria-label="Dismiss notification"
          >
            <FiX />
          </button>
        </div>
      ))}
    </div>
  );
}

let _toastId = 0;

/* ─────────────────────────────────────────
   Main Component
───────────────────────────────────────── */
export default function ManageSubjects() {
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
  const drawerRef = useRef(null);

  const { theme } = useTheme();

  useEffect(() => {
    const storedUsn = localStorage.getItem("usn");
    if (storedUsn) setUsn(storedUsn);
    fetchSubjects(storedUsn, 1);
    fetchAllUsers();
  }, []);

  /* smooth-scroll drawer into view when it opens */
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
    setTimeout(() => dismissToast(id), duration);
  };

  const dismissToast = (id) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  /* keep legacy signature for child components */
  const showMessage = (text, type = "") =>
    pushToast(text, type === "error" ? "error" : "success");

  /* ── Data fetching ── */
  const fetchSubjects = async (usn, pageNum = 1, append = false) => {
    if (pageNum === 1) setIsLoading(true);
    else setLoadingMore(true);
    try {
      const res = await axios.get("/api/work/get", {
        params: { usn, page: pageNum, limit },
      });
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
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await axios.get("/api/work/getall");
      setAllUsers(res.data.users || []);
    } catch (err) {
      console.error("Failed to fetch all users data:", err);
    }
  };

  /* ── Event handlers ── */
  const handleSubjectDelete = () => {
    fetchSubjects(usn, 1);
    pushToast("Subject deleted successfully!");
  };

  const handleTopicDelete = () => {
    fetchSubjects(usn, 1);
    pushToast("Topic deleted successfully!");
  };

  const handleAddSubject = async (subjectName, isPublic) => {
    setIsLoading(true);
    try {
      await axios.post("/api/subject", { usn, subject: subjectName, public: isPublic });
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

  const handleAddTopic = async (subject, topicName, isPublic) => {
    if (!subject || !topicName.trim()) return;
    setIsLoading(true);
    try {
      await axios.post("/api/topic", {
        usn, subject, topic: topicName, images: [], public: isPublic,
      });
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

  /* ── Guards ── */
  const usnl = typeof window !== "undefined" ? localStorage.getItem("usn") : null;
  if (!usnl) return <LoginRequired />;
  if (isLoading && subjects.length === 0) return <ManageSubjectsSkeleton />;

  return (
    <div className={`ms-wrapper ${theme}`}>

      {/* ── Toast notifications ── */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* ── Page Header ── */}
      <header className="ms-page-header">
        <div className="ms-header-accent" />

        <div className="ms-header-content">
          <div className="ms-header-label">
            <FiLayers className="ms-header-label-icon" />
            <span>Workspace</span>
          </div>
          <h1 className="ms-page-title">Manage Subjects</h1>
        </div>

        <div className="ms-header-right">
          <div className="ms-header-stat">
            <span className="ms-stat-num">{subjects.length}</span>
            <span className="ms-stat-label">subjects</span>
          </div>

          {/* Collapsible trigger */}
          <button
            className={`ms-add-toggle-btn${addOpen ? " ms-add-toggle-btn--open" : ""}`}
            onClick={() => setAddOpen((v) => !v)}
            aria-expanded={addOpen}
            aria-controls="ms-add-drawer"
          >
            <FiPlus className="ms-add-toggle-plus" />
            <span>New Subject</span>
            {addOpen
              ? <FiChevronUp className="ms-add-toggle-caret" />
              : <FiChevronDown className="ms-add-toggle-caret" />}
          </button>
        </div>
      </header>

      {/* ── Collapsible Add-Subject Drawer ── */}
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

      {/* ── Subjects & Topics Panel ── */}
      <main className="ms-main">
        <section className="ms-panel ms-panel--list">
          <div className="ms-panel-header">
            <div className="ms-panel-title-row">
              <span className="ms-panel-icon-wrap ms-panel-icon-wrap--blue">
                <FiFolder />
              </span>
              <h2 className="ms-panel-title">Subjects &amp; Topics</h2>
            </div>
          </div>

          <div className="ms-panel-body">
            {isLoading && subjects.length === 0 && (
              <div className="ms-state ms-state--loading">
                <FiLoader className="ms-spinner-icon" />
                <span>Loading subjects…</span>
              </div>
            )}

            {subjects.length === 0 && !isLoading && (
              <div className="ms-state ms-state--empty">
                <FiInbox className="ms-empty-icon" />
                <p>No subjects yet. Hit <strong>New Subject</strong> above to get started.</p>
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
                  {loadingMore ? (
                    <><FiLoader className="ms-spinner-icon" /> Loading…</>
                  ) : (
                    <><FiChevronDown /> View more subjects</>
                  )}
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}