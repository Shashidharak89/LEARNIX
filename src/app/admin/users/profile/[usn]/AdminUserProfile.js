"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  UserIcon,
  ShieldCheckIcon,
  ShieldUserIcon,
  CalendarIcon,
  Trash2Icon,
  ArrowLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  KeyIcon,
  XIcon,
  EyeIcon,
  EyeOffIcon,
  CameraIcon,
  FolderIcon,
  FileTextIcon,
  LockIcon,
  GlobeIcon,
  TriangleAlertIcon,
  CheckIcon,
  PencilIcon,
  CompassIcon,
} from "@animateicons/react/lucide";
import { FiZap, FiTrendingUp } from "react-icons/fi";
import "../../../styles/AdminDashboard.css";
import "../../AdminUsers.css";
import "./styles/AdminUserProfile.css";

/* ─── Role Badge ─────────────────────────────────────────────── */
function RoleBadge({ role }) {
  if (role === "superadmin")
    return (
      <span className="au-role-badge au-role-superadmin">
        <ShieldCheckIcon size={12} /> Super Admin
      </span>
    );
  if (role === "admin")
    return (
      <span className="au-role-badge au-role-admin">
        <ShieldUserIcon size={12} /> Admin
      </span>
    );
  return (
    <span className="au-role-badge au-role-user">
      <UserIcon size={12} /> User
    </span>
  );
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(d) {
  if (!d) return "Never";
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/* ─── Skeleton ─────────────────────────────────────────────── */
function ProfileSkeleton() {
  return (
    <div className="aup-skeleton-container">
      <div className="aup-skeleton aup-sk-hero">
        <div className="aup-sk-header">
          <div className="aup-sk-box aup-sk-avatar" />
          <div className="aup-sk-lines">
            <div className="aup-sk-box aup-sk-name" />
            <div className="aup-sk-box aup-sk-usn" />
            <div className="aup-sk-box aup-sk-badge" />
          </div>
        </div>
      </div>
      <div className="au-summary-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="au-summary-widget aup-sk-box" style={{ height: 84 }} />
        ))}
      </div>
    </div>
  );
}

/* ─── Modal Shell ──────────────────────────────────────────── */
function Modal({ title, onClose, children }) {
  return (
    <div className="aup-modal-overlay" onClick={onClose}>
      <div className="aup-modal" onClick={(e) => e.stopPropagation()}>
        <div className="aup-modal-header">
          <h3 className="aup-modal-title">{title}</h3>
          <button className="aup-modal-close" onClick={onClose} aria-label="Close modal">
            <XIcon size={16} />
          </button>
        </div>
        <div className="aup-modal-body">{children}</div>
      </div>
    </div>
  );
}

