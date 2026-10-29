"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpenIcon,
  UsersIcon,
  StarIcon,
  ClockIcon,
  MessageCircleIcon,
  UserIcon,
  ArrowRightIcon,
  LogInIcon,
  RocketIcon,
} from "@animateicons/react/lucide";
import { RiGraduationCapLine } from "react-icons/ri";
import { LayersIcon } from "../components/icons/LayersIcon";
import "./styles/DashBoard.css";
import WhatsNew from "../components/WhatsNew";
import DashboardNavCards from "./DashboardNavCards";

function GreetingBadge({ greeting }) {
  const clockRef = useRef(null);

  return (
    <div
      className="learnix-greeting-badge"
      onMouseEnter={() => clockRef.current?.startAnimation?.()}
      onMouseLeave={() => clockRef.current?.stopAnimation?.()}
    >
      <ClockIcon ref={clockRef} size={14} />
      <span>{greeting}</span>
    </div>
  );
}

function StatCard({ icon: Icon, value, label, variant }) {
  const iconRef = useRef(null);

  const handleMouseEnter = () => {
    iconRef.current?.startAnimation?.();
  };

  const handleMouseLeave = () => {
    iconRef.current?.stopAnimation?.();
  };

  return (
    <div
      className="learnix-stat-card"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={`learnix-stat-icon-wrapper learnix-stat-${variant}`}>
        <Icon ref={iconRef} size={24} />
      </div>
      <div className="learnix-stat-info">
        <span className="learnix-stat-value">{value}</span>
        <span className="learnix-stat-label">{label}</span>
      </div>
    </div>
  );
}

function SecondaryLink({ href, icon: Icon, text }) {
  const iconRef = useRef(null);
  const arrowRef = useRef(null);

  const handleMouseEnter = () => {
    iconRef.current?.startAnimation?.();
    arrowRef.current?.startAnimation?.();
  };

  const handleMouseLeave = () => {
    iconRef.current?.stopAnimation?.();
    arrowRef.current?.stopAnimation?.();
  };

  return (
    <Link
      href={href}
      className="learnix-secondary-item"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="learnix-secondary-item-left">
        <span className="learnix-secondary-icon-wrap">
          <Icon ref={iconRef} size={20} />
        </span>
        <span>{text}</span>
      </div>
      <span className="learnix-secondary-arrow-wrap">
        <ArrowRightIcon ref={arrowRef} size={18} />
      </span>
    </Link>
  );
}

function HeaderLoginBtn({ href }) {
  const iconRef = useRef(null);

  return (
    <Link
      href={href}
      className="learnix-header-login-btn"
      onMouseEnter={() => iconRef.current?.startAnimation?.()}
      onMouseLeave={() => iconRef.current?.stopAnimation?.()}
    >
      <LogInIcon ref={iconRef} size={16} />
      <span>Sign In</span>
    </Link>
  );
}

function FooterCtaBtn({ href, text }) {
  const arrowRef = useRef(null);

  return (
    <Link
      href={href}
      className="learnix-footer-cta-btn"
      onMouseEnter={() => arrowRef.current?.startAnimation?.()}
      onMouseLeave={() => arrowRef.current?.stopAnimation?.()}
    >
      <span>{text}</span>
      <ArrowRightIcon ref={arrowRef} size={18} />
    </Link>
  );
}

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
      {/* Welcome to Learnix Workspace - Apple Widget Header */}
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
              <div className="learnix-header-badges">
                <span className="learnix-workspace-tag">
                  <LayersIcon size={13} className="learnix-workspace-tag-icon" />
                  WORKSPACE
                </span>
                <GreetingBadge greeting={getGreeting()} />
              </div>
              <h1 className="learnix-dashboard-title">
                My <span className="learnix-title-highlight">Workspace</span>
              </h1>
              <p className="learnix-dashboard-subtitle">
                Welcome to Learnix! {usn
                  ? "Discover, share, and collaborate on academic resources with ease."
                  : "Join our learning community to discover and share academic resources."
                }
              </p>
            </div>
          </div>
          <div className="learnix-header-right">
            {!usn && (
              <div className="learnix-header-auth">
                <HeaderLoginBtn href="/login" />
              </div>
            )}
            <div className="learnix-header-decoration">
              <RiGraduationCapLine className="learnix-decoration-icon" />
            </div>
          </div>
        </div>
      </header>

      {/* Quick Stats - Apple Style Rounded Widgets with Animated Icons */}
      <section className="learnix-quick-stats" aria-label="Learnix platform statistics">
        <StatCard
          icon={BookOpenIcon}
          value="500+"
          label="Study Resources"
          variant="blue"
        />

        <StatCard
          icon={UsersIcon}
          value="200+"
          label="Learnix Users"
          variant="yellow"
        />

        <StatCard
          icon={StarIcon}
          value="5.0 ★"
          label="5 Stars on Google Play Store"
          variant="amber"
        />
      </section>

      {/* Navigation Quick Cards */}
      <DashboardNavCards loggedIn={!!usn} />

      {/* What's New banner */}
      <WhatsNew />

      {/* Secondary Actions with Animated Icons */}
      <section className="learnix-secondary-actions">
        <h2 className="learnix-section-title">More Options</h2>
        <div className="learnix-secondary-grid">
          <SecondaryLink
            href="/feedback"
            icon={MessageCircleIcon}
            text="Feedback"
          />

          <SecondaryLink
            href="/profile"
            icon={UserIcon}
            text="Your Profile"
          />
        </div>
      </section>

      {/* Footer Call to Action for non-logged users */}
      {!usn && (
        <section className="learnix-footer-cta">
          <div className="learnix-footer-cta-content">
            <div className="learnix-footer-cta-icon-wrap">
              <RocketIcon size={36} />
            </div>
            <h3 className="learnix-footer-cta-title">Ready to Get Started?</h3>
            <p className="learnix-footer-cta-text">
              Join thousands of students sharing and discovering academic resources
            </p>
            <FooterCtaBtn href="/login" text="Create Your Account" />
          </div>
        </section>
      )}
    </div>
  );
}