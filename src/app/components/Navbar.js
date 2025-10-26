"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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
  FiFolder           
} from "react-icons/fi";
import "./styles/Navbar.css";
import { Fill } from "./Fill";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUSN, setHasUSN] = useState(false);

  useEffect(() => {
    const storedUsn = localStorage.getItem("usn");
    setHasUSN(!!storedUsn);
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
              <span className="learnix-nav-text">Login</span>
            </Link>
          )}
          {!hasUSN && (
            <Link 
              href="/signup" 
              className="learnix-nav-item" 
              onClick={closeSidebar}
              tabIndex={isOpen ? 0 : -1}
            >
              <span className="learnix-nav-icon">
                <FiUser size={18} />
              </span>
              <span className="learnix-nav-text">Signup</span>
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