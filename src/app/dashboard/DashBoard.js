"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiSearch, FiUpload, FiUser, FiLogIn } from "react-icons/fi";
import "./styles/DashBoard.css";

export default function DashBoard() {
  const [usn, setUsn] = useState(null);

  useEffect(() => {
    const storedUsn = localStorage.getItem("usn");
    setUsn(storedUsn);
  }, []);

  if (!usn) {
    return (
      <div className="learnix-dashboard not-logged">
        <h1 className="learnix-dashboard-title">You are not logged in</h1>
        <p className="learnix-dashboard-subtitle">
          Please login to access your Learnix dashboard.
        </p>
        <Link href="/login" className="learnix-dashboard-login-btn">
          <FiLogIn size={18} />
          <span>Login</span>
        </Link>
      </div>
    );
  }

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
