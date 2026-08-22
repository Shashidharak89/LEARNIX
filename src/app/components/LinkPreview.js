"use client";

import { useEffect, useState } from "react";
import { FiExternalLink, FiGlobe, FiFileText, FiImage, FiHardDrive, FiAlertCircle } from "react-icons/fi";
import "./styles/LinkPreview.css";

const previewCache = new Map();

export default function LinkPreview({ url, className = "" }) {
  const [preview, setPreview] = useState(() => previewCache.get(url) || null);
  const [loading, setLoading] = useState(!previewCache.has(url));
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!url) return;
    if (previewCache.has(url)) {
      setPreview(previewCache.get(url));
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(false);

    fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load preview");
        return res.json();
      })
      .then((data) => {
        if (isMounted && data.success && data.preview) {
          previewCache.set(url, data.preview);
          setPreview(data.preview);
        } else if (isMounted) {
          setError(true);
        }
      })
      .catch(() => {
        if (isMounted) setError(true);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [url]);

  if (!url) return null;

  // Loading Skeleton
  if (loading) {
    return (
      <div className={`lnk-preview-card lnk-preview-skeleton ${className}`}>
        <div className="lnk-skeleton-thumb"></div>
        <div className="lnk-skeleton-body">
          <div className="lnk-skeleton-line lnk-skeleton-title"></div>
          <div className="lnk-skeleton-line lnk-skeleton-desc"></div>
          <div className="lnk-skeleton-line lnk-skeleton-meta"></div>
        </div>
      </div>
    );
  }

  // Fallback if preview API failed
  if (error || !preview) {
    const cleanUrl = String(url).trim();
    const hasScheme = /^https?:\/\//i.test(cleanUrl) || /^mailto:/i.test(cleanUrl);
    const href = hasScheme ? cleanUrl : `https://${cleanUrl}`;

    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className={`lnk-preview-fallback ${className}`}
      >
        <FiGlobe className="lnk-fallback-icon" />
        <span className="lnk-fallback-url">{cleanUrl}</span>
        <FiExternalLink className="lnk-fallback-ext" />
      </a>
    );
  }

  // Get Provider Icon based on normalized type
  const renderProviderIcon = () => {
    switch (preview.type) {
      case "google-drive":
        return <FiHardDrive className="lnk-type-icon lnk-icon-drive" />;
      case "image":
        return <FiImage className="lnk-type-icon lnk-icon-image" />;
      case "document":
        return <FiFileText className="lnk-type-icon lnk-icon-doc" />;
      default:
        return <FiGlobe className="lnk-type-icon lnk-icon-web" />;
    }
  };

  const targetHref = preview.canonicalUrl || preview.url || url;

  return (
    <a
      href={targetHref}
      target="_blank"
      rel="noreferrer noopener"
      className={`lnk-preview-card ${preview.image ? "lnk-has-image" : "lnk-no-image"} ${className}`}
    >
      {preview.image && (
        <div className="lnk-preview-image-wrap">
          <img
            src={preview.image}
            alt={preview.title || "Preview"}
            className="lnk-preview-image"
            onError={(e) => {
              // Hide image if failed to load
              e.currentTarget.parentElement.style.display = "none";
            }}
          />
        </div>
      )}

      <div className="lnk-preview-body">
        <div className="lnk-preview-domain-row">
          {renderProviderIcon()}
          <span className="lnk-preview-site">{preview.siteName || preview.domain}</span>
          <span className="lnk-preview-domain">• {preview.domain}</span>
        </div>

        <h4 className="lnk-preview-title">{preview.title || preview.domain}</h4>

        {preview.description && (
          <p className="lnk-preview-desc">{preview.description}</p>
        )}

        <div className="lnk-preview-footer">
          <span className="lnk-preview-visit">Visit link</span>
          <FiExternalLink className="lnk-preview-ext-icon" />
        </div>
      </div>
    </a>
  );
}
