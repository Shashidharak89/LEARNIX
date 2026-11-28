"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FiShield,
  FiUsers,
  FiFileText,
  FiMessageCircle,
  FiBook,
  FiTool,
  FiCode,
  FiDatabase,
  FiSearch,
  FiCreditCard,
  FiArrowUpRight,
} from "react-icons/fi";
import { MdAdminPanelSettings, MdOutlineSupervisorAccount } from "react-icons/md";
import "./styles/AdminDashboard.css";
import AdminRequestMetrics from "./AdminRequestMetrics";
import AdminLeaderboard from "./AdminLeaderboard";

// ─── Privilege config per role ────────────────────────────────────────────────
const ROLE_CONFIG = {
  superadmin: {
    label: "Super Admin",
    color: "#dc2626",
    bgColor: "#fef2f2",
    borderColor: "rgba(220, 38, 38, 0.2)",
    badgeBg: "#dc2626",
    icon: <MdAdminPanelSettings size={18} />,
    tagline: "Full unrestricted access to all Learnix administrative operations",
  },
  admin: {
    label: "Admin",
    color: "#0b74ff",
    bgColor: "#eff6ff",
    borderColor: "rgba(11, 116, 255, 0.2)",
    badgeBg: "#0b74ff",
    icon: <MdOutlineSupervisorAccount size={18} />,
    tagline: "Elevated access to manage platform content, materials & users",
  },
};

// ─── Navigation links ──────────────────────────────────────────────────────────
const ADMIN_NAV_ITEMS = [
  {
    href: "/admin/users",
    title: "User Management",
    icon: <FiUsers size={20} />,
    colorTheme: "blue",
  },
  {
    href: "/admin/feedbacks",
    title: "Feedbacks",
    icon: <FiMessageCircle size={20} />,
    colorTheme: "pink",
  },
  {
    href: "/admin/updates",
    title: "Updates",
    icon: <FiBook size={20} />,
    colorTheme: "amber",
  },
  {
    href: "/admin/qp",
    title: "QP Management",
    icon: <FiFileText size={20} />,
    colorTheme: "emerald",
  },
  {
    href: "/admin/study-materials",
    title: "Study Materials",
    icon: <FiBook size={20} />,
    colorTheme: "purple",
  },
  {
    href: "/admin/resources",
    title: "Resource Management",
    icon: <FiFileText size={20} />,
    colorTheme: "indigo",
  },
  {
    href: "/admin/tools",
    title: "Tools Management",
    icon: <FiTool size={20} />,
    colorTheme: "amber",
  },
  {
    href: "/admin/coding",
    title: "Coding Problems",
    icon: <FiCode size={20} />,
    colorTheme: "sky",
  },
  {
    href: "/admin/database",
    title: "Database Management",
    icon: <FiDatabase size={20} />,
    colorTheme: "blue",
  },
  {
    href: "/admin/searches",
    title: "Searches",
    icon: <FiSearch size={20} />,
    colorTheme: "amber",
  },
  {
    href: "/admin/payments",
    title: "Payments",
    icon: <FiCreditCard size={20} />,
    colorTheme: "emerald",
  },
];

// ─── Main component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [role, setRole] = useState(null);
  const [name, setName] = useState(null);
  const [usn, setUsn] = useState(null);
  const [token, setToken] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const storedRole = localStorage.getItem("role") || "";
    const storedName = localStorage.getItem("name") || "";
    const storedUsn = localStorage.getItem("usn") || "";
    const storedToken = localStorage.getItem("token") || "";
    setRole(storedRole);
    setName(storedName);
    setUsn(storedUsn);
    setToken(storedToken);
    setTimeout(() => setIsLoaded(true), 60);
  }, []);

  // Guard: still loading localStorage
  if (role === null) return null;

  const isSuperAdmin = role === "superadmin";
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.admin;

  return (
    <div className={`adm-wrapper ${isLoaded ? "adm-loaded" : ""}`}>
      <main className="adm-main">

        {/* ── Apple-style Hero Intro Widget ── */}
        <div className="adm-intro-card">
          <div className="adm-intro-header">
            <div className="adm-intro-left">
              <div className="adm-role-badge" style={{ backgroundColor: cfg.badgeBg }}>
                {cfg.icon}
                <span>{cfg.label}</span>
              </div>
              <h1 className="adm-title">
                Admin <span className="adm-title-highlight">Control Panel</span>
              </h1>
              <p className="adm-subtitle">{cfg.tagline}</p>
              {name && (
                <div className="adm-identity">
                  <span>Signed in as <strong>{name}</strong></span>
                  {usn && <span className="adm-usn-chip">{usn}</span>}
                </div>
              )}
            </div>

            <div className="adm-intro-right">
              <div
                className="adm-shield-orb"
                style={{
                  background: cfg.bgColor,
                  border: `1.5px solid ${cfg.borderColor}`,
                  color: cfg.color,
                }}
              >
                <FiShield size={36} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Role Privilege Notice Widget ── */}
        <div
          className="adm-role-note"
          style={{ background: cfg.bgColor, borderColor: cfg.borderColor }}
        >
          <span className="adm-role-note-icon" style={{ color: cfg.color }}>
            {cfg.icon}
          </span>
          <p style={{ color: cfg.color }}>
            {isSuperAdmin
              ? "Super Admin access active: You have full permissions over all platform data, backups, moderation, and infrastructure controls."
              : "Admin access active: You can manage curriculum materials, updates, tools, and user contributions."}
          </p>
        </div>

        {/* ── Navigation Grid (Clean, titles only, Apple rounded widgets) ── */}
        <div className="adm-nav-section">
          <div className="adm-nav-section-head">
            <h2 className="adm-nav-section-title">Navigation</h2>
          </div>
          <div className="adm-nav-grid">
            {ADMIN_NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`adm-nav-card adm-nav-card--${item.colorTheme}`}
              >
                <div className="adm-nav-card-icon">{item.icon}</div>
                <span className="adm-nav-card-title">{item.title}</span>
                <span className="adm-nav-card-arrow">
                  <FiArrowUpRight size={18} />
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Streaks Leaderboard (Highest & Active) ── */}
        <AdminLeaderboard token={token} />

        {/* ── Platform Request Metrics ── */}
        <AdminRequestMetrics role={role} />

      </main>
    </div>
  );
}
