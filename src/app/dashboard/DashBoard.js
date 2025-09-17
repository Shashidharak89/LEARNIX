"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiSearch, FiUpload, FiUser, FiLogIn, FiBookOpen, FiTrendingUp, FiStar } from "react-icons/fi";
import { MdDashboard } from "react-icons/md";
import { IoRocketOutline } from "react-icons/io5";
import "./styles/DashBoard.css";

export default function DashBoard() {
  const [usn, setUsn] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const storedUsn = localStorage.getItem("usn");
    setUsn(storedUsn);
    
    // Add a small delay for smoother animation
    setTimeout(() => {
      setIsLoaded(true);
    }, 100);
  }, []);

  if (!usn) {
    return (
      <div className="learnix-creative-container learnix-not-authenticated">
        <div className="learnix-auth-content">
          <div className="learnix-auth-icon-wrapper">
            <FiUser className="learnix-auth-icon" />
          </div>
          <h1 className="learnix-auth-title">Access Required</h1>
          <p className="learnix-auth-description">
            Please authenticate to unlock your personalized Learnix experience
          </p>
          <Link href="/login" className="learnix-auth-button">
            <FiLogIn size={20} />
            <span>Sign In</span>
            <div className="learnix-button-ripple"></div>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`learnix-creative-container ${isLoaded ? 'learnix-loaded' : ''}`}>
      {/* Hero Section */}
      <section className="learnix-hero-section">
        <div className="learnix-hero-content">
          <div className="learnix-welcome-badge">
            <MdDashboard size={16} />
            <span>Dashboard</span>
          </div>
          <h1 className="learnix-hero-title">
            Welcome to <span className="learnix-brand-highlight">Learnix</span>
          </h1>
          <p className="learnix-hero-subtitle">
            Your collaborative learning hub for sharing knowledge and exploring academic resources
          </p>
        </div>
        <div className="learnix-hero-decoration">
          <IoRocketOutline className="learnix-floating-icon" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="learnix-stats-section">
        <div className="learnix-stat-item">
          <FiBookOpen className="learnix-stat-icon" />
          <span className="learnix-stat-number">10+</span>
          <span className="learnix-stat-label">Resources</span>
        </div>
        <div className="learnix-stat-item">
          <FiTrendingUp className="learnix-stat-icon" />
          <span className="learnix-stat-number">95%</span>
          <span className="learnix-stat-label">Success Rate</span>
        </div>
        <div className="learnix-stat-item">
          <FiStar className="learnix-stat-icon" />
          <span className="learnix-stat-number">4.8</span>
          <span className="learnix-stat-label">Rating</span>
        </div>
      </section>

      {/* Main Actions Grid */}
      <main className="learnix-actions-grid">
        <Link href="/search" className="learnix-action-card learnix-primary-card">
          <div className="learnix-card-header">
            <FiSearch className="learnix-card-icon" />
            <div className="learnix-card-badge">Popular</div>
          </div>
          <div className="learnix-card-content">
            <h2 className="learnix-card-title">Discover Content</h2>
            <p className="learnix-card-description">
              Explore thousands of shared homework solutions and study materials
            </p>
          </div>
          <div className="learnix-card-footer">
            <span className="learnix-action-hint">Browse now →</span>
          </div>
        </Link>

        <Link href="/upload" className="learnix-action-card learnix-secondary-card">
          <div className="learnix-card-header">
            <FiUpload className="learnix-card-icon" />
            <div className="learnix-card-badge">Share</div>
          </div>
          <div className="learnix-card-content">
            <h2 className="learnix-card-title">Share Knowledge</h2>
            <p className="learnix-card-description">
              Upload your work and help fellow students succeed
            </p>
          </div>
          <div className="learnix-card-footer">
            <span className="learnix-action-hint">Upload now →</span>
          </div>
        </Link>

        <Link href="/profile" className="learnix-action-card learnix-tertiary-card">
          <div className="learnix-card-header">
            <FiUser className="learnix-card-icon" />
            <div className="learnix-card-badge">Profile</div>
          </div>
          <div className="learnix-card-content">
            <h2 className="learnix-card-title">Your Space</h2>
            <p className="learnix-card-description">
              Manage your contributions and track your learning progress
            </p>
          </div>
          <div className="learnix-card-footer">
            <span className="learnix-action-hint">View profile →</span>
          </div>
        </Link>
      </main>
    </div>
  );
}