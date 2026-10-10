"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FiShield,
  FiUsers,
  FiFileText,
  FiArrowRight,
  FiMessageCircle,
  FiBook,
  FiTool,
} from "react-icons/fi";
import { MdAdminPanelSettings, MdOutlineSupervisorAccount } from "react-icons/md";
import "./styles/AdminDashboard.css";
import AdminRequestMetrics from "./AdminRequestMetrics";
import AdminLeaderboard from "./AdminLeaderboard";

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
    setTimeout(() => setIsLoaded(true), 100);
  }, []);

  // Guard: still loading localStorage
  if (role === null) return null;

  const isAdmin = role === "admin";
  const isSuperAdmin = role === "superadmin";
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.admin;

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

      {/* ── Role privilege note ── */}
      <div className="adm-role-note" style={{ background: cfg.bgColor, borderColor: cfg.borderColor }}>
        <span style={{ color: cfg.color }}>{cfg.icon}</span>
        <p style={{ color: cfg.color }}>
          {isSuperAdmin
            ? "As Super Admin you have unrestricted access to all Learnix systems, management tools, and administrative operations."
            : "As Admin you have elevated access to manage platform content, updates, and users. System-level operations require Super Admin."}
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

        <Link href="/admin/feedbacks" className="adm-quick-btn adm-quick-btn-pink">
          <span className="adm-quick-btn-icon adm-quick-btn-icon-pink"><FiMessageCircle size={20} /></span>
          <div className="adm-quick-btn-text">
            <span className="adm-quick-btn-label">Feedbacks</span>
            <span className="adm-quick-btn-sub">Read all user feedback submissions</span>
          </div>
          <FiArrowRight size={18} className="adm-quick-btn-arrow" />
        </Link>

        <Link href="/admin/updates" className="adm-quick-btn adm-quick-btn-purple">
          <span className="adm-quick-btn-icon adm-quick-btn-icon-purple"><FiBook size={20} /></span>
          <div className="adm-quick-btn-text">
            <span className="adm-quick-btn-label">Updates</span>
            <span className="adm-quick-btn-sub">View and manage platform updates</span>
          </div>
          <FiArrowRight size={18} className="adm-quick-btn-arrow" />
        </Link>

        <Link href="/admin/qp" className="adm-quick-btn adm-quick-btn-green" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
          <span className="adm-quick-btn-icon" style={{ background: '#d1fae5', color: '#10b981' }}><FiFileText size={20} /></span>
          <div className="adm-quick-btn-text">
            <span className="adm-quick-btn-label">QP Management</span>
            <span className="adm-quick-btn-sub">Manage QP Universities, Subjects, and Exams</span>
          </div>
          <FiArrowRight size={18} className="adm-quick-btn-arrow" />
        </Link>

        <Link href="/admin/study-materials" className="adm-quick-btn" style={{ background: 'rgba(124, 58, 237, 0.1)', borderColor: 'rgba(124, 58, 237, 0.2)' }}>
          <span className="adm-quick-btn-icon" style={{ background: '#ede9fe', color: '#7c3aed' }}><FiBook size={20} /></span>
          <div className="adm-quick-btn-text">
            <span className="adm-quick-btn-label">Study Materials</span>
            <span className="adm-quick-btn-sub">Manage Universities, Colleges, Subjects, and Files</span>
          </div>
          <FiArrowRight size={18} className="adm-quick-btn-arrow" />
        </Link>

        <Link href="/admin/resources" className="adm-quick-btn" style={{ background: 'rgba(99, 102, 241, 0.1)', borderColor: 'rgba(99, 102, 241, 0.2)' }}>
          <span className="adm-quick-btn-icon" style={{ background: '#e0e7ff', color: '#4f46e5' }}><FiFileText size={20} /></span>
          <div className="adm-quick-btn-text">
            <span className="adm-quick-btn-label">Resource Management</span>
            <span className="adm-quick-btn-sub">Subjects, Topics, Moderation &amp; Transfers</span>
          </div>
          <FiArrowRight size={18} className="adm-quick-btn-arrow" />
        </Link>

        <Link href="/admin/tools" className="adm-quick-btn" style={{ background: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
          <span className="adm-quick-btn-icon" style={{ background: '#fef3c7', color: '#d97706' }}><FiTool size={20} /></span>
          <div className="adm-quick-btn-text">
            <span className="adm-quick-btn-label">Tools Management</span>
            <span className="adm-quick-btn-sub">Shared Files, Texts &amp; Codes</span>
          </div>
          <FiArrowRight size={18} className="adm-quick-btn-arrow" />
        </Link>
      </div>

      {/* ── Streaks Leaderboard (Highest & Active) ── */}
      <AdminLeaderboard token={token} />

      <AdminRequestMetrics role={role} />

    </div>
  );
}
