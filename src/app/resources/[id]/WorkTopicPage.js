"use client";

/* global URLSearchParams */

import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { FaListOl } from "react-icons/fa";
import { FiPlus, FiMinus, FiMaximize2 } from "react-icons/fi";
import {
  ArrowLeftIcon,
  DownloadIcon,
  ShareIcon,
  BookmarkIcon,
  ChevronDownIcon,
  ClockIcon,
  EyeIcon,
  ImageIcon,
  ContactRoundIcon,
  BookOpenIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XIcon,
  SparklesIcon,
  RefreshCwIcon,
  FileTextIcon,
} from "@animateicons/react/lucide";
import TopicReviews from "./TopicReviews";
import Ads from "../../components/ads/Ads";
import { toggleLearnLaterClient, checkLearnLaterStatusClient } from "@/lib/clientLearnLater";
import ImageLoader from "../../components/ImageLoader";
import OpenInApp from "./OpenInApp";
import "./styles/WorkTopicPage.css";

function normalizeResourceType(type, sourceFile) {
  if (type === "resource" || type === "work") return "resource";
  if (type === "study_material" || type === "sm") return "study_material";
  if (type === "question_paper" || type === "qp") return "question_paper";
  if (type === "update") return "update";
  if (sourceFile) {
    if (sourceFile.includes("work") || sourceFile.includes("resource")) return "resource";
    if (sourceFile.includes("sm") || sourceFile.includes("study")) return "study_material";
    if (sourceFile.includes("qp") || sourceFile.includes("question")) return "question_paper";
    if (sourceFile.includes("update")) return "update";
  }
  return "resource";
}

