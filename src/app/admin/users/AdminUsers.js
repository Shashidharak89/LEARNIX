"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import {
  UsersIcon,
  UserCheckIcon,
  UserXIcon,
  ShieldCheckIcon,
  ShieldUserIcon,
  CalendarIcon,
  Trash2Icon,
  SearchIcon,
  XIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ExternalLinkIcon,
  ActivityIcon,
} from "@animateicons/react/lucide";
import { FiLoader } from "react-icons/fi";
import "../styles/AdminDashboard.css";
import "./AdminUsers.css";
import "./deleted/styles/DeletedUsers.css";

const PAGE_LIMIT = 12;

function RoleBadge({ role }) {
  if (role === "superadmin")
    return (
      <span className="au-role-badge au-role-superadmin">
        <ShieldCheckIcon size={12} /> Super Admin
      </span>
    );
  if (role === "admin")
    return (
      <span className="au-role-badge au-role-admin">
        <ShieldUserIcon size={12} /> Admin
      </span>
    );
  return (
    <span className="au-role-badge au-role-user">
      <UserIcon size={12} /> User
    </span>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getLastSeenMeta(lastLoginAt) {
  if (!lastLoginAt) {
    return { text: "Never active", isActive: false };
  }

  const seen = new Date(lastLoginAt);
  if (Number.isNaN(seen.getTime())) {
    return { text: "Never active", isActive: false };
  }

  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - seen.getTime());
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 5) {
    return { text: "Active", isActive: true };
  }

  if (diffMinutes < 60) {
    return { text: `${diffMinutes} mins ago`, isActive: false };
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return { text: `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`, isActive: false };
  }

  const absolute = seen
    .toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .replace(",", " at")
    .replace(/\s(AM|PM)$/i, (value) => value.toLowerCase());

  return { text: absolute, isActive: false };
}

