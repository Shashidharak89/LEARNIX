"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FiUsers,
  FiArrowLeft,
  FiShield,
  FiUser,
  FiLock,
  FiLoader,
  FiChevronDown,
  FiCalendar,
  FiHash,
  FiUserCheck,
  FiUserX,
} from "react-icons/fi";
import { MdAdminPanelSettings } from "react-icons/md";
import "../styles/AdminDashboard.css";
import "./AdminUsers.css";

const PAGE_LIMIT = 12;

function RoleBadge({ role }) {
  if (role === "superadmin")
    return <span className="au-role-badge au-role-superadmin"><FiShield size={11} /> Super Admin</span>;
  if (role === "admin")
    return <span className="au-role-badge au-role-admin"><MdAdminPanelSettings size={11} /> Admin</span>;
  return <span className="au-role-badge au-role-user"><FiUser size={11} /> User</span>;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export default function AdminUsers() {
  const [myRole, setMyRole]         = useState(null);
  const [token, setToken]           = useState("");
  const [myUsn, setMyUsn]           = useState("");
  const [isLoaded, setIsLoaded]     = useState(false);

  const [users, setUsers]           = useState([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]       = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]           = useState("");

  // per-user role-change state
  const [changingRole, setChangingRole] = useState({}); // { usn: true/false }
  const [roleMsg, setRoleMsg]           = useState({});  // { usn: "message" }

  // ── bootstrap ──
  useEffect(() => {
    const r = localStorage.getItem("role") || "";
    const t = localStorage.getItem("token") || "";
    const u = localStorage.getItem("usn")   || "";
    setMyRole(r);
    setToken(t);
    setMyUsn(u);
    setTimeout(() => setIsLoaded(true), 100);
  }, []);

  // ── fetch users ──
  const fetchUsers = useCallback(async (pageNum, append = false) => {
    if (!token) return;
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/users?page=${pageNum}&limit=${PAGE_LIMIT}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to fetch users");
        return;
      }

      if (append) {
        setUsers(prev => [...prev, ...data.users]);
      } else {
        setUsers(data.users);
      }
      setTotal(data.total);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [token]);

  // ── initial load once token ready ──
  useEffect(() => {
    if (token && (myRole === "admin" || myRole === "superadmin")) {
      fetchUsers(1, false);
    }
  }, [token, myRole, fetchUsers]);

  // ── view more ──
  const handleViewMore = () => {
    const next = page + 1;
    fetchUsers(next, true);
  };

  // ── change role ──
  const handleRoleChange = async (user, newRole) => {
    setChangingRole(prev => ({ ...prev, [user.usn]: true }));
    setRoleMsg(prev => ({ ...prev, [user.usn]: "" }));

    try {
      const res = await fetch("/api/admin/users/role", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUsn: user.usn, newRole }),
      });
      const data = await res.json();

      if (!res.ok) {
        setRoleMsg(prev => ({ ...prev, [user.usn]: data.error || "Failed" }));
        return;
      }

      // Update user in local list
      setUsers(prev =>
        prev.map(u =>
          u.usn === user.usn ? { ...u, role: data.user.role } : u
        )
      );
      setRoleMsg(prev => ({
        ...prev,
        [user.usn]: newRole === "admin" ? "Made admin ✓" : "Removed admin ✓",
      }));

      // Clear message after 2.5s
      setTimeout(() => {
        setRoleMsg(prev => ({ ...prev, [user.usn]: "" }));
      }, 2500);
    } catch {
      setRoleMsg(prev => ({ ...prev, [user.usn]: "Network error" }));
    } finally {
      setChangingRole(prev => ({ ...prev, [user.usn]: false }));
    }
  };

  // ── guards ──
  if (myRole === null) return null;

  const hasAccess = myRole === "admin" || myRole === "superadmin";
  const isSuperAdmin = myRole === "superadmin";

  if (!hasAccess) {
    return (
      <div className={`adm-wrapper ${isLoaded ? "adm-loaded" : ""}`}>
        <div className="adm-no-access">
          <div className="adm-no-access-icon"><FiLock size={40} /></div>
          <h2 className="adm-no-access-title">Access Denied</h2>
          <p className="adm-no-access-text">
            You don&apos;t have permission to view this page.
          </p>
          <Link href="/admin" className="adm-back-btn">
            <FiArrowLeft size={16} /> Back to Admin Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`adm-wrapper ${isLoaded ? "adm-loaded" : ""}`}>

      {/* ── Header ── */}
      <header className="adm-header">
        <div className="adm-header-content">
          <div className="adm-header-left">
            <Link href="/admin" className="au-back-link">
              <FiArrowLeft size={15} /> Admin Dashboard
            </Link>
            <div className="adm-role-badge" style={{ backgroundColor: "#3b82f6", marginTop: "0.75rem" }}>
              <FiUsers size={16} />
              <span>User Management</span>
            </div>
            <h1 className="adm-title">
              All <span className="adm-title-highlight">Users</span>
            </h1>
            <p className="adm-subtitle">
              Latest registered users — {total > 0 ? `${total} total` : "loading…"}
            </p>
          </div>
          <div className="adm-header-deco">
            <div className="adm-deco-circle" style={{ background: "#dbeafe", border: "2px solid #bfdbfe" }}>
              <FiUsers size={44} color="#3b82f6" />
            </div>
          </div>
        </div>
      </header>

      {/* ── Summary strip ── */}
      <section className="adm-summary">
        <div className="adm-summary-card adm-summary-blue">
          <div className="adm-summary-icon"><FiUsers size={20} /></div>
          <div>
            <div className="adm-summary-value">{total}</div>
            <div className="adm-summary-label">Total Users</div>
          </div>
        </div>
        <div className="adm-summary-card adm-summary-green">
          <div className="adm-summary-icon"><FiUserCheck size={20} /></div>
          <div>
            <div className="adm-summary-value">{users.filter(u => (u.role || "user") === "admin").length}</div>
            <div className="adm-summary-label">Admins (loaded)</div>
          </div>
        </div>
        <div className="adm-summary-card adm-summary-gray">
          <div className="adm-summary-icon"><FiUser size={20} /></div>
          <div>
            <div className="adm-summary-value">{users.filter(u => !u.role || u.role === "user").length}</div>
            <div className="adm-summary-label">Regular Users</div>
          </div>
        </div>
        <div className="adm-summary-card adm-summary-yellow">
          <div className="adm-summary-icon"><FiHash size={20} /></div>
          <div>
            <div className="adm-summary-value">{users.length}</div>
            <div className="adm-summary-label">Loaded</div>
          </div>
        </div>
      </section>

      {/* ── Error ── */}
      {error && (
        <div className="au-error-banner">
          {error}
        </div>
      )}

      {/* ── User list ── */}
      {loading ? (
        <div className="au-loading-state">
          <div className="au-spinner"><FiLoader size={28} /></div>
          <p>Loading users…</p>
        </div>
      ) : (
        <>
          <section className="au-users-grid">
            {users.map((user, idx) => {
              const userRole = user.role || "user";
              const isChanging = changingRole[user.usn];
              const msg = roleMsg[user.usn];
              const isOwnAccount = user.usn === myUsn;

              return (
                <div
                  key={user._id || idx}
                  className="au-user-card"
                  style={{ animationDelay: `${idx * 0.04}s` }}
                >
                  {/* Avatar + name row */}
                  <div className="au-card-top">
                    <div className="au-avatar-wrap">
                      <Image
                        src={user.profileimg || "https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp"}
                        alt={user.name}
                        width={48}
                        height={48}
                        className="au-avatar"
                      />
                    </div>
                    <div className="au-card-info">
                      <p className="au-user-name">{user.name}</p>
                      <p className="au-user-usn">{user.usn}</p>
                    </div>
                    <RoleBadge role={userRole} />
                  </div>

                  {/* Meta row */}
                  <div className="au-meta-row">
                    <span className="au-meta-item">
                      <FiCalendar size={12} />
                      Joined {formatDate(user.createdAt)}
                    </span>
                  </div>

                  {/* Role action — superadmin only, not own account */}
                  {isSuperAdmin && !isOwnAccount && (
                    <div className="au-role-action">
                      {userRole === "admin" ? (
                        <button
                          className="au-role-btn au-role-btn-remove"
                          onClick={() => handleRoleChange(user, "user")}
                          disabled={isChanging}
                        >
                          <FiUserX size={14} />
                          {isChanging ? "Updating…" : "Remove Admin"}
                        </button>
                      ) : (
                        <button
                          className="au-role-btn au-role-btn-make"
                          onClick={() => handleRoleChange(user, "admin")}
                          disabled={isChanging}
                        >
                          <FiUserCheck size={14} />
                          {isChanging ? "Updating…" : "Make Admin"}
                        </button>
                      )}
                      {msg && <span className="au-role-msg">{msg}</span>}
                    </div>
                  )}

                  {/* Own account label */}
                  {isOwnAccount && (
                    <div className="au-own-tag">You</div>
                  )}
                </div>
              );
            })}
          </section>

          {/* ── View more ── */}
          {page < totalPages && (
            <div className="au-view-more-wrap">
              <button
                className="au-view-more-btn"
                onClick={handleViewMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <span className="au-dots">
                      <span /><span /><span />
                    </span>
                    Loading…
                  </>
                ) : (
                  <>
                    <FiChevronDown size={16} />
                    View More ({total - users.length} remaining)
                  </>
                )}
              </button>
            </div>
          )}

          {/* ── All loaded ── */}
          {users.length > 0 && page >= totalPages && (
            <p className="au-all-loaded">All {total} users loaded</p>
          )}

          {/* ── Empty ── */}
          {users.length === 0 && !loading && (
            <div className="au-empty">
              <FiUsers size={36} />
              <p>No users found</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