function getRecItemHref(item) {
  const normType = normalizeResourceType(item.resource_type, item.source_file);
  const cleanId = item.resource_id ? String(item.resource_id).replace(/^["']|["']$/g, "").trim() : "";

  if (normType === "resource") {
    if (cleanId) {
      if (cleanId.startsWith("sub-only-")) {
        return `/resources/subject/${cleanId.replace("sub-only-", "")}`;
      }
      return `/resources/${cleanId}`;
    }
    return item.resource_url || "/resources";
  }

  if (normType === "update") {
    return cleanId ? `/updates/${cleanId}` : item.resource_url || "/updates";
  }

  if (normType === "study_material") {
    if (item.resource_url) return item.resource_url;
    return item.subject_name ? `/materials?q=${encodeURIComponent(item.subject_name)}` : "/materials";
  }

  if (normType === "question_paper") {
    return cleanId ? `/qp/${cleanId}` : "/qp";
  }

  return item.resource_url || (cleanId ? `/resources/${cleanId}` : "/resources");
}

// Skeleton Components
const UserProfileSkeleton = () => (
  <div className="wtpc-user-section wtpc-skeleton-container">
    <div className="wtpc-user-avatar">
      <div className="wtpc-skeleton-avatar"></div>
    </div>
    <div className="wtpc-user-info">
      <div className="wtpc-skeleton-user-name"></div>
      <div className="wtpc-user-details">
        <div className="wtpc-detail-item wtpc-skeleton-detail">
          <ContactRoundIcon className="wtpc-detail-icon wtpc-skeleton-icon" size={16} />
          <div className="wtpc-skeleton-text"></div>
        </div>
        <div className="wtpc-detail-item wtpc-skeleton-detail">
          <BookOpenIcon className="wtpc-detail-icon wtpc-skeleton-icon" size={16} />
          <div className="wtpc-skeleton-text"></div>
        </div>
      </div>
    </div>
  </div>
);

const ActionButtonsSkeleton = () => (
  <div className="wtpc-action-buttons-container wtpc-skeleton-container">
    <div className="wtpc-action-btn wtpc-back-btn wtpc-skeleton-btn">
      <ArrowLeftIcon className="wtpc-skeleton-icon" size={16} />
      <span className="wtpc-btn-text wtpc-skeleton-btn-text">Back</span>
    </div>
    <div className="wtpc-action-btn wtpc-download-btn wtpc-skeleton-btn">
      <DownloadIcon className="wtpc-skeleton-icon" size={16} />
      <span className="wtpc-btn-text wtpc-skeleton-btn-text">Download</span>
    </div>
    <div className="wtpc-action-btn wtpc-share-btn wtpc-skeleton-btn">
      <ShareIcon className="wtpc-skeleton-icon" size={16} />
      <span className="wtpc-btn-text wtpc-skeleton-btn-text">Share</span>
    </div>
  </div>
);

const TopicContentSkeleton = () => (
  <div className="wtpc-topic-section wtpc-skeleton-container">
    <div className="wtpc-topic-header">
      <div className="wtpc-skeleton-topic-title"></div>
      <div className="wtpc-topic-meta">
        <div className="wtpc-meta-item wtpc-skeleton-meta">
          <ClockIcon className="wtpc-meta-icon wtpc-skeleton-icon" size={16} />
          <div className="wtpc-skeleton-text-small"></div>
        </div>
      </div>
    </div>
    
    <div className="wtpc-topic-content wtpc-skeleton-content-box">
      <h3 className="wtpc-skeleton-content-heading">Description</h3>
      <div className="wtpc-skeleton-content-lines">
        <div className="wtpc-skeleton-line"></div>
        <div className="wtpc-skeleton-line"></div>
        <div className="wtpc-skeleton-line wtpc-skeleton-line-short"></div>
      </div>
    </div>

    <div className="wtpc-images-section">
      <div className="wtpc-images-header">
        <h3>
          <ImageIcon className="wtpc-section-icon wtpc-skeleton-icon" size={16} />
          <span className="wtpc-skeleton-images-title"></span>
        </h3>
      </div>
      <div className="wtpc-images-grid">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="wtpc-image-container wtpc-skeleton-image-container">
            <div className="wtpc-image-wrapper">
              <div className="wtpc-skeleton-image"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Main Loading Skeleton (shows when wrapper is loading)
const FullPageSkeleton = () => (
  <div className="wtpc-container">
    <div className="wtpc-main-content">
      <UserProfileSkeleton />
      <ActionButtonsSkeleton />
      <TopicContentSkeleton />
    </div>
    <div className="wtpc-footer">
      <p>&copy; 2025 Work Topic Page. All rights reserved.</p>
    </div>
  </div>
);

/* ── Enhanced Fullscreen Lightbox with Zoom Controls ── */
const WtpcLightbox = ({ images, startIndex, onClose, topicTitle }) => {
  const [idx, setIdx] = useState(startIndex);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const closeRef = useRef(null);
  const refreshRef = useRef(null);

  const resetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setIsDragging(false);
  }, []);

  const handleZoomIn = (e) => {
    e?.stopPropagation?.();
    setZoom((z) => Math.min(4, +(z + 0.35).toFixed(2)));
  };

  const handleZoomOut = (e) => {
    e?.stopPropagation?.();
    setZoom((z) => {
      const next = Math.max(0.75, +(z - 0.35).toFixed(2));
      if (next <= 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const prev = useCallback(() => {
    setIdx((i) => (i - 1 + images.length) % images.length);
    resetZoom();
  }, [images.length, resetZoom]);

  const next = useCallback(() => {
    setIdx((i) => (i + 1) % images.length);
    resetZoom();
  }, [images.length, resetZoom]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "+" || e.key === "=") handleZoomIn();
      if (e.key === "-" || e.key === "_") handleZoomOut();
      if (e.key === "0") resetZoom();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prev, next, onClose, resetZoom]);

  const handlePointerDown = (e) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging || zoom <= 1) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy,
    });
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch {}
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (zoom > 1) {
      resetZoom();
    } else {
      setZoom(2);
    }
  };

  return (
    <div className="wtpc-lb-overlay" onClick={onClose} role="dialog" aria-modal="true">
      {/* Top Header Bar */}
      <div className="wtpc-lb-header" onClick={(e) => e.stopPropagation()}>
        <div className="wtpc-lb-title-wrap">
          <span className="wtpc-lb-title-text">{topicTitle || "Resource Slideshow"}</span>
          <span className="wtpc-lb-badge">Page {idx + 1} of {images.length}</span>
        </div>
        <button
          className="wtpc-lb-close"
          onClick={onClose}
          aria-label="Close fullscreen view"
          title="Close (Esc)"
          onMouseEnter={() => closeRef.current?.startAnimation?.()}
          onMouseLeave={() => closeRef.current?.stopAnimation?.()}
        >
          <XIcon ref={closeRef} size={22} />
        </button>
      </div>

      {/* Nav Previous */}
      {images.length > 1 && (
        <button
          className="wtpc-lb-nav wtpc-lb-prev"
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
          aria-label="Previous image"
          title="Previous (Left Arrow)"
          onMouseEnter={() => prevRef.current?.startAnimation?.()}
          onMouseLeave={() => prevRef.current?.stopAnimation?.()}
        >
          <ChevronLeftIcon ref={prevRef} size={30} />
        </button>
      )}

      {/* Main Image Viewport with pan & zoom */}
      <div
        className={`wtpc-lb-img-wrap ${zoom > 1 ? "is-zoomed" : ""}`}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        style={{
          cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in",
        }}
        title={zoom > 1 ? "Drag to pan image • Double-click to reset" : "Double-click to zoom in • Click + / - below"}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[idx]}
          alt={`Page ${idx + 1}`}
          className="wtpc-lb-img"
          draggable={false}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transition: isDragging ? "none" : "transform 0.2s cubic-bezier(0.2, 0, 0, 1)",
          }}
        />
      </div>

      {/* Nav Next */}
      {images.length > 1 && (
        <button
          className="wtpc-lb-nav wtpc-lb-next"
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
          aria-label="Next image"
          title="Next (Right Arrow)"
          onMouseEnter={() => nextRef.current?.startAnimation?.()}
          onMouseLeave={() => nextRef.current?.stopAnimation?.()}
        >
          <ChevronRightIcon ref={nextRef} size={30} />
        </button>
      )}

      {/* Bottom Floating Control Bar with + and - zoom buttons */}
      <div className="wtpc-lb-toolbar" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="wtpc-lb-tool-btn"
          onClick={handleZoomOut}
          disabled={zoom <= 0.75}
          title="Zoom out (-)"
          aria-label="Zoom out"
        >
          <FiMinus size={18} />
        </button>

        <button
          type="button"
          className="wtpc-lb-zoom-badge"
          onClick={resetZoom}
          title="Click to reset zoom to 100%"
          aria-label="Reset zoom"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          type="button"
          className="wtpc-lb-tool-btn"
          onClick={handleZoomIn}
          disabled={zoom >= 4}
          title="Zoom in (+)"
          aria-label="Zoom in"
        >
          <FiPlus size={18} />
        </button>

        <button
          type="button"
          className="wtpc-lb-tool-btn"
          onClick={resetZoom}
          title="Reset zoom to 100%"
          aria-label="Reset zoom"
          onMouseEnter={() => refreshRef.current?.startAnimation?.()}
          onMouseLeave={() => refreshRef.current?.stopAnimation?.()}
        >
          <RefreshCwIcon ref={refreshRef} size={15} />
        </button>

        <div className="wtpc-lb-divider" />

        <div className="wtpc-lb-page-info">
          Page {idx + 1} / {images.length}
        </div>
      </div>
    </div>
  );
};

