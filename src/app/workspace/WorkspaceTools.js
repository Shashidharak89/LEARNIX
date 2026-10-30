"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  SettingsIcon,
  ArrowRightIcon,
  UploadIcon,
  ZapIcon,
  FileTextIcon,
  ExternalLinkIcon,
} from "@animateicons/react/lucide";
import "./styles/WorkspaceTools.css";

const HARDCODED_TOOLS = [
  {
    id: "file-share",
    title: "Instant File Share",
    badge: "File Drop",
    badgeType: "wt-badge-blue",
    description: "Drop documents or study notes and share them instantly via a 6-character code with zero sign-up.",
    url: "/tools",
    icon: UploadIcon,
    tag: "Up to 50MB",
  },
  {
    id: "file-upload-plus",
    title: "File Upload +",
    badge: "Turbo Drop",
    badgeType: "wt-badge-emerald",
    description: "High-speed peer-to-peer file transfer with 24-hour cloud availability and automated expiry.",
    url: "/tools",
    icon: ZapIcon,
    tag: "Up to 100MB",
  },
  {
    id: "text-share",
    title: "Text & Snippet Share",
    badge: "Quick Paste",
    badgeType: "wt-badge-purple",
    description: "Paste code snippets, lecture notes, or revision text to share securely with an instant 6-digit access code.",
    url: "/tools",
    icon: FileTextIcon,
    tag: "Instant Sync",
  },
];

function ToolCard({ tool }) {
  const iconRef = useRef(null);
  const extRef = useRef(null);
  const Icon = tool.icon;

  return (
    <div
      className="wt-tool-card"
      onMouseEnter={() => {
        iconRef.current?.startAnimation?.();
        extRef.current?.startAnimation?.();
      }}
      onMouseLeave={() => {
        iconRef.current?.stopAnimation?.();
        extRef.current?.stopAnimation?.();
      }}
    >
      <div className="wt-card-header">
        <div className="wt-header-titles">
          <div className="wt-badges-row">
            <span className={`wt-category-pill ${tool.badgeType}`}>
              <Icon ref={iconRef} size={12} />
              <span>{tool.badge}</span>
            </span>

            {tool.tag && (
              <span className="wt-tag-pill" title={tool.tag}>
                <span>{tool.tag}</span>
              </span>
            )}
          </div>

          <h4 className="wt-card-title">
            <Link href={tool.url} className="wt-title-link" title={`Launch ${tool.title}`}>
              {tool.title}
            </Link>
          </h4>
        </div>
      </div>

      {tool.description && <p className="wt-card-desc">{tool.description}</p>}

      <div className="wt-card-meta">
        <div className="wt-meta-left">
          <span className="wt-meta-hint">
            <span>Free • No Signup Required</span>
          </span>
        </div>

        <Link
          href={tool.url}
          className="wt-card-launch-btn"
          title={`Open ${tool.title}`}
        >
          <span>Launch</span>
          <ExternalLinkIcon ref={extRef} size={13} />
        </Link>
      </div>
    </div>
  );
}

export default function WorkspaceTools() {
  const [isExpanded, setIsExpanded] = useState(false);

  const settingsIconRef = useRef(null);
  const topActionRef = useRef(null);

  const toggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <section className="wt-section-wrapper" aria-label="Tools">
      {/* Main Apple Card Widget */}
      <div className="wt-widget-card">
        {/* Header Row - strictly 1 row on ALL screen widths */}
        <div className="wt-widget-header">
          <div
            className="wt-header-title-group"
            onClick={toggleExpand}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleExpand();
              }
            }}
          >
            <div
              className="wt-icon-badge"
              aria-hidden="true"
              onMouseEnter={() => settingsIconRef.current?.startAnimation?.()}
              onMouseLeave={() => settingsIconRef.current?.stopAnimation?.()}
            >
              <SettingsIcon ref={settingsIconRef} size={22} />
            </div>
            <div className="wt-title-text-group">
              <h3 className="wt-section-title">Tools</h3>
              <span className="wt-section-subtitle">Instant file drop, text share & utilities</span>
            </div>
          </div>

          <div className="wt-header-actions">
            <Link
              href="/tools"
              className="wt-top-visit-btn"
              onMouseEnter={() => topActionRef.current?.startAnimation?.()}
              onMouseLeave={() => topActionRef.current?.stopAnimation?.()}
              title="Try tools now"
            >
              <span>Try Now</span>
              <ArrowRightIcon ref={topActionRef} size={15} />
            </Link>
          </div>
        </div>

        {/* Content Body - 3 Hardcoded Tools */}
        {isExpanded && (
          <div className="wt-widget-body">
            <div className="wt-cards-list">
              {HARDCODED_TOOLS.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
