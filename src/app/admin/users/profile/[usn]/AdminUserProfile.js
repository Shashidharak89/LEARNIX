"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FiArrowLeft, FiUser, FiShield, FiCalendar, FiBook,
  FiFileText, FiAlertCircle, FiLock, FiUnlock,
  FiMoreVertical, FiEdit2, FiTrash2, FiKey, FiX,
  FiCheck, FiEye, FiEyeOff, FiCamera,
} from "react-icons/fi";
import { MdAdminPanelSettings } from "react-icons/md";
import "../../AdminUsers.css";
import "../../../styles/AdminDashboard.css";
import "./styles/AdminUserProfile.css";

/* ─── helpers ─────────────────────────────────────────────── */
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

/* ─── Skeleton ─────────────────────────────────────────────── */
function ProfileSkeleton() {
  return (
    <div className="aup-skeleton">
      <div className="aup-sk-header">
        <div className="aup-sk-box aup-sk-avatar" />
        <div className="aup-sk-lines">
          <div className="aup-sk-box aup-sk-name" />
          <div className="aup-sk-box aup-sk-usn" />
          <div className="aup-sk-box aup-sk-badge" />
        </div>
      </div>
      <div className="aup-sk-divider" />
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="aup-sk-row">
          <div className="aup-sk-box aup-sk-icon-sm" />
          <div className="aup-sk-box aup-sk-label-sm" />
          <div className="aup-sk-box aup-sk-val-sm" />
        </div>
      ))}
      <div className="aup-sk-divider" style={{ marginTop: "1rem" }} />
      <div className="aup-sk-stats">
        {[1, 2, 3].map(i => <div key={i} className="aup-sk-box aup-sk-stat" />)}
      </div>
    </div>
  );
}

/* ─── Modal shell ──────────────────────────────────────────── */
function Modal({ title, onClose, children }) {
  return (
    <div className="aup-modal-overlay" onClick={onClose}>
      <div className="aup-modal" onClick={e => e.stopPropagation()}>
        <div className="aup-modal-header">
          <h3 className="aup-modal-title">{title}</h3>
          <button className="aup-modal-close" onClick={onClose}><FiX size={18} /></button>
        </div>
        <div className="aup-modal-body">{children}</div>
      </div>
    </div>
  );
}