/* ── AI Suggestions Section (Top 3 relevant resources based on subject & topic) ── */
const AiRecommendationsSection = ({ topic, subject, currentId }) => {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const sparkleRef = useRef(null);

  useEffect(() => {
    if (!topic?.topic || !subject?.subject) return;

    let isMounted = true;
    const fetchRecs = async () => {
      setLoading(true);
      try {
        const combinedQuery = [topic.topic, subject.subject].filter(Boolean).join(" ").trim();
        const res = await fetch("/api/ai-recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: combinedQuery.slice(0, 300), limit: 6 }),
        });
        if (!res.ok) throw new Error("AI recommendations fetch failed");
        const json = await res.json();
        if (isMounted) {
          const cleanCurId = String(currentId || topic._id || "").replace(/^["']|["']$/g, "").trim();
          const filtered = (json.results || []).filter((item) => {
            const itemCleanId = item.resource_id ? String(item.resource_id).replace(/^["']|["']$/g, "").trim() : "";
            return itemCleanId && itemCleanId !== cleanCurId;
          });
          setRecommendations(filtered.slice(0, 3));
        }
      } catch (err) {
        console.error("AI recommendations error:", err);
        if (isMounted) setRecommendations([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRecs();

    return () => {
      isMounted = false;
    };
  }, [topic?.topic, subject?.subject, currentId]);

  if (!loading && (!recommendations || recommendations.length === 0)) {
    return null;
  }

  return (
    <div className="wtpc-ai-section">
      <div className="wtpc-ai-header">
        <div
          className="wtpc-ai-title-wrap"
          onMouseEnter={() => sparkleRef.current?.startAnimation?.()}
          onMouseLeave={() => sparkleRef.current?.stopAnimation?.()}
        >
          <div className="wtpc-ai-icon-bubble">
            <SparklesIcon ref={sparkleRef} size={18} className="wtpc-ai-sparkle-icon" />
          </div>
          <div>
            <h3 className="wtpc-ai-title">AI Suggested Resources</h3>
            <p className="wtpc-ai-subtitle">
              Relevant study materials &amp; topics matching <strong>{subject.subject}</strong>: {topic.topic}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="wtpc-ai-grid">
          {[1, 2, 3].map((k) => (
            <div key={k} className="wtpc-ai-card wtpc-ai-skeleton-card">
              <div className="wtpc-ai-skel-pill" />
              <div className="wtpc-ai-skel-title" />
              <div className="wtpc-ai-skel-meta" />
            </div>
          ))}
        </div>
      ) : (
        <div className="wtpc-ai-grid">
          {recommendations.map((item, idx) => {
            const normType = normalizeResourceType(item.resource_type, item.source_file);
            const isStudyMaterial = normType === "study_material";
            const isQuestionPaper = normType === "question_paper";
            const href = getRecItemHref(item);
            const similarityPercent = item.similarity ? Math.round(item.similarity * 100) : null;

            return (
              <a
                key={item.resource_id || `rec-${idx}`}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="wtpc-ai-card"
                title={`Open "${item.title}" in new tab`}
              >
                <div className="wtpc-ai-card-top">
                  <span className={`wtpc-ai-type-pill wtpc-ai-pill-${normType}`}>
                    {isStudyMaterial ? (
                      <FileTextIcon size={13} />
                    ) : isQuestionPaper ? (
                      <FileTextIcon size={13} />
                    ) : (
                      <BookOpenIcon size={13} />
                    )}
                    <span>
                      {isStudyMaterial
                        ? "Study Material"
                        : isQuestionPaper
                        ? "Question Paper"
                        : "Resource Topic"}
                    </span>
                  </span>
                  {similarityPercent && (
                    <span className="wtpc-ai-match-badge">
                      {similarityPercent}% match
                    </span>
                  )}
                </div>

                <h4 className="wtpc-ai-card-title">{item.title}</h4>

                {(item.subject_name || item.course_name || item.semester_number) && (
                  <div className="wtpc-ai-card-meta">
                    {item.subject_name && (
                      <span className="wtpc-ai-meta-tag">{item.subject_name}</span>
                    )}
                    {item.semester_number && (
                      <span className="wtpc-ai-meta-tag">Sem {item.semester_number}</span>
                    )}
                    {item.course_name && (
                      <span className="wtpc-ai-meta-tag">{item.course_name}</span>
                    )}
                  </div>
                )}

                <div className="wtpc-ai-card-action">
                  <span>Explore Resource</span>
                  <ChevronRightIcon size={15} />
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
};

const WorkTopicPage = ({ data, loading, error, onDownload, onShare, topicId, usingCachedData, isAndroid }) => {
  const [expandedImages, setExpandedImages] = useState({});
  const [showPageNumbers, setShowPageNumbers] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null); // lightbox
  const [rangeModalOpen, setRangeModalOpen] = useState(false);
  const [allPages, setAllPages] = useState(true);
  const [customMode, setCustomMode] = useState(false);
  const [selectedPages, setSelectedPages] = useState([]);
  const [visiblePageCount, setVisiblePageCount] = useState(10);
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(1);
  const [isSavedInLearnLater, setIsSavedInLearnLater] = useState(false);
  const [isLearnLaterLoading, setIsLearnLaterLoading] = useState(false);

  const usnRef = useRef(null);
  const subjectRef = useRef(null);
  const backBtnRef = useRef(null);
  const downloadBtnRef = useRef(null);
  const shareBtnRef = useRef(null);
  const learnLaterBtnRef = useRef(null);
  const clockRef = useRef(null);
  const viewsRef = useRef(null);
  const imageHeaderRef = useRef(null);
  const slideshowRef = useRef(null);
  const modalDownloadRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    if (topicId) {
      checkLearnLaterStatusClient([{ type: "resource", targetId: topicId }])
        .then((res) => {
          if (mounted && res && res[`resource:${topicId}`]) {
            setIsSavedInLearnLater(true);
          }
        })
        .catch(() => {});
    }
    return () => {
      mounted = false;
    };
  }, [topicId]);

  useEffect(() => {
    const handleUpdate = (e) => {
      if (e.detail?.item?.targetId === topicId || e.detail?.itemId === `resource:${topicId}`) {
        if (e.detail?.isSaved !== undefined) {
          setIsSavedInLearnLater(e.detail.isSaved);
        }
      }
    };
    window.addEventListener("learnix:learn-later-updated", handleUpdate);
    return () => window.removeEventListener("learnix:learn-later-updated", handleUpdate);
  }, [topicId]);

  const rawImages = Array.isArray(data?.topic?.images) ? data.topic.images : [];
  const validImages = rawImages.filter((img) => img && img.trim() !== "");
  const hasImages = validImages.length > 0;

  const handleToggleLearnLater = async () => {
    if (!data?.topic || isLearnLaterLoading) return;
    setIsLearnLaterLoading(true);
    try {
      const res = await toggleLearnLaterClient({
        type: 'resource',
        targetId: topicId,
        title: data.topic.topic,
        subtitle: data.subject?.subject,
        description: data.topic.content,
        url: `/resources/${topicId}`,
        metadata: {
          userName: data.user?.name,
          usn: data.user?.usn,
          subjectName: data.subject?.subject,
        }
      });
      if (res && res.success !== false) {
        setIsSavedInLearnLater(res.isSaved);
      }
    } finally {
      setIsLearnLaterLoading(false);
    }
  };

  const toggleImageExpansion = (imageIndex) => {
    setExpandedImages(prev => ({
      ...prev,
      [imageIndex]: !prev[imageIndex]
    }));
  };

  const downloadTopicAsPDF = () => {
    if (onDownload) {
      onDownload(data, { allPages: true });
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare(data);
    }
  };

  const togglePageNumbers = () => {
    setShowPageNumbers((prev) => !prev);
  };

  const openRangeModal = () => {
    if (!hasImages || !validImages.length) return;
    setStartPage(1);
    setEndPage(validImages.length);
    setAllPages(true);
    setCustomMode(false);
    setSelectedPages([]);
    setVisiblePageCount(10);
    setRangeModalOpen(true);
  };

  const closeRangeModal = () => setRangeModalOpen(false);

  const handleRangeDownload = (e) => {
    e.preventDefault();
    if (!onDownload) return;

    const total = validImages.length;
    const start = Math.max(1, Math.min(total, Number(startPage) || 1));
    const end = Math.max(start, Math.min(total, Number(endPage) || total));

    if (customMode) {
      const uniqueSelected = Array.from(new Set(selectedPages)).filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
      if (!uniqueSelected.length) return;
      onDownload(data, {
        allPages: false,
        selectedPages: uniqueSelected,
      });
    } else {
      onDownload(data, {
        allPages,
        startPage: start,
        endPage: end,
      });
    }

    setRangeModalOpen(false);
  };

  const toggleCustomMode = (checked) => {
    setCustomMode(checked);
    if (checked) {
      setAllPages(false);
    } else {
      setSelectedPages([]);
    }
  };

  const toggleAllPages = (checked) => {
    setAllPages(checked);
    if (checked) {
      setCustomMode(false);
      setSelectedPages([]);
      setStartPage(1);
      setEndPage(validImages.length || 1);
    }
  };

  const togglePageSelection = (pageNumber) => {
    setSelectedPages((prev) => {
      if (prev.includes(pageNumber)) {
        return prev.filter((n) => n !== pageNumber);
      }
      return [...prev, pageNumber].sort((a, b) => a - b);
    });
  };

  const showMorePages = () => {
    setVisiblePageCount((prev) => Math.min(prev + 10, validImages.length));
  };

  // Show skeleton if wrapper is loading
  if (loading) {
    return <FullPageSkeleton />;
  }

  if (error) {
    return (
      <div className="wtpc-error-container">
        <div className="wtpc-error-content">
          <h2>Error Loading Topic</h2>
          <p>{error}</p>
          <Link href="/resources" className="wtpc-back-link">
            <ArrowLeftIcon size={16} /> Back to Resources
          </Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="wtpc-error-container">
        <div className="wtpc-error-content">
          <h2>Topic Not Found</h2>
          <p>The requested topic could not be found.</p>
          <Link href="/resources" className="wtpc-back-link">
            <ArrowLeftIcon size={16} /> Back to Resources
          </Link>
        </div>
      </div>
    );
  }

  const { user, subject, topic } = data;

  return (
    <div className="wtpc-container">
      {/* App Banner for Android ONLY */}
      {isAndroid && <OpenInApp topicId={topicId} isAndroid={isAndroid} />}

      {/* Main Content */}
      <div className="wtpc-main-content">
        {/* User Profile Section */}
        <div className="wtpc-user-section">
          <div className="wtpc-user-avatar">
            <img 
              src={user.profileimg} 
              alt={user.name}
              className="wtpc-profile-image"
              onError={(e) => {
                e.target.src = '/default-avatar.png'; // fallback image
              }}
            />
          </div>
          <div className="wtpc-user-info">
            <Link href={`/users/${user.usn.toLowerCase()}`} className="wtpc-user-name-link">
              <h1 className="wtpc-user-name">{user.name}</h1>
            </Link>
            <div className="wtpc-user-details">
              <div
                className="wtpc-detail-item"
                onMouseEnter={() => usnRef.current?.startAnimation?.()}
                onMouseLeave={() => usnRef.current?.stopAnimation?.()}
              >
                <ContactRoundIcon ref={usnRef} size={15} className="wtpc-detail-icon" />
                <span>{user.usn}</span>
              </div>
              <div
                className="wtpc-detail-item"
                onMouseEnter={() => subjectRef.current?.startAnimation?.()}
                onMouseLeave={() => subjectRef.current?.stopAnimation?.()}
              >
                <BookOpenIcon ref={subjectRef} size={15} className="wtpc-detail-icon" />
                <span>{subject.subject}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="wtpc-action-buttons-container">
          <Link
            href="/resources"
            className="wtpc-action-btn wtpc-back-btn"
            onMouseEnter={() => backBtnRef.current?.startAnimation?.()}
            onMouseLeave={() => backBtnRef.current?.stopAnimation?.()}
          >
            <ArrowLeftIcon ref={backBtnRef} size={16} />
            <span className="wtpc-btn-text">Back</span>
          </Link>
          <div className="wtpc-download-wrapper">
            <button 
              onClick={downloadTopicAsPDF}
              className="wtpc-action-btn wtpc-download-btn wtpc-download-primary"
              disabled={!hasImages || !validImages.length}
              title={!hasImages || !validImages.length ? "No images available for download" : "Download as PDF"}
              onMouseEnter={() => downloadBtnRef.current?.startAnimation?.()}
              onMouseLeave={() => downloadBtnRef.current?.stopAnimation?.()}
            >
              <DownloadIcon ref={downloadBtnRef} size={16} />
              <span className="wtpc-btn-text">Download</span>
            </button>
            <button
              type="button"
              onClick={openRangeModal}
              className="wtpc-action-btn wtpc-download-btn wtpc-download-caret"
              disabled={!hasImages || !validImages.length}
              title="Download selected pages"
            >
              <ChevronDownIcon size={14} />
            </button>
          </div>
          <button 
            onClick={handleShare}
            className="wtpc-action-btn wtpc-share-btn"
            title="Share Topic"
            onMouseEnter={() => shareBtnRef.current?.startAnimation?.()}
            onMouseLeave={() => shareBtnRef.current?.stopAnimation?.()}
          >
            <ShareIcon ref={shareBtnRef} size={16} />
            <span className="wtpc-btn-text">Share</span>
          </button>
          <button 
            onClick={handleToggleLearnLater}
            className={`wtpc-action-btn wtpc-learn-later-btn ${isSavedInLearnLater ? 'wtpc-saved' : ''}`}
            title={isSavedInLearnLater ? "Remove from Learn Later" : "Save to Learn Later"}
            disabled={isLearnLaterLoading}
            onMouseEnter={() => learnLaterBtnRef.current?.startAnimation?.()}
            onMouseLeave={() => learnLaterBtnRef.current?.stopAnimation?.()}
          >
            <BookmarkIcon ref={learnLaterBtnRef} size={16} />
            <span className="wtpc-btn-text">{isSavedInLearnLater ? 'Saved' : 'Learn Later'}</span>
          </button>
        </div>

        {/* Cached Data Indicator */}
        {usingCachedData && (
          <div className="wtpc-cached-indicator">
            <span>📦 Loading from saved data...</span>
          </div>
        )}

        {/* Topic Content Section */}
        <div className="wtpc-topic-section">
          <div className="wtpc-topic-header">
            <h2 className="wtpc-topic-title">{topic.topic}</h2>
            <div className="wtpc-topic-meta">
              <div
                className="wtpc-meta-item"
                onMouseEnter={() => clockRef.current?.startAnimation?.()}
                onMouseLeave={() => clockRef.current?.stopAnimation?.()}
              >
                <ClockIcon ref={clockRef} size={15} className="wtpc-meta-icon" />
                <span>{new Date(topic.timestamp).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
              <div
                className="wtpc-meta-item wtpc-meta-views"
                title={`${topic.views ?? 0} views`}
                onMouseEnter={() => viewsRef.current?.startAnimation?.()}
                onMouseLeave={() => viewsRef.current?.stopAnimation?.()}
              >
                <EyeIcon ref={viewsRef} size={15} className="wtpc-meta-icon" />
                <span>{topic.views ?? 0} views</span>
              </div>
            </div>
          </div>

          {topic.content && (
            <div className="wtpc-topic-content">
              <h3>Description</h3>
              <p>{topic.content}</p>
            </div>
          )}

          {/* Images Section */}
          {hasImages && validImages.length > 0 && (
            <div className="wtpc-images-section">
              <div className="wtpc-images-header">
                <h3
                  onMouseEnter={() => imageHeaderRef.current?.startAnimation?.()}
                  onMouseLeave={() => imageHeaderRef.current?.stopAnimation?.()}
                >
                  <ImageIcon ref={imageHeaderRef} size={18} className="wtpc-section-icon" />
                  Images ({validImages.length})
                </h3>
                <div className="wtpc-images-header-controls">
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(0)}
                    className="wtpc-slideshow-btn"
                    title="View slideshow"
                    onMouseEnter={() => slideshowRef.current?.startAnimation?.()}
                    onMouseLeave={() => slideshowRef.current?.stopAnimation?.()}
                  >
                    <EyeIcon ref={slideshowRef} size={14} className="wtpc-toggle-icon" aria-hidden="true" />
                    <span className="wtpc-toggle-label">Slideshow</span>
                  </button>
                  <button
                    type="button"
                    onClick={togglePageNumbers}
                    className={`wtpc-page-toggle ${showPageNumbers ? "wtpc-page-toggle-active" : ""}`}
                    aria-pressed={showPageNumbers}
                    title={showPageNumbers ? "Hide page numbers" : "Show page numbers"}
                  >
                    <span className="wtpc-toggle-switch" aria-hidden="true">
                      <span className="wtpc-toggle-knob" />
                    </span>
                    <FaListOl className="wtpc-toggle-icon" aria-hidden="true" />
                    <span className="wtpc-toggle-label">Page #</span>
                  </button>
                </div>
              </div>
              <div className="wtpc-images-grid">
                {validImages.map((imageUrl, index) => (
                  <React.Fragment key={index}>
                    <div className="wtpc-image-container">
                      {showPageNumbers && (
                        <span className="wtpc-page-badge">{index + 1}</span>
                      )}
                      <div
                        className="wtpc-image-wrapper wtpc-image-wrapper-clickable"
                        onClick={() => setLightboxIndex(index)}
                        role="button"
                        tabIndex={0}
                        title={`Click to view Page ${index + 1} in full screen`}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setLightboxIndex(index);
                          }
                        }}
                      >
                        <ImageLoader
                          src={imageUrl}
                          alt={`${topic.topic} - Image ${index + 1}`}
                          className="wtpc-topic-image"
                          loading="lazy"
                        />
                        <div className="wtpc-image-zoom-overlay">
                          <FiMaximize2 size={18} />
                          <span>View Full Screen</span>
                        </div>
                      </div>
                    </div>
                    {/* Ad after every 6 pages */}
                    {(index + 1) % 6 === 0 && (
                      <div className="wtpc-ad-slot">
                        <Ads />
                      </div>
                    )}
                  </React.Fragment>
                ))}
                {/* Ad at the end (only if last page wasn't already followed by an ad) */}
                {validImages.length % 6 !== 0 && (
                  <div className="wtpc-ad-slot">
                    <Ads />
                  </div>
                )}
              </div>
            </div>
          )}

          {!hasImages && (
            <div className="wtpc-no-images">
              <ImageIcon className="wtpc-no-images-icon" size={48} />
              <p>No images available for this topic</p>
            </div>
          )}

          {/* AI Recommended Resources (3 relevant resources based on subject & topic) */}
          <AiRecommendationsSection
            topic={topic}
            subject={subject}
            currentId={topicId}
          />

          {/* Reviews Section */}
          <TopicReviews 
            topicId={topicId} 
          />
        </div>
      </div>

      {/* Footer */}
      <div className="wtpc-footer">
        <p>&copy; 2025 Work Topic Page. All rights reserved.</p>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <WtpcLightbox
          images={validImages}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          topicTitle={topic.topic}
        />
      )}

      {rangeModalOpen && (
        <div className="wtpc-modal-overlay" role="dialog" aria-modal="true">
          <div className="wtpc-modal">
            <div className="wtpc-modal-header">
              <h3>Download pages</h3>
              <button className="wtpc-modal-close" onClick={closeRangeModal} aria-label="Close">
                ×
              </button>
            </div>
            <form className="wtpc-modal-body" onSubmit={handleRangeDownload}>
              <div className="wtpc-modal-row">
                <label className="wtpc-input-group">
                  <span>From</span>
                  <input
                    type="number"
                    min={1}
                    max={validImages.length}
                    value={startPage}
                    onChange={(e) => {
                      setStartPage(e.target.value);
                      setAllPages(false);
                      setCustomMode(false);
                    }}
                    disabled={allPages || customMode}
                  />
                </label>
                <label className="wtpc-input-group">
                  <span>To</span>
                  <input
                    type="number"
                    min={1}
                    max={validImages.length}
                    value={endPage}
                    onChange={(e) => {
                      setEndPage(e.target.value);
                      setAllPages(false);
                      setCustomMode(false);
                    }}
                    disabled={allPages || customMode}
                  />
                </label>
              </div>

              <div className="wtpc-checkbox-stack">
                <label className="wtpc-checkbox">
                  <input
                    type="checkbox"
                    checked={allPages}
                    onChange={(e) => toggleAllPages(e.target.checked)}
                  />
                  <span>All pages ({validImages.length})</span>
                </label>

                <label className="wtpc-checkbox">
                  <input
                    type="checkbox"
                    checked={customMode}
                    onChange={(e) => toggleCustomMode(e.target.checked)}
                    disabled={allPages}
                  />
                  <span>Select specific pages</span>
                </label>
              </div>

              {customMode && (
                <div className="wtpc-page-picker">
                  <div className="wtpc-page-grid">
                    {Array.from({ length: Math.min(visiblePageCount, validImages.length) }, (_, idx) => idx + 1).map((num) => (
                      <label key={num} className={`wtpc-page-chip ${selectedPages.includes(num) ? "wtpc-page-chip-active" : ""}`}>
                        <input
                          type="checkbox"
                          checked={selectedPages.includes(num)}
                          onChange={() => togglePageSelection(num)}
                        />
                        <span>{num}</span>
                      </label>
                    ))}
                  </div>
                  {visiblePageCount < validImages.length && (
                    <button type="button" className="wtpc-secondary-btn wtpc-view-more" onClick={showMorePages}>
                      View more {Math.min(10, validImages.length - visiblePageCount)}
                    </button>
                  )}
                </div>
              )}

              <div className="wtpc-modal-actions">
                <button type="button" className="wtpc-secondary-btn" onClick={closeRangeModal}>Cancel</button>
                <button
                  type="submit"
                  className="wtpc-primary-btn"
                  onMouseEnter={() => modalDownloadRef.current?.startAnimation?.()}
                  onMouseLeave={() => modalDownloadRef.current?.stopAnimation?.()}
                >
                  <DownloadIcon ref={modalDownloadRef} size={16} />
                  <span className="wtpc-btn-text">Download</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkTopicPage;