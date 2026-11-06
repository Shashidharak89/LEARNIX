"use client";

import React, { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiChevronDown } from "react-icons/fi";
import { LayersIcon } from "./icons/LayersIcon";
import { WrenchIcon } from "./icons/WrenchIcon";
import { GraduationCapIcon } from "./icons/GraduationCapIcon";
import {
  ShieldCheckIcon,
  LogInIcon,
  FolderIcon,
  BellIcon,
  BookOpenIcon,
  ClipboardIcon,
  BookmarkIcon,
  UserIcon,
  LogOutIcon,
  SparklesIcon,
  XIcon,
} from "@animateicons/react/lucide";

function SidebarLink({
  href,
  onClick,
  icon: Icon,
  logoSrc,
  text,
  tabIndex,
  className = "",
}) {
  const iconRef = useRef(null);

  const handleMouseEnter = () => {
    iconRef.current?.startAnimation?.();
  };

  const handleMouseLeave = () => {
    iconRef.current?.stopAnimation?.();
  };

  return (
    <Link
      href={href}
      className={`learnix-nav-item ${className}`.trim()}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      tabIndex={tabIndex}
    >
      <span className="learnix-nav-icon">
        {logoSrc ? (
          <Image
            src={logoSrc}
            alt={text}
            width={18}
            height={18}
            style={{ objectFit: "contain", borderRadius: "4px" }}
          />
        ) : (
          Icon && <Icon ref={iconRef} size={18} />
        )}
      </span>
      <span className="learnix-nav-text">{text}</span>
    </Link>
  );
}

function WorkspaceSidebarItem({ isOpen, onClose }) {
  const iconRef = useRef(null);

  const handleMouseEnter = () => {
    iconRef.current?.startAnimation?.();
  };

  const handleMouseLeave = () => {
    iconRef.current?.stopAnimation?.();
  };

  return (
    <div
      className="learnix-workspace-menu-group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link
        href="/workspace"
        className="learnix-nav-item learnix-workspace-parent-link"
        onClick={onClose}
        tabIndex={isOpen ? 0 : -1}
      >
        <span className="learnix-nav-icon">
          <LayersIcon ref={iconRef} size={18} />
        </span>
        <span className="learnix-nav-text">Workspace</span>
        <span className="learnix-workspace-arrow">
          <FiChevronDown size={15} />
        </span>
      </Link>

      {/* Popdown Subitems: Manage Updates & Manage Resources */}
      <div className="learnix-workspace-subitems">
        <Link
          href="/upload/updates"
          className="learnix-workspace-subitem"
          onClick={onClose}
          tabIndex={isOpen ? 0 : -1}
        >
          <span className="learnix-subitem-icon">
            <BellIcon size={14} />
          </span>
          <span className="learnix-subitem-text">Manage Updates</span>
        </Link>
        <Link
          href="/resources/upload"
          className="learnix-workspace-subitem"
          onClick={onClose}
          tabIndex={isOpen ? 0 : -1}
        >
          <span className="learnix-subitem-icon">
            <FolderIcon size={14} />
          </span>
          <span className="learnix-subitem-text">Manage Resources</span>
        </Link>
      </div>
    </div>
  );
}

function SidebarButton({
  onClick,
  icon: Icon,
  text,
  tabIndex,
  className = "",
}) {
  const iconRef = useRef(null);

  const handleMouseEnter = () => {
    iconRef.current?.startAnimation?.();
  };

  const handleMouseLeave = () => {
    iconRef.current?.stopAnimation?.();
  };

  return (
    <button
      type="button"
      className={`learnix-nav-item ${className}`.trim()}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      tabIndex={tabIndex}
    >
      <span className="learnix-nav-icon">
        <Icon ref={iconRef} size={18} />
      </span>
      <span className="learnix-nav-text">{text}</span>
    </button>
  );
}