/* ─── Main Component ───────────────────────────────────────── */
export default function AdminUserProfile({ params }) {
  const { usn } = use(params);

  const [token, setToken]       = useState("");
  const [myRole, setMyRole]     = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const [profile, setProfile]           = useState(null);
  const [subjects, setSubjects]         = useState([]);
  const [subjectCount, setSubjectCount] = useState(0);
  const [topicCount, setTopicCount]     = useState(0);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");

  /* Modals */
  const [modal, setModal] = useState(null); // "edit" | "password" | "delete"

  /* Edit Form State */
  const [editName, setEditName]             = useState("");
  const [editUsn, setEditUsn]               = useState("");
  const [editImgFile, setEditImgFile]       = useState(null);
  const [editImgPreview, setEditImgPreview] = useState(null);
  const [editLoading, setEditLoading]       = useState(false);
  const [editError, setEditError]           = useState("");

  /* Password Form State */
  const [pwNew, setPwNew]                 = useState("");
  const [pwConfirm, setPwConfirm]         = useState("");
  const [showPwNew, setShowPwNew]         = useState(false);
  const [showPwConfirm, setShowPwConfirm] = useState(false);
  const [pwLoading, setPwLoading]         = useState(false);
  const [pwError, setPwError]             = useState("");

  /* Delete State */
  const [delLoading, setDelLoading] = useState(false);
  const [delError, setDelError]     = useState("");

  /* Toast Notification */
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  /* Bootstrap Auth */
  useEffect(() => {
    const r = localStorage.getItem("role") || "";
    const t = localStorage.getItem("token") || "";
    setMyRole(r);
    setToken(t);
    setTimeout(() => setIsLoaded(true), 80);
  }, []);

  /* Fetch Profile */
  const fetchProfile = async (tok, u) => {
    if (!tok || !u) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/user/${encodeURIComponent(u)}`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load profile");
        return;
      }
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

  useEffect(() => {
    fetchProfile(token, usn);
  }, [token, usn]);

  /* Open Modals */
  const openEdit = () => {
    setEditName(profile?.name || "");
    setEditUsn(profile?.usn || "");
    setEditImgFile(null);
    setEditImgPreview(null);
    setEditError("");
    setModal("edit");
  };
  const openPassword = () => {
    setPwNew("");
    setPwConfirm("");
    setPwError("");
    setModal("password");
  };
  const openDelete = () => {
    setDelError("");
    setModal("delete");
  };

  const handleImgChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditImgFile(file);
    setEditImgPreview(URL.createObjectURL(file));
  };

  /* Submit Edit */
  const submitEdit = async () => {
    setEditLoading(true);
    setEditError("");
    try {
      const fd = new FormData();
      fd.append("name", editName.trim());
      fd.append("usn", editUsn.trim());
      if (editImgFile) fd.append("profileimg", editImgFile);

      const res = await fetch(`/api/admin/user/${encodeURIComponent(usn)}/edit`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || "Failed to update");
        return;
      }
      setProfile(data.user);
      setModal(null);
      showToast("Profile updated successfully");
      if (data.user?.usn && data.user.usn !== usn) {
        window.history.replaceState({}, "", `/admin/users/profile/${data.user.usn}`);
      }
    } catch {
      setEditError("Network error. Please try again.");
    } finally {
      setEditLoading(false);
    }
  };

  /* Submit Password */
  const submitPassword = async () => {
    if (pwNew !== pwConfirm) {
      setPwError("Passwords do not match");
      return;
    }
    if (pwNew.length < 6) {
      setPwError("Password must be at least 6 characters");
      return;
    }
    setPwLoading(true);
    setPwError("");
    try {
      const res = await fetch(`/api/admin/user/${encodeURIComponent(usn)}/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword: pwNew, confirmPassword: pwConfirm }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwError(data.error || "Failed to update");
        return;
      }
      setModal(null);
      showToast("Password changed successfully");
    } catch {
      setPwError("Network error. Please try again.");
    } finally {
      setPwLoading(false);
    }
  };

  /* Submit Delete */
  const submitDelete = async () => {
    setDelLoading(true);
    setDelError("");
    try {
      const res = await fetch(`/api/admin/user/${encodeURIComponent(usn)}/delete`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setDelError(data.error || "Failed to delete");
        return;
      }
      setModal(null);
      showToast("User deleted and backed up");
      setTimeout(() => window.location.replace("/admin/users"), 1000);
    } catch {
      setDelError("Network error. Please try again.");
    } finally {
      setDelLoading(false);
    }
  };

  if (myRole === null) return null;
  const isSuperAdmin = myRole === "superadmin";
  const isAdminOrSuper = myRole === "admin" || myRole === "superadmin";

  return (
    <div className={`adm-wrapper ${isLoaded ? "adm-loaded" : ""}`}>
      <main className="adm-main aup-main">
        {/* ── Apple Breadcrumbs & Easy Navigation Header ── */}
        <nav className="aup-breadcrumb-nav" aria-label="Breadcrumbs">
          <div className="aup-breadcrumb-left">
            <Link href="/admin" className="aup-crumb-link">
              Admin
            </Link>
            <ChevronRightIcon size={12} className="aup-crumb-sep" />
            <Link href="/admin/users" className="aup-crumb-link">
              Users
            </Link>
            <ChevronRightIcon size={12} className="aup-crumb-sep" />
            <span className="aup-crumb-current">{profile?.usn || usn}</span>
          </div>

          <div className="aup-breadcrumb-right">
            <Link href="/admin/users" className="aup-quick-nav-btn">
              <ArrowLeftIcon size={13} />
              <span>Back to Users</span>
            </Link>
            <Link href="/admin/users/deleted" className="aup-quick-nav-btn aup-nav-del">
              <Trash2Icon size={13} />
              <span>Deleted Users</span>
            </Link>
          </div>
        </nav>

        {/* ── Toast Notification ── */}
        {toast && (
          <div className={`aup-toast aup-toast--${toast.type}`}>{toast.msg}</div>
        )}

        {/* ── Error Banner ── */}
        {!loading && error && (
          <div className="aup-error-banner">
            <TriangleAlertIcon size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* ── Loading Skeleton ── */}
        {loading && <ProfileSkeleton />}

        {/* ── Profile Content ── */}
        {!loading && !error && profile && (
          <div className="aup-content-stack">
            {/* ── Apple Hero Profile Widget Card ── */}
            <div className="adm-intro-card aup-hero-card">
              <div className="adm-intro-header aup-hero-header">
                <div className="adm-intro-left aup-hero-left">
                  {/* User Avatar + Identity Info */}
                  <div className="aup-user-header">
                    <Link
                      href={`/users/${profile.usn}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aup-avatar-link"
                      title="View public user profile in new tab"
                    >
                      <Image
                        src={
                          profile.profileimg ||
                          "https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp"
                        }
                        alt={profile.name}
                        width={84}
                        height={84}
                        className="aup-avatar"
                        unoptimized
                      />
                      <span className="aup-avatar-badge" title="Open public profile">
                        <ExternalLinkIcon size={12} />
                      </span>
                    </Link>

                    <div className="aup-user-meta">
                      <div className="aup-badge-line">
                        <RoleBadge role={profile.role} />
                        <span className="aup-plan-badge">{profile.plan || "basic"}</span>
                      </div>
                      <h1 className="adm-title aup-name">{profile.name}</h1>
                      <div className="aup-sub-identity">
                        <span className="aup-usn-tag">{profile.usn}</span>
                        {profile.email && (
                          <span className="aup-email-tag">{profile.email}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Navigation Toolbar */}
                  {isAdminOrSuper && (
                    <div className="aup-actions-toolbar">
                      <button
                        type="button"
                        className="aup-action-chip aup-chip-blue"
                        onClick={openEdit}
                        title="Edit user details"
                      >
                        <PencilIcon size={14} />
                        <span>Edit Details</span>
                      </button>

                      {isSuperAdmin && (
                        <button
                          type="button"
                          className="aup-action-chip aup-chip-purple"
                          onClick={openPassword}
                          title="Change password"
                        >
                          <KeyIcon size={14} />
                          <span>Change Password</span>
                        </button>
                      )}

                      {isSuperAdmin && (
                        <button
                          type="button"
                          className="aup-action-chip aup-chip-red"
                          onClick={openDelete}
                          title="Delete user"
                        >
                          <Trash2Icon size={14} />
                          <span>Delete Account</span>
                        </button>
                      )}

                      <Link
                        href={`/users/${profile.usn}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="aup-action-chip aup-chip-slate"
                        title="Open public profile in new tab"
                      >
                        <ExternalLinkIcon size={14} />
                        <span>Public View</span>
                      </Link>

                      <Link
                        href={`/search/${profile.usn}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="aup-action-chip aup-chip-gray"
                        title="Search user view"
                      >
                        <CompassIcon size={14} />
                        <span>Search View</span>
                      </Link>
                    </div>
                  )}
                </div>

                <div className="adm-intro-right aup-hero-right">
                  <div className="adm-shield-orb aup-user-orb">
                    <UserIcon size={38} />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Apple-style Stat Widgets Strip ── */}
            <section className="au-summary-grid aup-stats-grid">
              <div className="au-summary-widget au-widget-blue">
                <div className="au-widget-icon">
                  <FolderIcon size={20} />
                </div>
                <div className="au-widget-content">
                  <div className="au-widget-value">{subjectCount}</div>
                  <div className="au-widget-label">Total Subjects</div>
                </div>
              </div>

              <div className="au-summary-widget au-widget-green">
                <div className="au-widget-icon">
                  <FileTextIcon size={20} />
                </div>
                <div className="au-widget-content">
                  <div className="au-widget-value">{topicCount}</div>
                  <div className="au-widget-label">Total Topics</div>
                </div>
              </div>

              <div className="au-summary-widget au-widget-amber">
                <div className="au-widget-icon">
                  <FiZap size={20} />
                </div>
                <div className="au-widget-content">
                  <div className="au-widget-value">{profile.streaks ?? 0}</div>
                  <div className="au-widget-label">Daily Streak</div>
                </div>
              </div>

              <div className="au-summary-widget au-widget-purple">
                <div className="au-widget-icon">
                  <FiTrendingUp size={20} />
                </div>
                <div className="au-widget-content">
                  <div className="au-widget-value">{profile.highestStreak ?? 0}</div>
                  <div className="au-widget-label">Highest Streak</div>
                </div>
              </div>
            </section>

            {/* ── Metadata & Activity Info Widget ── */}
            <div className="aup-card-widget">
              <div className="aup-card-header">
                <div className="aup-card-title-group">
                  <CalendarIcon size={16} className="aup-card-icon" />
                  <h3 className="aup-card-title">Account & Activity Timeline</h3>
                </div>
              </div>

              <div className="aup-meta-grid">
                <div className="aup-meta-item">
                  <span className="aup-meta-label">Registered On</span>
                  <span className="aup-meta-value">{formatDate(profile.createdAt)}</span>
                </div>
                <div className="aup-meta-item">
                  <span className="aup-meta-label">Last Active</span>
                  <span className="aup-meta-value">{formatDateTime(profile.lastLoginAt)}</span>
                </div>
                <div className="aup-meta-item">
                  <span className="aup-meta-label">Wallet Balance</span>
                  <span className="aup-meta-value aup-balance-value">
                    ₹{profile.balance || 0}
                  </span>
                </div>
                <div className="aup-meta-item">
                  <span className="aup-meta-label">Account Role</span>
                  <span className="aup-meta-value aup-role-name">
                    {profile.role === "superadmin"
                      ? "Super Administrator"
                      : profile.role === "admin"
                      ? "Administrator"
                      : "Standard Student/User"}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Subjects Section ── */}
            <div className="aup-card-widget">
              <div className="aup-card-header">
                <div className="aup-card-title-group">
                  <FolderIcon size={16} className="aup-card-icon" />
                  <h3 className="aup-card-title">
                    Created Subjects ({subjectCount})
                  </h3>
                </div>
                <span className="aup-section-sub">
                  Resources uploaded by {profile.name.split(" ")[0]}
                </span>
              </div>

              {subjects.length > 0 ? (
                <div className="aup-subjects-grid">
                  {subjects.map((sub, i) => (
                    <div key={sub._id || i} className="aup-subject-card">
                      <div className="aup-subject-top">
                        <span className="aup-subject-name" title={sub.subject}>
                          {sub.subject}
                        </span>
                        <span
                          className={`aup-subject-vis ${
                            (sub.visibility || "public") === "public"
                              ? "aup-vis-pub"
                              : "aup-vis-priv"
                          }`}
                        >
                          {(sub.visibility || "public") === "public" ? (
                            <>
                              <GlobeIcon size={10} /> Public
                            </>
                          ) : (
                            <>
                              <LockIcon size={10} />{" "}
                              {(sub.visibility || "public").charAt(0).toUpperCase() +
                                (sub.visibility || "public").slice(1)}
                            </>
                          )}
                        </span>
                      </div>
                      <p className="aup-subject-date">
                        <CalendarIcon size={12} /> {formatDate(sub.createdAt)}
                      </p>
                      <Link
                        href={`/resources/subject/${sub._id}`}
                        target="_blank"
                        className="aup-subject-link"
                      >
                        <span>View Subject</span>
                        <ExternalLinkIcon size={12} />
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="aup-empty-state">
                  <FolderIcon size={32} />
                  <p>No subjects uploaded by this user yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ MODALS ══════════════════════════════════════════ */}

        {/* Edit Profile */}
        {modal === "edit" && (
          <Modal title="Edit Profile Details" onClose={() => !editLoading && setModal(null)}>
            <div className="aup-edit-avatar-wrap">
              <Image
                src={
                  editImgPreview ||
                  profile?.profileimg ||
                  "https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp"
                }
                alt="avatar"
                width={80}
                height={80}
                className="aup-avatar"
              />
              <label className="aup-edit-img-label">
                <CameraIcon size={14} /> Change Photo
                <input
                  type="file"
                  accept="image/*"
                  className="aup-hidden-input"
                  onChange={handleImgChange}
                />
              </label>
            </div>

            <label className="aup-field-label">Full Name</label>
            <input
              className="aup-modal-input"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Full name"
            />

            <label className="aup-field-label">USN</label>
            <input
              className="aup-modal-input"
              value={editUsn}
              onChange={(e) => setEditUsn(e.target.value.toUpperCase())}
              placeholder="University Seat Number"
            />

            {editError && <p className="aup-modal-error">{editError}</p>}
            <div className="aup-modal-actions">
              <button
                type="button"
                className="aup-modal-btn aup-btn-cancel"
                onClick={() => setModal(null)}
                disabled={editLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="aup-modal-btn aup-btn-save"
                onClick={submitEdit}
                disabled={editLoading}
              >
                {editLoading ? "Saving…" : <><CheckIcon size={14} /> Save Changes</>}
              </button>
            </div>
          </Modal>
        )}

        {/* Change Password */}
        {modal === "password" && (
          <Modal title="Change User Password" onClose={() => !pwLoading && setModal(null)}>
            <p className="aup-modal-hint">
              Assign a new password for <strong>{profile?.usn}</strong>. It will be securely hashed with bcrypt.
            </p>

            <label className="aup-field-label">New Password</label>
            <div className="aup-pw-wrap">
              <input
                className="aup-modal-input aup-modal-input--pw"
                type={showPwNew ? "text" : "password"}
                value={pwNew}
                onChange={(e) => setPwNew(e.target.value)}
                placeholder="Min 6 characters"
              />
              <button
                type="button"
                className="aup-pw-eye"
                onClick={() => setShowPwNew((v) => !v)}
              >
                {showPwNew ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
              </button>
            </div>

            <label className="aup-field-label">Confirm Password</label>
            <div className="aup-pw-wrap">
              <input
                className="aup-modal-input aup-modal-input--pw"
                type={showPwConfirm ? "text" : "password"}
                value={pwConfirm}
                onChange={(e) => setPwConfirm(e.target.value)}
                placeholder="Repeat password"
              />
              <button
                type="button"
                className="aup-pw-eye"
                onClick={() => setShowPwConfirm((v) => !v)}
              >
                {showPwConfirm ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
              </button>
            </div>

            {pwError && <p className="aup-modal-error">{pwError}</p>}
            <div className="aup-modal-actions">
              <button
                type="button"
                className="aup-modal-btn aup-btn-cancel"
                onClick={() => setModal(null)}
                disabled={pwLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="aup-modal-btn aup-btn-save"
                onClick={submitPassword}
                disabled={pwLoading}
              >
                {pwLoading ? "Updating…" : <><KeyIcon size={14} /> Update Password</>}
              </button>
            </div>
          </Modal>
        )}

        {/* Delete User */}
        {modal === "delete" && (
          <Modal title="Delete User Account" onClose={() => !delLoading && setModal(null)}>
            <div className="aup-delete-icon-wrap">
              <Trash2Icon size={26} />
            </div>
            <p className="aup-modal-hint aup-delete-hint">
              Are you sure you want to delete <strong>{profile?.name}</strong> ({profile?.usn})?
              <br />
              A safety backup will be stored and can be restored from the Deleted Users page.
            </p>
            {delError && <p className="aup-modal-error">{delError}</p>}
            <div className="aup-modal-actions">
              <button
                type="button"
                className="aup-modal-btn aup-btn-cancel"
                onClick={() => setModal(null)}
                disabled={delLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="aup-modal-btn aup-btn-danger"
                onClick={submitDelete}
                disabled={delLoading}
              >
                {delLoading ? "Deleting…" : <><Trash2Icon size={14} /> Yes, Delete User</>}
              </button>
            </div>
          </Modal>
        )}
      </main>
    </div>
  );
}
