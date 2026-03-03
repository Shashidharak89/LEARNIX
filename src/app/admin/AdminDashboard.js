"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FiShield,
  FiUsers,
  FiFileText,
  FiTrash2,
  FiEdit3,
  FiEye,
  FiToggleLeft,
  FiToggleRight,
  FiBell,
  FiBarChart2,
  FiSettings,
  FiAlertTriangle,
  FiArrowRight,
  FiLock,
  FiDatabase,
  FiStar,
  FiFlag,
  FiMessageCircle,
  FiCheckCircle,
  FiXCircle,
  FiUpload,
  FiBook,
} from "react-icons/fi";
import { MdAdminPanelSettings, MdOutlineSupervisorAccount } from "react-icons/md";
import "./styles/AdminDashboard.css";

// ─── Privilege config per role ────────────────────────────────────────────────
const ROLE_CONFIG = {
  superadmin: {
    label: "Super Admin",
    color: "#dc2626",       // red-600
    bgColor: "#fef2f2",
    borderColor: "#fecaca",
    badgeBg: "#dc2626",
    icon: <MdAdminPanelSettings size={22} />,
    tagline: "Full unrestricted access to all Learnix systems",
  },
  admin: {
    label: "Admin",
    color: "#7c3aed",       // violet-600
    bgColor: "#f5f3ff",
    borderColor: "#ddd6fe",
    badgeBg: "#7c3aed",
    icon: <MdOutlineSupervisorAccount size={22} />,
    tagline: "Elevated access to manage platform content & users",
  },
};

