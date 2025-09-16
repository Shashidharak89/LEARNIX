"use client";

import Link from "next/link";
import { FiSearch, FiUpload, FiUser } from "react-icons/fi";
import "./styles/DashBoard.css";

export default function DashBoard() {
  return (
    <div className="learnix-dashboard">
      {/* Header */}
      <header className="learnix-dashboard-header">
        <h1 className="learnix-dashboard-title">Welcome to Learnix</h1>
        <p className="learnix-dashboard-subtitle">
          A platform to share and explore homeworks with ease.
        </p>
      </header>

      {/* Main Content */}
      <main className="learnix-dashboard-content">
        <Link href="/search" className="learnix-dashboard-card">
          <FiSearch className="learnix-dashboard-icon" />
          <h2>Search Homeworks</h2>
          <p>Find homeworks shared by others.</p>
        </Link>

        <Link href="/upload" className="learnix-dashboard-card">
          <FiUpload className="learnix-dashboard-icon" />
          <h2>Upload Work</h2>
          <p>Share your own homeworks with the community.</p>
        </Link>

        <Link href="/profile" className="learnix-dashboard-card">
          <FiUser className="learnix-dashboard-icon" />
          <h2>Your Profile</h2>
          <p>Manage your account and contributions.</p>
        </Link>
      </main>
    </div>
  );
}
