"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FiBookOpen,
  FiStar,
  FiUsers,
  FiMessageCircle,
  FiUser,
  FiArrowRight,
  FiLogIn,
  FiClock,
} from "react-icons/fi";
import { MdOutlineSchool } from "react-icons/md";
import { RiGraduationCapLine } from "react-icons/ri";
import { IoRocketOutline } from "react-icons/io5";
import "./styles/DashBoard.css";
import WhatsNew from "../components/WhatsNew";
import DashboardNavCards from "./DashboardNavCards";

export default function DashBoard() {
  const [usn, setUsn] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Check for stored USN and add smooth appearance delay
    const loadTimer = setTimeout(() => {
      setUsn(localStorage.getItem("usn"));
      setIsLoaded(true);
    }, 50);

    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => {
      clearTimeout(loadTimer);
      clearInterval(timeInterval);
    };
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className={`learnix-dashboard-wrapper ${isLoaded ? "learnix-dashboard-loaded" : ""}`}>
      {/* Welcome to Learnix - Apple Widget Header */}
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
                <FiClock size={13} />
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
                <FiLogIn size={15} />
                <span>Sign In</span>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Quick Stats - Apple Style Rounded Widgets (500+ Resources, 200+ Learnix Users, 5 Avg Rating) */}
      <section className="learnix-quick-stats" aria-label="Learnix platform statistics">
        <div className="learnix-stat-card">
          <div className="learnix-stat-icon-wrapper learnix-stat-blue">
            <FiBookOpen size={22} />
          </div>
          <div className="learnix-stat-info">
            <span className="learnix-stat-value">500+</span>
            <span className="learnix-stat-label">Study Resources</span>
          </div>
        </div>

        <div className="learnix-stat-card">
          <div className="learnix-stat-icon-wrapper learnix-stat-yellow">
            <FiUsers size={22} />
          </div>
          <div className="learnix-stat-info">
            <span className="learnix-stat-value">200+</span>
            <span className="learnix-stat-label">Learnix Users</span>
          </div>
        </div>

        <div className="learnix-stat-card">
          <div className="learnix-stat-icon-wrapper learnix-stat-amber">
            <FiStar size={22} />
          </div>
          <div className="learnix-stat-info">
            <span className="learnix-stat-value">5</span>
            <span className="learnix-stat-label">Avg Rating</span>
          </div>
        </div>
      </section>

      {/* Navigation Quick Cards */}
      <DashboardNavCards loggedIn={!!usn} />

      {/* What's New banner */}
      <WhatsNew />

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