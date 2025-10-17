// UsersPageSkeleton.js
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiSearch, FiUser, FiLoader } from "react-icons/fi";
import { HiOutlineUsers } from "react-icons/hi";
import "./styles/UsersPageSkeleton.css";

export default function UsersPageSkeleton() {
  // Initial skeleton state: show loading for initial load
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const skeletonCount = 10; // Number of skeleton cards to show

  // Simulate initial load delay for skeleton
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 2000); // Adjust delay as needed for demo
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="modern-users-wrapper-skeleton">
      <div className="modern-search-section-skeleton">
        <div className="modern-search-container-skeleton">
          <FiSearch className="search-icon-modern-skeleton" />
          <div className="modern-search-input-skeleton"></div>
        </div>
      </div>

      <div className="modern-users-grid-skeleton">
        {[...Array(skeletonCount)].map((_, index) => (
          <div
            key={index}
            className="modern-user-card-skeleton"
            style={{ "--animation-delay": `${index * 0.1}s` }}
          >
            <div className="user-card-inner-skeleton">
              <div className="user-avatar-section-skeleton">
                <div className="avatar-ring-skeleton">
                  <div className="modern-user-avatar-skeleton"></div>
                </div>
              </div>
              
              <div className="user-details-section-skeleton">
                <div className="modern-user-name-skeleton"></div>
                <div className="modern-user-usn-skeleton">
                  <FiUser className="usn-icon-skeleton" />
                  <div className="usn-text-skeleton"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isInitialLoading && (
        <div className="modern-loading-section-skeleton">
          <FiLoader className="loading-spinner-skeleton" />
          <span className="loading-text-modern-skeleton">Loading users...</span>
        </div>
      )}
    </div>
  );
}