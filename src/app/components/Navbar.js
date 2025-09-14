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

  return (
    <>
      {/* Navbar */}
      <nav className="navbar">
        {/* Logo */}
        <div className="navbar-logo">
          <h1>LEARNIX</h1>
        </div>

        {/* Menu Button */}
        <button 
          className="navbar-menu-btn" 
          onClick={toggleSidebar}
          aria-label="Toggle menu"
        >
          {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </nav>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-header">
          <h2>Menu</h2>
          <button 
            className="sidebar-close-btn" 
            onClick={closeSidebar}
            aria-label="Close menu"
          >
            <FiX size={24} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <Link href="/dashboard" className="sidebar-link" onClick={closeSidebar}>
            <FiHome size={20} />
            <span>Dashboard</span>
          </Link>
          
          {/* Show Login only if no USN in localStorage */}
          {!hasUSN && (
            <Link href="/login" className="sidebar-link" onClick={closeSidebar}>
              <FiLogIn size={20} />
              <span>Login</span>
            </Link>
          )}
          
          <Link href="/search" className="sidebar-link" onClick={closeSidebar}>
            <FiSearch size={20} />
            <span>Search</span>
          </Link>
          
          <Link href="/upload" className="sidebar-link" onClick={closeSidebar}>
            <FiUpload size={20} />
            <span>Upload</span>
          </Link>
          
          <Link href="/profile" className="sidebar-link" onClick={closeSidebar}>
            <FiUser size={20} />
            <span>Profile</span>
          </Link>
        </nav>
      </aside>
    </>
  );
};
