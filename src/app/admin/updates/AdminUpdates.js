"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
    FiArrowLeft,
    FiChevronDown,
    FiLoader,
    FiCalendar,
    FiHash,
    FiTrash2,
    FiBook,
} from "react-icons/fi";
import "../styles/AdminDashboard.css";
import "../users/AdminUsers.css";
import "./AdminUpdates.css";

const PAGE_LIMIT = 10;

function formatDateTime(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
}

export default function AdminUpdates() {
    const [token, setToken] = useState("");
    const [myRole, setMyRole] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);

    const [updates, setUpdates] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        const role = localStorage.getItem("role") || "";
        const tok = localStorage.getItem("token") || "";
        setMyRole(role);
        setToken(tok);
        setTimeout(() => setIsLoaded(true), 80);
    }, []);

    const fetchUpdates = useCallback(
        async (pageNum, append = false) => {
            if (!token) return;
            append ? setLoadingMore(true) : setLoading(true);
            setError("");

            try {
                const res = await fetch(`/api/updates?index=${pageNum}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();

                if (!res.ok) {
                    setError(data.error || "Failed to fetch updates");
                    return;
                }

                append
                    ? setUpdates((prev) => [...prev, ...(data.updates || [])])
                    : setUpdates(data.updates || []);
                setPage(pageNum);
            } catch {
                setError("Network error. Please try again.");
            } finally {
                setLoading(false);
                setLoadingMore(false);
            }
        },
        [token]
    );

    useEffect(() => {
        if (token && (myRole === "admin" || myRole === "superadmin")) {
            fetchUpdates(1, false);
        }
    }, [token, myRole, fetchUpdates]);

    const handleDelete = useCallback(
        async (updateId) => {
            if (!window.confirm("Are you sure you want to delete this update?")) return;

            setDeletingId(updateId);
            try {
                const res = await fetch(`/api/updates?id=${updateId}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                });

                const data = await res.json();

                if (!res.ok) {
                    setError(data.error || "Failed to delete update");
                    return;
                }

                setUpdates((prev) => prev.filter((u) => u._id !== updateId));
                setError("");
            } catch {
                setError("Network error. Failed to delete update.");
            } finally {
                setDeletingId(null);
            }
        },
        [token]
    );

    if (myRole === null) return null;

    return (
        <div className={`adm-wrapper ${isLoaded ? "adm-loaded" : ""}`}>
            <header className="adm-header">
                <div className="adm-header-content">
                    <div className="adm-header-left">
                        <Link href="/admin" className="au-back-link">
                            <FiArrowLeft size={15} /> Admin Dashboard
                        </Link>
                        <div className="adm-role-badge" style={{ backgroundColor: "#7c3aed", marginTop: "0.75rem" }}>
                            <FiBook size={15} />
                            <span>Updates</span>
                        </div>
                        <h1 className="adm-title">
                            Platform <span className="adm-title-highlight">Updates</span>
                        </h1>
                        <p className="adm-subtitle">
                            {updates.length > 0 ? `${updates.length} updates loaded` : "No updates yet"}
                        </p>
                    </div>
                    <div className="adm-header-deco">
                        <div className="adm-deco-circle" style={{ background: "#ede9fe", border: "2px solid #e9d5ff" }}>
                            <FiBook size={44} color="#7c3aed" />
                        </div>
                    </div>
                </div>
            </header>

            <section className="adm-summary">
                <div className="adm-summary-card adm-summary-blue">
                    <div className="adm-summary-icon"><FiBook size={20} /></div>
                    <div>
                        <div className="adm-summary-value">{updates.length}</div>
                        <div className="adm-summary-label">Updates Loaded</div>
                    </div>
                </div>
                <div className="adm-summary-card adm-summary-yellow">
                    <div className="adm-summary-icon"><FiHash size={20} /></div>
                    <div>
                        <div className="adm-summary-value">{page}</div>
                        <div className="adm-summary-label">Current Page</div>
                    </div>
                </div>
            </section>

            {error && <div className="au-error-banner">{error}</div>}

            {loading ? (
                <div className="au-loading-state">
                    <div className="au-spinner"><FiLoader size={28} /></div>
                    <p>Loading updates…</p>
                </div>
            ) : (
                <>
                    <section className="au-updates-list">
                        {updates.map((item, idx) => (
                            <article
                                key={item._id || idx}
                                className="au-update-card"
                                style={{ animationDelay: `${idx * 0.03}s` }}
                            >
                                <div className="au-update-header">
                                    <div className="au-update-meta">
                                        <span className="au-update-id">#{item._id?.slice(-6) || idx + 1}</span>
                                        <h3 className="au-update-title">{item.title}</h3>

                                        {item.name && (
                                            <div className="au-update-user">
                                                {item.profileUrl && (
                                                    <img
                                                        src={item.profileUrl}
                                                        alt={item.name}
                                                        onError={(e) => (e.target.style.display = "none")}
                                                    />
                                                )}
                                                <span className="au-update-user-name">{item.name}</span>
                                                {item.usn && <span className="au-update-user-usn">{item.usn}</span>}
                                            </div>
                                        )}

                                        <div className="au-update-time">
                                            <FiCalendar size={12} /> {formatDateTime(item.createdAt)}
                                        </div>
                                    </div>

                                    <button
                                        className="au-update-delete-btn"
                                        onClick={() => handleDelete(item._id)}
                                        disabled={deletingId === item._id}
                                    >
                                        <FiTrash2 size={14} />
                                        {deletingId === item._id ? "Deleting…" : "Delete"}
                                    </button>
                                </div>

                                <div className="au-update-content">{item.content}</div>

                                {item.links && item.links.length > 0 && (
                                    <div className="au-update-links">
                                        <span className="au-update-links-label">Links</span>
                                        <div className="au-update-links-list">
                                            {item.links.map((link, linkIdx) => (
                                                <a
                                                    key={linkIdx}
                                                    href={link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="au-update-link-item"
                                                >
                                                    {link}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {item.files && item.files.length > 0 && (
                                    <div className="au-update-files">
                                        <span className="au-update-files-label">Files</span>
                                        <div className="au-update-files-list">
                                            {item.files.map((file, fileIdx) => (
                                                <a
                                                    key={fileIdx}
                                                    href={file.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="au-update-file-item"
                                                >
                                                    📄 {file.name}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </article>
                        ))}
                    </section>

                    {updates.length === 0 && !loading && (
                        <div className="au-empty">
                            <FiBook size={36} />
                            <p>No updates found</p>
                        </div>
                    )}

                    {updates.length > 0 && (
                        <div className="au-view-more-wrap">
                            <button
                                className="au-view-more-btn"
                                onClick={() => fetchUpdates(page + 1, true)}
                                disabled={loadingMore}
                            >
                                {loadingMore ? (
                                    <><span className="au-dots"><span /><span /><span /></span> Loading…</>
                                ) : (
                                    <><FiChevronDown size={16} /> Load More Updates</>
                                )}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
