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

export default function HeroNavCards({ loggedIn }) {
  return (
    <div className="learnix-nav-card-grid">
      <Link href="/learn" className="learnix-nav-card">
        <HiAcademicCap className="learnix-nav-card-icon" />
        <span>Learn</span>
      </Link>
      <Link href="/search" className="learnix-nav-card">
        <FiSearch className="learnix-nav-card-icon" />
        <span>Search</span>
      </Link>
      <Link href="/materials" className="learnix-nav-card">
        <FiBookOpen className="learnix-nav-card-icon" />
        <span>Materials</span>
      </Link>
      <Link href="/qp" className="learnix-nav-card">
        <FiFileText className="learnix-nav-card-icon" />
        <span>Question Papers</span>
      </Link>
      <Link href="/tools" className="learnix-nav-card">
        <FiTool className="learnix-nav-card-icon" />
        <span>Tools</span>
      </Link>
      <Link href="/help" className="learnix-nav-card">
        <FiHelpCircle className="learnix-nav-card-icon" />
        <span>Help</span>
      </Link>
      <Link href={loggedIn ? "/upload" : "/login"} className="learnix-nav-card">
        <FiUpload className="learnix-nav-card-icon" />
        <span>Upload</span>
      </Link>
      <Link href="/dashboard" className="learnix-nav-card">
        <FiTrendingUp className="learnix-nav-card-icon" />
        <span>Dashboard</span>
      </Link>
      <Link href="/updates" className="learnix-nav-card">
        <FiBell className="learnix-nav-card-icon" />
        <span>Updates</span>
      </Link>
    </div>
  );
}
