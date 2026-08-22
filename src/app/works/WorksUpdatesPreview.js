"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiChevronRight, FiClock, FiDownload, FiEye, FiExternalLink } from "react-icons/fi";
import { getYouTubeVideoId } from "../utils/youtube";
import LinkPreview from "../components/LinkPreview";
import FileIcon from "../components/FileIcon";
import "./styles/WorksUpdatesPreview.css";

const formatTime = (isoTime) => {
  try {
    const date = new Date(isoTime);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

export default function WorksUpdatesPreview() {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUpdatesPreview = async () => {
      try {
        const response = await fetch("/api/updates/preview");
        if (!response.ok) throw new Error("Failed to load updates preview");
        const data = await response.json();
        setUpdates(Array.isArray(data?.updates) ? data.updates : []);
      } catch (error) {
        console.error("Failed to fetch updates preview:", error);
        setUpdates([]);
      } finally {
        setLoading(false);
      }
    };

    loadUpdatesPreview();
  }, []);

  return (
    <section className="wup-wrap" aria-label="Latest updates preview">
      <div className="wup-header">
        <h3 className="wup-title">UPDATES</h3>
      </div>

      {loading ? (
        <div className="wup-loading">Loading latest updates...</div>
      ) : updates.length === 0 ? (
        <div className="wup-empty">No updates yet.</div>
      ) : (
        <div className="wup-list">
          {updates.slice(0, 3).map((update) => {
            const files = Array.isArray(update.files) ? update.files : [];

            return (
              <article key={String(update._id)} className="wup-item">
                <div className="wup-item-top">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <p className="wup-item-title">{update.title || "Update"}</p>
                    <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '10px', background: update.visibility === 'private' ? '#fef2f2' : update.visibility === 'unlisted' ? '#fffbe6' : '#eff6ff', color: update.visibility === 'private' ? '#ef4444' : update.visibility === 'unlisted' ? '#d97706' : '#2563eb', fontWeight: 600, border: `1px solid ${update.visibility === 'private' ? '#fecaca' : update.visibility === 'unlisted' ? '#fef08a' : '#bfdbfe'}` }}>
                      {update.visibility === 'private' ? '🔒 Private' : update.visibility === 'unlisted' ? '🔗 Unlisted' : '🌐 Public'}
                    </span>
                  </div>
                  <span className="wup-time">
                    <FiClock />
                    {formatTime(update.createdAt)}
                  </span>
                </div>

                {update.content ? <p className="wup-content">{update.content}</p> : null}

                {files.length > 0 ? (
                  <div className="wup-files-list">
                    {files.map((fileItem, fileIndex) => {
                      const fileUrl = fileItem?.url || fileItem;
                      if (!fileUrl) return null;

                      const fileName = fileItem?.name || String(fileUrl).split("/").pop() || "Open file";
                      const fileViewUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(fileUrl)}`;

                      return (
                        <div
                          key={`${String(update._id)}-file-${fileIndex}`}
                          className="wup-file-row"
                          onClick={() => window.open(fileViewUrl, '_blank', 'noopener,noreferrer')}
                        >
                          <div className="wup-file-name" title={`Open ${fileName}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <FileIcon filename={fileName || fileUrl} />
                            <span>{fileName}</span>
                          </div>
                          <div className="wup-file-actions" onClick={(e) => e.stopPropagation()}>
                            <a
                              href={fileViewUrl}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="wup-file-btn"
                              title="View"
                              aria-label="View file"
                            >
                              <FiEye />
                            </a>
                            <a
                              href={fileUrl}
                              download={fileName || "file"}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="wup-file-btn"
                              title="Download"
                              aria-label="Download file"
                            >
                              <FiDownload />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : update.links?.length ? (
                  <div className="wup-link-row">
                    {update.links.map((rawLink, index) => {
                      const value = String(rawLink || "").trim();
                      if (!value) return null;
                      const ytId = getYouTubeVideoId(value);
                      if (ytId) {
                        return (
                          <div key={index} className="wup-youtube-embed-wrapper">
                            <iframe
                              className="wup-youtube-iframe"
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
                      const internal = value.startsWith("/");
                      if (internal) {
                        return (
                          <Link key={index} href={value} className="wup-link-item">
                            Open link <FiExternalLink />
                          </Link>
                        );
                      }
                      return <LinkPreview key={index} url={value} />;
                    })}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      <div className="wup-more-wrap">
        <Link href="/updates" className="wup-more-btn">
          <span>View more</span>
          <FiChevronRight className="wup-more-icon" />
        </Link>
      </div>
    </section>
  );
}