export default function AppSidebar({
  isOpen,
  onClose,
  hasUSN,
  userRole,
  getLoginHref,
  handleSignout,
  onMouseEnter,
  onMouseLeave,
}) {
  const closeIconRef = useRef(null);

  return (
    <>
      {/* Sidebar Backdrop Overlay */}
      {isOpen && (
        <div
          className="learnix-sidebar-backdrop"
          onClick={onClose}
          aria-label="Close navigation menu"
        />
      )}

      {/* Navigation Sidebar Drawer */}
      <aside
        className={`learnix-navigation-sidebar ${isOpen ? "learnix-sidebar-active" : ""}`}
        aria-hidden={!isOpen}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {/* Sidebar Header */}
        <div className="learnix-sidebar-top">
          <button
            type="button"
            className="learnix-sidebar-close-button"
            onClick={onClose}
            onMouseEnter={() => closeIconRef.current?.startAnimation?.()}
            onMouseLeave={() => closeIconRef.current?.stopAnimation?.()}
            aria-label="Close navigation menu"
          >
            <XIcon ref={closeIconRef} size={18} />
          </button>
          <div className="learnix-sidebar-logo">
            <Image
              src="https://res.cloudinary.com/ddycnd409/image/upload/v1758341529/Picsart_25-09-18_21-28-57-720-removebg-preview_hjouiw.png"
              alt="Learnix"
              width={120}
              height={41}
              className="learnix-sidebar-logo-img"
            />
          </div>
          <div className="learnix-sidebar-top-spacer" aria-hidden="true" />
        </div>

        {/* Sidebar Navigation Items */}
        <nav className="learnix-sidebar-menu">
          {/* Workspace - shown ONLY when user is logged in */}
          {hasUSN && (
            <WorkspaceSidebarItem isOpen={isOpen} onClose={onClose} />
          )}

          {/* Learn - ALWAYS visible */}
          <SidebarLink
            href="/learn"
            onClick={onClose}
            icon={GraduationCapIcon}
            text="Learn"
            tabIndex={isOpen ? 0 : -1}
          />

          {hasUSN && (userRole === "admin" || userRole === "superadmin") && (
            <SidebarLink
              href="/admin"
              onClick={onClose}
              icon={ShieldCheckIcon}
              text="Admin Dashboard"
              className="learnix-nav-admin"
              tabIndex={isOpen ? 0 : -1}
            />
          )}

          {!hasUSN && (
            <SidebarLink
              href={typeof getLoginHref === "function" ? getLoginHref() : "/login"}
              onClick={onClose}
              icon={LogInIcon}
              text="Login / Register"
              tabIndex={isOpen ? 0 : -1}
            />
          )}

          <SidebarLink
            href="/resources"
            onClick={onClose}
            icon={FolderIcon}
            text="Resources"
            tabIndex={isOpen ? 0 : -1}
          />

          <SidebarLink
            href="/updates"
            onClick={onClose}
            icon={BellIcon}
            text="Updates"
            tabIndex={isOpen ? 0 : -1}
          />

          <SidebarLink
            href="/materials"
            onClick={onClose}
            icon={BookOpenIcon}
            text="Study Materials"
            tabIndex={isOpen ? 0 : -1}
          />

          <SidebarLink
            href="/qp"
            onClick={onClose}
            icon={ClipboardIcon}
            text="Question Papers"
            tabIndex={isOpen ? 0 : -1}
          />

          <SidebarLink
            href="/learnix-code"
            onClick={onClose}
            logoSrc="/learnix-code-logo.png"
            text="Learnix Code"
            tabIndex={isOpen ? 0 : -1}
          />

          <SidebarLink
            href="/tools"
            onClick={onClose}
            icon={WrenchIcon}
            text="Tools"
            tabIndex={isOpen ? 0 : -1}
          />

          {/* Learn Later - placed right below Tools */}
          <SidebarLink
            href="/learn-later"
            onClick={onClose}
            icon={BookmarkIcon}
            text="Learn Later"
            tabIndex={isOpen ? 0 : -1}
          />

          {/* Upload removed from sidebar */}

          <SidebarLink
            href="/profile"
            onClick={onClose}
            icon={UserIcon}
            text="Profile"
            tabIndex={isOpen ? 0 : -1}
          />

          {hasUSN && (
            <SidebarButton
              onClick={handleSignout}
              icon={LogOutIcon}
              text="Signout"
              className="learnix-signout-btn"
              tabIndex={isOpen ? 0 : -1}
            />
          )}
        </nav>
      </aside>
    </>
  );
}
