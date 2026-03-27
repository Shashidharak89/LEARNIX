"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiChevronRight, FiClock, FiDownload, FiEye, FiExternalLink } from "react-icons/fi";
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
                  <p className="wup-item-title">{update.title || "Update"}</p>
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
                        <div key={`${String(update._id)}-file-${fileIndex}`} className="wup-file-row">
                          <a
                            href={fileViewUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="wup-file-name"
                            title={`Open ${fileName}`}
                          >
                            {fileName}
                          </a>
                          <div className="wup-file-actions">
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
                    {update.links.slice(0, 1).map((rawLink, index) => {
                      const value = String(rawLink || "").trim();
                      if (!value) return null;
                      const internal = value.startsWith("/");
                      if (internal) {
                        return (
                          <Link key={index} href={value} className="wup-link-item">
                            Open link <FiExternalLink />
                          </Link>
                        );
                      }
                      const href = /^https?:\/\//i.test(value) ? value : `https://${value}`;
                      return (
                        <a key={index} href={href} target="_blank" rel="noreferrer noopener" className="wup-link-item">
                          Open link <FiExternalLink />
                        </a>
                      );
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
