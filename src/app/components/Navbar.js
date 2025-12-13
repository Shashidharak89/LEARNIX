"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";
import {
  FiMenu,
  FiX,
  FiHome,
  FiLogIn,
  FiSearch,
  FiUpload,
  FiUser,
  FiLogOut,
  FiMessageCircle,
  FiBookOpen,
  FiFolder,
  FiHelpCircle,
  FiTool,
  FiBell
} from "react-icons/fi";
import "./styles/Navbar.css";
import { Fill } from "./Fill";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUSN, setHasUSN] = useState(false);
  
  // Notification state
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifLoadingMore, setNotifLoadingMore] = useState(false);
  const [notifPage, setNotifPage] = useState(1);
  const [hasMoreNotifs, setHasMoreNotifs] = useState(false);
  const [totalNotifs, setTotalNotifs] = useState(0);
  const notifRef = useRef(null);

  useEffect(() => {
    // initialize hasUSN from localStorage
    const storedUsn = localStorage.getItem("usn");
    setHasUSN(!!storedUsn);

    // keep hasUSN in sync if localStorage changes in other tabs
    const onStorage = (e) => {
      if (e.key === "usn") {
        setHasUSN(!!e.newValue);
      }
    };
    window.addEventListener("storage", onStorage);

    // ---------- aligned interval logic ----------
    let intervalId = null;
    let timeoutId = null;
    let stopped = false;

    const sendActive = async () => {
      try {
        const currentUsn = localStorage.getItem("usn");
        if (!currentUsn) return; // don't call if not logged in
        await axios.post("/api/user/active", { usn: currentUsn });
      } catch (error) {
        console.error("Failed to update active time:", error);
      }
    };

    const startAligned = () => {
      // clear previous timers if any
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);

      // calculate ms until next full minute (:00)
      const now = new Date();
      const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

      // wait until the next minute boundary, then send and schedule every 60s
      timeoutId = setTimeout(async () => {
        if (stopped) return;
        await sendActive(); // fire exactly at :00
        intervalId = setInterval(sendActive, 60000); // thereafter every 60s
      }, msUntilNextMinute);
    };

    // visibility handling: pause when hidden to avoid wasted calls
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        stopped = true;
        if (timeoutId) clearTimeout(timeoutId);
        if (intervalId) clearInterval(intervalId);
        timeoutId = null;
        intervalId = null;
      } else {
        stopped = false;
        startAligned();
      }
    };

    // start aligned interval only if user exists now OR start anyway (it will early-return if no usn)
    startAligned();
    document.addEventListener("visibilitychange", handleVisibility);

    // cleanup on unmount
    return () => {
      stopped = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  const handleSignout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  // Fetch notifications (with pagination support)
  const fetchNotifications = async (page = 1, append = false) => {
    const usn = localStorage.getItem("usn");
    if (!usn) return;
    
    try {
      if (append) {
        setNotifLoadingMore(true);
      } else {
        setNotifLoading(true);
      }
      
      const res = await fetch(`/api/review/notifications/${usn}?page=${page}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        if (append) {
          setNotifications(prev => [...prev, ...(data.notifications || [])]);
        } else {
          setNotifications(data.notifications || []);
        }
        setUnreadCount(data.unreadCount || 0);
        setHasMoreNotifs(data.hasMore || false);
        setTotalNotifs(data.total || 0);
        setNotifPage(page);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setNotifLoading(false);
      setNotifLoadingMore(false);
    }
  };

  // Load more notifications
  const loadMoreNotifications = () => {
    if (hasMoreNotifs && !notifLoadingMore) {
      fetchNotifications(notifPage + 1, true);
    }
  };

  // Fetch unread count periodically
  useEffect(() => {
    if (!hasUSN) return;
    
    // Initial fetch
    fetchNotifications();
    
    // Fetch every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, [hasUSN]);

  // Close notifications on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    
    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      // Reset to first page and fetch fresh
      setNotifPage(1);
      setNotifications([]);
      fetchNotifications(1, false);
    }
  };

  const formatNotifTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && isOpen) {
        closeSidebar();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <>
      {/* Main Navbar */}
      <nav className="learnix-navbar-container">
        {/* Logo */}
        <div className="learnix-navbar-brand">
          <Link href="/" className="learnix-logo-link">
            <Image
              src="https://res.cloudinary.com/ddycnd409/image/upload/v1758341529/Picsart_25-09-18_21-28-57-720-removebg-preview_hjouiw.png"
              alt="Learnix Logo"
              width={500}
              height={171}
              className="learnix-logo-image"
              priority
            />
          </Link>
        </div>

        {/* Right Section - Notification & Menu */}
        <div className="learnix-navbar-right">
          {/* Notification Bell */}
          {hasUSN && (
            <div className="learnix-notification-wrapper" ref={notifRef}>
              <button
                className="learnix-notification-btn"
                onClick={toggleNotifications}
                aria-label="Notifications"
              >
                <FiBell size={20} />
                {unreadCount > 0 && (
                  <span className="learnix-notification-badge">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popup */}
              {showNotifications && (
                <div className="learnix-notification-popup">
                  <div className="learnix-notif-header">
                    <h4>Notifications</h4>
                    <span className="learnix-notif-count">{unreadCount} unread</span>
                  </div>
                  
                  <div className="learnix-notif-list">
                    {notifLoading ? (
                      <div className="learnix-notif-loading">Loading...</div>
                    ) : notifications.length === 0 ? (
                      <div className="learnix-notif-empty">
                        <FiBell size={32} />
                        <p>No notifications yet</p>
                      </div>
                    ) : (
                      <>
                        {notifications.map((notif) => (
                          <Link
                            key={notif._id}
                            href={`/reviews/${notif.topicId}`}
                            className={`learnix-notif-item ${!notif.isRead ? 'learnix-notif-unread' : ''}`}
                            onClick={() => setShowNotifications(false)}
                          >
                            <div className="learnix-notif-content">
                              <p className="learnix-notif-text">
                                <strong>{notif.reviewerUsn}</strong> sent a {notif.type} on your topic <strong>{notif.topicName}</strong> of <strong>{notif.subjectName}</strong>
                              </p>
                              <span className="learnix-notif-time">{formatNotifTime(notif.timestamp)}</span>
                            </div>
                            <span className="learnix-notif-link">Click to view →</span>
                          </Link>
                        ))}
                        
                        {/* Load More Button */}
                        {hasMoreNotifs && (
                          <div className="learnix-notif-load-more">
                            <button 
                              onClick={loadMoreNotifications}
                              disabled={notifLoadingMore}
                              className="learnix-load-more-btn"
                            >
                              {notifLoadingMore ? "Loading..." : `Load More (${notifications.length} of ${totalNotifs})`}
                            </button>
                          </div>
                        )}
                        
                        {/* All Loaded Message */}
                        {!hasMoreNotifs && notifications.length > 0 && (
                          <div className="learnix-notif-all-loaded">
                            All {totalNotifs} notifications loaded
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Menu Toggle Button */}
          <button
            className="learnix-menu-toggle-btn"
            onClick={toggleSidebar}
            aria-label="Toggle navigation menu"
            aria-expanded={isOpen}
          >
            <span className="learnix-menu-icon">
              {isOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </span>
          </button>
        </div>
      </nav>

      {/* Sidebar Overlay */}
      {isOpen && (
        <div
          className="learnix-sidebar-backdrop"
          onClick={closeSidebar}
          aria-label="Close navigation menu"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`learnix-navigation-sidebar ${isOpen ? "learnix-sidebar-active" : ""}`}
        aria-hidden={!isOpen}
      >
        {/* Sidebar Header */}
        <div className="learnix-sidebar-top">
          <div className="learnix-sidebar-logo">
            <Image
              src="https://res.cloudinary.com/ddycnd409/image/upload/v1758341529/Picsart_25-09-18_21-28-57-720-removebg-preview_hjouiw.png"
              alt="Learnix"
              width={120}
              height={41}
              className="learnix-sidebar-logo-img"
            />
          </div>
          <button
            className="learnix-sidebar-close-button"
            onClick={closeSidebar}
            aria-label="Close navigation menu"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Sidebar Navigation Links */}
        <nav className="learnix-sidebar-menu">
          <Link
            href="/dashboard"
            className="learnix-nav-item"
            onClick={closeSidebar}
            tabIndex={isOpen ? 0 : -1}
          >
            <span className="learnix-nav-icon">
              <FiHome size={18} />
            </span>
            <span className="learnix-nav-text">Dashboard</span>
          </Link>

          {!hasUSN && (
            <Link
              href="/login"
              className="learnix-nav-item"
              onClick={closeSidebar}
              tabIndex={isOpen ? 0 : -1}
            >
              <span className="learnix-nav-icon">
                <FiLogIn size={18} />
              </span>
              <span className="learnix-nav-text">Login / Register</span>
            </Link>
          )}

          <Link
            href="/search"
            className="learnix-nav-item"
            onClick={closeSidebar}
            tabIndex={isOpen ? 0 : -1}
          >
            <span className="learnix-nav-icon">
              <FiSearch size={18} />
            </span>
            <span className="learnix-nav-text">Search</span>
          </Link>

          <Link
            href="/works"
            className="learnix-nav-item"
            onClick={closeSidebar}
            tabIndex={isOpen ? 0 : -1}
          >
            <span className="learnix-nav-icon">
              <FiFolder size={18} />
            </span>
            <span className="learnix-nav-text">Uploaded Works</span>
          </Link>

          <Link
            href="/upload"
            className="learnix-nav-item"
            onClick={closeSidebar}
            tabIndex={isOpen ? 0 : -1}
          >
            <span className="learnix-nav-icon">
              <FiUpload size={18} />
            </span>
            <span className="learnix-nav-text">Upload</span>
          </Link>

          <Link
            href="/materials"
            className="learnix-nav-item"
            onClick={closeSidebar}
            tabIndex={isOpen ? 0 : -1}
          >
            <span className="learnix-nav-icon">
              <FiBookOpen size={18} />
            </span>
            <span className="learnix-nav-text">Study Materials</span>
          </Link>

          <Link
            href="/tools"
            className="learnix-nav-item"
            onClick={closeSidebar}
            tabIndex={isOpen ? 0 : -1}
          >
            <span className="learnix-nav-icon">
              <FiTool size={18} />
            </span>
            <span className="learnix-nav-text">Tools</span>
          </Link>

          <Link
            href="/feedback"
            className="learnix-nav-item"
            onClick={closeSidebar}
            tabIndex={isOpen ? 0 : -1}
          >
            <span className="learnix-nav-icon">
              <FiMessageCircle size={18} />
            </span>
            <span className="learnix-nav-text">Feedback</span>
          </Link>

          <Link
            href="/help"
            className="learnix-nav-item"
            onClick={closeSidebar}
            tabIndex={isOpen ? 0 : -1}
          >
            <span className="learnix-nav-icon">
              <FiHelpCircle size={18} />
            </span>
            <span className="learnix-nav-text">Help</span>
          </Link>

          <Link
            href="/about"
            className="learnix-nav-item"
            onClick={closeSidebar}
            tabIndex={isOpen ? 0 : -1}
          >
            <span className="learnix-nav-icon">
              <FiBookOpen size={18} />
            </span>
            <span className="learnix-nav-text">About</span>
          </Link>

          <Link
            href="/profile"
            className="learnix-nav-item"
            onClick={closeSidebar}
            tabIndex={isOpen ? 0 : -1}
          >
            <span className="learnix-nav-icon">
              <FiUser size={18} />
            </span>
            <span className="learnix-nav-text">Profile</span>
          </Link>

          {hasUSN && (
            <button
              onClick={handleSignout}
              className="learnix-nav-item learnix-signout-btn"
              tabIndex={isOpen ? 0 : -1}
            >
              <span className="learnix-nav-icon">
                <FiLogOut size={18} />
              </span>
              <span className="learnix-nav-text">Signout</span>
            </button>
          )}
        </nav>
      </aside>
      {/* <Fill/> */}
    </>
  );
};
