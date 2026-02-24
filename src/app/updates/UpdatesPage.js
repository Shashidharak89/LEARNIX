"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '../components/Navbar';
import { FiClock, FiUser, FiExternalLink, FiChevronRight } from 'react-icons/fi';
import './styles/Updates.css';

export default function UpdatesPage() {
  const [updates, setUpdates] = useState([]);
  const [pageIndex, setPageIndex] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchUpdates = async (index = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/updates?index=${index}`);
      if (!res.ok) throw new Error('Failed to fetch updates');
      const data = await res.json();
      if (Array.isArray(data.updates)) {
        if (index === 1) setUpdates(data.updates);
        else setUpdates(prev => [...prev, ...data.updates]);
        setHasMore(data.updates.length === 10);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUpdates(1);
  }, []);

  const formatRelativeTime = (iso) => {
    try {
      const then = new Date(iso);
      const now = new Date();
      const diffSec = Math.floor((now - then) / 1000);
      if (diffSec < 60) {
        return `${diffSec} second${diffSec === 1 ? '' : 's'} ago`;
      }
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) {
        return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
      }
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) {
        return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
      }
      // older than 24 hours -> show locale string
      return then.toLocaleString();
    } catch (e) {
      return iso;
    }
  };

  const loadMore = () => {
    const next = pageIndex + 1;
    setPageIndex(next);
    fetchUpdates(next);
  };

  // Skeleton loader component
  const UpdateSkeleton = () => (
    <div className="upd-card upd-skeleton">
      <div className="upd-card-header">
        <div className="upd-skeleton-avatar"></div>
        <div className="upd-skeleton-text-group">
          <div className="upd-skeleton-line upd-skeleton-name"></div>
          <div className="upd-skeleton-line upd-skeleton-title"></div>
        </div>
      </div>
      <div className="upd-skeleton-content">
        <div className="upd-skeleton-line upd-skeleton-text"></div>
        <div className="upd-skeleton-line upd-skeleton-text upd-skeleton-text-short"></div>
      </div>
    </div>
  );

  return (
    <>
      <div className="upd-page-container">
        <main className="upd-main">
          {/* Page Title */}
          <div className="upd-intro-card">
            <h1 className="upd-title">Updates</h1>
            <p className="upd-subtitle">Recent activity: subjects and public topics created by users.</p>
          </div>

          {/* Updates List */}
          <div className="upd-list">
            {/* Empty State */}
            {updates.length === 0 && !loading && (
              <div className="upd-empty-state">
                <FiClock className="upd-empty-icon" />
                <p className="upd-empty-text">No updates yet.</p>
              </div>
            )}

            {/* Skeleton Loading */}
            {loading && pageIndex === 1 && (
              <>
                <UpdateSkeleton />
                <UpdateSkeleton />
                <UpdateSkeleton />
              </>
            )}

            {/* Update Cards */}
            {updates.map((u, idx) => (
              <div key={u._id} className="upd-card" style={{ animationDelay: `${idx * 50}ms` }}>
                <div className="upd-card-header">
                  <img 
                    src={u.profileUrl || '/default-profile.png'} 
                    alt={u.name || 'user'} 
                    className="upd-avatar"
                  />
                  <div className="upd-user-info">
                    <div className="upd-user-name">
                      <FiUser className="upd-user-icon" />
                      <span>{u.name}</span>
                      <span className="upd-usn">• {u.usn}</span>
                    </div>
                    <div className="upd-user-title">{u.title}</div>
                  </div>
                  <div className="upd-timestamp">
                    <FiClock className="upd-time-icon" />
                    {formatRelativeTime(u.createdAt)}
                  </div>
                </div>

                {u.content && (
                  <p className="upd-content">{u.content}</p>
                )}

                {u.links && u.links.length > 0 && (
                  <div className="upd-links">
                    {u.links.map((l, i) => {
                      const raw = String(l || '').trim();
                      if (!raw) return null;
                      
                      const isInternal = raw.startsWith('/');
                      
                      if (isInternal) {
                        return (
                          <Link key={i} href={raw} className="upd-link upd-link-internal">
                            <span>Visit</span>
                            <FiChevronRight className="upd-link-icon" />
                          </Link>
                        );
                      }

                      const hasScheme = /^https?:\/\//i.test(raw) || /^mailto:/i.test(raw);
                      const href = hasScheme ? raw : `https://${raw}`;

                      return (
                        <a 
                          key={i} 
                          href={href} 
                          target="_blank" 
                          rel="noreferrer noopener" 
                          className="upd-link upd-link-external"
                        >
                          <span>{raw}</span>
                          <FiExternalLink className="upd-link-icon" />
                        </a>
                      );
                    })}
                  </div>
                )}

                {u.files && u.files.length > 0 && (
                  <div className="upd-files">
                    {u.files.map((f, i) => {
                      const url = f.url || f;
                      const name = f.name || url.split('/').pop();
                      const isImage = (f.resourceType === 'image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                      if (isImage) {
                        return (
                          <a key={i} href={url} target="_blank" rel="noreferrer noopener" className="upd-file-thumb">
                            <img src={url} alt={name} loading="lazy" />
                          </a>
                        );
                      }
                      return (
                        <a key={i} href={url} target="_blank" rel="noreferrer noopener" className="upd-file-link">
                          {name}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {/* Load More Button */}
            {hasMore && updates.length > 0 && (
              <div className="upd-load-more-container">
                <button 
                  className="upd-load-more-btn" 
                  onClick={loadMore} 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="upd-spinner"></span>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <span>Load More</span>
                      <FiChevronRight className="upd-btn-icon" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}