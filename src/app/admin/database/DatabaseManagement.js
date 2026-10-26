"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  FiDatabase,
  FiDownload,
  FiGlobe,
  FiBook,
  FiUsers,
  FiArrowLeft,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertCircle,
  FiEye,
  FiX,
  FiShare2,
  FiZap,
  FiCode,
  FiCopy,
  FiCheck,
  FiLayers
} from "react-icons/fi";
import { exportDatabaseViaWebSocket } from "@/lib/databaseWsExporter";
import { DATABASE_SCHEMAS, getCopyableSchemaJSON, getCopyableHeadersCSV } from "@/lib/databaseSchemas";
import "./styles/DatabaseManagement.css";

const COLLECTIONS_CONFIG = [
  {
    id: "resources",
    title: "Resources",
    shortName: "Resources",
    badge: "Resources",
    badgeClass: "badge-blue",
    icon: <FiGlobe size={24} />,
    color: "#3b82f6",
    bgColor: "#eff6ff",
    borderColor: "#bfdbfe",
    columnsCount: DATABASE_SCHEMAS.resources.headers.length,
    previewColumns: ["topic_title", "topic_content", "subject_name", "author_name", "author_usn"]
  },
  {
    id: "updates",
    title: "Updates",
    shortName: "Updates",
    badge: "Updates",
    badgeClass: "badge-pink",
    icon: <FiShare2 size={24} />,
    color: "#ec4899",
    bgColor: "#fdf2f8",
    borderColor: "#fbcfe8",
    columnsCount: DATABASE_SCHEMAS.updates.headers.length,
    previewColumns: ["update_title", "update_content", "update_files_urls", "author_name", "author_usn"]
  },
  {
    id: "study-materials",
    title: "Study Materials",
    shortName: "Study Materials",
    badge: "Study Materials",
    badgeClass: "badge-purple",
    icon: <FiBook size={24} />,
    color: "#8b5cf6",
    bgColor: "#f5f3ff",
    borderColor: "#ddd6fe",
    columnsCount: DATABASE_SCHEMAS["study-materials"].headers.length,
    previewColumns: ["file_name", "file_url", "subject_name", "college_name", "university_name"]
  },
  {
    id: "users",
    title: "Users",
    shortName: "Users",
    badge: "Users",
    badgeClass: "badge-emerald",
    icon: <FiUsers size={24} />,
    color: "#10b981",
    bgColor: "#ecfdf5",
    borderColor: "#a7f3d0",
    columnsCount: DATABASE_SCHEMAS.users.headers.length,
    previewColumns: ["name", "usn", "email", "total_subjects", "total_updates"]
  }
];