// ─── Feature definitions ──────────────────────────────────────────────────────
// access: "full" | "limited" | "none"
const FEATURES = [
  {
    id: "user-management",
    icon: <FiUsers size={22} />,
    title: "User Management",
    desc: "View, search and manage all registered users. Update user info, reset passwords, and control account status.",
    iconBg: "#dbeafe",
    iconColor: "#3b82f6",
    privileges: [
      { label: "View all users",             admin: "full",    superadmin: "full"    },
      { label: "Edit user profile & name",   admin: "full",    superadmin: "full"    },
      { label: "Suspend / Deactivate user",  admin: "limited", superadmin: "full"    },
      { label: "Delete user permanently",    admin: "none",    superadmin: "full"    },
      { label: "Assign / change user roles", admin: "none",    superadmin: "full"    },
      { label: "Reset user password",        admin: "limited", superadmin: "full"    },
    ],
  },
  {
    id: "content-moderation",
    icon: <FiFileText size={22} />,
    title: "Content Moderation",
    desc: "Review, approve, hide or remove uploaded works, topics and subject content across the platform.",
    iconBg: "#fef3c7",
    iconColor: "#f59e0b",
    privileges: [
      { label: "View all topics & works",    admin: "full",    superadmin: "full"    },
      { label: "Edit topic content",         admin: "full",    superadmin: "full"    },
      { label: "Hide / unpublish content",   admin: "full",    superadmin: "full"    },
      { label: "Delete topics permanently",  admin: "limited", superadmin: "full"    },
      { label: "Bulk delete content",        admin: "none",    superadmin: "full"    },
      { label: "Feature / pin topics",       admin: "full",    superadmin: "full"    },
    ],
  },
  {
    id: "reported-content",
    icon: <FiFlag size={22} />,
    title: "Reported Content",
    desc: "Handle user reports on inappropriate or incorrect content. Review flags and take moderation actions.",
    iconBg: "#fee2e2",
    iconColor: "#ef4444",
    privileges: [
      { label: "View reported content",      admin: "full",    superadmin: "full"    },
      { label: "Dismiss / resolve reports",  admin: "full",    superadmin: "full"    },
      { label: "Warn content owner",         admin: "full",    superadmin: "full"    },
      { label: "Escalate reports",           admin: "full",    superadmin: "full"    },
      { label: "View reporter identity",     admin: "limited", superadmin: "full"    },
    ],
  },
  {
    id: "uploads-files",
    icon: <FiUpload size={22} />,
    title: "Uploads & Files",
    desc: "Manage all file uploads including PDFs, images and documents. Review storage usage and remove stale files.",
    iconBg: "#d1fae5",
    iconColor: "#10b981",
    privileges: [
      { label: "View all uploaded files",    admin: "full",    superadmin: "full"    },
      { label: "Download any file",          admin: "full",    superadmin: "full"    },
      { label: "Delete files",               admin: "limited", superadmin: "full"    },
      { label: "Manage Cloudinary storage",  admin: "none",    superadmin: "full"    },
      { label: "Storage usage analytics",    admin: "full",    superadmin: "full"    },
    ],
  },
  {
    id: "study-materials",
    icon: <FiBook size={22} />,
    title: "Study Materials",
    desc: "Control the official study materials, add new resources, update links and manage subject/semester data.",
    iconBg: "#ede9fe",
    iconColor: "#7c3aed",
    privileges: [
      { label: "View all materials",         admin: "full",    superadmin: "full"    },
      { label: "Add new material entries",   admin: "full",    superadmin: "full"    },
      { label: "Edit material metadata",     admin: "full",    superadmin: "full"    },
      { label: "Delete material entries",    admin: "limited", superadmin: "full"    },
      { label: "Publish / unpublish materials", admin: "full", superadmin: "full"   },
    ],
  },
  {
    id: "feedback-reviews",
    icon: <FiMessageCircle size={22} />,
    title: "Feedback & Reviews",
    desc: "Read user feedback and review submissions. Respond on behalf of the platform and archive old entries.",
    iconBg: "#fce7f3",
    iconColor: "#ec4899",
    privileges: [
      { label: "Read all feedback",          admin: "full",    superadmin: "full"    },
      { label: "Reply to feedback",          admin: "full",    superadmin: "full"    },
      { label: "Delete feedback entries",    admin: "limited", superadmin: "full"    },
      { label: "Export feedback data",       admin: "none",    superadmin: "full"    },
    ],
  },
  {
    id: "notifications",
    icon: <FiBell size={22} />,
    title: "Notifications & Announcements",
    desc: "Send platform-wide announcements and manage notification delivery to users.",
    iconBg: "#fef3c7",
    iconColor: "#d97706",
    privileges: [
      { label: "View all notifications",     admin: "full",    superadmin: "full"    },
      { label: "Send announcements",         admin: "limited", superadmin: "full"    },
      { label: "Broadcast to all users",     admin: "none",    superadmin: "full"    },
      { label: "Delete notifications",       admin: "limited", superadmin: "full"    },
    ],
  },
  {
    id: "analytics",
    icon: <FiBarChart2 size={22} />,
    title: "Analytics & Reports",
    desc: "Access platform-wide usage statistics, traffic reports, and user activity summaries.",
    iconBg: "#dbeafe",
    iconColor: "#2563eb",
    privileges: [
      { label: "View usage stats",           admin: "full",    superadmin: "full"    },
      { label: "View user activity logs",    admin: "limited", superadmin: "full"    },
      { label: "Export analytics data",      admin: "none",    superadmin: "full"    },
      { label: "Access raw DB metrics",      admin: "none",    superadmin: "full"    },
    ],
  },
  {
    id: "platform-settings",
    icon: <FiSettings size={22} />,
    title: "Platform Settings",
    desc: "Configure global platform settings, feature toggles, maintenance mode and environment configuration.",
    iconBg: "#f3f4f6",
    iconColor: "#374151",
    privileges: [
      { label: "View platform settings",     admin: "full",    superadmin: "full"    },
      { label: "Toggle feature flags",       admin: "none",    superadmin: "full"    },
      { label: "Enable maintenance mode",    admin: "none",    superadmin: "full"    },
      { label: "Modify env configuration",   admin: "none",    superadmin: "full"    },
      { label: "Manage API keys",            admin: "none",    superadmin: "full"    },
    ],
  },
  {
    id: "database",
    icon: <FiDatabase size={22} />,
    title: "Database & Backups",
    desc: "Access MongoDB collections, trigger manual backups and restore from snapshots.",
    iconBg: "#f0fdf4",
    iconColor: "#16a34a",
    privileges: [
      { label: "View collection counts",     admin: "full",    superadmin: "full"    },
      { label: "Run read-only queries",      admin: "none",    superadmin: "full"    },
      { label: "Trigger manual backup",      admin: "none",    superadmin: "full"    },
      { label: "Restore from backup",        admin: "none",    superadmin: "full"    },
      { label: "Drop / truncate collection", admin: "none",    superadmin: "full"    },
    ],
  },
];

