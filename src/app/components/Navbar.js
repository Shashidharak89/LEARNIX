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

  // Close sidebar when clicking outside or pressing escape
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        closeSidebar();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevent scrolling when sidebar is open
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Main Navbar */}
      <nav className="learnix-navbar">
        {/* Logo */}
        <div className="learnix-navbar-logo">
          <Link href="/">
            <h1>LEARNIX</h1>
          </Link>
        </div>

        {/* Menu Toggle Button */}
        <button 
          className="learnix-navbar-menu-btn" 
          onClick={toggleSidebar}
          aria-label="Toggle navigation menu"
          aria-expanded={isOpen}
        >
          {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </nav>

      {/* Sidebar Overlay */}
      {isOpen && (
        <div 
          className="learnix-sidebar-overlay" 
          onClick={closeSidebar}
          aria-label="Close navigation menu"
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`learnix-sidebar ${isOpen ? "learnix-sidebar-open" : ""}`}
        aria-hidden={!isOpen}
      >
        {/* Sidebar Header */}
        <div className="learnix-sidebar-header">
          <h2>Navigation</h2>
          <button 
            className="learnix-sidebar-close-btn" 
            onClick={closeSidebar}
            aria-label="Close navigation menu"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Sidebar Navigation Links */}
        <nav className="learnix-sidebar-nav">
          <Link 
            href="/dashboard" 
            className="learnix-sidebar-link" 
            onClick={closeSidebar}
            tabIndex={isOpen ? 0 : -1}
          >
            <FiHome size={20} />
            <span>Dashboard</span>
          </Link>
          
          {/* Show Login only if no USN in localStorage */}
          {!hasUSN && (
            <Link 
              href="/login" 
              className="learnix-sidebar-link" 
              onClick={closeSidebar}
              tabIndex={isOpen ? 0 : -1}
            >
              <FiLogIn size={20} />
              <span>Login</span>
            </Link>
          )}
          
          <Link 
            href="/search" 
            className="learnix-sidebar-link" 
            onClick={closeSidebar}
            tabIndex={isOpen ? 0 : -1}
          >
            <FiSearch size={20} />
            <span>Search</span>
          </Link>
          
          <Link 
            href="/upload" 
            className="learnix-sidebar-link" 
            onClick={closeSidebar}
            tabIndex={isOpen ? 0 : -1}
          >
            <FiUpload size={20} />
            <span>Upload</span>
          </Link>
          
          <Link 
            href="/profile" 
            className="learnix-sidebar-link" 
            onClick={closeSidebar}
            tabIndex={isOpen ? 0 : -1}
          >
            <FiUser size={20} />
            <span>Profile</span>
          </Link>
        </nav>
      </aside>
    </>
  );
};