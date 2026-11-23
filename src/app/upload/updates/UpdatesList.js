"use client";
import { useEffect, useState, useRef } from "react";
import Link from 'next/link';
import {
  FiClock,
  FiExternalLink,
  FiChevronRight,
  FiChevronDown,
  FiChevronUp,
  FiAlertCircle,
  FiAlertTriangle,
  FiTrash2,
  FiCheckCircle,
  FiInfo,
  FiX
} from "react-icons/fi";
import {
  UserIcon,
  ClockIcon,
  EllipsisVerticalIcon,
  ShareIcon,
  ExternalLinkIcon,
  EyeIcon,
  DownloadIcon,
  PencilIcon,
  Trash2Icon,
} from "@animateicons/react/lucide";
import { groupConsecutiveLinks } from '../../utils/youtube';
import LinkPreview from '../../components/LinkPreview';
import YouTubeEmbed from '../../components/YouTubeEmbed';
import FileIcon from '../../components/FileIcon';
import { authFetch } from '@/lib/clientAuth';
import { isPdfFile, getPdfDownloadName, getPdfDownloadUrl, downloadPdfFile } from '@/lib/pdfDownload';
import ExpandableDescription from '../../components/ExpandableDescription';
import EditUpdateModal from './EditUpdateModal';
import '@/app/updates/styles/Updates.css';
import './styles/UpdatesList.css';

const FILES_LIMIT = 4;

function formatViews(n) {
  const num = Number(n) || 0;
  if (num >= 1000000) {
    const formatted = (num / 1000000).toFixed(1);
    return `${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}M`;
  }
  if (num >= 1000) {
    const formatted = (num / 1000).toFixed(1);
    return `${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}k`;
  }
  return String(num);
}

function formatExactViews(n) {
  const num = Number(n) || 0;
  return `${num.toLocaleString()} view${num !== 1 ? 's' : ''}`;
}

function formatExactTimestamp(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch (e) {
    return String(iso);
  }
}

