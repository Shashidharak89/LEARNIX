"use client";
import { useEffect, useState, useRef } from "react";
import Link from 'next/link';
import { FiTrash2, FiEdit2, FiSave, FiX, FiUser, FiClock, FiExternalLink, FiChevronRight, FiAlertCircle, FiAlertTriangle, FiUpload } from "react-icons/fi";
import './styles/UpdatesList.css';

export default function UpdatesList() {
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
  
  // Modal states
  const [deleteModal, setDeleteModal] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const fetchPage = async (p = 1, append = false) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/updates/latest?index=${p}`);
      if (!res.ok) throw new Error('Failed to load updates');
      const data = await res.json();
      const items = data?.updates || [];
      setHasMore(items.length === 10);
      setUpdates(prev => (append ? [...prev, ...items] : items));
    } catch (err) {
      console.error(err);
      showToast('Failed to load updates', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage(1, false);

    const usn = typeof window !== 'undefined' ? localStorage.getItem('usn') : null;
    if (!usn) return;
    (async () => {
      try {
        const res = await fetch(`/api/user/id?usn=${encodeURIComponent(usn)}`);
        if (res.ok) {
          const d = await res.json();
          if (d?.userId) setCurrentUserId(d.userId);
        }
      } catch (e) {
        console.error('Failed to resolve current user id', e);
      }
    })();
  }, []);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPage(next, true);
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

      // Under 24 hours - show relative time
      if (diffDays < 1) {
        if (diffSeconds < 60) return `${diffSeconds} second${diffSeconds !== 1 ? 's' : ''} ago`;
        if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      }

      // More than 24 hours - show formatted date and time
      const dateStr = date.toLocaleDateString('en-US', { 
        day: 'numeric',
        month: 'short', 
        year: 'numeric'
      });
      const timeStr = date.toLocaleTimeString('en-US', { 
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      
      return { date: dateStr, time: timeStr };
    } catch (e) {
      return iso;
    }
  };

  const parseLinks = (text) => {
    if (!text) return [];
    return text.split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), type === 'error' ? 3000 : 2000);
  };

  const openEditWindow = (u) => {
    setEditingId(String(u._id));
    setEditTitle(u.title || "");
    setEditContent(u.content || "");
    setEditLinksText((u.links || []).join('\n'));
    setEditFiles(Array.isArray(u.files) ? [...u.files] : []);
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

    const payload = {
      updateId,
      userId: currentUserId,
      title: editTitle,
      content: editContent,
      links: parseLinks(editLinksText),
      files: editFiles
    };

    try {
      const res = await fetch('/api/updates/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Edit failed');
      }

      setUpdates(prev => prev.map(it => it._id === updateId ? { 
        ...it, 
        title: data.update.title, 
        content: data.update.content, 
        links: data.update.links || [],
        files: data.update.files || []
      } : it));
      showToast('Update saved successfully', 'success');
      closeEditWindow();
    } catch (err) {
      console.error('Edit error', err);
      showToast('Failed to save update', 'error');
    }
  };

  const handleEditFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setEditIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const fd = new FormData();
        fd.append('file', f);
        if (currentUserId) fd.append('userId', currentUserId);
        const res = await fetch('/api/updates/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (res.ok && data?.file) {
          // If we're editing an existing update, immediately persist the file to the Update doc
          if (editingId && currentUserId) {
            try {
              const addRes = await fetch('/api/updates/files/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updateId: editingId, userId: currentUserId, file: data.file }),
              });
              const addData = await addRes.json();
              if (addRes.ok && addData?.update) {
                setEditFiles(Array.isArray(addData.update.files) ? addData.update.files : (editFiles) => [...editFiles, data.file]);
                // also update list in parent updates array so UI stays in sync
                setUpdates((prev) => prev.map(u => u._id === addData.update._id ? ({ ...u, files: addData.update.files || [] }) : u));
              } else {
                // fallback to local append if server call failed
                setEditFiles((p) => [...p, data.file]);
                showToast(addData?.error || `Failed to attach ${f.name} to update`, 'error');
              }
            } catch (err) {
              console.error('Failed to add file to update', err);
              setEditFiles((p) => [...p, data.file]);
              showToast('Failed to persist file to update', 'error');
            }
          } else {
            // Not editing an existing update (shouldn't normally happen) — keep locally
            setEditFiles((p) => [...p, data.file]);
          }
        } else {
          showToast(data?.error || `Failed to upload ${f.name}`,'error');
        }
      }
    } catch (err) {
      console.error('Edit file upload error', err);
      showToast('File upload failed', 'error');
    } finally {
      setEditIsUploading(false);
      e.target.value = null;
    }
  };

  const removeEditFile = (idx) => {
    setEditFiles((p) => p.filter((_, i) => i !== idx));
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
    const newList = updates.filter(u => u._id !== updateId);
    setUpdates(newList);
    pendingRef.current[updateId] = true;

    try {
      const res = await fetch('/api/updates/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updateId, userId: currentUserId }),
      });
      let data;
      try { data = await res.json(); } catch (e) { data = null; }
      if (!res.ok) {
        throw new Error(data?.error || `Delete failed (status ${res.status})`);
      }
      showToast('Update deleted', 'success');
    } catch (err) {
      console.error('Delete error', err);
      showToast('Failed to delete update', 'error');
      setUpdates(prev);
    } finally {
      delete pendingRef.current[updateId];
    }
  };

  // Skeleton loader
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
        <div className="upl-header-icon">
          <FiClock />
        </div>
        <h4 className="upl-section-title">Recent Updates</h4>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`upl-toast upl-toast-${toast.type}`}>
          <FiAlertCircle className="upl-toast-icon" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="upl-modal-overlay" onClick={closeDeleteModal}>
          <div className="upl-modal" onClick={(e) => e.stopPropagation()}>
            <div className="upl-modal-header">
              <FiAlertTriangle className="upl-modal-icon upl-modal-icon-danger" />
              <h3 className="upl-modal-title">Delete Update</h3>
            </div>
            <div className="upl-modal-body">
              <p className="upl-modal-text">
                Are you sure you want to delete <strong>"{deleteModal.title}"</strong>?
              </p>
              <p className="upl-modal-subtext">This action cannot be undone.</p>
            </div>
            <div className="upl-modal-actions">
              <button onClick={closeDeleteModal} className="upl-modal-btn upl-modal-btn-cancel">
                <FiX />
                <span>Cancel</span>
              </button>
              <button onClick={confirmDelete} className="upl-modal-btn upl-modal-btn-danger">
                <FiTrash2 />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Window Modal */}
      {editModalOpen && (
        <div className="upl-modal-overlay" onClick={closeEditWindow}>
          <div className="upl-modal upl-modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="upl-modal-header">
              <FiEdit2 className="upl-modal-icon upl-modal-icon-primary" />
              <h3 className="upl-modal-title">Edit Update</h3>
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
                <label className="upl-edit-label">Files (optional)</label>
                <div className="upl-edit-files-row">
                  <label className="upl-file-btn">
                    <FiUpload />
                    <span>Add files</span>
                    <input type="file" multiple onChange={handleEditFilesSelected} className="upl-hidden-input" />
                  </label>
                  {editIsUploading && <span className="upl-file-uploading">Uploading…</span>}
                </div>

                {editFiles && editFiles.length > 0 && (
                  <div className="upl-edit-files-list">
                    {editFiles.map((f, i) => (
                      <div key={i} className="upl-edit-file-item">
                        <a href={`/api/updates/download?url=${encodeURIComponent(f.url)}&name=${encodeURIComponent(f.name || '')}`} className="upl-edit-file-link" target="_blank" rel="noreferrer noopener">{f.name || f.url.split('/').pop()}</a>
                        <button type="button" className="upl-edit-file-remove" onClick={() => removeEditFile(i)} title="Remove file"><FiTrash2 /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="upl-modal-actions">
              <button onClick={closeEditWindow} className="upl-modal-btn upl-modal-btn-cancel">
                <FiX />
                <span>Cancel</span>
              </button>
              <button onClick={() => saveEdit(editingId)} className="upl-modal-btn upl-modal-btn-primary">
                <FiSave />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {updates.length === 0 && !loading && (
        <div className="upl-empty-state">
          <FiClock className="upl-empty-icon" />
          <p className="upl-empty-text">No updates yet.</p>
        </div>
      )}

      {/* Skeleton Loading */}
      {loading && page === 1 && (
        <div className="upl-list">
          <UpdateSkeleton />
          <UpdateSkeleton />
          <UpdateSkeleton />
        </div>
      )}

      {/* Updates List */}
      <div className="upl-list">
        {updates.map((u, idx) => {
          const timeData = getRelativeTime(u.createdAt);
          const isRelative = typeof timeData === 'string';
          
          return (
            <article key={u._id} className="upl-card" style={{ animationDelay: `${idx * 50}ms` }}>
              {/* Card Header */}
              <div className="upl-card-header">
                <div className="upl-avatar-wrapper">
                  {u.profileUrl ? (
                    <img src={u.profileUrl} alt={u.name || 'profile'} className="upl-avatar" />
                  ) : (
                    <div className="upl-avatar upl-avatar-placeholder">
                      <FiUser />
                    </div>
                  )}
                </div>

                <div className="upl-user-info">
                  <div className="upl-title-section">
                    <strong className="upl-user-title">{u.title}</strong>
                    <div className="upl-meta-row">
                      {/* Action Buttons */}
                      {currentUserId && u.userId && String(currentUserId) === String(u.userId) && (
                        <div className="upl-actions">
                          <button
                            onClick={() => openEditWindow(u)}
                            className="upl-action-btn upl-action-edit"
                            title="Edit"
                            aria-label="Edit update"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => openDeleteModal(String(u._id), u.title)}
                            className="upl-action-btn upl-action-delete"
                            title="Delete"
                            aria-label="Delete update"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      )}
                      
                      {/* Timestamp */}
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
              </div>

              {/* Content */}
              {u.content && (
                <p className="upl-content">{u.content}</p>
              )}

              {/* Links */}
              {u.links && u.links.length > 0 && (
                <div className="upl-links">
                  {u.links.map((ln, idx) => {
                    const raw = String(ln || '').trim();
                    if (!raw) return null;
                    
                    const internal = raw.startsWith('/');
                    
                    if (internal) {
                      return (
                        <Link key={idx} href={raw} className="upl-link upl-link-internal">
                          <span>Visit</span>
                          <FiChevronRight className="upl-link-icon" />
                        </Link>
                      );
                    }

                    const hasScheme = /^https?:\/\//i.test(raw) || /^mailto:/i.test(raw);
                    const href = hasScheme ? raw : `https://${raw}`;

                    return (
                      <a 
                        key={idx} 
                        href={href} 
                        target="_blank" 
                        rel="noreferrer noopener" 
                        className="upl-link upl-link-external"
                      >
                        <span>{raw}</span>
                        <FiExternalLink className="upl-link-icon" />
                      </a>
                    );
                  })}
                </div>
              )}

              {/* Files */}
              {u.files && u.files.length > 0 && (
                <div className="upl-files">
                  {u.files.map((f, idx) => {
                    const url = f.url || f;
                    const name = f.name || url.split('/').pop();
                    const isImage = (f.resourceType === 'image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                    const downloadHref = `/api/updates/download?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name)}`;
                    if (isImage) {
                      return (
                        <a key={idx} href={downloadHref} className="upl-file-thumb" title={name}>
                          <img src={url} alt={name} />
                        </a>
                      );
                    }
                    return (
                      <a key={idx} href={downloadHref} className="upl-file-link" title={name}>
                        {name}
                      </a>
                    );
                  })}
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Load More Section */}
      <div className="upl-load-more-section">
        {loading && page > 1 ? (
          <button className="upl-load-more-btn" disabled>
            <span className="upl-spinner"></span>
            <span>Loading...</span>
          </button>
        ) : hasMore ? (
          <button onClick={loadMore} className="upl-load-more-btn">
            <span>Load More</span>
            <FiChevronRight className="upl-btn-icon" />
          </button>
        ) : (
          updates.length > 0 && (
            <div className="upl-end-message">
              <span>No more updates</span>
            </div>
          )
        )}
      </div>
    </section>
  );
}