"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  BookOpenIcon,
  FolderIcon,
  FileTextIcon,
  InfoIcon,
  UploadIcon,
  TrendingUpIcon,
  BellIcon,
} from "@animateicons/react/lucide";
import { WrenchIcon } from "../components/icons/WrenchIcon";
import { GraduationCapIcon } from "../components/icons/GraduationCapIcon";
import "./styles/WorkspaceNavCards.css";

const navItems = [
  { href: "/learn",            Icon: GraduationCapIcon, label: "Learn",           theme: "learn",     title: "Interactive Hub",    description: "Explore study modules, concept cards & daily quizzes." },
  { href: "/materials",        Icon: BookOpenIcon,   label: "Materials",       theme: "materials", title: "Study Notes",        description: "Access peer-reviewed notes, summaries & guides." },
  { href: "/resources",        Icon: FolderIcon,     label: "Resources",       theme: "works",     title: "Academic Resources", description: "Browse homework solutions, notes & academic projects." },
  { href: "/qp",               Icon: FileTextIcon,   label: "Question Papers", theme: "qp",        title: "Past Papers",        description: "Practice authentic past exam papers for top marks." },
  { href: "/tools",            Icon: WrenchIcon,     label: "Tools",           theme: "tools",     title: "Practice Tools",     description: "Use document converters, quizzes & utility tools." },
  { href: "/help",             Icon: InfoIcon,       label: "Help",            theme: "help",      title: "Help Center",        description: "Get quick assistance, guides & platform support." },
  { href: "/resources/upload", Icon: UploadIcon,     label: "Upload",          theme: "upload",    title: "Share Work",         description: "Upload your notes & manage your subjects easily.", authRequired: true },
  { href: "/workspace",        Icon: TrendingUpIcon, label: "Workspace",       theme: "dashboard", title: "Workspace",          description: "Track saved materials, progress & workspace resources." },
  { href: "/updates",          Icon: BellIcon,       label: "Updates",         theme: "updates",   title: "Study Updates",      description: "Stay informed with real-time academic announcements." },
];

function NavCardItem({ item, resolvedHref }) {
  const iconRef = useRef(null);
  const IconComponent = item.Icon;

  const handleMouseEnter = () => {
    iconRef.current?.startAnimation?.();
  };

  const handleMouseLeave = () => {
    iconRef.current?.stopAnimation?.();
  };

  return (
    <Link
      href={resolvedHref}
      className={`dash-lnx-card dash-lnx-card--${item.theme}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span className="dash-lnx-icon-wrap" aria-hidden="true">
        <IconComponent ref={iconRef} size={22} className="dash-lnx-icon" />
      </span>
      <span className="dash-lnx-label">{item.label}</span>

      {/* Smooth Hover Popup Tooltip */}
      <span className="dash-lnx-tooltip" role="tooltip">
        <span className="dash-lnx-tooltip-title">{item.title}</span>
        <span className="dash-lnx-tooltip-desc">{item.description}</span>
      </span>
    </Link>
  );
}

export default function WorkspaceNavCards({ loggedIn }) {
  return (
    <nav className="dash-lnx-grid" aria-label="Quick navigation">
      {navItems.map((item) => {
        const resolvedHref = item.authRequired && !loggedIn ? "/login" : item.href;

        return (
          <NavCardItem
            key={item.label}
            item={item}
            resolvedHref={resolvedHref}
          />
        );
      })}
    </nav>
  );
}
