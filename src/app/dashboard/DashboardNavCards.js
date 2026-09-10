"use client";

import Link from "next/link";
import {
  FiBookOpen,
  FiTrendingUp,
  FiSearch,
  FiTool,
  FiHelpCircle,
  FiUpload,
  FiFileText,
  FiBell,
  FiFolder,
} from "react-icons/fi";
import { HiAcademicCap } from "react-icons/hi";
import "./styles/DashboardNavCards.css";

const navItems = [
  { href: "/learn",     Icon: HiAcademicCap, label: "Learn",           theme: "learn",     title: "Interactive Hub", description: "Explore study modules, concept cards & daily quizzes." },
  { href: "/search",    Icon: FiSearch,      label: "Search",          theme: "search",    title: "Instant Search",  description: "Search notes, topics & past papers for your courses." },
  { href: "/materials", Icon: FiBookOpen,    label: "Materials",       theme: "materials", title: "Study Notes",     description: "Access peer-reviewed notes, summaries & guides." },
  { href: "/works",     Icon: FiFolder,      label: "Works",           theme: "works",     title: "Student Works",   description: "Browse homework solutions & student projects." },
  { href: "/qp",        Icon: FiFileText,    label: "Question Papers", theme: "qp",        title: "Past Papers",     description: "Practice authentic past exam papers for top marks." },
  { href: "/tools",     Icon: FiTool,        label: "Tools",           theme: "tools",     title: "Practice Tools",  description: "Use document converters, quizzes & utility tools." },
  { href: "/help",      Icon: FiHelpCircle,  label: "Help",            theme: "help",      title: "Help Center",     description: "Get quick assistance, guides & platform support." },
  { href: "/upload",    Icon: FiUpload,      label: "Upload",          theme: "upload",    title: "Share Work",      description: "Upload your notes & manage your subjects easily.", authRequired: true },
  { href: "/dashboard", Icon: FiTrendingUp,  label: "Dashboard",       theme: "dashboard", title: "My Dashboard",    description: "Track saved materials, progress & contribution metrics." },
  { href: "/updates",   Icon: FiBell,        label: "Updates",         theme: "updates",   title: "Study Updates",   description: "Stay informed with real-time academic announcements." },
];

export default function DashboardNavCards({ loggedIn }) {
  return (
    <nav className="dash-lnx-grid" aria-label="Quick navigation">
      {navItems.map(({ href, Icon, label, theme, title, description, authRequired }) => {
        const resolvedHref = authRequired && !loggedIn ? "/login" : href;

        return (
          <Link
            key={label}
            href={resolvedHref}
            className={`dash-lnx-card dash-lnx-card--${theme}`}
          >
            <span className="dash-lnx-icon-wrap" aria-hidden="true">
              <Icon className="dash-lnx-icon" />
            </span>
            <span className="dash-lnx-label">{label}</span>

            {/* Smooth Hover Popup Tooltip */}
            <span className="dash-lnx-tooltip" role="tooltip">
              <span className="dash-lnx-tooltip-title">{title}</span>
              <span className="dash-lnx-tooltip-desc">{description}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
