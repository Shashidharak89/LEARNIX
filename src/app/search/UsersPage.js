"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiSearch, FiUser, FiLoader } from "react-icons/fi";
import { HiOutlineUsers } from "react-icons/hi";
import "./styles/UsersPage.css";

export default function UsersPage() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const limit = 10;

  useEffect(() => {
    // when query changes, reset and fetch from page 1
    setPage(1);
    fetchUsers(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const fetchUsers = async (reset = false) => {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch(
        `/api/user/all?search=${encodeURIComponent(query)}&page=${
          reset ? 1 : page
        }&limit=${limit}`
      );
      const data = await res.json();

      if (data.users) {
        if (reset) {
          setUsers(data.users);
          setPage(2);
        } else {
          setUsers((prev) => {
            const existingUSNs = new Set(prev.map((u) => u.usn));
            const newOnes = data.users.filter((u) => !existingUSNs.has(u.usn));
            return [...prev, ...newOnes];
          });
          setPage((prev) => prev + 1);
        }
        setHasMore(data.users.length === limit);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = () => {
    if (
      window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 200 &&
      hasMore &&
      !loading
    ) {
      fetchUsers(false);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loading]);

  return (
    <div className="modern-users-wrapper">
      {/* <div className="modern-users-header">
        <div className="header-icon-wrapper">
          <HiOutlineUsers className="header-main-icon" />
        </div>
        <h1 className="modern-page-title">Discover Users</h1>
        <p className="modern-page-subtitle">Find and connect with fellow students</p>
      </div> */}

      <div className="modern-search-section">
        <div className="modern-search-container">
          <FiSearch className="search-icon-modern" />
          <input
            type="text"
            className="modern-search-input"
            placeholder="Search by name, USN, subject, or topic..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="modern-users-grid">
        {users.map((user, index) => (
          <Link
            key={user.usn}
            href={`/search/${user.usn}`}
            className="modern-user-card"
            style={{ "--animation-delay": `${index * 0.1}s` }}
          >
            <div className="user-card-inner">
              <div className="user-avatar-section">
                <div className="avatar-ring">
                  <Image
                    src={user.profileimg}
                    alt={user.name}
                    width={60}
                    height={60}
                    className="modern-user-avatar"
                  />
                </div>
              </div>
              
              <div className="user-details-section">
                <h3 className="modern-user-name">{user.name}</h3>
                <div className="modern-user-usn">
                  <FiUser className="usn-icon" />
                  <span>{user.usn}</span>
                </div>
              </div>
              
              <div className="card-hover-indicator">
                <div className="hover-arrow">→</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {loading && (
        <div className="modern-loading-section">
          <FiLoader className="loading-spinner" />
          <span className="loading-text-modern">Loading more users...</span>
        </div>
      )}
      
      {!hasMore && users.length > 0 && (
        <div className="modern-end-message">
          <p className="end-text-modern">🎉 You've seen all users!</p>
        </div>
      )}
      
      {!loading && users.length === 0 && (
        <div className="modern-empty-state">
          <HiOutlineUsers className="empty-state-icon" />
          <h3 className="empty-state-title">No users found</h3>
          <p className="empty-state-subtitle">Try adjusting your search terms</p>
        </div>
      )}
    </div>
  );
}