"use client";

import { FiSearch, FiLoader, FiUser } from "react-icons/fi";
import { HiOutlineUsers } from "react-icons/hi";
import './styles/UsersPageSkeleton.css';

export default function UsersPageSkeleton() {
  return (
    <div className="mus-skeleton-wrapper">
      <div className="mus-search-section">
        <div className="mus-search-container">
          <div className="mus-search-icon mus-skeleton mus-skeleton-circle"></div>
          <div className="mus-search-input mus-skeleton"></div>
        </div>
      </div>

      <div className="mus-users-grid">
        {[1,2,3,4,5,6,7,8].map((index) => (
          <div 
            key={index} 
            className="mus-user-card mus-skeleton"
            style={{ "--animation-delay": `${index * 0.1}s` }}
          >
            <div className="mus-card-inner">
              <div className="mus-avatar-section">
                <div className="mus-avatar-ring mus-skeleton mus-skeleton-circle"></div>
              </div>
              
              <div className="mus-details-section">
                <div className="mus-name mus-skeleton mus-skeleton-text"></div>
                <div className="mus-usn mus-skeleton">
                  <div className="mus-usn-icon mus-skeleton mus-skeleton-circle"></div>
                  <div className="mus-usn-text mus-skeleton mus-skeleton-text"></div>
                </div>
              </div>
              
              <div className="mus-card-hover-indicator mus-skeleton">
                <div className="mus-hover-arrow mus-skeleton mus-skeleton-circle"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mus-loading-section">
        <div className="mus-spinner mus-skeleton mus-skeleton-circle"></div>
        <div className="mus-loading-text mus-skeleton mus-skeleton-text"></div>
      </div>
    </div>
  );
}