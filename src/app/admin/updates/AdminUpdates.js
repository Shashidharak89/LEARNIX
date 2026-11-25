"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getYouTubeVideoId } from "../../utils/youtube";
import LinkPreview from "../../components/LinkPreview";
import FileIcon from "../../components/FileIcon";
import {
  ArrowLeftIcon,
  BookOpenIcon,
  ChevronDownIcon,
  CalendarIcon,
  Trash2Icon,
  EyeIcon,
  PlusIcon,
  LockIcon,
  GlobeIcon,
  LinkIcon,
  PencilIcon,
  EllipsisVerticalIcon,
  UserIcon,
} from "@animateicons/react/lucide";
import { FiLoader } from "react-icons/fi";
import AdminModal from "../components/AdminModal";
import AdminToast from "../components/AdminToast";
import AdminDropdown from "../components/AdminDropdown";
import EditUpdateModal from "@/app/upload/updates/EditUpdateModal";
import "../styles/AdminDashboard.css";
import "../users/AdminUsers.css";
import "./AdminUpdates.css";

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function AdminUpdates() {
  const [token, setToken] = useState("");
  const [myRole, setMyRole] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const [updates, setUpdates] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, loading: false });
  const [editingUpdate, setEditingUpdate] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [transferModal, setTransferModal] = useState({ isOpen: false, update: null, newUserId: "", loading: false });
  const [usersList, setUsersList] = useState([]);

  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (!token) return;
    fetch("/api/admin/users?limit=500", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.users)) setUsersList(d.users);
      })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    const role = localStorage.getItem("role") || "";
    const tok = localStorage.getItem("token") || "";
    setMyRole(role);
    setToken(tok);
    setTimeout(() => setIsLoaded(true), 80);
  }, []);

  const fetchUpdates = useCallback(
    async (pageNum, append = false) => {
      if (!token) return;
      append ? setLoadingMore(true) : setLoading(true);
      setError("");

      try {
        const res = await fetch(`/api/updates?index=${pageNum}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to fetch updates");
          return;
        }

        append
          ? setUpdates((prev) => [...prev, ...(data.updates || [])])
          : setUpdates(data.updates || []);
        setPage(pageNum);
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (token && (myRole === "admin" || myRole === "superadmin")) {
      fetchUpdates(1, false);
    }
  }, [token, myRole, fetchUpdates]);

  const handleDelete = useCallback((updateId) => {
    setDeleteModal({ isOpen: true, id: updateId, loading: false });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    const updateId = deleteModal.id;
    if (!updateId) return;

    setDeleteModal((prev) => ({ ...prev, loading: true }));
    setDeletingId(updateId);
    try {
      const res = await fetch(`/api/updates/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ updateId }),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Failed to delete update", "error");
        setDeleteModal((prev) => ({ ...prev, loading: false }));
        return;
      }

      setUpdates((prev) => prev.filter((u) => u._id !== updateId));
      setDeleteModal({ isOpen: false, id: null, loading: false });
      showToast("Update deleted successfully", "success");
    } catch {
      showToast("Network error. Failed to delete update.", "error");
      setDeleteModal((prev) => ({ ...prev, loading: false }));
    } finally {
      setDeletingId(null);
    }
  }, [deleteModal.id, token, showToast]);

  const handleConfirmTransfer = useCallback(async () => {
    if (!transferModal.update || !transferModal.newUserId) {
      showToast("Please select a user to transfer ownership to", "error");
      return;
    }
    setTransferModal((prev) => ({ ...prev, loading: true }));
    try {
      const res = await fetch("/api/admin/updates/transfer", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          updateId: transferModal.update._id,
          newUserId: transferModal.newUserId,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || "Failed to transfer ownership", "error");
        setTransferModal((prev) => ({ ...prev, loading: false }));
        return;
      }
      setUpdates((prev) =>
        prev.map((u) => (u._id === transferModal.update._id ? { ...u, ...data.update } : u))
      );
      showToast(data.message || "Ownership transferred successfully", "success");
      setTransferModal({ isOpen: false, update: null, newUserId: "", loading: false });
    } catch {
      showToast("Network error while transferring ownership", "error");
      setTransferModal((prev) => ({ ...prev, loading: false }));
    }
  }, [transferModal, token, showToast]);

  if (myRole === null) return null;

  return (
    <div className={`adm-wrapper ${isLoaded ? "adm-loaded" : ""}`}>
      <main className="adm-main aup-updates-main">
        {/* ── Apple-style Hero Intro Card ── */}
        <div className="adm-intro-card aup-updates-intro">
          <div className="adm-intro-header aup-updates-header">
            <div className="adm-intro-left aup-updates-left">
              <div className="aup-updates-top-row">
                <Link href="/admin" className="au-back-link">
                  <ArrowLeftIcon size={16} /> <span>Admin Dashboard</span>
                </Link>
                <div className="adm-role-badge aup-updates-badge">
                  <BookOpenIcon size={15} />
                  <span>Updates Management</span>
                </div>
              </div>

              <div className="aup-updates-title-group">
                <h1 className="adm-title aup-updates-title">
                  Platform <span className="adm-title-highlight aup-updates-highlight">Updates</span>
                </h1>
                <p className="adm-subtitle aup-updates-subtitle">
                  {updates.length > 0
                    ? `Manage announcements and learning feeds — ${updates.length} loaded on page ${page}`
                    : "No platform updates posted yet"}
                </p>
              </div>

              <div className="aup-updates-actions">
                <Link href="/upload/updates" className="aup-post-update-btn">
                  <PlusIcon size={15} />
                  <span>Create New Update</span>
                </Link>
                <Link href="/updates" target="_blank" className="aup-public-feed-btn">
                  <GlobeIcon size={14} />
                  <span>Public Feed</span>
                </Link>
              </div>
            </div>

            <div className="adm-intro-right">
              <div className="adm-shield-orb aup-updates-orb">
                <BookOpenIcon size={38} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Apple Summary Grid Widgets ── */}
        <section className="au-summary-grid aup-updates-summary-grid">
          <div className="au-summary-widget aup-widget-purple">
            <div className="au-widget-icon aup-widget-icon-purple">
              <BookOpenIcon size={20} />
            </div>
            <div className="au-widget-content">
              <div className="au-widget-value">{updates.length}</div>
              <div className="au-widget-label">Updates Loaded</div>
            </div>
          </div>

          <div className="au-summary-widget au-widget-blue">
            <div className="au-widget-icon">
              <GlobeIcon size={20} />
            </div>
            <div className="au-widget-content">
              <div className="au-widget-value">
                {updates.filter((u) => u.visibility === "public" || !u.visibility).length}
              </div>
              <div className="au-widget-label">Public Updates</div>
            </div>
          </div>

          <div className="au-summary-widget au-widget-amber">
            <div className="au-widget-icon">
              <EyeIcon size={20} />
            </div>
            <div className="au-widget-content">
              <div className="au-widget-value">
                {updates.reduce((sum, u) => sum + (u.views || 0), 0)}
              </div>
              <div className="au-widget-label">Total Views (Loaded)</div>
            </div>
          </div>
        </section>

        {error && <div className="au-error-banner">{error}</div>}

        {loading ? (
          <div className="au-loading-state">
            <div className="au-spinner">
              <FiLoader size={28} />
            </div>
            <p>Loading updates…</p>
          </div>
        ) : (
          <>
            <section className="au-updates-list">
              {updates.map((item, idx) => (
                <article
                  key={item._id || idx}
                  className="au-update-card"
                  style={{ animationDelay: `${idx * 0.03}s` }}
                >
                  <div className="au-update-header">
                    <div className="au-update-meta">
                      <div className="au-update-meta-top">
                        <span className="au-update-id">#{item._id?.slice(-6) || idx + 1}</span>
                        <span
                          className={`aup-vis-chip ${
                            item.visibility === "private"
                              ? "aup-vis-priv"
                              : item.visibility === "unlisted"
                              ? "aup-vis-unlisted"
                              : "aup-vis-pub"
                          }`}
                        >
                          {item.visibility === "private" ? (
                            <>
                              <LockIcon size={11} /> Private
                            </>
                          ) : item.visibility === "unlisted" ? (
                            <>
                              <LinkIcon size={11} /> Unlisted
                            </>
                          ) : (
                            <>
                              <GlobeIcon size={11} /> Public
                            </>
                          )}
                        </span>
                      </div>

                      <h3 className="au-update-title">{item.title}</h3>

                      {item.name && (
                        <div className="au-update-user">
                          {item.profileUrl && (
                            <img
                              src={item.profileUrl}
                              alt={item.name}
                              onError={(e) => (e.target.style.display = "none")}
                              className="au-update-user-avatar"
                            />
                          )}
                          <span className="au-update-user-name">{item.name}</span>
                          {item.usn && <span className="au-update-user-usn">{item.usn}</span>}
                        </div>
                      )}

                      <div className="au-update-time">
                        <CalendarIcon size={12} /> {formatDateTime(item.createdAt)}
                        <span className="aup-views-badge">
                          <EyeIcon size={12} /> {item.views ?? 0} views
                        </span>
                      </div>
                    </div>

                    <div className="au-update-actions" style={{ position: "relative" }}>
                      <button
                        type="button"
                        className="au-update-view-btn"
                        onClick={() => setEditingUpdate(item)}
                        title="Edit update"
                      >
                        <PencilIcon size={14} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        className="au-update-delete-btn"
                        onClick={() => handleDelete(item._id)}
                        disabled={deletingId === item._id}
                        title="Delete update"
                      >
                        <Trash2Icon size={14} />
                        <span>{deletingId === item._id ? "Deleting…" : "Delete"}</span>
                      </button>
                      <button
                        type="button"
                        className="au-update-more-btn"
                        onClick={() => setOpenMenuId(openMenuId === item._id ? null : item._id)}
                        title="More options"
                        aria-label="More options"
                      >
                        <EllipsisVerticalIcon size={16} />
                      </button>

                      {openMenuId === item._id && (
                        <div className="au-update-dropdown">
                          <button
                            type="button"
                            className="au-update-dropdown-item"
                            onClick={() => {
                              setOpenMenuId(null);
                              setTransferModal({
                                isOpen: true,
                                update: item,
                                newUserId: item.userId ? String(item.userId) : "",
                                loading: false,
                              });
                            }}
                          >
                            <UserIcon size={14} />
                            <span>Change Uploader</span>
                          </button>
                          <Link
                            href={`/updates/${item._id}`}
                            target="_blank"
                            className="au-update-dropdown-item"
                            onClick={() => setOpenMenuId(null)}
                          >
                            <GlobeIcon size={14} />
                            <span>View Update</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="au-update-content">{item.content}</div>

                  {item.links && item.links.length > 0 && (
                    <div className="au-update-links">
                      <span className="au-update-links-label">Attached Links</span>
                      <div className="au-update-links-list">
                        {item.links.map((link, linkIdx) => {
                          const raw = String(link || "").trim();
                          if (!raw) return null;
                          const ytId = getYouTubeVideoId(raw);
                          if (ytId) {
                            return (
                              <div key={linkIdx} className="au-youtube-embed-wrapper">
                                <iframe
                                  className="au-youtube-iframe"
                                  src={`https://www.youtube.com/embed/${ytId}`}
                                  title="YouTube video player"
                                  frameBorder="0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                  referrerPolicy="strict-origin-when-cross-origin"
                                  allowFullScreen
                                />
                              </div>
                            );
                          }
                          return <LinkPreview key={linkIdx} url={raw} />;
                        })}
                      </div>
                    </div>
                  )}

                  {item.files && item.files.length > 0 && (
                    <div className="au-update-files">
                      <span className="au-update-files-label">Attached Files</span>
                      <div className="au-update-files-list">
                        {item.files.map((file, fileIdx) => {
                          const viewUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
                            file.url
                          )}`;
                          return (
                            <a
                              key={fileIdx}
                              href={viewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="au-update-file-item"
                            >
                              <FileIcon filename={file.name || file.url} />
                              <span style={{ marginLeft: "8px" }}>{file.name}</span>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </section>

            {updates.length === 0 && !loading && (
              <div className="au-empty">
                <BookOpenIcon size={36} />
                <p>No updates found</p>
              </div>
            )}

            {updates.length > 0 && (
              <div className="au-view-more-wrap">
                <button
                  type="button"
                  className="au-view-more-btn"
                  onClick={() => fetchUpdates(page + 1, true)}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <span className="au-dots">
                        <span />
                        <span />
                        <span />
                      </span>{" "}
                      Loading…
                    </>
                  ) : (
                    <>
                      <ChevronDownIcon size={16} /> Load More Updates
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Custom Apple Delete Confirmation Modal */}
      <AdminModal
        isOpen={deleteModal.isOpen}
        onClose={() => !deleteModal.loading && setDeleteModal({ isOpen: false, id: null, loading: false })}
        onConfirm={handleConfirmDelete}
        title="Delete Update?"
        message="Are you sure you want to delete this update? This action cannot be undone."
        confirmText="Yes, delete it"
        cancelText="Cancel"
        variant="danger"
        loading={deleteModal.loading}
      />

      {/* Change Uploader / Transfer Ownership Modal */}
      <AdminModal
        isOpen={transferModal.isOpen}
        onClose={() => !transferModal.loading && setTransferModal({ isOpen: false, update: null, newUserId: "", loading: false })}
        onConfirm={handleConfirmTransfer}
        title="Change Uploader"
        message={`Transfer ownership of "${transferModal.update?.title || "this update"}" to another user:`}
        confirmText="Transfer Ownership"
        cancelText="Cancel"
        variant="primary"
        loading={transferModal.loading}
      >
        <div style={{ textAlign: "left", marginBottom: "18px" }}>
          <AdminDropdown
            label="Select New Uploader"
            options={usersList.map((u) => ({
              value: String(u._id),
              label: `${u.name || "User"} (${u.usn || u.email || u._id})`,
              keywords: `${u.name || ""} ${u.usn || ""} ${u.email || ""}`,
            }))}
            value={transferModal.newUserId}
            onChange={(val) => setTransferModal((prev) => ({ ...prev, newUserId: val }))}
            placeholder="-- Select User --"
            searchPlaceholder="Search by name, USN, or email..."
            required
          />
        </div>
      </AdminModal>

      {/* Edit Update Modal (Same as Upload Updates) */}
      <EditUpdateModal
        isOpen={!!editingUpdate}
        update={editingUpdate}
        onClose={() => setEditingUpdate(null)}
        onUpdated={(updated) => {
          setUpdates((prev) => prev.map((u) => (u._id === updated._id ? { ...u, ...updated } : u)));
          setEditingUpdate(null);
          showToast("Update saved successfully", "success");
        }}
        showToast={showToast}
      />

      {/* Bottom-Right Light Toast */}
      <AdminToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