// Single Update Card matching /updates exactly
function MyUpdateCard({
  update: u,
  idx,
  currentUserId,
  currentUserUsn,
  onOpenEdit,
  onDeleteRequest,
  onShareUpdate,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLinksExpanded, setIsLinksExpanded] = useState(false);
  const [isFilesExpanded, setIsFilesExpanded] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  const menuRef = useRef(null);
  const moreRef = useRef(null);
  const userIconRef = useRef(null);
  const timeIconRef = useRef(null);
  const viewsIconRef = useRef(null);
  const shareRef = useRef(null);
  const externalLinkRef = useRef(null);

  useEffect(() => {
    const checkScreen = () => {
      setIsLargeScreen(typeof window !== "undefined" && window.innerWidth >= 640);
    };
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isMenuOpen]);

  const totalFiles = u.files?.length || 0;
  const hasMoreFiles = totalFiles > FILES_LIMIT;
  const visibleFiles = isFilesExpanded || !hasMoreFiles
    ? (u.files || [])
    : (u.files || []).slice(0, FILES_LIMIT);

  const totalLinks = u.links?.length || 0;
  const groups = groupConsecutiveLinks(u.links || []);
  const hasFirstRowYT = groups[0]?.type === 'youtube-group';

  let hasMoreLinks = false;
  let visibleGroups = groups;

  if (!isLinksExpanded && totalLinks > 0) {
    if (isLargeScreen) {
      if (groups[0]?.type === 'youtube-group' && groups[0]?.items?.length === 2) {
        if (groups.length > 1) {
          hasMoreLinks = true;
          visibleGroups = [groups[0]];
        }
      } else if (groups.length > 1 || (groups[0]?.items?.length || 1) > 1) {
        hasMoreLinks = true;
        visibleGroups = [groups[0]];
      }
    } else {
      if (groups[0]?.type === 'youtube-group') {
        if (groups[0]?.items?.length > 1 || groups.length > 1) {
          hasMoreLinks = true;
          visibleGroups = [{
            type: 'youtube-group',
            items: [groups[0].items[0]],
          }];
        }
      } else if (groups.length > 1) {
        hasMoreLinks = true;
        visibleGroups = [groups[0]];
      }
    }
  }

  const isOwner = Boolean(
    (currentUserId && u.userId && String(currentUserId) === String(u.userId)) ||
    (currentUserUsn && u.usn && currentUserUsn.toLowerCase() === u.usn.toLowerCase())
  );

  return (
    <article
      className="upd-card"
      style={{
        animationDelay: `${(idx % 10) * 25}ms`,
        position: 'relative',
        zIndex: isMenuOpen ? 100 : 1,
      }}
    >
      <div className="upd-card-header">
        <Link href={`/users/${u.usn || ''}`}>
          <img
            src={u.profileUrl || '/default-profile.png'}
            alt={u.name || 'user'}
            className="upd-avatar"
          />
        </Link>
        <div className="upd-user-info">
          <div className="upd-user-top-row">
            <div className="upd-user-name-usn" title={`${u.name || ''}${u.usn ? ` • ${u.usn}` : ''}`}>
              <Link
                href={`/users/${u.usn || ''}`}
                className="upd-user-name-link"
                onMouseEnter={() => userIconRef.current?.startAnimation?.()}
                onMouseLeave={() => userIconRef.current?.stopAnimation?.()}
              >
                <UserIcon ref={userIconRef} className="upd-user-icon" size={14} />
                <span className="upd-user-name-text">{u.name || 'User'}</span>
              </Link>
              {u.usn && (
                <Link href={`/users/${u.usn}`} className="upd-usn-link">
                  • {u.usn}
                </Link>
              )}
            </div>

            <div className="upd-card-header-actions">
              {/* Views badge */}
              <div
                className="upd-header-views-badge"
                title={formatExactViews(u.views ?? 0)}
                onMouseEnter={() => viewsIconRef.current?.startAnimation?.()}
                onMouseLeave={() => viewsIconRef.current?.stopAnimation?.()}
              >
                <EyeIcon ref={viewsIconRef} className="upd-views-icon" size={14} />
                <span className="upd-views-count">{formatViews(u.views ?? 0)}</span>
              </div>

              {/* 3-dots more menu */}
              <div className="upd-more-menu-container" ref={menuRef}>
                <button
                  type="button"
                  className={`upd-more-btn ${isMenuOpen ? 'is-active' : ''}`}
                  title="More options"
                  aria-label="More options"
                  onMouseEnter={() => moreRef.current?.startAnimation?.()}
                  onMouseLeave={() => moreRef.current?.stopAnimation?.()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(!isMenuOpen);
                  }}
                >
                  <EllipsisVerticalIcon ref={moreRef} size={16} />
                </button>
                {isMenuOpen && (
                  <div className="upd-dropdown-menu">
                    {isOwner && (
                      <button
                        type="button"
                        className="upd-dropdown-item"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMenuOpen(false);
                          onOpenEdit(u);
                        }}
                      >
                        <PencilIcon size={14} />
                        <span>Edit update</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="upd-dropdown-item"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMenuOpen(false);
                        onShareUpdate(u._id, u.title || 'Update');
                      }}
                      onMouseEnter={() => shareRef.current?.startAnimation?.()}
                      onMouseLeave={() => shareRef.current?.stopAnimation?.()}
                    >
                      <ShareIcon ref={shareRef} size={14} />
                      <span>Share update</span>
                    </button>
                    <button
                      type="button"
                      className="upd-dropdown-item"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMenuOpen(false);
                        window.open(`/updates/${u._id}`, "_blank", "noopener,noreferrer");
                      }}
                      onMouseEnter={() => externalLinkRef.current?.startAnimation?.()}
                      onMouseLeave={() => externalLinkRef.current?.stopAnimation?.()}
                    >
                      <ExternalLinkIcon ref={externalLinkRef} size={14} />
                      <span>Open in new tab</span>
                    </button>
                    {isOwner && (
                      <button
                        type="button"
                        className="upd-dropdown-item"
                        style={{ color: '#ef4444' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMenuOpen(false);
                          onDeleteRequest(String(u._id), u.title);
                        }}
                      >
                        <Trash2Icon size={14} />
                        <span>Delete update</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="upd-user-sub-row">
            {u.title && (
              <div className="upd-user-title">
                <Link
                  href={`/updates/${u._id}`}
                  className="upd-title-clickable-link"
                  title={`Open update: ${u.title}`}
                >
                  <span>{u.title}</span>
                </Link>
              </div>
            )}
            <div
              className="upd-timestamp"
              onMouseEnter={() => timeIconRef.current?.startAnimation?.()}
              onMouseLeave={() => timeIconRef.current?.stopAnimation?.()}
            >
              <ClockIcon ref={timeIconRef} className="upd-time-icon" size={13} />
              <span>{formatExactTimestamp(u.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      <ExpandableDescription content={u.content} className="upd-content" />

      {/* Links section */}
      {u.links && u.links.length > 0 && (
        <div className="upd-links-section">
          <div className={`upd-links-wrapper ${hasMoreLinks && !isLinksExpanded ? 'is-collapsed' : ''} ${hasFirstRowYT ? 'has-yt-video' : ''}`}>
            <div className="upd-links">
              {visibleGroups.map((group, groupIdx) => {
                if (group.type === 'youtube-group') {
                  if (group.items.length === 2) {
                    return (
                      <div key={groupIdx} className="upd-youtube-grid-2">
                        {group.items.map((item, itemIdx) => (
                          <YouTubeEmbed
                            key={itemIdx}
                            ytId={item.ytId}
                            wrapperClass="upd-youtube-embed-wrapper upd-youtube-grid-item"
                            iframeClass="upd-youtube-iframe"
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
                      wrapperClass="upd-youtube-embed-wrapper"
                      iframeClass="upd-youtube-iframe"
                    />
                  );
                }

                if (group.type === 'internal') {
                  return (
                    <Link key={groupIdx} href={group.raw} className="upd-link upd-link-internal">
                      <span>Visit</span>
                      <FiChevronRight className="upd-link-icon" />
                    </Link>
                  );
                }
                return <LinkPreview key={groupIdx} url={group.raw} />;
              })}
            </div>

            {hasMoreLinks && !isLinksExpanded && (
              <div className="upd-items-fade">
                <button
                  type="button"
                  className="upd-toggle-items-btn"
                  onClick={() => setIsLinksExpanded(true)}
                >
                  <span>View all links</span>
                  <FiChevronDown className="upd-toggle-items-btn-icon" />
                </button>
              </div>
            )}
          </div>

          {hasMoreLinks && isLinksExpanded && (
            <div className="upd-items-collapse-wrapper">
              <button
                type="button"
                className="upd-toggle-items-btn upd-toggle-items-btn-collapse"
                onClick={() => setIsLinksExpanded(false)}
              >
                <span>Show less links</span>
                <FiChevronUp className="upd-toggle-items-btn-icon" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Files section */}
      {u.files && u.files.length > 0 && (
        <div className="upd-files">
          <div className="upd-files-label">Attachments</div>
          <div className={`upd-files-wrapper ${hasMoreFiles && !isFilesExpanded ? 'is-collapsed' : ''}`}>
            <div className="upd-files-list">
              {visibleFiles.map((f, i) => {
                const url = f.url || f;
                const name = f.name || url.split('/').pop();
                const viewUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;

                let downloadUrl = url;
                const isPdf = isPdfFile(f, name);
                const actualPdfName = isPdf ? getPdfDownloadName(f, name, u?.title) : name;
                if (isPdf) {
                  downloadUrl = getPdfDownloadUrl(url, actualPdfName, u?.title);
                }

                return (
                  <div
                    key={i}
                    className="upd-file-card"
                    onClick={() => window.open(viewUrl, '_blank', 'noopener,noreferrer')}
                  >
                    <div className="upd-file-card-name" title={`View ${name}`}>
                      <FileIcon filename={name || url} />
                      <span className="upd-file-card-label">{name}</span>
                    </div>
                    <div className="upd-file-card-actions" onClick={(e) => e.stopPropagation()}>
                      <a href={viewUrl} target="_blank" rel="noreferrer noopener" className="upd-file-action-btn upd-file-action-view" title="View">
                        <EyeIcon size={14} />
                      </a>
                      <a
                        href={downloadUrl}
                        download={isPdf ? actualPdfName : name}
                        target={isPdf ? undefined : "_blank"}
                        rel="noreferrer noopener"
                        className="upd-file-action-btn upd-file-action-download"
                        title={`Download ${isPdf ? actualPdfName : name}`}
                        onClick={isPdf ? (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          downloadPdfFile(url, actualPdfName, u?.title);
                        } : undefined}
                      >
                        <DownloadIcon size={14} />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {hasMoreFiles && !isFilesExpanded && (
              <div className="upd-items-fade">
                <button
                  type="button"
                  className="upd-toggle-items-btn"
                  onClick={() => setIsFilesExpanded(true)}
                >
                  <span>View all attachments</span>
                  <FiChevronDown className="upd-toggle-items-btn-icon" />
                </button>
              </div>
            )}
          </div>

          {hasMoreFiles && isFilesExpanded && (
            <div className="upd-items-collapse-wrapper">
              <button
                type="button"
                className="upd-toggle-items-btn upd-toggle-items-btn-collapse"
                onClick={() => setIsFilesExpanded(false)}
              >
                <span>Show less attachments</span>
                <FiChevronUp className="upd-toggle-items-btn-icon" />
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export default function UpdatesList({ refreshKey, searchQuery = "", onClearSearch }) {
  const [updates, setUpdates] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserUsn, setCurrentUserUsn] = useState(null);
  const [toast, setToast] = useState(null);
  const pendingRef = useRef({});

  // Modal states
  const [deleteModal, setDeleteModal] = useState(null);
  const [editingUpdate, setEditingUpdate] = useState(null);

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
    setCurrentUserUsn(usn);

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

  const toastTimeoutRef = useRef(null);
  const showToast = (message, type = 'info') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3500);
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

  const handleShareUpdate = (updateId, updateTitle) => {
    const shareUrl = `${window.location.origin}/updates/${updateId}`;
    if (navigator.share) {
      navigator.share({
        title: updateTitle || 'Campus Update',
        text: `Check out this update: ${updateTitle}`,
        url: shareUrl,
      }).catch((err) => {
        if (err.name !== 'AbortError') {
          navigator.clipboard.writeText(shareUrl);
          showToast('Link copied to clipboard!', 'success');
        }
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      showToast('Link copied to clipboard!', 'success');
    }
  };

  const handleUpdateSaved = (updatedItem) => {
    setUpdates((prev) =>
      prev.map((it) => (it._id === updatedItem._id ? { ...it, ...updatedItem } : it))
    );
    showToast('Update saved successfully', 'success');
  };

  const UpdateSkeleton = () => (
    <div className="upd-card upl-skeleton">
      <div className="upd-card-header">
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

      {/* Apple-styled Edit Update Modal */}
      {editingUpdate && (
        <EditUpdateModal
          update={editingUpdate}
          currentUserId={currentUserId}
          onClose={() => setEditingUpdate(null)}
          onUpdateSaved={handleUpdateSaved}
        />
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
        {updates.map((u, idx) => (
          <MyUpdateCard
            key={u._id}
            update={u}
            idx={idx}
            currentUserId={currentUserId}
            currentUserUsn={currentUserUsn}
            onOpenEdit={(update) => setEditingUpdate(update)}
            onDeleteRequest={(id, title) => openDeleteModal(id, title)}
            onShareUpdate={handleShareUpdate}
          />
        ))}
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
