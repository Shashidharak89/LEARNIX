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
} from "react-icons/fi";
import { HiAcademicCap } from "react-icons/hi";
import "./styles/HeroNavCards.css";

const navItems = [
  { href: "/learn",     Icon: HiAcademicCap, label: "Learn",           theme: "learn" },
  { href: "/search",    Icon: FiSearch,      label: "Search",          theme: "search" },
  { href: "/materials", Icon: FiBookOpen,    label: "Materials",       theme: "materials" },
  { href: "/qp",        Icon: FiFileText,    label: "Question Papers", theme: "qp" },
  { href: "/tools",     Icon: FiTool,        label: "Tools",           theme: "tools" },
  { href: "/help",      Icon: FiHelpCircle,  label: "Help",            theme: "help" },
  { href: "/upload",    Icon: FiUpload,      label: "Upload",          theme: "upload", authRequired: true },
  { href: "/dashboard", Icon: FiTrendingUp,  label: "Dashboard",       theme: "dashboard" },
  { href: "/updates",   Icon: FiBell,        label: "Updates",         theme: "updates" },
];

export default function HeroNavCards({ loggedIn }) {
  return (
    <nav className="lnx-grid" aria-label="Quick navigation">
      {navItems.map(({ href, Icon, label, theme, authRequired }) => {
        const resolvedHref = authRequired && !loggedIn ? "/login" : href;

        return (
          <Link
            key={label}
            href={resolvedHref}
            className={`lnx-card lnx-card--${theme}`}
          >
            <span className="lnx-icon-wrap" aria-hidden="true">
              <Icon className="lnx-icon" />
            </span>
            <span className="lnx-label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}