"use client";
import { useEffect, useState, useRef } from "react";
import Link from 'next/link';
import { FiTrash2, FiEdit2, FiSave, FiX, FiUser, FiClock, FiExternalLink, FiChevronRight, FiAlertCircle, FiAlertTriangle, FiUpload, FiDownload, FiEye, FiGlobe, FiLock, FiLink2, FiChevronDown, FiCheck, FiCheckCircle, FiInfo } from "react-icons/fi";
import { getYouTubeVideoId, groupConsecutiveLinks } from '../../utils/youtube';
import LinkPreview from '../../components/LinkPreview';
import YouTubeEmbed from '../../components/YouTubeEmbed';
import FileIcon from '../../components/FileIcon';
import { authFetch } from '@/lib/clientAuth';
import { uploadFileViaWebSocket } from '@/lib/websocketUploader';
import ExpandableDescription from '../../components/ExpandableDescription';
import './styles/UpdatesList.css';

export default function UpdatesList({ refreshKey, searchQuery = "", onClearSearch }) {
  const [updates, setUpdates] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [toast, setToast] = useState(null);
  const pendingRef = useRef({});
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editLinksText, setEditLinksText] = useState("");
  const [editFiles, setEditFiles] = useState([]);
  const [editIsUploading, setEditIsUploading] = useState(false);
  const [editUploadStatus, setEditUploadStatus] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Modal states
  const [deleteModal, setDeleteModal] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editVisibility, setEditVisibility] = useState("public");
  const [openVisibilityMenuId, setOpenVisibilityMenuId] = useState(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.upl-vis-container')) {
        setOpenVisibilityMenuId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleUpdateVisibility = async (updateId, newVisibility) => {
    setOpenVisibilityMenuId(null);

    // Optimistic UI update
    setUpdates((prev) =>
      prev.map((u) => (String(u._id) === String(updateId) ? { ...u, visibility: newVisibility } : u))
    );

    try {
      const res = await authFetch('/api/updates/visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updateId, visibility: newVisibility })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to update visibility');
      showToast(`Visibility updated to ${newVisibility}`, 'success');
    } catch (err) {
      console.error('Visibility update error:', err);
      showToast('Failed to change visibility', 'error');
      if (currentUserId) {
        fetchPage(page, false, currentUserId, searchQuery);
      }
    }
  };

  const fetchPage = async (p = 1, append = false, userId = currentUserId, query = searchQuery) => {
    if (!userId) {
      setUpdates([]);
      setHasMore(false);
      return;
    }

    setLoading(true);
    try {
      const urlParams = new globalThis.URLSearchParams({
        index: String(p),
        limit: '10',
        userId: encodeURIComponent(userId)
      });
      if (query && query.trim()) {
        urlParams.set('q', query.trim());
      }
      const res = await authFetch(`/api/user/updates?${urlParams.toString()}`);
      if (!res.ok) throw new Error('Failed to load updates');
      const data = await res.json();
      const items = data?.updates || [];
      const paginationHasMore = data?.pagination?.hasMore !== undefined ? data.pagination.hasMore : items.length === 10;
      setHasMore(paginationHasMore);
      setUpdates(prev => (append ? [...prev, ...items] : items));
    } catch (err) {
      console.error(err);
      showToast('Failed to load updates', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const usn = typeof window !== 'undefined' ? localStorage.getItem('usn') : null;
    if (!usn) {
      setUpdates([]);
      setHasMore(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`/api/user/id?usn=${encodeURIComponent(usn)}`);
        if (res.ok) {
          const d = await res.json();
          if (d?.userId) {
            setCurrentUserId(d.userId);
            setPage(1);
            fetchPage(1, false, d.userId, searchQuery);
          }
        }
      } catch (e) {
        console.error('Failed to resolve current user id', e);
      }
    })();
  }, []);

  useEffect(() => {
    if (refreshKey > 0 && currentUserId) {
      setPage(1);
      fetchPage(1, false, currentUserId, searchQuery);
    }
  }, [refreshKey]);

  useEffect(() => {
    if (currentUserId) {
      setPage(1);
      fetchPage(1, false, currentUserId, searchQuery);
    }
  }, [searchQuery]);

  const loadMore = () => {
    if (!currentUserId) return;
    const next = page + 1;
    setPage(next);
    fetchPage(next, true, currentUserId, searchQuery);
  };

  const getRelativeTime = (iso) => {
    try {
      const date = new Date(iso);
      const now = new Date();
      const diffMs = now - date;
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays < 1) {
        if (diffSeconds < 60) return `${diffSeconds} second${diffSeconds !== 1 ? 's' : ''} ago`;
        if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      }

      const dateStr = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
      const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      return { date: dateStr, time: timeStr };
    } catch (e) {
      return iso;
    }
  };

  const parseLinks = (text) => {
    if (!text) return [];
    return text.split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
  };

  const toastTimeoutRef = useRef(null);
  const showToast = (message, type = 'info') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3500);
  };

  const openEditWindow = (u) => {
    setEditingId(String(u._id));
    setEditTitle(u.title || "");
    setEditContent(u.content || "");
    setEditLinksText((u.links || []).join('\n'));
    setEditFiles(Array.isArray(u.files) ? [...u.files] : []);
    setEditVisibility(u.visibility || "public");
    setEditModalOpen(true);
  };

  const closeEditWindow = () => {
    setEditModalOpen(false);
    setEditingId(null);
    setEditTitle('');
    setEditContent('');
    setEditLinksText('');
  };

  const saveEdit = async (updateId) => {
    if (!currentUserId) {
      showToast('You must be signed in to edit', 'error');
      return;
    }

    if (!editTitle.trim()) {
      showToast('Please provide a title', 'error');
      return;
    }

    setIsSaving(true);
    const payload = {
      updateId,
      userId: currentUserId,
      title: editTitle.trim(),
      content: editContent,
      links: parseLinks(editLinksText),
      files: editFiles,
      visibility: editVisibility
    };

    try {
      const res = await fetch('/api/updates/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Edit failed');

      setUpdates(prev => prev.map(it => it._id === updateId ? { 
        ...it, 
        title: data.update.title, 
        content: data.update.content, 
        links: data.update.links || [],
        files: data.update.files || [],
        visibility: data.update.visibility || "public"
      } : it));
      showToast('Update saved successfully', 'success');
      closeEditWindow();
    } catch (err) {
      console.error('Edit error', err);
      showToast('Failed to save update', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setEditIsUploading(true);
    setEditUploadStatus({
      current: 1,
      total: files.length,
      filename: files[0]?.name,
      percent: 0,
      chunkIndex: 1,
      totalChunks: 1,
      statusText: "Connecting to WebSocket..."
    });

    const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        setEditUploadStatus({
          current: i + 1,
          total: files.length,
          filename: f.name,
          percent: 0,
          chunkIndex: 1,
          totalChunks: 1,
          statusText: "Connecting to WebSocket..."
        });

        const uploadResult = await uploadFileViaWebSocket(f, {
          userId: currentUserId,
          token,
          onProgress: ({ percent, currentChunk, totalChunks }) => {
            setEditUploadStatus({
              current: i + 1,
              total: files.length,
              filename: f.name,
              percent,
              chunkIndex: currentChunk,
              totalChunks,
              statusText: `Uploading chunk ${currentChunk}/${totalChunks} (${percent}%)`
            });
          },
          onStatus: (statusText) => {
            setEditUploadStatus(prev => prev ? ({ ...prev, statusText }) : null);
          }
        });

        const uploadedFile = uploadResult?.file;
        if (uploadedFile) {
          if (editingId && currentUserId) {
            try {
              const addRes = await fetch('/api/updates/files/add', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ updateId: editingId, userId: currentUserId, file: uploadedFile }),
              });
              const addData = await addRes.json();
              if (addRes.ok && addData?.update) {
                setEditFiles(Array.isArray(addData.update.files) ? addData.update.files : (prev) => [...prev, uploadedFile]);
                setUpdates((prev) => prev.map(u => u._id === addData.update._id ? ({ ...u, files: addData.update.files || [] }) : u));
              } else {
                setEditFiles((p) => [...p, uploadedFile]);
                showToast(addData?.error || `Failed to attach ${f.name} to update`, 'error');
              }
            } catch (err) {
              console.error('Failed to add file to update', err);
              setEditFiles((p) => [...p, uploadedFile]);
              showToast('Failed to persist file to update', 'error');
            }
          } else {
            setEditFiles((p) => [...p, uploadedFile]);
          }
        } else {
          showToast(`Failed to upload ${f.name}`, 'error');
        }
      }
      showToast(`Uploaded ${files.length} file${files.length > 1 ? 's' : ''} successfully via WebSocket`, 'success');
    } catch (err) {
      console.error('Edit file upload error', err);
      showToast(err.message || 'File upload failed', 'error');
    } finally {
      setEditIsUploading(false);
      setEditUploadStatus(null);
      if (e?.target) e.target.value = null;
    }
  };

  const removeEditFile = async (idx) => {
    const fileToRemove = editFiles[idx];
    setEditFiles((p) => p.filter((_, i) => i !== idx));

    if (fileToRemove?.publicId) {
      const origUpdate = updates.find((u) => String(u._id) === editingId);
      const isOriginal = origUpdate?.files?.some((f) => f.publicId === fileToRemove.publicId);
      if (!isOriginal) {
        try {
          await fetch('/api/updates/upload', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              publicId: fileToRemove.publicId,
              resourceType: fileToRemove.resourceType || 'auto',
            }),
          });
        } catch (err) {
          console.error('Failed to delete uncommitted edit file from Cloudinary:', err);
        }
      }
    }
  };

  const openDeleteModal = (updateId, title) => {
    setDeleteModal({ updateId, title });
  };

  const closeDeleteModal = () => {
    setDeleteModal(null);
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;
    const updateId = deleteModal.updateId;
    closeDeleteModal();

    if (!currentUserId) {
      showToast('You must be signed in to delete', 'error');
      return;
    }

    const prev = updates;
    setUpdates(updates.filter(u => u._id !== updateId));
    pendingRef.current[updateId] = true;

    try {
      const res = await fetch('/api/updates/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updateId, userId: currentUserId }),
      });
      let data;
      try { data = await res.json(); } catch (e) { data = null; }
      if (!res.ok) throw new Error(data?.error || `Delete failed (status ${res.status})`);
      showToast('Update deleted successfully', 'success');
    } catch (err) {
      console.error('Delete error', err);
      showToast('Failed to delete update', 'error');
      setUpdates(prev);
    } finally {
      delete pendingRef.current[updateId];
    }
  };

  const UpdateSkeleton = () => (
    <div className="upl-card upl-skeleton">
      <div className="upl-card-header">
        <div className="upl-skeleton-avatar"></div>
        <div className="upl-skeleton-text-group">
          <div className="upl-skeleton-line upl-skeleton-title"></div>
          <div className="upl-skeleton-line upl-skeleton-meta"></div>
        </div>
      </div>
      <div className="upl-skeleton-content">
        <div className="upl-skeleton-line upl-skeleton-text"></div>
        <div className="upl-skeleton-line upl-skeleton-text upl-skeleton-text-short"></div>
      </div>
    </div>
  );

  return (
    <section className="upl-container">
      <div className="upl-header-section">
        <div className="upl-header-icon"><FiClock /></div>
        <h4 className="upl-section-title">
          {searchQuery ? `Search Results for "${searchQuery}"` : "Recent Updates"}
        </h4>
        {searchQuery && onClearSearch && (
          <button
            type="button"
            onClick={onClearSearch}
            className="upl-clear-search-badge"
            title="Clear search filter"
          >
            <span>Clear filter</span>
            <FiX size={14} />
          </button>
        )}
      </div>

      {/* Floating Screen-Bottom Toast Notification */}
      {toast && (
        <div className={`upl-toast upl-toast-${toast.type || 'info'}`} role="status" aria-live="polite">
          <div className="upl-toast-icon-box">
            {toast.type === 'success' ? (
              <FiCheckCircle className="upl-toast-icon" />
            ) : toast.type === 'error' ? (
              <FiAlertCircle className="upl-toast-icon" />
            ) : (
              <FiInfo className="upl-toast-icon" />
            )}
          </div>
          <span className="upl-toast-text">{toast.message}</span>
          <button
            type="button"
            className="upl-toast-close"
            onClick={() => setToast(null)}
            aria-label="Dismiss message"
          >
            <FiX />
          </button>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <div className="upl-modal-overlay" onClick={closeDeleteModal}>
          <div className="upl-modal" onClick={(e) => e.stopPropagation()}>
            <div className="upl-modal-header">
              <div className="upl-modal-header-left">
                <FiAlertTriangle className="upl-modal-icon upl-modal-icon-danger" />
                <h3 className="upl-modal-title">Delete Update</h3>
              </div>
              <button
                type="button"
                onClick={closeDeleteModal}
                className="upl-modal-close-btn"
                title="Close"
                aria-label="Close delete modal"
              >
                <FiX />
              </button>
            </div>
            <div className="upl-modal-body">
              <p className="upl-modal-text">Are you sure you want to delete <strong>"{deleteModal.title}"</strong>?</p>
              <p className="upl-modal-subtext">This action cannot be undone.</p>
            </div>
            <div className="upl-modal-actions">
              <button type="button" onClick={closeDeleteModal} className="upl-modal-btn upl-modal-btn-cancel">
                <FiX />
                <span>Cancel</span>
              </button>
              <button type="button" onClick={confirmDelete} className="upl-modal-btn upl-modal-btn-danger">
                <FiTrash2 />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && (
        <div className="upl-modal-overlay" onClick={closeEditWindow}>
          <div className="upl-modal upl-modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="upl-modal-header">
              <div className="upl-modal-header-left">
                <FiEdit2 className="upl-modal-icon upl-modal-icon-primary" />
                <h3 className="upl-modal-title">Edit Update</h3>
              </div>
              <button
                type="button"
                onClick={closeEditWindow}
                className="upl-modal-close-btn"
                title="Close"
                aria-label="Close edit modal"
              >
                <FiX />
              </button>
            </div>
            <div className="upl-modal-body">
              <div className="upl-edit-field">
                <label className="upl-edit-label">Title</label>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="upl-edit-title-input"
                  placeholder="Update title..."
                />
              </div>
              <div className="upl-edit-field">
                <label className="upl-edit-label">Visibility</label>
                <select
                  value={editVisibility}
                  onChange={(e) => setEditVisibility(e.target.value)}
                  className="upl-edit-select"
                >
                  <option value="public">Public (Visible to everyone)</option>
                  <option value="private">Private (Only visible to you)</option>
                  <option value="unlisted">Unlisted (Anyone with link)</option>
                </select>
              </div>
              <div className="upl-edit-field">
                <label className="upl-edit-label">Content</label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={5}
                  className="upl-edit-textarea"
                  placeholder="Update content..."
                />
              </div>
              <div className="upl-edit-field">
                <label className="upl-edit-label">Links (one per line)</label>
                <textarea
                  value={editLinksText}
                  onChange={(e) => setEditLinksText(e.target.value)}
                  rows={3}
                  className="upl-edit-textarea"
                  placeholder="/internal-link or https://external-link.com"
                />
              </div>
              <div className="upl-edit-field">
                <label className="upl-edit-label">
                  <span>Files (optional)</span>
                  {editFiles && editFiles.length > 0 && (
                    <span className="upl-edit-file-count">
                      {editFiles.length} {editFiles.length === 1 ? 'file' : 'files'} attached
                    </span>
                  )}
                </label>
                <div className="upl-edit-files-row">
                  <label className="upl-file-btn">
                    <FiUpload />
                    <span>Add files</span>
                    <input type="file" multiple onChange={handleEditFilesSelected} className="upl-hidden-input" />
                  </label>
                  {editIsUploading && !editUploadStatus && <span className="upl-file-uploading">Uploading…</span>}
                </div>

                {/* Real-time WebSocket Chunk Upload Progressbar */}
                {editIsUploading && editUploadStatus && (
                  <div className="upl-ws-progress-box">
                    <div className="upl-ws-progress-header">
                      <span className="upl-ws-progress-filename">
                        File {editUploadStatus.current}/{editUploadStatus.total}: <strong>{editUploadStatus.filename}</strong>
                      </span>
                      <span className="upl-ws-progress-tag">
                        ⚡ WS: {editUploadStatus.percent || 0}%
                      </span>
                    </div>
                    <div className="upl-ws-progress-track">
                      <div
                        className="upl-ws-progress-fill"
                        style={{ width: `${Math.max(2, editUploadStatus.percent || 0)}%` }}
                      ></div>
                    </div>
                    <div className="upl-ws-progress-footer">
                      <span>{editUploadStatus.statusText || 'Uploading chunks…'}</span>
                      {editUploadStatus.totalChunks > 1 && (
                        <span>Chunk {editUploadStatus.chunkIndex || 1} of {editUploadStatus.totalChunks}</span>
                      )}
                    </div>
                  </div>
                )}
                {editFiles && editFiles.length > 0 && (
                  <div className="upl-edit-files-list">
                    {editFiles.map((f, i) => {
                      const url = f.url || f;
                      const name = f.name || (typeof url === 'string' ? url.split('/').pop() : 'Attachment');
                      const viewUrl = typeof url === 'string' && url.startsWith('http')
                        ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`
                        : url;

                      return (
                        <div key={i} className="upl-edit-file-item">
                          <div className="upl-edit-file-info">
                            <FileIcon filename={name} />
                            <a
                              href={viewUrl}
                              className="upl-edit-file-link"
                              target="_blank"
                              rel="noreferrer noopener"
                              title={name}
                            >
                              {name}
                            </a>
                          </div>
                          <button
                            type="button"
                            className="upl-edit-file-remove"
                            onClick={() => removeEditFile(i)}
                            title={`Remove ${name}`}
                            aria-label={`Remove ${name}`}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="upl-modal-actions">
              <button
                type="button"
                onClick={closeEditWindow}
                className="upl-modal-btn upl-modal-btn-cancel"
                disabled={isSaving}
              >
                <FiX />
                <span>Cancel</span>
              </button>
              <button
                type="button"
                onClick={() => saveEdit(editingId)}
                className="upl-modal-btn upl-modal-btn-primary"
                disabled={isSaving || editIsUploading}
              >
                {isSaving ? (
                  <>
                    <span className="upl-spinner"></span>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <FiSave />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {updates.length === 0 && !loading && (
        <div className="upl-empty-state">
          <FiClock className="upl-empty-icon" />
          <p className="upl-empty-text">
            {searchQuery
              ? `No updates found in your account matching "${searchQuery}".`
              : "No updates yet."}
          </p>
          {searchQuery && onClearSearch && (
            <button
              type="button"
              onClick={onClearSearch}
              className="upl-empty-clear-btn"
            >
              Show all updates
            </button>
          )}
        </div>
      )}

      {/* Skeleton */}
      {loading && page === 1 && (
        <div className="upl-list">
          <UpdateSkeleton /><UpdateSkeleton /><UpdateSkeleton />
        </div>
      )}

      {/* Updates List */}
      <div className="upl-list">
        {updates.map((u, idx) => {
          const timeData = getRelativeTime(u.createdAt);
          const isRelative = typeof timeData === 'string';
          const isMenuOpen = openVisibilityMenuId !== null && String(openVisibilityMenuId) === String(u._id);

          return (
            <article
              key={u._id}
              className={`upl-card ${isMenuOpen ? 'upl-card-active-menu' : ''}`}
              style={{
                animationDelay: `${(idx % 10) * 25}ms`,
                zIndex: isMenuOpen ? 1000 : 1
              }}
            >
              {/* Card Header */}
              <div className="upl-card-header">
                <div className="upl-avatar-wrapper">
                  {u.profileUrl ? (
                    <img src={u.profileUrl} alt={u.name || 'profile'} className="upl-avatar" />
                  ) : (
                    <div className="upl-avatar upl-avatar-placeholder"><FiUser /></div>
                  )}
                </div>
                <div className="upl-user-info">
                  <div className="upl-user-top-row">
                    <div className="upl-user-name-usn" title={`${u.name || ''}${u.usn ? ` • ${u.usn}` : ''}`}>
                      <Link href={`/search/${u.usn || ''}`} className="upl-user-name-link">
                        <FiUser className="upl-user-icon" />
                        <span className="upl-user-name-text">{u.name || 'User'}</span>
                      </Link>
                      {u.usn && (
                        <Link href={`/search/${u.usn}`} className="upl-usn-link">
                          • {u.usn}
                        </Link>
                      )}
                    </div>
                    {currentUserId && u.userId && String(currentUserId) === String(u.userId) && (
                      <div className="upl-actions">
                        <button onClick={() => openEditWindow(u)} className="upl-action-btn upl-action-edit" title="Edit update" aria-label="Edit update"><FiEdit2 /></button>
                        <button onClick={() => openDeleteModal(String(u._id), u.title)} className="upl-action-btn upl-action-delete" title="Delete update" aria-label="Delete update"><FiTrash2 /></button>
                      </div>
                    )}
                  </div>

                  <div className="upl-user-sub-row">
                    {u.title && (
                      <strong className="upl-user-title">{u.title}</strong>
                    )}

                    {/* Interactive Visibility Switcher with Apple-style dropdown */}
                    <div className="upl-vis-container">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenVisibilityMenuId(isMenuOpen ? null : String(u._id));
                        }}
                        className={`upl-vis-badge upl-vis-badge-${u.visibility || 'public'}`}
                        title="Click to change visibility"
                        aria-haspopup="true"
                        aria-expanded={isMenuOpen}
                      >
                        {u.visibility === 'private' ? (
                          <FiLock className="upl-vis-badge-icon" />
                        ) : u.visibility === 'unlisted' ? (
                          <FiLink2 className="upl-vis-badge-icon" />
                        ) : (
                          <FiGlobe className="upl-vis-badge-icon" />
                        )}
                        <span className="upl-vis-badge-text">
                          {u.visibility === 'private' ? 'Private' : u.visibility === 'unlisted' ? 'Unlisted' : 'Public'}
                        </span>
                        <FiChevronDown className={`upl-vis-badge-arrow ${isMenuOpen ? 'upl-vis-badge-arrow-open' : ''}`} />
                      </button>

                      {/* Dropdown Menu */}
                      {isMenuOpen && (
                        <div className="upl-vis-dropdown" onClick={(e) => e.stopPropagation()}>
                          <div className="upl-vis-dropdown-header">
                            <span>Change Visibility</span>
                          </div>
                          <div className="upl-vis-dropdown-list">
                            <button
                              type="button"
                              className={`upl-vis-dropdown-item ${(!u.visibility || u.visibility === 'public') ? 'active' : ''}`}
                              onClick={() => handleUpdateVisibility(u._id, 'public')}
                            >
                              <div className="upl-vis-item-icon-box upl-vis-icon-public">
                                <FiGlobe />
                              </div>
                              <div className="upl-vis-item-info">
                                <span className="upl-vis-item-title">Public</span>
                                <span className="upl-vis-item-desc">Visible to everyone on campus</span>
                              </div>
                              {(!u.visibility || u.visibility === 'public') && (
                                <FiCheck className="upl-vis-item-check" />
                              )}
                            </button>

                            <button
                              type="button"
                              className={`upl-vis-dropdown-item ${u.visibility === 'unlisted' ? 'active' : ''}`}
                              onClick={() => handleUpdateVisibility(u._id, 'unlisted')}
                            >
                              <div className="upl-vis-item-icon-box upl-vis-icon-unlisted">
                                <FiLink2 />
                              </div>
                              <div className="upl-vis-item-info">
                                <span className="upl-vis-item-title">Unlisted</span>
                                <span className="upl-vis-item-desc">Anyone with link can view</span>
                              </div>
                              {u.visibility === 'unlisted' && (
                                <FiCheck className="upl-vis-item-check" />
                              )}
                            </button>

                            <button
                              type="button"
                              className={`upl-vis-dropdown-item ${u.visibility === 'private' ? 'active' : ''}`}
                              onClick={() => handleUpdateVisibility(u._id, 'private')}
                            >
                              <div className="upl-vis-item-icon-box upl-vis-icon-private">
                                <FiLock />
                              </div>
                              <div className="upl-vis-item-info">
                                <span className="upl-vis-item-title">Private</span>
                                <span className="upl-vis-item-desc">Only visible to you</span>
                              </div>
                              {u.visibility === 'private' && (
                                <FiCheck className="upl-vis-item-check" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="upl-timestamp">
                      <FiClock className="upl-time-icon" />
                      {isRelative ? (
                        <span className="upl-time-relative">{timeData}</span>
                      ) : (
                        <div className="upl-time-absolute">
                          <span className="upl-time-date">{timeData.date}</span>
                          <span className="upl-time-clock">{timeData.time}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <ExpandableDescription content={u.content} className="upl-content" />

              {/* Links */}
              {u.links && u.links.length > 0 && (
                <div className="upl-links">
                  {groupConsecutiveLinks(u.links).map((group, groupIdx) => {
                    if (group.type === 'youtube-group') {
                      if (group.items.length === 2) {
                        return (
                          <div key={groupIdx} className="upl-youtube-grid-2">
                            {group.items.map((item, itemIdx) => (
                              <YouTubeEmbed
                                key={itemIdx}
                                ytId={item.ytId}
                                wrapperClass="upl-youtube-embed-wrapper upl-youtube-grid-item"
                                iframeClass="upl-youtube-iframe"
                              />
                            ))}
                          </div>
                        );
                      }
                      const item = group.items[0];
                      return (
                        <YouTubeEmbed
                          key={groupIdx}
                          ytId={item.ytId}
                          wrapperClass="upl-youtube-embed-wrapper"
                          iframeClass="upl-youtube-iframe"
                        />
                      );
                    }

                    if (group.type === 'internal') {
                      return (
                        <Link key={groupIdx} href={group.raw} className="upl-link upl-link-internal">
                          <span>Visit</span><FiChevronRight className="upl-link-icon" />
                        </Link>
                      );
                    }
                    return <LinkPreview key={groupIdx} url={group.raw} />;
                  })}
                </div>
              )}

              {/* Files — clicking anywhere opens Drive viewer */}
              {u.files && u.files.length > 0 && (
                <div className="upl-files">
                  {u.files.map((f, idx) => {
                    const url = f.url || f;
                    const name = f.name || url.split('/').pop();
                    const viewUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;

                    return (
                      <div
                        key={idx}
                        className="upl-file-card"
                        onClick={() => window.open(viewUrl, '_blank', 'noopener,noreferrer')}
                      >
                        <div className="upl-file-card-name" title={`View ${name}`}>
                          <FileIcon filename={name || url} />
                          <span className="upl-file-card-label">{name}</span>
                        </div>
                        <div className="upl-file-card-actions" onClick={(e) => e.stopPropagation()}>
                          <a href={viewUrl} target="_blank" rel="noreferrer noopener" className="upl-file-action-btn upl-file-action-view" title="View">
                            <FiEye />
                          </a>
                          <a href={url} download={name} target="_blank" rel="noreferrer noopener" className="upl-file-action-btn upl-file-action-download" title="Download">
                            <FiDownload />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Load More */}
      <div className="upl-load-more-section">
        {loading && page > 1 ? (
          <button className="upl-load-more-btn" disabled><span className="upl-spinner"></span><span>Loading...</span></button>
        ) : hasMore ? (
          <button onClick={loadMore} className="upl-load-more-btn"><span>Load More</span><FiChevronRight className="upl-btn-icon" /></button>
        ) : (
          updates.length > 0 && <div className="upl-end-message"><span>No more updates</span></div>
        )}
      </div>
    </section>
  );
}