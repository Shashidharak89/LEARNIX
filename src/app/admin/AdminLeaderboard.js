"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FiAward,
  FiZap,
  FiStar,
  FiSearch,
  FiX,
  FiChevronDown,
  FiExternalLink,
  FiShield,
  FiLoader,
} from "react-icons/fi";
import { MdAdminPanelSettings } from "react-icons/md";
import "./styles/AdminLeaderboard.css";

const PAGE_SIZE = 10;
const DEFAULT_AVATAR =
  "https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp";

function RoleTag({ role }) {
  if (role === "superadmin") {
    return (
      <span className="alb-role-pill alb-role-superadmin">
        <FiShield size={10} /> Super Admin
      </span>
    );
  }
  if (role === "admin") {
    return (
      <span className="alb-role-pill alb-role-admin">
        <MdAdminPanelSettings size={10} /> Admin
      </span>
    );
  }
  return null;
}

export default function AdminLeaderboard({ token: propToken }) {
  const [activeTab, setActiveTab] = useState("highest"); // "highest" | "active"
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState(propToken || "");

  const pageRef = useRef(page);
  const totalPagesRef = useRef(totalPages);
  const loadingMoreRef = useRef(false);

  pageRef.current = page;
  totalPagesRef.current = totalPages;

  // Retrieve auth token
  useEffect(() => {
    if (!token && typeof window !== "undefined") {
      const stored = localStorage.getItem("token") || "";
      setToken(stored);
    }
  }, [token]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch page 1 (initial load, tab switch, or search change)
  const fetchFirstPage = useCallback(
    async (type, search) => {
      if (!token) return;
      setLoading(true);
      setError("");

      try {
        const q = encodeURIComponent(search || "");
        const res = await fetch(
          `/api/admin/leaderboard?type=${type}&page=1&size=${PAGE_SIZE}&search=${q}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to load leaderboard");
        }

        setUsers(data.users || []);
        setTotal(data.total || 0);
        setPage(1);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        setError(err.message || "Failed to load leaderboard data");
        setUsers([]);
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  // Trigger initial fetch & re-fetch on tab / search query change
  useEffect(() => {
    if (token) {
      fetchFirstPage(activeTab, searchQuery);
    }
  }, [token, activeTab, searchQuery, fetchFirstPage]);

  // Load next page and append (page + 1 only)
  const loadNextPage = async () => {
    if (loading || loadingMoreRef.current || !token) return;
    const curPage = pageRef.current;
    const maxPages = totalPagesRef.current;
    if (curPage >= maxPages) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);
    setError("");

    try {
      const nextPage = curPage + 1;
      const q = encodeURIComponent(searchQuery || "");
      const res = await fetch(
        `/api/admin/leaderboard?type=${activeTab}&page=${nextPage}&size=${PAGE_SIZE}&search=${q}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load more users");
      }

      setUsers((prev) => [...prev, ...(data.users || [])]);
      setTotal(data.total || 0);
      setPage(data.page || nextPage);
      setTotalPages(data.totalPages || maxPages);
    } catch (err) {
      setError(err.message || "Error loading next page");
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  };

  const handleTabChange = (type) => {
    if (type === activeTab) return;
    setActiveTab(type);
  };

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <div className="alb-rank-badge alb-rank-gold" title="Rank 1 - Gold">
          <span>🥇</span>
          <span className="alb-rank-num">#1</span>
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="alb-rank-badge alb-rank-silver" title="Rank 2 - Silver">
          <span>🥈</span>
          <span className="alb-rank-num">#2</span>
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="alb-rank-badge alb-rank-bronze" title="Rank 3 - Bronze">
          <span>🥉</span>
          <span className="alb-rank-num">#3</span>
        </div>
      );
    }
    return (
      <div className="alb-rank-badge alb-rank-standard">
        <span className="alb-rank-num">#{rank}</span>
      </div>
    );
  };

  return (
    <section className="alb-section">
      {/* ── Header & Title ── */}
      <div className="alb-header">
        <div className="alb-header-left">
          <div className="alb-badge">
            <FiAward size={15} />
            <span>Platform Leaderboard</span>
          </div>
          <h2 className="alb-title">
            Streaks <span className="alb-title-highlight">Leaderboard</span>
          </h2>
          <p className="alb-subtitle">
            Ranked by {activeTab === "highest" ? "highest recorded streak milestones" : "currently active daily streaks"} — top users across Learnix
          </p>
        </div>

        {/* ── Tabs (Highest vs Active) ── */}
        <div className="alb-tabs">
          <button
            type="button"
            className={`alb-tab-btn ${activeTab === "highest" ? "alb-tab-active" : ""}`}
            onClick={() => handleTabChange("highest")}
          >
            <FiStar size={15} />
            <span>Highest Streak</span>
          </button>
          <button
            type="button"
            className={`alb-tab-btn ${activeTab === "active" ? "alb-tab-active" : ""}`}
            onClick={() => handleTabChange("active")}
          >
            <FiZap size={15} />
            <span>Active Streak</span>
          </button>
        </div>
      </div>

      {/* ── Search Bar & Filter Strip ── */}
      <div className="alb-filter-strip">
        <div className="alb-search-box">
          <FiSearch size={16} className="alb-search-icon" />
          <input
            type="text"
            className="alb-search-input"
            placeholder="Search by name, USN, or email to inspect rank..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button
              type="button"
              className="alb-search-clear"
              onClick={() => setSearchInput("")}
              title="Clear search"
            >
              <FiX size={14} />
            </button>
          )}
        </div>

        <div className="alb-stats-pill">
          <span>Total Ranked:</span>
          <strong>{total}</strong>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && <div className="alb-error-banner">{error}</div>}

      {/* ── Leaderboard Table / Cards ── */}
      {loading ? (
        <div className="alb-loading-state">
          <FiLoader className="alb-spinner" size={26} />
          <p>Loading leaderboard rankings…</p>
        </div>
      ) : users.length === 0 ? (
        <div className="alb-empty-state">
          <FiAward size={36} className="alb-empty-icon" />
          <p className="alb-empty-title">
            {searchQuery ? `No users found matching "${searchQuery}"` : "No streak records available"}
          </p>
          {searchQuery && (
            <button
              type="button"
              className="alb-empty-reset-btn"
              onClick={() => setSearchInput("")}
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="alb-list-container">
          <div className="alb-list">
            {users.map((user, idx) => {
              const rank = user.rank || idx + 1;
              const isTopThree = rank <= 3;
              const isPrimaryHighest = activeTab === "highest";

              return (
                <div
                  key={user._id || idx}
                  className={`alb-item ${isTopThree ? `alb-item-top alb-item-top-${rank}` : ""}`}
                >
                  {/* Rank Badge */}
                  <div className="alb-rank-col">{getRankBadge(rank)}</div>

                  {/* Avatar & User Details */}
                  <div className="alb-user-col">
                    <div className="alb-avatar-wrap">
                      <Image
                        src={user.profileimg || DEFAULT_AVATAR}
                        alt={user.name || "User"}
                        width={42}
                        height={42}
                        className="alb-avatar"
                        unoptimized
                      />
                    </div>
                    <div className="alb-user-meta">
                      <div className="alb-user-name-row">
                        <span className="alb-user-name">{user.name}</span>
                        <RoleTag role={user.role} />
                      </div>
                      <div className="alb-user-sub-row">
                        <span className="alb-user-usn">{user.usn}</span>
                        {user.email && (
                          <span className="alb-user-email">• {user.email}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Streak Metrics */}
                  <div className="alb-streaks-col">
                    {/* Highest Streak */}
                    <div
                      className={`alb-streak-chip ${
                        isPrimaryHighest ? "alb-streak-highlight" : ""
                      }`}
                      title="Highest streak achieved"
                    >
                      <FiStar size={13} className="alb-streak-icon alb-icon-star" />
                      <div className="alb-streak-info">
                        <span className="alb-streak-val">{user.highestStreak ?? 1}</span>
                        <span className="alb-streak-label">Highest</span>
                      </div>
                    </div>

                    {/* Active Streak */}
                    <div
                      className={`alb-streak-chip ${
                        !isPrimaryHighest ? "alb-streak-highlight" : ""
                      }`}
                      title="Currently active daily streak"
                    >
                      <FiZap size={13} className="alb-streak-icon alb-icon-zap" />
                      <div className="alb-streak-info">
                        <span className="alb-streak-val">{user.streaks ?? 1}</span>
                        <span className="alb-streak-label">Active</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Link */}
                  <div className="alb-actions-col">
                    <Link
                      href={`/admin/users/profile/${user.usn}`}
                      className="alb-profile-link"
                      title="View user details in Admin"
                    >
                      <span>Profile</span>
                      <FiExternalLink size={12} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── View More Button ── */}
          {page < totalPages && (
            <div className="alb-view-more-wrap">
              <button
                type="button"
                className="alb-view-more-btn"
                onClick={loadNextPage}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <FiLoader className="alb-spinner" size={15} />
                    <span>Loading next page…</span>
                  </>
                ) : (
                  <>
                    <FiChevronDown size={16} />
                    <span>View More ({total - users.length} remaining)</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* All loaded message */}
          {users.length > 0 && page >= totalPages && (
            <p className="alb-all-loaded">
              All {total} ranked users loaded
            </p>
          )}
        </div>
      )}
    </section>
  );
}
