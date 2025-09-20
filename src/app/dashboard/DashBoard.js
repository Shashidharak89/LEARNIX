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
import "./styles/DashBoard.css";

export default function DashBoard() {
  const [usn, setUsn] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Check for stored USN - this will be null if user not logged in
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
                {usn 
                  ? "Discover, share, and collaborate on academic resources with ease"
                  : "Join our learning community to discover and share academic resources"
                }
              </p>
            </div>
          </div>
          <div className="learnix-header-decoration">
            <RiGraduationCapLine className="learnix-decoration-icon" />
          </div>
          {!usn && (
            <div className="learnix-header-auth">
              <Link href="/login" className="learnix-header-login-btn">
                <FiLogIn size={16} />
                <span>Sign In</span>
              </Link>
            </div>
          )}
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
            <span className="learnix-stat-value">10+</span>
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

      {/* Login Prompt for Unauthenticated Users */}
      {/* {!usn && (
        <section className="learnix-auth-prompt">
          <div className="learnix-auth-prompt-content">
            <div className="learnix-auth-prompt-icon">
              <FiUser size={24} />
            </div>
            <h3 className="learnix-auth-prompt-title">Join Our Learning Community</h3>
            <p className="learnix-auth-prompt-text">
              Sign in to upload your own resources, save favorites, and access personalized features
            </p>
            <div className="learnix-auth-prompt-actions">
              <Link href="/login" className="learnix-auth-prompt-btn learnix-auth-primary">
                <FiLogIn size={16} />
                <span>Sign In</span>
              </Link>
              <Link href="/login" className="learnix-auth-prompt-btn learnix-auth-secondary">
                <FiUser size={16} />
                <span>Create Account</span>
              </Link>
            </div>
          </div>
        </section>
      )} */}

      {/* Main Action Cards */}
      <main className="learnix-main-actions">
        <h2 className="learnix-section-title">
          {usn ? "Your Dashboard" : "Explore Features"}
        </h2>
        <div className="learnix-action-grid">
          <Link href="/works" className="learnix-action-item learnix-primary-action">
            <div className="learnix-action-header">
              <div className="learnix-action-icon-container">
                <FiFolder size={24} />
              </div>
              <span className="learnix-action-badge">Most Popular</span>
            </div>
            <div className="learnix-action-body">
              <h3 className="learnix-action-title">Browse Works</h3>
              <p className="learnix-action-desc">
                Explore homework solutions, assignments, and projects shared by students
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
              <h3 className="learnix-action-title">Student Profiles</h3>
              <p className="learnix-action-desc">
                Discover fellow students and view their academic contributions
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
                Access textbooks, reference materials, and comprehensive study guides
              </p>
            </div>
            <div className="learnix-action-arrow">
              <FiArrowRight size={18} />
            </div>
          </Link>

          {usn ? (
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
          ) : (
            <div className="learnix-action-item learnix-quaternary-action learnix-disabled-action">
              <div className="learnix-action-header">
                <div className="learnix-action-icon-container">
                  <FiUpload size={24} />
                </div>
                <span className="learnix-action-badge">Login Required</span>
              </div>
              <div className="learnix-action-body">
                <h3 className="learnix-action-title">Upload Resources</h3>
                <p className="learnix-action-desc">
                  Sign in to share your homework and study materials with the community
                </p>
              </div>
              <div className="learnix-action-arrow">
                <FiLogIn size={18} />
              </div>
            </div>
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
          
          {usn ? (
            <Link href="/profile" className="learnix-secondary-item">
              <FiUser size={20} />
              <span>Your Profile</span>
              <FiArrowRight size={16} />
            </Link>
          ) : (
            <Link href="/profile" className="learnix-secondary-item">
              <MdOutlineSchool size={20} />
              <span>Your Profile</span>
              <FiArrowRight size={16} />
            </Link>
          )}

          {/* <Link href="/help" className="learnix-secondary-item">
            <FiBookOpen size={20} />
            <span>Help & Support</span>
            <FiArrowRight size={16} />
          </Link> */}
        </div>
      </section>

      {/* Footer Call to Action for non-logged users */}
      {!usn && (
        <section className="learnix-footer-cta">
          <div className="learnix-footer-cta-content">
            <IoRocketOutline size={32} className="learnix-footer-cta-icon" />
            <h3 className="learnix-footer-cta-title">Ready to Get Started?</h3>
            <p className="learnix-footer-cta-text">
              Join thousands of students sharing and discovering academic resources
            </p>
            <Link href="/login" className="learnix-footer-cta-btn">
              <span>Create Your Account</span>
              <FiArrowRight size={16} />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}