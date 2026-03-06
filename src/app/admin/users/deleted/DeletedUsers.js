"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FiArrowLeft, FiUsers, FiShield, FiUser, FiLoader,
  FiChevronDown, FiCalendar, FiTrash2, FiRefreshCw,
  FiMoreVertical, FiAlertCircle, FiX, FiCheck,
} from "react-icons/fi";
import { MdAdminPanelSettings } from "react-icons/md";
import '../../styles/AdminDashboard.css';
import "../AdminUsers.css";
import "./styles/DeletedUsers.css";

const PAGE_LIMIT = 12;

function RoleBadge({ role }) {
  if (role === "superadmin")
    return <span className="au-role-badge au-role-superadmin"><FiShield size={11} /> Super Admin</span>;
  if (role === "admin")
    return <span className="au-role-badge au-role-admin"><MdAdminPanelSettings size={11} /> Admin</span>;
  return <span className="au-role-badge au-role-user"><FiUser size={11} /> User</span>;
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/* ─── Confirm modal ─── */
function ConfirmModal({ title, message, danger, confirmLabel, onConfirm, onCancel, loading }) {
  return (
    <div className="du-modal-overlay" onClick={onCancel}>
      <div className="du-modal" onClick={e => e.stopPropagation()}>
        <div className="du-modal-header">
          <h3 className="du-modal-title">{title}</h3>
          <button className="du-modal-close" onClick={onCancel} disabled={loading}><FiX size={17} /></button>
        </div>
        <div className="du-modal-body">
          <p className="du-modal-text">{message}</p>
          <div className="du-modal-actions">
            <button className="du-modal-btn du-btn-cancel" onClick={onCancel} disabled={loading}>Cancel</button>
            <button
              className={`du-modal-btn ${danger ? "du-btn-danger" : "du-btn-primary"}`}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? "Please wait…" : <><FiCheck size={13} /> {confirmLabel}</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DeletedUsers() {
  const [myRole, setMyRole] = useState(null);
  const [token, setToken]   = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  const [users, setUsers]         = useState([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]     = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]         = useState("");

  /* 3-dot menu */
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRefs = useRef({});

  /* confirm modal */
  const [confirm, setConfirm] = useState(null); // { type: "restore"|"purge", backup }
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError]     = useState("");

  /* toast */
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* bootstrap */
  useEffect(() => {
    const r = localStorage.getItem("role")  || "";
    const t = localStorage.getItem("token") || "";
    setMyRole(r);
    setToken(t);
    setTimeout(() => setIsLoaded(true), 80);
  }, []);

  /* fetch */
  const fetchDeleted = useCallback(async (pageNum, append = false) => {
    if (!token) return;
    append ? setLoadingMore(true) : setLoading(true);
    setError("");
    try {
      const res  = await fetch(`/api/admin/deleted-users?page=${pageNum}&limit=${PAGE_LIMIT}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to fetch"); return; }
      append ? setUsers(prev => [...prev, ...data.users]) : setUsers(data.users);
      setTotal(data.total);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); setLoadingMore(false); }
  }, [token]);

  useEffect(() => {
    if (token && (myRole === "admin" || myRole === "superadmin")) fetchDeleted(1, false);
  }, [token, myRole, fetchDeleted]);

  /* close menu on outside click */
  useEffect(() => {
    if (!openMenuId) return;
    const h = (e) => {
      const el = menuRefs.current[openMenuId];
      if (el && !el.contains(e.target)) setOpenMenuId(null);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [openMenuId]);

  /* restore */
  const doRestore = async () => {
    if (!confirm) return;
    setActionLoading(true); setActionError("");
    try {
      const res  = await fetch(`/api/admin/deleted-users/restore/${confirm.backup._id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { setActionError(data.error || "Failed to restore"); return; }
      setUsers(prev => prev.filter(u => u._id !== confirm.backup._id));
      setTotal(t => t - 1);
      setConfirm(null);
      showToast(`${confirm.backup.usn} restored successfully`);
    } catch { setActionError("Network error. Please try again."); }
    finally { setActionLoading(false); }
  };

  /* purge */
  const doPurge = async () => {
    if (!confirm) return;
    setActionLoading(true); setActionError("");
    try {
      const res  = await fetch(`/api/admin/deleted-users/purge/${confirm.backup._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { setActionError(data.error || "Failed to purge"); return; }
      setUsers(prev => prev.filter(u => u._id !== confirm.backup._id));
      setTotal(t => t - 1);
      setConfirm(null);
      showToast(`${confirm.backup.usn} permanently purged`, "error");
    } catch { setActionError("Network error. Please try again."); }
    finally { setActionLoading(false); }
  };

  if (myRole === null) return null;
  const isSuperAdmin = myRole === "superadmin";

  return (
    <div className={`adm-wrapper ${isLoaded ? "adm-loaded" : ""}`}>

      {/* Header */}
      <header className="adm-header">
        <div className="adm-header-content">
          <div className="adm-header-left">
            <Link href="/admin/users" className="au-back-link">
              <FiArrowLeft size={15} /> All Users
            </Link>
            <div className="adm-role-badge" style={{ backgroundColor: "#dc2626", marginTop: "0.75rem" }}>
              <FiTrash2 size={15} />
              <span>Deleted Users</span>
            </div>
            <h1 className="adm-title">
              Deleted <span className="adm-title-highlight">Users</span>
            </h1>
            <p className="adm-subtitle">
              {total > 0 ? `${total} backed-up record${total > 1 ? "s" : ""}` : "No deleted users"}
              {" — "}uploaded data is always preserved
            </p>
          </div>
          <div className="adm-header-deco">
            <div className="adm-deco-circle" style={{ background: "#fee2e2", border: "2px solid #fecaca" }}>
              <FiTrash2 size={44} color="#dc2626" />
            </div>
          </div>
        </div>
      </header>

      {/* Toast */}
      {toast && <div className={`du-toast du-toast--${toast.type}`}>{toast.msg}</div>}

      {/* Error */}
      {error && (
        <div className="au-error-banner" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <FiAlertCircle size={16} /> {error}
        </div>
      )}

      {/* Info note */}
      {!loading && !isSuperAdmin && (
        <div className="du-info-note">
          <FiAlertCircle size={14} />
          You can view deleted users. Only superadmins can restore or permanently remove them.
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="au-loading-state">
          <div className="au-spinner"><FiLoader size={28} /></div>
          <p>Loading…</p>
        </div>
      ) : (
        <>
          {users.length === 0 && !loading && (
            <div className="au-empty">
              <FiTrash2 size={36} /><p>No deleted users found</p>
            </div>
          )}

          <section className="au-users-grid">
            {users.map((backup, idx) => (
              <div
                key={backup._id}
                className="au-user-card du-deleted-card"
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                {/* 3-dot menu — superadmin only */}
                {isSuperAdmin && (
                  <div className="du-menu-wrap" ref={el => { menuRefs.current[backup._id] = el; }}>
                    <button
                      className="du-menu-btn"
                      onClick={() => setOpenMenuId(v => v === backup._id ? null : backup._id)}
                      aria-label="More options"
                    >
                      <FiMoreVertical size={17} />
                    </button>
                    {openMenuId === backup._id && (
                      <div className="du-menu-dropdown">
                        <button
                          className="du-menu-item du-menu-restore"
                          onClick={() => { setOpenMenuId(null); setActionError(""); setConfirm({ type: "restore", backup }); }}
                        >
                          <FiRefreshCw size={13} /> Restore User
                        </button>
                        <button
                          className="du-menu-item du-menu-danger"
                          onClick={() => { setOpenMenuId(null); setActionError(""); setConfirm({ type: "purge", backup }); }}
                        >
                          <FiTrash2 size={13} /> Permanently Remove
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Card content */}
                <div className="au-card-top">
                  <div className="au-avatar-wrap">
                    <Image
                      src={backup.profileimg || "https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp"}
                      alt={backup.name || "Deleted user"}
                      width={48} height={48}
                      className="au-avatar du-grayscale"
                    />
                  </div>
                  <div className="au-card-info">
                    <p className="au-user-name">{backup.name || "—"}</p>
                    <p className="au-user-usn">{backup.usn || "—"}</p>
                  </div>
                  <RoleBadge role={backup.role || "user"} />
                </div>

                <div className="au-meta-row" style={{ flexDirection: "column", gap: "0.25rem" }}>
                  <span className="au-meta-item">
                    <FiCalendar size={12} /> Joined {formatDate(backup.originalCreatedAt)}
                  </span>
                  <span className="au-meta-item du-deleted-on">
                    <FiTrash2 size={12} /> Deleted {formatDate(backup.deletedAt)}
                  </span>
                  {backup.deletedBy && (
                    <span className="au-meta-item du-deleted-by">
                      by {backup.deletedBy}
                    </span>
                  )}
                </div>

                <div className="du-deleted-badge">Deleted</div>
              </div>
            ))}
          </section>

          {page < totalPages && (
            <div className="au-view-more-wrap">
              <button className="au-view-more-btn" onClick={() => fetchDeleted(page + 1, true)} disabled={loadingMore}>
                {loadingMore
                  ? <><span className="au-dots"><span /><span /><span /></span> Loading…</>
                  : <><FiChevronDown size={16} /> View More ({total - users.length} remaining)</>}
              </button>
            </div>
          )}

          {users.length > 0 && page >= totalPages && (
            <p className="au-all-loaded">All {total} records loaded</p>
          )}
        </>
      )}

      {/* Confirm modal */}
      {confirm?.type === "restore" && (
        <ConfirmModal
          title="Restore User"
          message={`Restore ${confirm.backup.name} (${confirm.backup.usn}) back to active users?`}
          danger={false}
          confirmLabel="Restore"
          onConfirm={doRestore}
          onCancel={() => !actionLoading && setConfirm(null)}
          loading={actionLoading}
        />
      )}
      {confirm?.type === "purge" && (
        <ConfirmModal
          title="Permanently Remove"
          message={`Permanently delete the backup record for ${confirm.backup.usn}? Uploaded subjects and topics will NOT be affected. This cannot be undone.`}
          danger={true}
          confirmLabel="Yes, Remove"
          onConfirm={doPurge}
          onCancel={() => !actionLoading && setConfirm(null)}
          loading={actionLoading}
        />
      )}
      {confirm && actionError && (
        <div style={{ position: "fixed", bottom: "6rem", right: "1.5rem", zIndex: 1100 }}>
          <div className="du-toast du-toast--error">{actionError}</div>
        </div>
      )}
    </div>
  );
}
