"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { FiLogOut, FiShield, FiCode, FiLayers } from "react-icons/fi";
import { recordCodingEntry, exitCodingEnvironment } from "@/utils/codingExitTracker";
import "./LearnixCodeNav.css";

export default function LearnixCodeNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("role") || "";
    setIsAdmin(role === "admin" || role === "superadmin");

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
  }, []);

  function handleExit() {
    exitCodingEnvironment(router);
  }

  return (
    <nav className="lcn-navbar">
      <div className="lcn-left">
        <Link href="/learnix-code" className="lcn-brand">
          <span className="lcn-brand-icon">&lt;/&gt;</span>
          <span>Learnix <span style={{ color: "#38bdf8" }}>Code</span></span>
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
            className={`lcn-link ${pathname === "/learnix-code/problems" ? "active" : ""}`}
          >
            <FiLayers style={{ marginRight: 4 }} /> All Problems
          </Link>
        </div>
      </div>

      <div className="lcn-right">
        {isAdmin && (
          <Link href="/admin/coding" className="lcn-admin-link">
            <FiShield size={14} /> Admin Dashboard
          </Link>
        )}

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
