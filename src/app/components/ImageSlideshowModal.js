"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  XIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
} from "@animateicons/react/lucide";
import "../resources/[id]/styles/WorkTopicPage.css";

export default function ImageSlideshowModal({ images = [], startIndex = 0, title = "Slideshow", onClose }) {
  const [idx, setIdx] = useState(startIndex);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });

  const closeRef = useRef(null);
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  const resetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const prev = () => {
    resetZoom();
    setIdx((i) => (i - 1 + images.length) % images.length);
  };

  const next = () => {
    resetZoom();
    setIdx((i) => (i + 1) % images.length);
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && images.length > 1) prev();
      if (e.key === "ArrowRight" && images.length > 1) next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [images.length]); // eslint-disable-line

  const handleDownloadCurrent = async (e) => {
    e.stopPropagation();
    const imgUrl = images[idx];
    if (!imgUrl) return;
    try {
      const res = await fetch(imgUrl);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const safeTitle = (title || "Question_Paper").replace(/[^a-zA-Z0-9._-]/g, "_");
      const ext = blob.type.includes("png") ? "png" : blob.type.includes("webp") ? "webp" : "jpg";
      a.download = `${safeTitle}_Page_${idx + 1}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(imgUrl, "_blank", "noopener,noreferrer");
    }
  };

  if (!images || images.length === 0) return null;

  return (
    <div className="wtpc-lb-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="wtpc-lb-header" onClick={(e) => e.stopPropagation()}>
        <div className="wtpc-lb-title-wrap">
          <span className="wtpc-lb-title-text">{title}</span>
          <span className="wtpc-lb-badge">Page {idx + 1} of {images.length}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            className="wtpc-lb-close"
            onClick={handleDownloadCurrent}
            aria-label="Download current image"
            title="Download this image"
          >
            <DownloadIcon size={20} />
          </button>
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
      </div>

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

      <div
        className={`wtpc-lb-img-wrap ${zoom > 1 ? "is-zoomed" : ""}`}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => {
          if (zoom <= 1) return;
          setIsDragging(true);
          dragStartRef.current = { x: e.clientX, y: e.clientY };
          panStartRef.current = { ...pan };
          e.currentTarget.setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!isDragging || zoom <= 1) return;
          setPan({
            x: panStartRef.current.x + (e.clientX - dragStartRef.current.x),
            y: panStartRef.current.y + (e.clientY - dragStartRef.current.y),
          });
        }}
        onPointerUp={() => setIsDragging(false)}
        onPointerCancel={() => setIsDragging(false)}
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (zoom > 1) resetZoom();
          else setZoom(2);
        }}
        style={{
          cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[idx]}
          alt={`${title} - Page ${idx + 1}`}
          className="wtpc-lb-img"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transition: isDragging ? "none" : "transform 0.2s ease",
          }}
        />
      </div>

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
    </div>
  );
}