export default function DatabaseManagement() {
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [token, setToken] = useState("");
  const [wsOnline, setWsOnline] = useState(false);

  // Active export progress state
  const [exportingCollection, setExportingCollection] = useState(null); // collection id or "all"
  const [exportProgress, setExportProgress] = useState({
    percent: 0,
    processed: 0,
    total: 0,
    status: "",
    method: "websocket"
  });
  const [exportResult, setExportResult] = useState(null);
  const [exportError, setExportError] = useState(null);

  // Preview state
  const [previewData, setPreviewData] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  // Schema Modal state
  const [activeSchemaModal, setActiveSchemaModal] = useState(null); // collection id e.g. "resources"
  const [copyStatus, setCopyStatus] = useState(null); // "headers" | "json" | null
  const [schemaViewFormat, setSchemaViewFormat] = useState("table"); // "table" | "csv" | "json"

  const checkWsAvailability = useCallback(async () => {
    try {
      const res = await fetch("/api/updates/upload/ws-info");
      const data = await res.json();
      setWsOnline(Boolean(data && data.success && data.port));
    } catch {
      setWsOnline(false);
    }
  }, []);

  const fetchStats = useCallback(async (t) => {
    const activeToken = t !== undefined ? t : (typeof window !== "undefined" ? localStorage.getItem("token") || "" : "");
    setLoadingStats(true);
    try {
      const res = await fetch("/api/admin/database/stats", {
        headers: { Authorization: activeToken ? `Bearer ${activeToken}` : "" }
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.warn("Failed to fetch stats:", err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Initialize token and check WS
  useEffect(() => {
    const storedToken = localStorage.getItem("token") || "";
    setToken(storedToken);

    fetchStats(storedToken);
    checkWsAvailability();
  }, [fetchStats, checkWsAvailability]);

  // Trigger export for a single collection
  const handleExport = async (collectionId) => {
    if (exportingCollection) return;

    setExportingCollection(collectionId);
    setExportError(null);
    setExportResult(null);
    setExportProgress({
      percent: 5,
      processed: 0,
      total: 100,
      status: "Initializing export with nested dereferencing...",
      method: wsOnline ? "websocket" : "http"
    });

    try {
      const res = await exportDatabaseViaWebSocket(collectionId, {
        token,
        onProgress: (prog) => {
          setExportProgress((prev) => ({
            ...prev,
            percent: prog.percent ?? prev.percent,
            processed: prog.processed ?? prev.processed,
            total: prog.total ?? prev.total,
            status: prog.status || prev.status
          }));
        },
        onStatus: (statusText) => {
          setExportProgress((prev) => ({ ...prev, status: statusText }));
        }
      });

      setExportResult(res);
      fetchStats(token);
    } catch (err) {
      console.error("Export error:", err);
      setExportError(err.message || "Failed to download export file.");
    } finally {
      setTimeout(() => {
        setExportingCollection(null);
      }, 500);
    }
  };

  // Trigger sequential export of all 4 collections
  const handleExportAll = async () => {
    if (exportingCollection) return;

    setExportingCollection("all");
    setExportError(null);
    setExportResult(null);

    const results = [];
    const totalCollections = COLLECTIONS_CONFIG.length;

    try {
      for (let i = 0; i < totalCollections; i++) {
        const col = COLLECTIONS_CONFIG[i];
        setExportProgress({
          percent: Math.round((i / totalCollections) * 100),
          processed: i,
          total: totalCollections,
          status: `Processing ${col.shortName} (${i + 1}/${totalCollections})...`,
          method: wsOnline ? "websocket" : "http"
        });

        const res = await exportDatabaseViaWebSocket(col.id, {
          token,
          onProgress: (prog) => {
            const basePct = Math.round((i / totalCollections) * 100);
            const stepPct = Math.round(((prog.percent || 0) / 100) * (100 / totalCollections));
            setExportProgress((prev) => ({
              ...prev,
              percent: Math.min(99, basePct + stepPct),
              status: `[${col.shortName}] ${prog.status || "Exporting..."}`
            }));
          }
        });
        results.push(res);

        // Pause briefly between downloads so browser doesn't block multi-download
        await new Promise((r) => setTimeout(r, 600));
      }

      setExportProgress({
        percent: 100,
        processed: totalCollections,
        total: totalCollections,
        status: "All 4 collections downloaded successfully with nested attributes!",
        method: wsOnline ? "websocket" : "http"
      });

      setExportResult({
        success: true,
        filename: "All 4 Comprehensive CSV Datasets Exported",
        rowCount: results.reduce((acc, r) => acc + (r.rowCount || 0), 0),
        sizeBytes: results.reduce((acc, r) => acc + (r.sizeBytes || 0), 0),
        isBundle: true
      });
    } catch (err) {
      setExportError(err.message || "Error during multi-collection export");
    } finally {
      setTimeout(() => {
        setExportingCollection(null);
      }, 500);
    }
  };

  // Open Quick Preview Modal
  const handleOpenPreview = async (collectionId) => {
    setLoadingPreview(true);
    setPreviewError(null);
    setPreviewData(null);

    try {
      const res = await fetch(`/api/admin/database/preview?collection=${encodeURIComponent(collectionId)}`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load preview data");
      }
      setPreviewData(data);
    } catch (err) {
      setPreviewError(err.message || "Failed to load preview");
    } finally {
      setLoadingPreview(false);
    }
  };

  // Copy to clipboard helper
  const handleCopyToClipboard = (text, type) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopyStatus(type);
        setTimeout(() => setCopyStatus(null), 2500);
      });
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const currentSchema = activeSchemaModal ? DATABASE_SCHEMAS[activeSchemaModal] : null;

  return (
    <div className="dbm-container">
      {/* ── Breadcrumb & Navigation ── */}
      <div className="dbm-top-nav">
        <Link href="/admin" className="dbm-back-link">
          <FiArrowLeft size={18} />
          <span>Back to Admin Dashboard</span>
        </Link>
        <div className="dbm-top-indicators">
          <div className={`dbm-ws-badge ${wsOnline ? "ws-active" : "ws-fallback"}`}>
            <span className="ws-dot" />
            <FiZap size={14} />
            <span>{wsOnline ? "WebSocket Stream Online" : "HTTP Stream Standby"}</span>
          </div>
          <button
            onClick={() => setActiveSchemaModal("resources")}
            className="dbm-schema-nav-btn"
            title="Inspect CSV schema, attribute dictionary, and copyable headers"
          >
            <FiCode size={15} />
            <span>CSV Schema Specs</span>
          </button>
          <button
            onClick={() => {
              fetchStats();
              checkWsAvailability();
            }}
            className="dbm-refresh-btn"
            title="Refresh database statistics"
            disabled={loadingStats}
          >
            <FiRefreshCw size={15} className={loadingStats ? "spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Header ── */}
      <header className="dbm-header">
        <div className="dbm-header-left">
          <div className="dbm-header-icon-wrap">
            <FiDatabase size={32} />
          </div>
          <div>
            <h1 className="dbm-title">
              Database <span className="dbm-title-highlight">Management</span>
            </h1>
            <p className="dbm-subtitle">
              Download comprehensive RFC 4180 CSV exports with deep nested record dereferencing and live WebSocket progress streaming.
            </p>
          </div>
        </div>
        <div className="dbm-header-actions">
          <button
            onClick={handleExportAll}
            disabled={Boolean(exportingCollection)}
            className="dbm-export-all-btn"
          >
            <FiDownload size={18} />
            <span>Download All 4 Collections</span>
          </button>
        </div>
      </header>

      {/* ── Live Stats Cards ── */}
      <section className="dbm-stats-grid">
        <div className="dbm-stat-card">
          <div className="dbm-stat-icon-wrap" style={{ background: "#eff6ff", color: "#3b82f6" }}>
            <FiGlobe size={22} />
          </div>
          <div className="dbm-stat-info">
            <span className="dbm-stat-label">Resources</span>
            <div className="dbm-stat-number">
              {loadingStats ? "..." : (stats?.publicTopicsCount ?? 0) + (stats?.publicSubjectsCount ?? 0)}
            </div>
            <span className="dbm-stat-sub">
              {stats?.publicTopicsCount ?? 0} topics, {stats?.publicSubjectsCount ?? 0} subjects
            </span>
          </div>
        </div>

        <div className="dbm-stat-card">
          <div className="dbm-stat-icon-wrap" style={{ background: "#fdf2f8", color: "#ec4899" }}>
            <FiShare2 size={22} />
          </div>
          <div className="dbm-stat-info">
            <span className="dbm-stat-label">Updates</span>
            <div className="dbm-stat-number">
              {loadingStats ? "..." : stats?.publicUpdatesCount ?? 0}
            </div>
            <span className="dbm-stat-sub">Platform updates with files &amp; user profiles</span>
          </div>
        </div>

        <div className="dbm-stat-card">
          <div className="dbm-stat-icon-wrap" style={{ background: "#f5f3ff", color: "#8b5cf6" }}>
            <FiBook size={22} />
          </div>
          <div className="dbm-stat-info">
            <span className="dbm-stat-label">Study Materials</span>
            <div className="dbm-stat-number">
              {loadingStats ? "..." : stats?.studyMaterialsCount ?? 0}
            </div>
            <span className="dbm-stat-sub">
              Across {stats?.smSubjectsCount ?? 0} curriculum subjects
            </span>
          </div>
        </div>

        <div className="dbm-stat-card">
          <div className="dbm-stat-icon-wrap" style={{ background: "#ecfdf5", color: "#10b981" }}>
            <FiUsers size={22} />
          </div>
          <div className="dbm-stat-info">
            <span className="dbm-stat-label">Users</span>
            <div className="dbm-stat-number">
              {loadingStats ? "..." : stats?.usersCount ?? 0}
            </div>
            <span className="dbm-stat-sub">Accounts tracked with upload metrics</span>
          </div>
        </div>
      </section>

      {/* ── Active Progress Bar Banner ── */}
      {(exportingCollection || exportProgress.percent > 0) && (
        <div className="dbm-progress-banner">
          <div className="dbm-progress-header">
            <div className="dbm-progress-title-wrap">
              <span className="dbm-pulse-dot" />
              <strong>
                {exportingCollection === "all"
                  ? "Exporting All Datasets Sequentially..."
                  : `Exporting ${COLLECTIONS_CONFIG.find((c) => c.id === exportingCollection)?.title || "Data"}...`}
              </strong>
              <span className="dbm-progress-method-tag">
                {exportProgress.method === "websocket" ? "⚡ Live WebSocket Stream" : "🌐 HTTP Stream"}
              </span>
            </div>
            <span className="dbm-progress-percent">{exportProgress.percent}%</span>
          </div>

          <div className="dbm-progress-track">
            <div
              className="dbm-progress-fill"
              style={{ width: `${exportProgress.percent}%` }}
            />
          </div>

          <div className="dbm-progress-footer">
            <span className="dbm-progress-status">{exportProgress.status}</span>
            {exportProgress.total > 0 && (
              <span className="dbm-progress-count">
                {exportProgress.processed} / {exportProgress.total} items
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Result Notification ── */}
      {exportResult && (
        <div className="dbm-result-banner">
          <FiCheckCircle size={22} className="dbm-result-icon" />
          <div className="dbm-result-info">
            <strong>Export Successful!</strong>
            <span>
              Downloaded <strong>{exportResult.filename}</strong> ({exportResult.rowCount} rows,{" "}
              {formatBytes(exportResult.sizeBytes)}).
            </span>
          </div>
          <button
            onClick={() => setExportResult(null)}
            className="dbm-result-close"
            title="Dismiss notification"
          >
            <FiX size={18} />
          </button>
        </div>
      )}

      {/* ── Error Notification ── */}
      {exportError && (
        <div className="dbm-error-banner">
          <FiAlertCircle size={22} className="dbm-error-icon" />
          <div className="dbm-error-info">
            <strong>Export Failed:</strong>
            <span>{exportError}</span>
          </div>
          <button
            onClick={() => setExportError(null)}
            className="dbm-result-close"
            title="Dismiss error"
          >
            <FiX size={18} />
          </button>
        </div>
      )}

      {/* ── Export Cards Grid ── */}
      <h2 className="dbm-section-heading">Database Collections</h2>
      <div className="dbm-cards-grid">
        {COLLECTIONS_CONFIG.map((col) => {
          const isCurrentlyExporting = exportingCollection === col.id;
          const isBusy = Boolean(exportingCollection);

          return (
            <div key={col.id} className="dbm-card" style={{ borderColor: col.borderColor }}>
              <div className="dbm-card-header">
                <div
                  className="dbm-card-icon"
                  style={{ background: col.bgColor, color: col.color, borderColor: col.borderColor }}
                >
                  {col.icon}
                </div>
                <div className="dbm-card-header-meta">
                  <span className={`dbm-card-badge ${col.badgeClass}`}>{col.badge}</span>
                  <h3 className="dbm-card-title">{col.title}</h3>
                </div>
              </div>

              {/* Column Tags - Displayed in 2 Clean Rows */}
              <div className="dbm-card-columns-section">
                <div className="dbm-columns-header-row">
                  <span className="dbm-columns-label">
                    Total {col.columnsCount} Attributes:
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveSchemaModal(col.id)}
                    className="dbm-card-schema-link"
                  >
                    <FiCode size={13} />
                    <span>View All Schema</span>
                  </button>
                </div>
                <div className="dbm-column-tags">
                  {col.previewColumns.map((cName) => (
                    <span key={cName} className="dbm-col-tag">
                      {cName}
                    </span>
                  ))}
                  {col.columnsCount > col.previewColumns.length && (
                    <button
                      type="button"
                      onClick={() => setActiveSchemaModal(col.id)}
                      className="dbm-col-tag-more"
                      title="Click to view full attribute dictionary"
                    >
                      +{col.columnsCount - col.previewColumns.length} more attributes...
                    </button>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="dbm-card-footer">
                <button
                  type="button"
                  onClick={() => handleOpenPreview(col.id)}
                  disabled={isBusy}
                  className="dbm-preview-btn"
                  title="View the first 10 rows in a table before downloading"
                >
                  <FiEye size={16} />
                  <span>Quick Preview</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExport(col.id)}
                  disabled={isBusy}
                  className="dbm-download-btn"
                  style={{ backgroundColor: col.color }}
                >
                  {isCurrentlyExporting ? (
                    <>
                      <FiRefreshCw size={16} className="spin" />
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <FiDownload size={16} />
                      <span>Download CSV</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Quick Preview Modal ── */}
      {(previewData || loadingPreview || previewError) && (
        <div className="dbm-modal-backdrop" onClick={() => setPreviewData(null)}>
          <div className="dbm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dbm-modal-header">
              <div>
                <h3 className="dbm-modal-title">
                  Dataset Sample Preview:{" "}
                  <span style={{ color: "#3b82f6" }}>
                    {previewData?.filename || "Loading..."}
                  </span>
                </h3>
                <p className="dbm-modal-sub">
                  Showing first 10 sample records from {previewData?.rowCount ?? "..."} total records with full dereferenced attributes.
                </p>
              </div>
              <button
                onClick={() => {
                  setPreviewData(null);
                  setPreviewError(null);
                }}
                className="dbm-modal-close-btn"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="dbm-modal-body">
              {loadingPreview && (
                <div className="dbm-modal-loading">
                  <FiRefreshCw size={28} className="spin" />
                  <p>Generating preview rows with nested records...</p>
                </div>
              )}

              {previewError && (
                <div className="dbm-modal-error">
                  <FiAlertCircle size={24} />
                  <p>{previewError}</p>
                </div>
              )}

              {previewData && (
                <div className="dbm-table-wrap">
                  <table className="dbm-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        {previewData.headers.map((h, i) => (
                          <th key={i}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.sampleRows.map((row, rIdx) => (
                        <tr key={rIdx}>
                          <td className="dbm-td-index">{rIdx + 1}</td>
                          {row.map((val, cIdx) => (
                            <td key={cIdx} title={val}>
                              {val.length > 80 ? `${val.slice(0, 80)}...` : val || "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="dbm-modal-footer">
              <span className="dbm-modal-note">
                RFC 4180 format compliant. Quotes, commas, and multi-line content are safely preserved.
              </span>
              {previewData && (
                <button
                  onClick={() => {
                    const colId = previewData.collection;
                    setPreviewData(null);
                    handleExport(colId);
                  }}
                  className="dbm-modal-download-btn"
                >
                  <FiDownload size={16} />
                  <span>Download Full CSV ({previewData.rowCount} rows)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Copyable CSV Schema Specification Modal ── */}
      {currentSchema && (
        <div className="dbm-modal-backdrop" onClick={() => setActiveSchemaModal(null)}>
          <div className="dbm-modal dbm-schema-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dbm-modal-header">
              <div className="dbm-modal-header-left">
                <div className="dbm-schema-modal-badge">
                  <FiLayers size={16} />
                  <span>{currentSchema.headers.length} Total Attributes</span>
                </div>
                <h3 className="dbm-modal-title">{currentSchema.title}</h3>
                <p className="dbm-modal-sub">{currentSchema.description}</p>
              </div>
              <button
                onClick={() => setActiveSchemaModal(null)}
                className="dbm-modal-close-btn"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Collection Switcher Tabs */}
            <div className="dbm-schema-tabs-row">
              <div className="dbm-schema-dataset-tabs">
                {COLLECTIONS_CONFIG.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveSchemaModal(c.id)}
                    className={`dbm-schema-tab-btn ${activeSchemaModal === c.id ? "active" : ""}`}
                  >
                    {c.shortName} ({DATABASE_SCHEMAS[c.id].headers.length})
                  </button>
                ))}
              </div>

              <div className="dbm-schema-format-toggle">
                <button
                  onClick={() => setSchemaViewFormat("table")}
                  className={`dbm-format-btn ${schemaViewFormat === "table" ? "active" : ""}`}
                >
                  Attribute Dictionary
                </button>
                <button
                  onClick={() => setSchemaViewFormat("csv")}
                  className={`dbm-format-btn ${schemaViewFormat === "csv" ? "active" : ""}`}
                >
                  CSV Headers
                </button>
                <button
                  onClick={() => setSchemaViewFormat("json")}
                  className={`dbm-format-btn ${schemaViewFormat === "json" ? "active" : ""}`}
                >
                  JSON Schema
                </button>
              </div>
            </div>

            <div className="dbm-modal-body dbm-schema-body">
              {schemaViewFormat === "table" && (
                <div className="dbm-table-wrap">
                  <table className="dbm-table dbm-schema-table">
                    <thead>
                      <tr>
                        <th style={{ width: 45 }}>#</th>
                        <th>Column / Attribute Name</th>
                        <th>Data Type</th>
                        <th>Source Origin</th>
                        <th>Attribute Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentSchema.attributes.map((attr, idx) => (
                        <tr key={attr.name}>
                          <td className="dbm-td-index">{idx + 1}</td>
                          <td>
                            <code className="dbm-code-attr">{attr.name}</code>
                          </td>
                          <td>
                            <span className="dbm-type-pill">{attr.type}</span>
                          </td>
                          <td>
                            <code className="dbm-source-pill">{attr.sourceModel}</code>
                          </td>
                          <td>{attr.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {schemaViewFormat === "csv" && (
                <div className="dbm-copyable-code-block">
                  <div className="dbm-code-header">
                    <span>Comma-Separated Column Headers ({currentSchema.headers.length} attributes)</span>
                    <button
                      onClick={() => handleCopyToClipboard(getCopyableHeadersCSV(activeSchemaModal), "headers")}
                      className="dbm-copy-action-btn"
                    >
                      {copyStatus === "headers" ? <FiCheck size={14} color="#10b981" /> : <FiCopy size={14} />}
                      <span>{copyStatus === "headers" ? "Copied!" : "Copy Headers"}</span>
                    </button>
                  </div>
                  <pre className="dbm-pre">{getCopyableHeadersCSV(activeSchemaModal)}</pre>
                </div>
              )}

              {schemaViewFormat === "json" && (
                <div className="dbm-copyable-code-block">
                  <div className="dbm-code-header">
                    <span>Structured JSON Schema Definition</span>
                    <button
                      onClick={() => handleCopyToClipboard(getCopyableSchemaJSON(activeSchemaModal), "json")}
                      className="dbm-copy-action-btn"
                    >
                      {copyStatus === "json" ? <FiCheck size={14} color="#10b981" /> : <FiCopy size={14} />}
                      <span>{copyStatus === "json" ? "Copied!" : "Copy JSON"}</span>
                    </button>
                  </div>
                  <pre className="dbm-pre">{getCopyableSchemaJSON(activeSchemaModal)}</pre>
                </div>
              )}
            </div>

            <div className="dbm-modal-footer dbm-schema-footer">
              <div className="dbm-schema-quick-actions">
                <button
                  onClick={() => handleCopyToClipboard(getCopyableHeadersCSV(activeSchemaModal), "headers")}
                  className="dbm-schema-quick-copy-btn"
                >
                  {copyStatus === "headers" ? <FiCheck size={15} color="#10b981" /> : <FiCopy size={15} />}
                  <span>Copy CSV Headers ({currentSchema.headers.length} Columns)</span>
                </button>
                <button
                  onClick={() => handleCopyToClipboard(getCopyableSchemaJSON(activeSchemaModal), "json")}
                  className="dbm-schema-quick-copy-btn"
                >
                  {copyStatus === "json" ? <FiCheck size={15} color="#10b981" /> : <FiCopy size={15} />}
                  <span>Copy JSON Schema</span>
                </button>
              </div>

              <button
                onClick={() => {
                  const colId = activeSchemaModal;
                  setActiveSchemaModal(null);
                  handleExport(colId);
                }}
                className="dbm-modal-download-btn"
              >
                <FiDownload size={16} />
                <span>Download {currentSchema.title} CSV</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
