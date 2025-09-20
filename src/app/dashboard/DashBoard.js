"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  FiSearch, 
  FiUpload, 
  FiUser, 
  FiLogIn, 
  FiBookOpen, 
  FiTrendingUp, 
  FiStar,
  FiFolder,
  FiMessageCircle,
  FiActivity,
  FiClock,
  FiUsers,
  FiArrowRight
} from "react-icons/fi";
import { MdDashboard, MdOutlineSchool } from "react-icons/md";
import { IoRocketOutline, IoLibraryOutline } from "react-icons/io5";
import { RiGraduationCapLine } from "react-icons/ri";
import "./styles/Dashboard.css";

export default function DashBoard() {
  const [usn, setUsn] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const storedUsn = localStorage.getItem("usn");
    setUsn(storedUsn);
    
    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    // Add loading animation delay
    setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    return () => clearInterval(timeInterval);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  if (!usn) {
    return (
      <div className="learnix-dashboard-wrapper learnix-auth-required">
        <div className="learnix-auth-container">
          <div className="learnix-auth-logo">
            <Image
              src="https://res.cloudinary.com/ddycnd409/image/upload/v1758341529/Picsart_25-09-18_21-28-57-720-removebg-preview_hjouiw.png"
              alt="Learnix Logo"
              width={200}
              height={68}
              className="learnix-auth-logo-img"
            />
          </div>
          <div className="learnix-auth-content">
            <div className="learnix-auth-icon-container">
              <FiUser className="learnix-auth-icon" />
            </div>
            <h1 className="learnix-auth-heading">Authentication Required</h1>
            <p className="learnix-auth-text">
              Please sign in to access your personalized learning dashboard and explore all features
            </p>
            <Link href="/login" className="learnix-auth-signin-btn">
              <FiLogIn size={18} />
              <span>Sign In to Continue</span>
              <FiArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`learnix-dashboard-wrapper ${isLoaded ? 'learnix-dashboard-loaded' : ''}`}>
      {/* Header Section */}
      <header className="learnix-dashboard-header">
        <div className="learnix-header-content">
          <div className="learnix-header-left">
            <div className="learnix-header-logo">
              <Image
                src="https://res.cloudinary.com/ddycnd409/image/upload/v1758341529/Picsart_25-09-18_21-28-57-720-removebg-preview_hjouiw.png"
                alt="Learnix"
                width={140}
                height={48}
                className="learnix-header-logo-img"
              />
            </div>
            <div className="learnix-welcome-section">
              <div className="learnix-greeting-badge">
                <MdDashboard size={14} />
                <span>{getGreeting()}</span>
              </div>
              <h1 className="learnix-dashboard-title">
              Welcome to <span className="learnix-title-highlight">Learnix</span>
              </h1>
              <p className="learnix-dashboard-subtitle">
                Discover, share, and collaborate on academic resources with ease
              </p>
            </div>
          </div>
          <div className="learnix-header-decoration">
            <RiGraduationCapLine className="learnix-decoration-icon" />
          </div>
        </div>
      </header>

      {/* Quick Stats */}
      <section className="learnix-quick-stats">
        <div className="learnix-stat-card">
          <div className="learnix-stat-icon-wrapper learnix-stat-blue">
            <FiBookOpen size={20} />
          </div>
          <div className="learnix-stat-info">
            <span className="learnix-stat-value">10+</span>
            <span className="learnix-stat-label">Study Resources</span>
          </div>
        </div>
        <div className="learnix-stat-card">
          <div className="learnix-stat-icon-wrapper learnix-stat-yellow">
            <FiUsers size={20} />
          </div>
          <div className="learnix-stat-info">
            <span className="learnix-stat-value">15+</span>
            <span className="learnix-stat-label">Active Users</span>
          </div>
        </div>
        <div className="learnix-stat-card">
          <div className="learnix-stat-icon-wrapper learnix-stat-blue">
            <FiStar size={20} />
          </div>
          <div className="learnix-stat-info">
            <span className="learnix-stat-value">4.8</span>
            <span className="learnix-stat-label">Average Rating</span>
          </div>
        </div>
        <div className="learnix-stat-card">
          <div className="learnix-stat-icon-wrapper learnix-stat-yellow">
            <FiActivity size={20} />
          </div>
          <div className="learnix-stat-info">
            <span className="learnix-stat-value">95%</span>
            <span className="learnix-stat-label">Success Rate</span>
          </div>
        </div>
      </section>

      {/* Main Action Cards */}
      <main className="learnix-main-actions">
        <h2 className="learnix-section-title">Quick Actions</h2>
        <div className="learnix-action-grid">
          <Link href="/works" className="learnix-action-item learnix-primary-action">
            <div className="learnix-action-header">
              <div className="learnix-action-icon-container">
                <FiFolder size={24} />
              </div>
              <span className="learnix-action-badge">Most Popular</span>
            </div>
            <div className="learnix-action-body">
              <h3 className="learnix-action-title">Uploaded Works</h3>
              <p className="learnix-action-desc">
                Browse through homework solutions, assignments, and projects uploaded by students
              </p>
            </div>
            <div className="learnix-action-arrow">
              <FiArrowRight size={18} />
            </div>
          </Link>

          <Link href="/search" className="learnix-action-item learnix-secondary-action">
            <div className="learnix-action-header">
              <div className="learnix-action-icon-container">
                <FiUsers size={24} />
              </div>
              <span className="learnix-action-badge">Connect</span>
            </div>
            <div className="learnix-action-body">
              <h3 className="learnix-action-title">View Students Profile</h3>
              <p className="learnix-action-desc">
                Connect with fellow students, view their profiles and academic contributions
              </p>
            </div>
            <div className="learnix-action-arrow">
              <FiArrowRight size={18} />
            </div>
          </Link>

          <Link href="/materials" className="learnix-action-item learnix-tertiary-action">
            <div className="learnix-action-header">
              <div className="learnix-action-icon-container">
                <IoLibraryOutline size={24} />
              </div>
              <span className="learnix-action-badge">Study Hub</span>
            </div>
            <div className="learnix-action-body">
              <h3 className="learnix-action-title">Study Materials</h3>
              <p className="learnix-action-desc">
                Access curated textbooks, reference materials, and comprehensive study guides
              </p>
            </div>
            <div className="learnix-action-arrow">
              <FiArrowRight size={18} />
            </div>
          </Link>

          {usn && (
            <Link href="/upload" className="learnix-action-item learnix-quaternary-action">
              <div className="learnix-action-header">
                <div className="learnix-action-icon-container">
                  <FiUpload size={24} />
                </div>
                <span className="learnix-action-badge">Contribute</span>
              </div>
              <div className="learnix-action-body">
                <h3 className="learnix-action-title">Upload Resources</h3>
                <p className="learnix-action-desc">
                  Share your homework, assignments, and study materials to help others
                </p>
              </div>
              <div className="learnix-action-arrow">
                <FiArrowRight size={18} />
              </div>
            </Link>
          )}

          {!usn && (
            <Link href="/login" className="learnix-action-item learnix-quaternary-action">
              <div className="learnix-action-header">
                <div className="learnix-action-icon-container">
                  <FiLogIn size={24} />
                </div>
                <span className="learnix-action-badge">Join Us</span>
              </div>
              <div className="learnix-action-body">
                <h3 className="learnix-action-title">Login or Create Account</h3>
                <p className="learnix-action-desc">
                  Join our learning community to upload content and access exclusive features
                </p>
              </div>
              <div className="learnix-action-arrow">
                <FiArrowRight size={18} />
              </div>
            </Link>
          )}
        </div>
      </main>

      {/* Secondary Actions */}
      <section className="learnix-secondary-actions">
        <h2 className="learnix-section-title">More Options</h2>
        <div className="learnix-secondary-grid">
          <Link href="/feedback" className="learnix-secondary-item">
            <FiMessageCircle size={20} />
            <span>Feedback</span>
            <FiArrowRight size={16} />
          </Link>
          {usn && (
            <Link href="/profile" className="learnix-secondary-item">
              <FiUser size={20} />
              <span>View Your Profile</span>
              <FiArrowRight size={16} />
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