// ─── Privilege badge component ────────────────────────────────────────────────
function PrivilegeBadge({ access }) {
  if (access === "full") {
    return (
      <span className="adm-priv-badge adm-priv-full">
        <FiCheckCircle size={12} /> Full
      </span>
    );
  }
  if (access === "limited") {
    return (
      <span className="adm-priv-badge adm-priv-limited">
        <FiAlertTriangle size={12} /> Limited
      </span>
    );
  }
  return (
    <span className="adm-priv-badge adm-priv-none">
      <FiXCircle size={12} /> No Access
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [role, setRole] = useState(null);
  const [name, setName] = useState(null);
  const [usn, setUsn] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);

  useEffect(() => {
    const storedRole = localStorage.getItem("role") || "";
    const storedName = localStorage.getItem("name") || "";
    const storedUsn  = localStorage.getItem("usn")  || "";
    setRole(storedRole);
    setName(storedName);
    setUsn(storedUsn);
    setTimeout(() => setIsLoaded(true), 100);
  }, []);

  // Guard: not logged in or not an admin
  if (role === null) return null; // still loading

  const isAdmin      = role === "admin";
  const isSuperAdmin = role === "superadmin";
  const hasAccess    = isAdmin || isSuperAdmin;

  if (!hasAccess) {
    return (
      <div className={`adm-wrapper ${isLoaded ? "adm-loaded" : ""}`}>
        <div className="adm-no-access">
          <div className="adm-no-access-icon">
            <FiLock size={40} />
          </div>
          <h2 className="adm-no-access-title">Access Denied</h2>
          <p className="adm-no-access-text">
            You don&apos;t have permission to view this page.
            This area is restricted to admins only.
          </p>
          <Link href="/dashboard" className="adm-back-btn">
            <FiArrowRight size={16} style={{ transform: "rotate(180deg)" }} />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.admin;
  const totalFeatures = FEATURES.length;
  const fullAccess    = FEATURES.reduce((acc, f) =>
    acc + f.privileges.filter(p => p[role] === "full").length, 0);
  const limitedAccess = FEATURES.reduce((acc, f) =>
    acc + f.privileges.filter(p => p[role] === "limited").length, 0);
  const noAccess      = FEATURES.reduce((acc, f) =>
    acc + f.privileges.filter(p => p[role] === "none").length, 0);

  return (
    <div className={`adm-wrapper ${isLoaded ? "adm-loaded" : ""}`}>

      {/* ── Header ── */}
      <header className="adm-header">
        <div className="adm-header-content">
          <div className="adm-header-left">
            <div className="adm-role-badge" style={{ backgroundColor: cfg.badgeBg }}>
              {cfg.icon}
              <span>{cfg.label}</span>
            </div>
            <h1 className="adm-title">
              Admin <span className="adm-title-highlight">Dashboard</span>
            </h1>
            <p className="adm-subtitle">{cfg.tagline}</p>
            {name && (
              <p className="adm-identity">
                Signed in as <strong>{name}</strong>
                {usn && <span className="adm-usn-chip">{usn}</span>}
              </p>
            )}
          </div>
          <div className="adm-header-deco">
            <div className="adm-deco-circle" style={{ background: cfg.bgColor, border: `2px solid ${cfg.borderColor}` }}>
              <FiShield size={48} color={cfg.color} />
            </div>
          </div>
        </div>
      </header>

      {/* ── Access summary cards ── */}
      <section className="adm-summary">
        <div className="adm-summary-card adm-summary-blue">
          <div className="adm-summary-icon"><FiStar size={20} /></div>
          <div>
            <div className="adm-summary-value">{totalFeatures}</div>
            <div className="adm-summary-label">Feature Areas</div>
          </div>
        </div>
        <div className="adm-summary-card adm-summary-green">
          <div className="adm-summary-icon"><FiCheckCircle size={20} /></div>
          <div>
            <div className="adm-summary-value">{fullAccess}</div>
            <div className="adm-summary-label">Full Privileges</div>
          </div>
        </div>
        <div className="adm-summary-card adm-summary-yellow">
          <div className="adm-summary-icon"><FiAlertTriangle size={20} /></div>
          <div>
            <div className="adm-summary-value">{limitedAccess}</div>
            <div className="adm-summary-label">Limited Privileges</div>
          </div>
        </div>
        {isSuperAdmin && (
          <div className="adm-summary-card adm-summary-red">
            <div className="adm-summary-icon"><FiShield size={20} /></div>
            <div>
              <div className="adm-summary-value">All</div>
              <div className="adm-summary-label">Unrestricted Access</div>
            </div>
          </div>
        )}
        {isAdmin && (
          <div className="adm-summary-card adm-summary-gray">
            <div className="adm-summary-icon"><FiLock size={20} /></div>
            <div>
              <div className="adm-summary-value">{noAccess}</div>
              <div className="adm-summary-label">Restricted</div>
            </div>
          </div>
        )}
      </section>

      {/* ── Role privilege note ── */}
      <div className="adm-role-note" style={{ background: cfg.bgColor, borderColor: cfg.borderColor }}>
        <span style={{ color: cfg.color }}>{cfg.icon}</span>
        <p style={{ color: cfg.color }}>
          {isSuperAdmin
            ? "As Super Admin you have unrestricted access to every feature below including destructive and system-level operations."
            : "As Admin you have elevated access to content and user management. Destructive, system-level, and database operations require Super Admin."}
        </p>
      </div>

      {/* ── Quick action buttons ── */}
      <div className="adm-quick-actions">
        <Link href="/admin/users" className="adm-quick-btn adm-quick-btn-blue">
          <span className="adm-quick-btn-icon"><FiUsers size={20} /></span>
          <div className="adm-quick-btn-text">
            <span className="adm-quick-btn-label">User Management</span>
            <span className="adm-quick-btn-sub">View &amp; manage all registered users</span>
          </div>
          <FiArrowRight size={18} className="adm-quick-btn-arrow" />
        </Link>
      </div>

      {/* ── Feature cards ── */}
      <section className="adm-features-section">
        <h2 className="adm-section-title">Feature Areas & Your Privileges</h2>
        <p className="adm-section-sub">
          Click any card to expand the detailed privilege breakdown for your role.
        </p>

        <div className="adm-features-grid">
          {FEATURES.map((feature) => {
            const isExpanded = expandedCard === feature.id;
            const myPrivileges = feature.privileges;
            const myFull    = myPrivileges.filter(p => p[role] === "full").length;
            const myLimited = myPrivileges.filter(p => p[role] === "limited").length;
            const myNone    = myPrivileges.filter(p => p[role] === "none").length;

            return (
              <div
                key={feature.id}
                className={`adm-feature-card ${isExpanded ? "adm-feature-expanded" : ""}`}
                onClick={() => setExpandedCard(isExpanded ? null : feature.id)}
              >
                {/* Card header */}
                <div className="adm-feature-top">
                  <div className="adm-feature-icon-wrap" style={{ background: feature.iconBg, color: feature.iconColor }}>
                    {feature.icon}
                  </div>
                  <div className="adm-feature-meta">
                    <h3 className="adm-feature-title">{feature.title}</h3>
                    <div className="adm-feature-pill-row">
                      {myFull > 0    && <span className="adm-pill adm-pill-green">{myFull} full</span>}
                      {myLimited > 0 && <span className="adm-pill adm-pill-yellow">{myLimited} limited</span>}
                      {myNone > 0    && <span className="adm-pill adm-pill-gray">{myNone} restricted</span>}
                    </div>
                  </div>
                  <div className="adm-feature-chevron">{isExpanded ? "▲" : "▼"}</div>
                </div>

                <p className="adm-feature-desc">{feature.desc}</p>

                {/* Expanded privilege table */}
                {isExpanded && (
                  <div className="adm-priv-table">
                    <div className="adm-priv-table-head">
                      <span>Privilege</span>
                      <span>Your Access</span>
                    </div>
                    {myPrivileges.map((priv, idx) => (
                      <div key={idx} className="adm-priv-row">
                        <span className="adm-priv-label">{priv.label}</span>
                        <PrivilegeBadge access={priv[role]} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Coming soon banner ── */}
      <div className="adm-coming-soon">
        <div className="adm-coming-icon"><FiSettings size={28} /></div>
        <div>
          <h3 className="adm-coming-title">Live Admin Controls Coming Soon</h3>
          <p className="adm-coming-text">
            The interactive admin controls (user management, content actions, analytics charts) are currently under development.
            This page shows your role and the full privilege map for your access level.
          </p>
        </div>
      </div>

    </div>
  );
}
