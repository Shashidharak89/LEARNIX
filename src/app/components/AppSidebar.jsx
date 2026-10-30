"use client";

import React, { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiX } from "react-icons/fi";
import { LayersIcon } from "./icons/LayersIcon";
import { WrenchIcon } from "./icons/WrenchIcon";
import {
  ShieldCheckIcon,
  LogInIcon,
  FolderIcon,
  BellIcon,
  BookOpenIcon,
  ClipboardIcon,
  BookmarkIcon,
  UploadIcon,
  UserIcon,
  LogOutIcon,
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
}) {
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
      >
        {/* Sidebar Header */}
        <div className="learnix-sidebar-top">
          <div className="learnix-sidebar-logo">
            <Image
              src="https://res.cloudinary.com/ddycnd409/image/upload/v1758341529/Picsart_25-09-18_21-28-57-720-removebg-preview_hjouiw.png"
              alt="Learnix"
              width={120}
              height={41}
              className="learnix-sidebar-logo-img"
            />
          </div>
          <button
            type="button"
            className="learnix-sidebar-close-button"
            onClick={onClose}
            aria-label="Close navigation menu"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Sidebar Navigation Items */}
        <nav className="learnix-sidebar-menu">
          <SidebarLink
            href="/workspace"
            onClick={onClose}
            icon={LayersIcon}
            text="Workspace"
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
            href="/works"
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
            href="/learn-later"
            onClick={onClose}
            icon={BookmarkIcon}
            text="Learn Later"
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

          <SidebarLink
            href="/resources/upload"
            onClick={onClose}
            icon={UploadIcon}
            text="Upload"
            tabIndex={isOpen ? 0 : -1}
          />

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
