"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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
    <div className="users-container">
      <input
        type="text"
        className="search-bar"
        placeholder="Search by name, USN, subject, or topic..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="users-list">
        {users.map((user) => (
          <Link
            key={user.usn}
            href={`/search/${user.usn}`}
            className="user-card"
          >
            <Image
              src={user.profileimg}
              alt={user.name}
              width={50}
              height={50}
              className="user-img"
            />
            <div className="user-info">
              <h4>{user.name}</h4>
              <p>{user.usn}</p>
            </div>
          </Link>
        ))}
      </div>

      {loading && <p className="loading-text">Loading...</p>}
      {!hasMore && users.length > 0 && (
        <p className="end-text">No more users to load</p>
      )}
      {!loading && users.length === 0 && (
        <p className="end-text">No users found</p>
      )}
    </div>
  );
}
