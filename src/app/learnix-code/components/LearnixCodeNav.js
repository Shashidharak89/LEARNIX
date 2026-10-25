"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { FiLogOut, FiShield, FiCode, FiLayers, FiSun, FiMoon } from "react-icons/fi";
import { recordCodingEntry, exitCodingEnvironment } from "@/utils/codingExitTracker";
import "./LearnixCodeNav.css";

const THEME_KEY = "learnix-code-theme";

export default function LearnixCodeNav({ theme, onToggleTheme }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  // Internal theme state for when not passed as prop (e.g., on home page)
  const [localTheme, setLocalTheme] = useState("dark");

  useEffect(() => {
    const role = localStorage.getItem("role") || "";
    setIsAdmin(role === "admin" || role === "superadmin");

    // Load theme if not controlled externally
    if (!theme) {
      const saved = localStorage.getItem(THEME_KEY);
      setLocalTheme(saved === "light" ? "light" : "dark");
    }

    // Record non-coding entry point so exit always returns to original page
    recordCodingEntry();

    // Remove any lingering navbar padding
    if (typeof document !== "undefined") {
      document.body.classList.add("no-learnix-navbar-pad");
      document.body.style.paddingTop = "0px";
    }

    return () => {
      if (typeof document !== "undefined") {
        document.body.classList.remove("no-learnix-navbar-pad");
        document.body.style.paddingTop = "";
      }
    };
  }, [theme]);

  const effectiveTheme = theme || localTheme;

  function handleToggleTheme() {
    if (onToggleTheme) {
      onToggleTheme();
    } else {
      // Internal toggle for pages that don't pass it down
      setLocalTheme((prev) => {
        const next = prev === "dark" ? "light" : "dark";
        localStorage.setItem(THEME_KEY, next);
        return next;
      });
    }
  }

  function handleExit() {
    exitCodingEnvironment(router);
  }

  return (
    <nav className={`lcn-navbar lcn-theme-${effectiveTheme}`}>
      <div className="lcn-left">
        <Link href="/learnix-code" className="lcn-brand">
          <Image
            src="/learnix-code-logo.png"
            alt="Learnix Code Logo"
            width={32}
            height={32}
            className="lcn-brand-img"
            priority
          />
          <span>Learnix <span className="lcn-brand-accent">Code</span></span>
        </Link>

        <div className="lcn-links">
          <Link
            href="/learnix-code"
            className={`lcn-link ${pathname === "/learnix-code" ? "active" : ""}`}
          >
            <FiCode style={{ marginRight: 4 }} /> Playground
          </Link>
          <Link
            href="/learnix-code/problems"
            className={`lcn-link ${pathname === "/learnix-code/problems" || pathname?.startsWith("/learnix-code/problems/") ? "active" : ""}`}
          >
            <FiLayers style={{ marginRight: 4 }} /> Problems
          </Link>
        </div>
      </div>

      <div className="lcn-right">
        {isAdmin && (
          <Link href="/admin/coding" className="lcn-admin-link">
            <FiShield size={14} /> Admin
          </Link>
        )}

        {/* Theme Toggle */}
        <button
          onClick={handleToggleTheme}
          className="lcn-theme-btn"
          title={`Switch to ${effectiveTheme === "dark" ? "light" : "dark"} mode`}
        >
          {effectiveTheme === "dark" ? <FiSun size={15} /> : <FiMoon size={15} />}
        </button>

        <button
          onClick={handleExit}
          className="lcn-exit-btn"
          title="Exit Learnix Code and return to previous page"
        >
          <FiLogOut size={15} />
          <span>Exit</span>
        </button>
      </div>
    </nav>
  );
}