/* ─── Main Component ───────────────────────────────────────── */
export default function AdminUserProfile({ params }) {
  const { usn } = use(params);

  const [token, setToken]   = useState("");
  const [myRole, setMyRole] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const [profile, setProfile]     = useState(null);
  const [subjects, setSubjects]   = useState([]);
  const [subjectCount, setSubjectCount] = useState(0);
  const [topicCount, setTopicCount]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  /* 3-dot menu */
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  /* modals */
  const [modal, setModal] = useState(null); // "edit" | "password" | "delete"

  /* edit form state */
  const [editName, setEditName]       = useState("");
  const [editUsn, setEditUsn]         = useState("");
  const [editImgFile, setEditImgFile] = useState(null);
  const [editImgPreview, setEditImgPreview] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError]     = useState("");

  /* password form state */
  const [pwNew, setPwNew]         = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [showPwNew, setShowPwNew]         = useState(false);
  const [showPwConfirm, setShowPwConfirm] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError]     = useState("");

  /* delete state */
  const [delLoading, setDelLoading] = useState(false);
  const [delError, setDelError]     = useState("");

  /* toast */
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── bootstrap ── */
  useEffect(() => {
    const r = localStorage.getItem("role")  || "";
    const t = localStorage.getItem("token") || "";
    setMyRole(r);
    setToken(t);
    setTimeout(() => setIsLoaded(true), 80);
  }, []);

  /* ── fetch profile ── */
  const fetchProfile = async (tok, u) => {
    if (!tok || !u) return;
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(`/api/admin/user/${encodeURIComponent(u)}`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to load profile"); return; }
      setProfile(data.user);
      setSubjects(data.subjects || []);
      setSubjectCount(data.subjectCount ?? 0);
      setTopicCount(data.topicCount ?? 0);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(token, usn); }, [token, usn]); // eslint-disable-line

  /* ── close menu on outside click ── */
  useEffect(() => {
    if (!menuOpen) return;
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [menuOpen]);

  /* ── open modals ── */
  const openEdit = () => {
    setEditName(profile?.name || "");
    setEditUsn(profile?.usn || "");
    setEditImgFile(null);
    setEditImgPreview(null);
    setEditError("");
    setMenuOpen(false);
    setModal("edit");
  };
  const openPassword = () => { setPwNew(""); setPwConfirm(""); setPwError(""); setMenuOpen(false); setModal("password"); };
  const openDelete   = () => { setDelError(""); setMenuOpen(false); setModal("delete"); };

  const handleImgChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditImgFile(file);
    setEditImgPreview(URL.createObjectURL(file));
  };

  /* ── submit edit ── */
  const submitEdit = async () => {
    setEditLoading(true); setEditError("");
    try {
      const fd = new FormData();
      fd.append("name", editName.trim());
      fd.append("usn",  editUsn.trim());
      if (editImgFile) fd.append("profileimg", editImgFile);
      const res  = await fetch(`/api/admin/user/${encodeURIComponent(usn)}/edit`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data.error || "Failed to update"); return; }
      setProfile(data.user);
      setModal(null);
      showToast("Profile updated successfully");
    } catch { setEditError("Network error. Please try again."); }
    finally { setEditLoading(false); }
  };

  /* ── submit password ── */
  const submitPassword = async () => {
    if (pwNew !== pwConfirm) { setPwError("Passwords do not match"); return; }
    if (pwNew.length < 6)    { setPwError("Password must be at least 6 characters"); return; }
    setPwLoading(true); setPwError("");
    try {
      const res  = await fetch(`/api/admin/user/${encodeURIComponent(usn)}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newPassword: pwNew, confirmPassword: pwConfirm }),
      });
      const data = await res.json();
      if (!res.ok) { setPwError(data.error || "Failed to update"); return; }
      setModal(null);
      showToast("Password changed successfully");
    } catch { setPwError("Network error. Please try again."); }
    finally { setPwLoading(false); }
  };

  /* ── submit delete ── */
  const submitDelete = async () => {
    setDelLoading(true); setDelError("");
    try {
      const res  = await fetch(`/api/admin/user/${encodeURIComponent(usn)}/delete`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { setDelError(data.error || "Failed to delete"); return; }
      setModal(null);
      showToast("User deleted and backed up");
      setTimeout(() => window.location.replace("/admin/users"), 1200);
    } catch { setDelError("Network error. Please try again."); }
    finally { setDelLoading(false); }
  };

  if (myRole === null) return null;
  const isSuperAdmin   = myRole === "superadmin";
  const isAdminOrSuper = myRole === "admin" || myRole === "superadmin";

  return (
    <div className={`adm-wrapper aup-wrapper ${isLoaded ? "adm-loaded" : ""}`}>

      {/* ── Slim header ── */}
      <header className="aup-slim-header">
        <Link href="/admin/users" className="au-back-link">
          <FiArrowLeft size={14} /> All Users
        </Link>
        <span className="aup-slim-title">User Profile</span>
      </header>

      {/* ── Toast ── */}
      {toast && <div className={`aup-toast aup-toast--${toast.type}`}>{toast.msg}</div>}

      {/* ── Error ── */}
      {!loading && error && (
        <div className="aup-error">
          <FiAlertCircle size={18} /><span>{error}</span>
        </div>
      )}

      {/* ── Skeleton ── */}
      {loading && <ProfileSkeleton />}

      {/* ── Content ── */}
      {!loading && !error && profile && (
        <div className="aup-content">

          {/* Profile card */}
          <div className="aup-profile-card">

            {/* 3-dot menu */}
            {isAdminOrSuper && (
              <div className="aup-menu-wrap" ref={menuRef}>
                <button
                  className="aup-menu-btn"
                  onClick={() => setMenuOpen(v => !v)}
                  aria-label="More options"
                >
                  <FiMoreVertical size={18} />
                </button>
                {menuOpen && (
                  <div className="aup-menu-dropdown">
                    <button className="aup-menu-item" onClick={openEdit}>
                      <FiEdit2 size={14} /> Edit Profile
                    </button>
                    {isSuperAdmin && (
                      <button className="aup-menu-item" onClick={openPassword}>
                        <FiKey size={14} /> Change Password
                      </button>
                    )}
                    {isSuperAdmin && (
                      <button className="aup-menu-item aup-menu-danger" onClick={openDelete}>
                        <FiTrash2 size={14} /> Delete User
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="aup-avatar-section">
              <Image
                src={profile.profileimg || "https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp"}
                alt={profile.name}
                width={80} height={80}
                className="aup-avatar"
              />
              <div className="aup-avatar-info">
                <h2 className="aup-name">{profile.name}</h2>
                <p className="aup-usn">{profile.usn}</p>
                <RoleBadge role={profile.role} />
              </div>
            </div>

            <div className="aup-divider" />

            <div className="aup-info-list">
              {[
                { icon: <FiCalendar size={13} />, label: "Joined",   val: formatDate(profile.createdAt) },
                { icon: <FiBook size={13} />,     label: "Subjects",  val: subjectCount },
                { icon: <FiFileText size={13} />, label: "Topics",    val: topicCount },
                {
                  icon: profile.role === "user" ? <FiUnlock size={13} /> : <FiLock size={13} />,
                  label: "Role",
                  val: profile.role === "superadmin" ? "Super Admin" : profile.role === "admin" ? "Admin" : "User",
                },
              ].map(({ icon, label, val }) => (
                <div key={label} className="aup-info-row">
                  <span className="aup-info-icon">{icon}</span>
                  <span className="aup-info-label">{label}</span>
                  <span className="aup-info-value">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats strip */}
          <section className="adm-summary aup-stats">
            {[
              { cls: "adm-summary-blue",   icon: <FiBook size={18} />,     val: subjectCount, lbl: "Subjects" },
              { cls: "adm-summary-green",  icon: <FiFileText size={18} />, val: topicCount,   lbl: "Topics"   },
              { cls: "adm-summary-yellow", icon: <FiCalendar size={18} />, val: formatDate(profile.createdAt), lbl: "Joined" },
            ].map(({ cls, icon, val, lbl }) => (
              <div key={lbl} className={`adm-summary-card ${cls}`}>
                <div className="adm-summary-icon">{icon}</div>
                <div>
                  <div className="adm-summary-value">{val}</div>
                  <div className="adm-summary-label">{lbl}</div>
                </div>
              </div>
            ))}
          </section>

          {/* Subjects list */}
          {subjects.length > 0 && (
            <section className="aup-subjects-section">
              <h3 className="aup-section-title">
                <FiBook size={15} /> Subjects ({subjectCount})
              </h3>
              <div className="aup-subjects-grid">
                {subjects.map((sub, i) => (
                  <div key={sub._id || i} className="aup-subject-card">
                    <div className="aup-subject-top">
                      <span className="aup-subject-name">{sub.subject}</span>
                      <span className={`aup-subject-vis ${sub.public ? "aup-vis-pub" : "aup-vis-priv"}`}>
                        {sub.public
                          ? <><FiUnlock size={9} /> Public</>
                          : <><FiLock size={9} /> Private</>}
                      </span>
                    </div>
                    <p className="aup-subject-date"><FiCalendar size={10} /> {formatDate(sub.createdAt)}</p>
                    <Link href={`/works/subject/${sub._id}`} target="_blank" className="aup-subject-link">
                      View Subject →
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}

          {subjects.length === 0 && (
            <div className="aup-empty-subjects">
              <FiBook size={28} /><p>No subjects yet</p>
            </div>
          )}
        </div>
      )}

      {/* ══ MODALS ══════════════════════════════════════════ */}

      {/* Edit Profile */}
      {modal === "edit" && (
        <Modal title="Edit Profile" onClose={() => !editLoading && setModal(null)}>
          <div className="aup-edit-avatar-wrap">
            <Image
              src={editImgPreview || profile?.profileimg || "https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp"}
              alt="avatar"
              width={80} height={80}
              className="aup-avatar"
            />
            <label className="aup-edit-img-label">
              <FiCamera size={13} /> Change Photo
              <input type="file" accept="image/*" className="aup-hidden-input" onChange={handleImgChange} />
            </label>
          </div>

          <label className="aup-field-label">Full Name</label>
          <input className="aup-modal-input" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Full name" />

          <label className="aup-field-label">USN</label>
          <input className="aup-modal-input" value={editUsn} onChange={e => setEditUsn(e.target.value.toUpperCase())} placeholder="University Seat Number" />

          {editError && <p className="aup-modal-error">{editError}</p>}
          <div className="aup-modal-actions">
            <button className="aup-modal-btn aup-btn-cancel" onClick={() => setModal(null)} disabled={editLoading}>Cancel</button>
            <button className="aup-modal-btn aup-btn-save"   onClick={submitEdit}          disabled={editLoading}>
              {editLoading ? "Saving…" : <><FiCheck size={13} /> Save</>}
            </button>
          </div>
        </Modal>
      )}

      {/* Change Password */}
      {modal === "password" && (
        <Modal title="Change Password" onClose={() => !pwLoading && setModal(null)}>
          <p className="aup-modal-hint">New password for <strong>{profile?.usn}</strong>. Will be hashed before saving.</p>

          <label className="aup-field-label">New Password</label>
          <div className="aup-pw-wrap">
            <input className="aup-modal-input aup-modal-input--pw" type={showPwNew ? "text" : "password"}
              value={pwNew} onChange={e => setPwNew(e.target.value)} placeholder="Min 6 characters" />
            <button className="aup-pw-eye" onClick={() => setShowPwNew(v => !v)}>
              {showPwNew ? <FiEyeOff size={15} /> : <FiEye size={15} />}
            </button>
          </div>

          <label className="aup-field-label">Confirm Password</label>
          <div className="aup-pw-wrap">
            <input className="aup-modal-input aup-modal-input--pw" type={showPwConfirm ? "text" : "password"}
              value={pwConfirm} onChange={e => setPwConfirm(e.target.value)} placeholder="Repeat password" />
            <button className="aup-pw-eye" onClick={() => setShowPwConfirm(v => !v)}>
              {showPwConfirm ? <FiEyeOff size={15} /> : <FiEye size={15} />}
            </button>
          </div>

          {pwError && <p className="aup-modal-error">{pwError}</p>}
          <div className="aup-modal-actions">
            <button className="aup-modal-btn aup-btn-cancel" onClick={() => setModal(null)} disabled={pwLoading}>Cancel</button>
            <button className="aup-modal-btn aup-btn-save"   onClick={submitPassword}       disabled={pwLoading}>
              {pwLoading ? "Updating…" : <><FiKey size={13} /> Update Password</>}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete User */}
      {modal === "delete" && (
        <Modal title="Delete User" onClose={() => !delLoading && setModal(null)}>
          <div className="aup-delete-icon-wrap"><FiTrash2 size={26} /></div>
          <p className="aup-modal-hint aup-delete-hint">
            Delete <strong>{profile?.name}</strong> ({profile?.usn})?<br />
            A backup will be stored and can only be restored by a superadmin. This cannot be undone.
          </p>
          {delError && <p className="aup-modal-error">{delError}</p>}
          <div className="aup-modal-actions">
            <button className="aup-modal-btn aup-btn-cancel" onClick={() => setModal(null)} disabled={delLoading}>Cancel</button>
            <button className="aup-modal-btn aup-btn-danger" onClick={submitDelete}         disabled={delLoading}>
              {delLoading ? "Deleting…" : <><FiTrash2 size={13} /> Yes, Delete</>}
            </button>
          </div>
        </Modal>
      )}

    </div>
  );
}
