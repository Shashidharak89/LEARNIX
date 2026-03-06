"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FiArrowLeft, FiUser, FiShield, FiCalendar, FiBook,
  FiFileText, FiLoader, FiAlertCircle, FiLock, FiUnlock,
  FiHash,
} from "react-icons/fi";
import { MdAdminPanelSettings } from "react-icons/md";
import "../../AdminUsers.css";
import "../../../styles/AdminDashboard.css";
import "./styles/AdminUserProfile.css";

function RoleBadge({ role }) {
  if (role === "superadmin")
    return <span className="au-role-badge au-role-superadmin"><FiShield size={12} /> Super Admin</span>;
  if (role === "admin")
    return <span className="au-role-badge au-role-admin"><MdAdminPanelSettings size={12} /> Admin</span>;
  return <span className="au-role-badge au-role-user"><FiUser size={12} /> User</span>;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="aup-info-row">
      <span className="aup-info-icon">{icon}</span>
      <span className="aup-info-label">{label}</span>
      <span className="aup-info-value">{value}</span>
    </div>
  );
}

export default function AdminUserProfile({ params }) {
  const { usn } = use(params);

  const [token, setToken]     = useState("");
  const [myRole, setMyRole]   = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const [profile, setProfile]   = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [subjectCount, setSubjectCount] = useState(0);
  const [topicCount, setTopicCount]     = useState(0);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  useEffect(() => {
    const r = localStorage.getItem("role")  || "";
    const t = localStorage.getItem("token") || "";
    setMyRole(r);
    setToken(t);
    setTimeout(() => setIsLoaded(true), 80);
  }, []);

  useEffect(() => {
    if (!token || !usn) return;
    const fetchProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const res  = await fetch(`/api/admin/user/${encodeURIComponent(usn)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || "Failed to load profile"); return; }
        setProfile(data.user);
        setSubjects(data.subjects || []);
        setSubjectCount(data.subjectCount ?? 0);
        setTopicCount(data.topicCount   ?? 0);
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token, usn]);

  if (myRole === null) return null;

  return (
    <div className={`adm-wrapper ${isLoaded ? "adm-loaded" : ""}`}>

      {/* ── Header ── */}
      <header className="adm-header">
        <div className="adm-header-content">
          <div className="adm-header-left">
            <Link href="/admin/users" className="au-back-link">
              <FiArrowLeft size={15} /> All Users
            </Link>
            <div className="adm-role-badge" style={{ backgroundColor: "#7c3aed", marginTop: "0.75rem" }}>
              <FiUser size={16} />
              <span>User Profile</span>
            </div>
            <h1 className="adm-title">
              Profile <span className="adm-title-highlight">Details</span>
            </h1>
            <p className="adm-subtitle aup-usn-sub">
              <FiHash size={13} /> {usn?.toUpperCase()}
            </p>
          </div>
          <div className="adm-header-deco">
            <div className="adm-deco-circle" style={{ background: "#ede9fe", border: "2px solid #ddd6fe" }}>
              <FiUser size={44} color="#7c3aed" />
            </div>
          </div>
        </div>
      </header>

      {/* ── Loading ── */}
      {loading && (
        <div className="au-loading-state">
          <div className="au-spinner"><FiLoader size={28} /></div>
          <p>Loading profile…</p>
        </div>
      )}

      {/* ── Error ── */}
      {!loading && error && (
        <div className="aup-error">
          <FiAlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* ── Content ── */}
      {!loading && !error && profile && (
        <div className="aup-content">

          {/* ── Profile card ── */}
          <div className="aup-profile-card">
            <div className="aup-avatar-section">
              <Image
                src={profile.profileimg || "https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp"}
                alt={profile.name}
                width={88}
                height={88}
                className="aup-avatar"
              />
              <div className="aup-avatar-info">
                <h2 className="aup-name">{profile.name}</h2>
                <p className="aup-usn">{profile.usn}</p>
                <RoleBadge role={profile.role} />
              </div>
            </div>

            <div className="aup-divider" />

            <div className="aup-info-list">
              <InfoRow
                icon={<FiCalendar size={14} />}
                label="Joined"
                value={formatDate(profile.createdAt)}
              />
              <InfoRow
                icon={<FiBook size={14} />}
                label="Subjects"
                value={subjectCount}
              />
              <InfoRow
                icon={<FiFileText size={14} />}
                label="Topics"
                value={topicCount}
              />
              <InfoRow
                icon={profile.role === "user" ? <FiUnlock size={14} /> : <FiLock size={14} />}
                label="Role"
                value={profile.role === "superadmin" ? "Super Admin" : profile.role === "admin" ? "Admin" : "User"}
              />
            </div>
          </div>

          {/* ── Stat strips ── */}
          <section className="adm-summary aup-stats">
            <div className="adm-summary-card adm-summary-blue">
              <div className="adm-summary-icon"><FiBook size={20} /></div>
              <div>
                <div className="adm-summary-value">{subjectCount}</div>
                <div className="adm-summary-label">Subjects</div>
              </div>
            </div>
            <div className="adm-summary-card adm-summary-green">
              <div className="adm-summary-icon"><FiFileText size={20} /></div>
              <div>
                <div className="adm-summary-value">{topicCount}</div>
                <div className="adm-summary-label">Topics</div>
              </div>
            </div>
            <div className="adm-summary-card adm-summary-yellow">
              <div className="adm-summary-icon"><FiCalendar size={20} /></div>
              <div>
                <div className="adm-summary-value">{formatDate(profile.createdAt)}</div>
                <div className="adm-summary-label">Joined</div>
              </div>
            </div>
          </section>

          {/* ── Subjects list ── */}
          {subjects.length > 0 && (
            <section className="aup-subjects-section">
              <h3 className="aup-section-title">
                <FiBook size={16} /> Subjects ({subjectCount})
              </h3>
              <div className="aup-subjects-grid">
                {subjects.map((sub, i) => (
                  <div key={sub._id || i} className="aup-subject-card">
                    <div className="aup-subject-top">
                      <span className="aup-subject-name">{sub.subject}</span>
                      <span className={`aup-subject-vis ${sub.public ? "aup-vis-pub" : "aup-vis-priv"}`}>
                        {sub.public ? <><FiUnlock size={10} /> Public</> : <><FiLock size={10} /> Private</>}
                      </span>
                    </div>
                    <p className="aup-subject-date">
                      <FiCalendar size={11} /> Created {formatDate(sub.createdAt)}
                    </p>
                    <Link
                      href={`/works/subject/${sub._id}`}
                      target="_blank"
                      className="aup-subject-link"
                    >
                      View Subject →
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}

          {subjects.length === 0 && (
            <div className="aup-empty-subjects">
              <FiBook size={32} />
              <p>No subjects yet</p>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
