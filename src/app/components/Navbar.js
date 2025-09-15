"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FiMenu, 
  FiX, 
  FiHome, 
  FiLogIn, 
  FiSearch, 
  FiUpload, 
  FiUser 
} from "react-icons/fi";
import "./styles/Navbar.css";

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

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeSidebar();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Main Navbar */}
      <nav className="learnix-navbar">
        {/* Logo Section */}
        <div className="learnix-navbar__logo">
          <Link href="/" className="learnix-navbar__logo-link">
            <h1 className="learnix-navbar__logo-text">LEARNIX</h1>
          </Link>
        </div>

        {/* Menu Toggle Button */}
        <button 
          className="learnix-navbar__menu-toggle" 
          onClick={toggleSidebar}
          aria-label="Toggle navigation menu"
          aria-expanded={isOpen}
        >
          <span className="learnix-navbar__menu-icon">
            {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </span>
        </button>
      </nav>

      {/* Backdrop Overlay */}
      <div 
        className={`learnix-sidebar__backdrop ${isOpen ? 'learnix-sidebar__backdrop--active' : ''}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* Sidebar Navigation */}
      <aside className={`learnix-sidebar ${isOpen ? 'learnix-sidebar--open' : ''}`}>
        {/* Sidebar Header */}
        <div className="learnix-sidebar__header">
          <h2 className="learnix-sidebar__title">Navigation</h2>
          <button 
            className="learnix-sidebar__close-btn" 
            onClick={closeSidebar}
            aria-label="Close navigation menu"
          >
            <FiX size={22} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="learnix-sidebar__nav">
          <Link 
            href="/dashboard" 
            className="learnix-sidebar__link" 
            onClick={closeSidebar}
          >
            <FiHome size={20} className="learnix-sidebar__icon" />
            <span className="learnix-sidebar__text">Dashboard</span>
          </Link>
          
          {!hasUSN && (
            <Link 
              href="/login" 
              className="learnix-sidebar__link" 
              onClick={closeSidebar}
            >
              <FiLogIn size={20} className="learnix-sidebar__icon" />
              <span className="learnix-sidebar__text">Login</span>
            </Link>
          )}
          
          <Link 
            href="/search" 
            className="learnix-sidebar__link" 
            onClick={closeSidebar}
          >
            <FiSearch size={20} className="learnix-sidebar__icon" />
            <span className="learnix-sidebar__text">Search</span>
          </Link>
          
          <Link 
            href="/upload" 
            className="learnix-sidebar__link" 
            onClick={closeSidebar}
          >
            <FiUpload size={20} className="learnix-sidebar__icon" />
            <span className="learnix-sidebar__text">Upload</span>
          </Link>
          
          <Link 
            href="/profile" 
            className="learnix-sidebar__link" 
            onClick={closeSidebar}
          >
            <FiUser size={20} className="learnix-sidebar__icon" />
            <span className="learnix-sidebar__text">Profile</span>
          </Link>
        </nav>
      </aside>
    </>
  );
};