export default function AdminUsers() {
  const [myRole, setMyRole]           = useState(null);
  const [token, setToken]             = useState("");
  const [myUsn, setMyUsn]             = useState("");
  const [isLoaded, setIsLoaded]       = useState(false);
  const [sortMode, setSortMode]       = useState("activity"); // Latest active by default
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [users, setUsers]             = useState([]);
  const [total, setTotal]             = useState(0);
  const [activeUsers24h, setActiveUsers24h] = useState(0);
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [loading, setLoading]         = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]             = useState("");

  const [changingRole, setChangingRole] = useState({});
  const [roleMsg, setRoleMsg]           = useState({});

  const [openConfirmUsn, setOpenConfirmUsn] = useState(null);
  const [confirmAction, setConfirmAction]   = useState(null);
  const [dropdownPos, setDropdownPos]       = useState({ top: 0, left: 0 });

  const confirmRef   = useRef(null);
  const btnRefs      = useRef({});
  const sentinelRef  = useRef(null);
  const pageRef      = useRef(page);
  const totalPagesRef = useRef(totalPages);
  const loadingMoreRef = useRef(false);

  pageRef.current = page;
  totalPagesRef.current = totalPages;

  const syncUrlState = useCallback((nextPage, nextSort, nextSearch) => {
    if (typeof window === "undefined") return;
    const params = new window.URLSearchParams(window.location.search);
    params.set("page", String(Math.max(1, nextPage)));
    params.set("sort", nextSort || "activity");
    if (nextSearch) {
      params.set("search", nextSearch);
    } else {
      params.delete("search");
    }
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
  }, []);

  // ── Debounce search input ──
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ── bootstrap ──
  useEffect(() => {
    const r = localStorage.getItem("role")  || "";
    const t = localStorage.getItem("token") || "";
    const u = localStorage.getItem("usn")   || "";

    if (typeof window !== "undefined") {
      const params = new window.URLSearchParams(window.location.search);
      // Default to "activity" (latest active) if not explicitly set
      const qSort = params.get("sort") === "createdAt" ? "createdAt" : "activity";
      const qSearch = (params.get("search") || "").trim();
      setSortMode(qSort);
      if (qSearch) {
        setSearchInput(qSearch);
        setSearchQuery(qSearch);
      }
    }

    setMyRole(r); setToken(t); setMyUsn(u);
    setTimeout(() => setIsLoaded(true), 80);
  }, []);

  // ── fetch page 1 directly (fast, no looping) ──
  const fetchFirstPage = useCallback(async (sortVal, searchVal) => {
    if (!token) return;
    setLoading(true);
    setLoadingMore(false);
    setError("");

    try {
      const q = encodeURIComponent(searchVal || "");
      const res = await fetch(`/api/admin/users?page=1&limit=${PAGE_LIMIT}&sort=${sortVal}&search=${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch users");
      }

      setUsers(data.users || []);
      setTotal(data.total || 0);
      if (typeof data.activeUsers24h === "number") {
        setActiveUsers24h(data.activeUsers24h);
      }
      setPage(1);
      setTotalPages(data.totalPages || 1);
      syncUrlState(1, sortVal, searchVal);
    } catch (err) {
      setError(err.message || "Network error. Please try again.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [token, syncUrlState]);

  // Trigger page 1 fetch when token is ready or sort/search changes
  useEffect(() => {
    if (!isLoaded || !token) return;
    if (myRole === "admin" || myRole === "superadmin") {
      fetchFirstPage(sortMode, searchQuery);
    }
  }, [token, myRole, isLoaded, sortMode, searchQuery, fetchFirstPage]);

  // ── load only the NEXT page and append (never fetch from page 1 again) ──
  const loadNextPage = useCallback(async () => {
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
      const res = await fetch(`/api/admin/users?page=${nextPage}&limit=${PAGE_LIMIT}&sort=${sortMode}&search=${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch more users");
      }

      setUsers(prev => [...prev, ...(data.users || [])]);
      setTotal(data.total || 0);
      if (typeof data.activeUsers24h === "number") {
        setActiveUsers24h(data.activeUsers24h);
      }
      setPage(data.page || nextPage);
      setTotalPages(data.totalPages || maxPages);
      syncUrlState(data.page || nextPage, sortMode, searchQuery);
    } catch (err) {
      setError(err.message || "Network error while loading more users.");
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [loading, token, searchQuery, sortMode, syncUrlState]);

  // ── IntersectionObserver for lazy loading on scroll ──
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !loadingMoreRef.current && pageRef.current < totalPagesRef.current) {
          loadNextPage();
        }
      },
      { root: null, rootMargin: "300px", threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loading, loadNextPage]);

  const handleSortChange = (nextSort) => {
    const safeSort = nextSort === "createdAt" ? "createdAt" : "activity";
    setSortMode(safeSort);
  };

  // ── inline confirm helpers ──
  const openConfirm = (user, newRole, usn) => {
    const btn = btnRefs.current[usn];
    if (btn) {
      const rect       = btn.getBoundingClientRect();
      const dropH      = 190;
      const dropW      = 230;
      const spaceBelow = window.innerHeight - rect.bottom;
      const top  = spaceBelow > dropH ? rect.bottom + 8 : rect.top - dropH - 8;
      const spaceRight = window.innerWidth - rect.left;
      const left = spaceRight > dropW  ? rect.left : rect.right - dropW;
      setDropdownPos({ top, left });
    }
    setOpenConfirmUsn(user.usn);
    setConfirmAction({ user, newRole });
  };

  const closeConfirm    = () => { setOpenConfirmUsn(null); setConfirmAction(null); };
  const handleConfirmed = () => {
    if (!confirmAction) return;
    handleRoleChange(confirmAction.user, confirmAction.newRole);
    closeConfirm();
  };

  // close on outside click
  useEffect(() => {
    if (!openConfirmUsn) return;
    const handler = (e) => {
      if (confirmRef.current && !confirmRef.current.contains(e.target)) {
        const btns = Object.values(btnRefs.current);
        if (btns.some(b => b && b.contains(e.target))) return;
        closeConfirm();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openConfirmUsn]);

  // ── change role ──
  const handleRoleChange = async (user, newRole) => {
    setChangingRole(prev => ({ ...prev, [user.usn]: true }));
    setRoleMsg(prev => ({ ...prev, [user.usn]: "" }));
    try {
      const res  = await fetch("/api/admin/users/role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetUsn: user.usn, newRole }),
      });
      const data = await res.json();
      if (!res.ok) { setRoleMsg(prev => ({ ...prev, [user.usn]: data.error || "Failed" })); return; }
      setUsers(prev => prev.map(u => u.usn === user.usn ? { ...u, role: data.user.role } : u));
      setRoleMsg(prev => ({
        ...prev,
        [user.usn]: newRole === "admin" ? "Made admin ✓" : "Removed admin ✓",
      }));
      setTimeout(() => setRoleMsg(prev => ({ ...prev, [user.usn]: "" })), 2500);
    } catch {
      setRoleMsg(prev => ({ ...prev, [user.usn]: "Network error" }));
    } finally {
      setChangingRole(prev => ({ ...prev, [user.usn]: false }));
    }
  };

  // ── guards ──
  if (myRole === null) return null;

  const isSuperAdmin = myRole === "superadmin";

  return (
    <div className={`adm-wrapper ${isLoaded ? "adm-loaded" : ""}`}>
      <main className="adm-main au-main">

        {/* ── Apple-style Hero Intro Card ── */}
        <div className="adm-intro-card au-intro-card">
          <div className="adm-intro-header au-intro-header">
            <div className="adm-intro-left au-intro-left">
              <div className="au-header-top-row">
                <Link href="/admin" className="au-back-link">
                  <ArrowLeftIcon size={16} /> <span>Admin Dashboard</span>
                </Link>
                <div className="adm-role-badge au-header-badge">
                  <UsersIcon size={15} />
                  <span>User Management</span>
                </div>
              </div>

              <div className="au-title-group">
                <h1 className="adm-title au-title">
                  All <span className="adm-title-highlight">Users</span>
                </h1>
                <p className="adm-subtitle au-subtitle">
                  {sortMode === "activity" ? "Active-first users" : "Latest registered users"} — {total > 0 ? `${total} total accounts` : "loading accounts…"}
                </p>
              </div>

              {/* Controls bar (Search, Filter, Quick Link) */}
              <div className="au-controls-row">
                <div className="au-search-bar">
                  <span className="au-search-icon">
                    <SearchIcon size={16} />
                  </span>
                  <input
                    type="text"
                    className="au-search-input"
                    placeholder="Search by name, USN, or email..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                  {searchInput && (
                    <button
                      type="button"
                      className="au-search-clear-btn"
                      onClick={() => setSearchInput("")}
                      title="Clear search"
                    >
                      <XIcon size={14} />
                    </button>
                  )}
                </div>

                <div className="au-filter-row">
                  <label htmlFor="au-sort-select" className="au-filter-label">Sort by</label>
                  <div className="au-select-wrapper">
                    <select
                      id="au-sort-select"
                      className="au-filter-select"
                      value={sortMode}
                      onChange={(event) => handleSortChange(event.target.value)}
                    >
                      <option value="activity">Latest active</option>
                      <option value="createdAt">Newest joined</option>
                    </select>
                    <ChevronDownIcon size={14} className="au-select-arrow" />
                  </div>
                </div>

                <Link href="/admin/users/deleted" className="au-deleted-users-link">
                  <Trash2Icon size={15} />
                  <span>View Deleted Users</span>
                </Link>
              </div>
            </div>

            <div className="adm-intro-right">
              <div className="adm-shield-orb au-users-orb">
                <UsersIcon size={38} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Summary Stats Widget Strip ── */}
        <section className="au-summary-grid">
          <div className="au-summary-widget au-widget-blue">
            <div className="au-widget-icon">
              <UsersIcon size={20} />
            </div>
            <div className="au-widget-content">
              <div className="au-widget-value">{total}</div>
              <div className="au-widget-label">Total Users</div>
            </div>
          </div>

          <div className="au-summary-widget au-widget-amber">
            <div className="au-widget-icon">
              <ActivityIcon size={20} />
            </div>
            <div className="au-widget-content">
              <div className="au-widget-value">{users.length}</div>
              <div className="au-widget-label">Loaded Users</div>
            </div>
          </div>

          <div className="au-summary-widget au-widget-green">
            <div className="au-widget-icon">
              <UserCheckIcon size={20} />
            </div>
            <div className="au-widget-content">
              <div className="au-widget-value">{activeUsers24h}</div>
              <div className="au-widget-label">Active Users (24h)</div>
            </div>
          </div>
        </section>

        {/* ── Error Banner ── */}
        {error && <div className="au-error-banner">{error}</div>}

        {/* ── User List Section (Apple Rounded Card Widgets) ── */}
        {loading ? (
          <div className="au-loading-state">
            <div className="au-spinner"><FiLoader size={28} /></div>
            <p>Loading users…</p>
          </div>
        ) : (
          <>
            <section className="au-users-list">
              {users.map((user, idx) => {
                const userRole     = user.role || "user";
                const isChanging   = changingRole[user.usn];
                const msg          = roleMsg[user.usn];
                const isOwnAccount = user.usn === myUsn;
                const isOpen       = openConfirmUsn === user.usn;
                const lastSeen     = getLastSeenMeta(user.lastLoginAt);

                return (
                  <div
                    key={user._id || idx}
                    className="au-user-row"
                    style={{ animationDelay: `${idx * 0.03}s` }}
                  >
                    {/* Left: Avatar */}
                    <Link
                      href={`/users/${user.usn}`}
                      className="au-row-avatar-link"
                      title={`View ${user.name}'s profile`}
                    >
                      <Image
                        src={user.profileimg || "https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp"}
                        alt={user.name}
                        width={52}
                        height={52}
                        className="au-row-avatar"
                        unoptimized
                      />
                      <span className="au-avatar-hint">
                        <ExternalLinkIcon size={11} />
                      </span>
                    </Link>

                    {/* Middle: User Info */}
                    <div className="au-row-info">
                      <div className="au-row-name-line">
                        <Link
                          href={`/users/${user.usn}`}
                          className="au-row-name-link"
                          title="View profile"
                        >
                          <span className="au-row-name">{user.name}</span>
                        </Link>
                        <RoleBadge role={userRole} />
                        {isOwnAccount && <span className="au-own-tag">You</span>}
                      </div>

                      <div className="au-row-meta-line">
                        <span className="au-row-usn">{user.usn}</span>
                        {user.email && (
                          <span className="au-row-email">• {user.email}</span>
                        )}
                        <span className="au-row-meta-item">
                          <CalendarIcon size={13} /> Joined {formatDate(user.createdAt)}
                        </span>
                        <span className={`au-row-last-seen ${lastSeen.isActive ? "is-active" : ""}`}>
                          <span className="au-status-dot" />
                          {lastSeen.text}
                        </span>
                      </div>
                    </div>

                    {/* Right: Actions Cluster */}
                    <div className="au-row-actions">
                      <Link
                        href={`/admin/users/profile/${user.usn}`}
                        className="au-admin-profile-btn"
                        title="Open Admin Profile"
                      >
                        <ShieldUserIcon size={14} />
                        <span>Admin Profile</span>
                        <ArrowRightIcon size={13} className="au-btn-arrow" />
                      </Link>

                      {isSuperAdmin && !isOwnAccount && (
                        <div className="au-role-action">
                          <div className="au-confirm-wrap">
                            {userRole === "admin" ? (
                              <button
                                ref={el => { btnRefs.current[user.usn] = el; }}
                                className="au-role-btn au-role-btn-remove"
                                onClick={() => isOpen ? closeConfirm() : openConfirm(user, "user", user.usn)}
                                disabled={isChanging}
                                title="Demote from Admin"
                              >
                                <UserXIcon size={14} />
                                <span>{isChanging ? "Updating…" : "Remove Admin"}</span>
                              </button>
                            ) : (
                              <button
                                ref={el => { btnRefs.current[user.usn] = el; }}
                                className="au-role-btn au-role-btn-make"
                                onClick={() => isOpen ? closeConfirm() : openConfirm(user, "admin", user.usn)}
                                disabled={isChanging}
                                title="Promote to Admin"
                              >
                                <UserCheckIcon size={14} />
                                <span>{isChanging ? "Updating…" : "Make Admin"}</span>
                              </button>
                            )}
                          </div>
                          {msg && <span className="au-role-msg">{msg}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </section>

            {/* Lazy loading observer sentinel */}
            <div ref={sentinelRef} className="au-sentinel" style={{ height: "1px" }} />

            {/* View More Button */}
            {page < totalPages && (
              <div className="au-view-more-wrap">
                <button className="au-view-more-btn" onClick={loadNextPage} disabled={loadingMore}>
                  {loadingMore ? (
                    <><span className="au-dots"><span /><span /><span /></span> Loading next page…</>
                  ) : (
                    <><ChevronDownIcon size={16} /> View More ({total - users.length} remaining)</>
                  )}
                </button>
              </div>
            )}

            {users.length > 0 && page >= totalPages && (
              <p className="au-all-loaded">All {total} users loaded</p>
            )}

            {users.length === 0 && !loading && (
              <div className="au-empty">
                <UsersIcon size={40} />
                <p>No users found</p>
              </div>
            )}
          </>
        )}

        {/* ── Confirm Dropdown Portal ── */}
        {openConfirmUsn && confirmAction && typeof document !== "undefined" &&
          createPortal(
            <div
              ref={confirmRef}
              className="au-confirm-dropdown"
              style={{ top: dropdownPos.top, left: dropdownPos.left }}
            >
              <div className={`au-confirm-dropdown-icon ${
                confirmAction.newRole === "admin" ? "au-confirm-icon-blue" : "au-confirm-icon-red"
              }`}>
                {confirmAction.newRole === "admin" ? <UserCheckIcon size={18} /> : <UserXIcon size={18} />}
              </div>
              <p className="au-confirm-dropdown-title">
                {confirmAction.newRole === "admin" ? "Make Admin?" : "Remove Admin?"}
              </p>
              <p className="au-confirm-dropdown-text">
                {confirmAction.newRole === "admin"
                  ? <><strong>{confirmAction.user.name}</strong> will gain admin access.</>
                  : <><strong>{confirmAction.user.name}</strong> will lose admin access.</>}
              </p>
              <div className="au-confirm-dropdown-actions">
                <button className="au-confirm-dropdown-btn au-confirm-cancel" onClick={closeConfirm}>
                  Cancel
                </button>
                <button
                  className={`au-confirm-dropdown-btn ${
                    confirmAction.newRole === "admin" ? "au-confirm-ok-blue" : "au-confirm-ok-red"
                  }`}
                  onClick={handleConfirmed}
                >
                  Confirm
                </button>
              </div>
            </div>,
            document.body
          )
        }

      </main>
    </div>
  );
}
