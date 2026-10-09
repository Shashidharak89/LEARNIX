"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  FiCalendar,
  FiBook,
  FiEye,
  FiEyeOff,
  FiClock,
  FiChevronRight,
  FiChevronDown,
  FiSearch,
  FiAlertCircle,
  FiList,
  FiZap,
  FiTrendingUp,
  FiX,
  FiUser,
  FiExternalLink,
  FiArrowUp,
  FiArrowDown,
  FiMessageSquare
} from "react-icons/fi";
import { HiAcademicCap } from "react-icons/hi";
import UserDetailsPageSkeleton from "./UserDetailsPageSkeleton";
import machineLearningSvg from "@/app/profile/icons/Mapping for machine learning.svg";
import "./styles/UserDetailsPage.css";
import { authFetch } from "@/lib/clientAuth";

export default function UserDetailsPage({ usn }) {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const [viewerUsn, setViewerUsn] = useState("");
  const [showImagePreview, setShowImagePreview] = useState(false);

  // Paginated resources state
  const [subjectsPage, setSubjectsPage] = useState(1);
  const [subjectsSize] = useState(10);
  const [subjectsSearch, setSubjectsSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [subjectsOrder, setSubjectsOrder] = useState("asc");
  const [subjectsData, setSubjectsData] = useState([]);
  const [subjectsPagination, setSubjectsPagination] = useState({
    page: 1,
    size: 10,
    totalPages: 1,
    totalRecords: 0,
  });
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingMoreSubjects, setLoadingMoreSubjects] = useState(false);
  const [subjectsError, setSubjectsError] = useState("");

  // Topics under subject state
  const [expandedSubjectIds, setExpandedSubjectIds] = useState({});
  const [subjectTopicsMap, setSubjectTopicsMap] = useState({});
  const [loadingTopicsMap, setLoadingTopicsMap] = useState({});

  const searchDebounceRef = useRef(null);
  const DEFAULT_PROFILE_IMAGE = "https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp";

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("usn") || "";
      setViewerUsn(stored.toUpperCase());
    }
  }, []);

  useEffect(() => {
    if (usn) {
      fetchUserDetails(usn);
    }
  }, [usn]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowImagePreview(false);
      }
    };
    if (showImagePreview) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showImagePreview]);

  const fetchUserDetails = async (usnToSearch) => {
    setLoading(true);
    setHasError(false);
    setMessage("");
    try {
      const res = await authFetch(`/api/user?usn=${encodeURIComponent(usnToSearch)}`);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 404) {
          setMessage("Student profile not found.");
        } else {
          setMessage(data?.error || "Failed to load student details");
        }
        setHasError(true);
        setUser(null);
        return;
      }

      setUser(data.user);
    } catch (err) {
      console.error("Error fetching user details:", err);
      setHasError(true);
      setMessage("Unable to load profile. Please check your connection.");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch paginated subjects for this user
  const fetchUserSubjects = useCallback(async ({
    page = 1,
    size = 10,
    search = "",
    order = "asc",
    append = false
  } = {}) => {
    if (!usn) return;

    if (append) {
      setLoadingMoreSubjects(true);
    } else {
      setLoadingSubjects(true);
    }
    setSubjectsError("");
    try {
      const query = typeof window !== 'undefined' 
        ? new window.URLSearchParams({
            usn: String(usn),
            page: String(page),
            size: String(size),
            search: String(search),
            order: String(order),
          })
        : { toString: () => `usn=${encodeURIComponent(usn)}&page=${page}&size=${size}&search=${encodeURIComponent(search)}&order=${order}` };

      const res = await authFetch(`/api/user/subjects?${query.toString()}`);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Failed to fetch subjects");
      }

      const newSubjects = data.subjects || [];
      if (append) {
        setSubjectsData((prev) => [...prev, ...newSubjects]);
      } else {
        setSubjectsData(newSubjects);
      }
      setSubjectsPage(page);
      if (data.pagination) {
        setSubjectsPagination(data.pagination);
      }
    } catch (err) {
      console.error("Error fetching subjects:", err);
      setSubjectsError(err.message || "Failed to load uploaded resources");
    } finally {
      setLoadingSubjects(false);
      setLoadingMoreSubjects(false);
    }
  }, [usn]);

  // Request topics under a specific subject
  const toggleSubjectTopics = async (subjectId) => {
    const isCurrentlyExpanded = !!expandedSubjectIds[subjectId];
    if (isCurrentlyExpanded) {
      setExpandedSubjectIds((prev) => ({ ...prev, [subjectId]: false }));
      return;
    }

    setExpandedSubjectIds((prev) => ({ ...prev, [subjectId]: true }));

    if (subjectTopicsMap[subjectId]) {
      return;
    }

    setLoadingTopicsMap((prev) => ({ ...prev, [subjectId]: true }));
    try {
      const res = await authFetch(`/api/user/topics?subjectId=${subjectId}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.topics) {
        setSubjectTopicsMap((prev) => ({ ...prev, [subjectId]: data.topics }));
      } else {
        setSubjectTopicsMap((prev) => ({ ...prev, [subjectId]: [] }));
      }
    } catch (err) {
      console.error("Error requesting topics for subject:", err);
      setSubjectTopicsMap((prev) => ({ ...prev, [subjectId]: [] }));
    } finally {
      setLoadingTopicsMap((prev) => ({ ...prev, [subjectId]: false }));
    }
  };

  const loadMoreSubjects = () => {
    if (loadingMoreSubjects || subjectsPagination.page >= subjectsPagination.totalPages) return;
    const nextPage = subjectsPagination.page + 1;
    fetchUserSubjects({
      page: nextPage,
      size: subjectsSize,
      search: subjectsSearch,
      order: subjectsOrder,
      append: true,
    });
  };

  const handleSearchChange = (val) => {
    setSearchInput(val);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      setSubjectsPage(1);
      setSubjectsSearch(val);
      fetchUserSubjects({
        page: 1,
        size: subjectsSize,
        search: val,
        order: subjectsOrder,
        append: false,
      });
    }, 350);
  };

  const clearSearch = () => {
    setSearchInput("");
    setSubjectsPage(1);
    setSubjectsSearch("");
    fetchUserSubjects({
      page: 1,
      size: subjectsSize,
      search: "",
      order: subjectsOrder,
      append: false,
    });
  };

  const handleSortToggle = () => {
    const newOrder = subjectsOrder === "asc" ? "desc" : "asc";
    setSubjectsOrder(newOrder);
    setSubjectsPage(1);
    fetchUserSubjects({
      page: 1,
      size: subjectsSize,
      search: subjectsSearch,
      order: newOrder,
      append: false,
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Sep 13, 2025";
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <UserDetailsPageSkeleton />;
  }

  if (hasError || !user) {
    return (
      <div className="up-container">
        <div className="up-wrapper">
          <div className="up-error-container">
            <div className="up-error-content">
              <FiUser className="up-error-icon" />
              <h3 className="up-error-title">Student Not Found</h3>
              <p className="up-error-message">{message || "No user found with the provided USN."}</p>
              <Link href="/search" className="up-login-btn">
                <FiSearch className="up-login-icon" />
                Search Another Student
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const canChat = Boolean(
    viewerUsn &&
    user?.id &&
    viewerUsn !== String(user?.usn || "").toUpperCase()
  );

  return (
    <div className="up-container">
      <div className="up-wrapper">
        {/* Centered LEARNIX PROFILE Badge Card */}
        <div className="up-badge-card-container">
          <div className="up-badge-card">
            <FiUser className="up-badge-card-icon" />
            <span>LEARNIX PROFILE</span>
          </div>
        </div>

        {/* Top Main Profile Card with broader height */}
        <div className="up-main-card">
          {/* Decorative Corner Accents */}
          <div className="up-card-accent-blue" />
          <div className="up-card-accent-yellow">
            <div className="up-card-dots" />
          </div>
          <div className="up-card-dots-left" />

          {/* Main Profile Body */}
          <div className="up-main-card-body">
            {/* Left Profile Info */}
            <div className="up-profile-left">
              <div 
                className="up-avatar-wrapper is-clickable"
                onClick={() => setShowImagePreview(true)}
                role="button"
                tabIndex={0}
                title="Click to view full profile picture"
              >
                <img
                  src={user.profileimg || DEFAULT_PROFILE_IMAGE}
                  alt={user.name}
                  className="up-avatar-img"
                />
                <div className="up-avatar-hover-overlay">
                  <FiEye className="up-avatar-eye-icon" />
                  <span className="up-avatar-eye-label">View</span>
                </div>
              </div>

              <div className="up-user-details">
                <h2 className="up-user-fullname">{user.name}</h2>
                <div className="up-user-usn">{user.usn}</div>

                <p className="up-user-quote">
                  &ldquo;Every journey begins with a single step.&rdquo;
                </p>

                <div className="up-meta-list">
                  <div className="up-meta-pill">
                    <HiAcademicCap className="up-meta-icon" />
                    <span>Student</span>
                  </div>
                  <div className="up-meta-pill">
                    <FiCalendar className="up-meta-icon" />
                    <span>Joined {formatDate(user.createdAt)}</span>
                  </div>
                  {/* Note: Email is intentionally omitted when inspecting other users */}
                  {canChat && (
                    <Link href={`/chat/${user.id}`} className="up-chat-pill" title="Start Chat">
                      <FiMessageSquare className="up-meta-icon" />
                      <span>Chat</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Right 4 Stat Cards: Subjects, Topics, Streak, Highest Streak (Uploads removed) */}
            <div className="up-stats-grid">
              {/* Card 1: Subjects */}
              <div className="up-stat-card is-subjects">
                <div className="up-stat-icon-wrapper">
                  <FiBook />
                </div>
                <div className="up-stat-value">{user.subjectsCount ?? user.subjects?.length ?? 0}</div>
                <div className="up-stat-label">Subjects</div>
              </div>

              {/* Card 2: Topics */}
              <div className="up-stat-card is-topics">
                <div className="up-stat-icon-wrapper">
                  <FiList />
                </div>
                <div className="up-stat-value">{user.topicsCount ?? 0}</div>
                <div className="up-stat-label">Topics</div>
              </div>

              {/* Card 3: Streak */}
              <div className="up-stat-card is-streak">
                <div className="up-stat-icon-wrapper">
                  <FiZap />
                </div>
                <div className="up-stat-value">{user.streaks || 1}</div>
                <div className="up-stat-label">Streak</div>
              </div>

              {/* Card 4: Highest streak */}
              <div className="up-stat-card is-highest-streak">
                <div className="up-stat-icon-wrapper">
                  <FiTrendingUp />
                </div>
                <div className="up-stat-value">{user.highestStreak || 1}</div>
                <div className="up-stat-label">Highest streak</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Banner Card: View Uploaded Resources */}
        <div className="up-resources-banner-card">
          {/* Left Graphic */}
          <div className="up-banner-graphic-left">
            <svg width="105" height="90" viewBox="0 0 120 100" fill="none">
              <ellipse cx="60" cy="90" rx="50" ry="6" fill="#cbd5e1" opacity="0.5"/>
              <path d="M15 30C15 26.6863 17.6863 24 21 24H42L50 32H99C102.314 32 105 34.6863 105 38V80C105 83.3137 102.314 86 99 86H21C17.6863 86 15 83.3137 15 80V30Z" fill="#2563eb" opacity="0.85"/>
              <rect x="35" y="16" width="30" height="40" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2"/>
              <line x1="41" y1="26" x2="57" y2="26" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/>
              <line x1="41" y1="32" x2="53" y2="32" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/>
              <path d="M12 40C12 36.6863 14.6863 34 18 34H102C105.314 34 108 36.6863 108 40V82C108 85.3137 105.314 88 102 88H18C14.6863 88 12 85.3137 12 82V40Z" fill="#007bff"/>
              <circle cx="60" cy="62" r="16" fill="#ffffff"/>
              <path d="M54 64C54 61.7909 55.7909 60 58 60C58.5523 60 59.0768 60.1118 59.5547 60.3137C60.2783 58.3754 62.1332 57 64.3333 57C67.1147 57 69.3804 59.135 69.6436 61.8596C70.9998 62.1245 72 63.3137 72 64.75C72 66.5449 70.5449 68 68.75 68H57.75C55.6789 68 54 66.3211 54 64.25Z" fill="#007bff"/>
              <path d="M60 66V58M60 58L57 61M60 58L63 61" stroke="#007bff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Center Content */}
          <div className="up-banner-center">
            <h3 className="up-banner-heading">View Uploaded Resources</h3>
            <p className="up-banner-subtext">
              {user.subjectsCount ?? user.subjects?.length ?? 0} subjects • {user.topicsCount ?? 0} topics
            </p>

            <button
              className="up-banner-action-btn"
              onClick={() => {
                const nextShow = !showResources;
                setShowResources(nextShow);
                if (nextShow && subjectsData.length === 0) {
                  fetchUserSubjects({
                    page: 1,
                    size: subjectsSize,
                    search: subjectsSearch,
                    order: subjectsOrder,
                  });
                }
              }}
            >
              {showResources ? (
                <>
                  <FiEyeOff /> Hide Resources
                </>
              ) : (
                <>
                  View Resources <FiChevronRight />
                </>
              )}
            </button>
          </div>

          {/* Right Graphic */}
          <div className="up-banner-graphic-right">
            <img
              src={machineLearningSvg.src || machineLearningSvg}
              alt="Machine Learning Mapping"
              className="up-banner-ml-img"
              style={{ width: "160px", height: "105px", objectFit: "contain" }}
            />
          </div>
        </div>

        {/* Expanded Resources Area with Auth-Protected Pagination & View More Button */}
        {showResources && (
          <div className="up-expanded-resources-section">
            {/* Search & Sort Controls Toolbar */}
            <div className="up-resources-toolbar">
              <div className="up-search-box">
                <FiSearch className="up-search-icon" />
                <input
                  type="text"
                  placeholder="Search subjects or topics..."
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="up-search-input"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="up-search-clear-btn"
                    title="Clear search"
                  >
                    <FiX />
                  </button>
                )}
              </div>

              <div className="up-sort-control">
                <button
                  type="button"
                  className="up-sort-btn"
                  onClick={handleSortToggle}
                  title={`Current sort: ${subjectsOrder === "asc" ? "A to Z" : "Z to A"}`}
                >
                  {subjectsOrder === "asc" ? (
                    <>
                      <FiArrowUp className="up-sort-icon" />
                      <span>Sort: A → Z</span>
                    </>
                  ) : (
                    <>
                      <FiArrowDown className="up-sort-icon" />
                      <span>Sort: Z → A</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Loading State */}
            {loadingSubjects ? (
              <div className="up-uploads-loading">
                <div className="up-mini-spinner" />
                <p>Loading uploaded resources...</p>
              </div>
            ) : subjectsError ? (
              <div className="up-error-box">
                <FiAlertCircle className="up-error-icon" />
                <span>{subjectsError}</span>
                <button
                  type="button"
                  onClick={() =>
                    fetchUserSubjects({
                      page: subjectsPage,
                      size: subjectsSize,
                      search: subjectsSearch,
                      order: subjectsOrder,
                    })
                  }
                  className="up-retry-btn"
                >
                  Retry
                </button>
              </div>
            ) : subjectsData.length === 0 ? (
              <div className="up-empty">
                <FiBook className="up-empty-icon" />
                <h3 className="up-empty-title">
                  {subjectsSearch ? "No matching subjects found" : "No public subjects added yet"}
                </h3>
                <p className="up-empty-text">
                  {subjectsSearch
                    ? `No results for "${subjectsSearch}". Try a different keyword.`
                    : "This student has not added any public subjects yet."}
                </p>
              </div>
            ) : (
              <>
                <div className="up-subjects">
                  {subjectsData.map((subject) => {
                    const isExpanded = !!expandedSubjectIds[subject._id];
                    const isLoadingTopics = !!loadingTopicsMap[subject._id];
                    const topics = subjectTopicsMap[subject._id];

                    return (
                      <div key={subject._id} className="up-subject-card">
                        <div
                          className="up-subject-header clickable"
                          onClick={() => toggleSubjectTopics(subject._id)}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="up-subject-title">
                            <FiBook className="up-subject-icon" />
                            <h3 className="up-subject-name">{subject.subject}</h3>
                          </div>

                          <div className="up-subject-actions">
                            <span className="up-subject-badge">
                              {subject.topicsCount} {subject.topicsCount === 1 ? "topic" : "topics"}
                            </span>
                            <button
                              type="button"
                              className={`up-subject-expand-btn ${isExpanded ? "is-expanded" : ""}`}
                              aria-label={isExpanded ? "Collapse topics" : "Expand topics"}
                            >
                              <FiChevronDown />
                            </button>
                          </div>
                        </div>

                        {/* Under subject, user can request/view topics */}
                        {isExpanded && (
                          <div className="up-subject-topics-wrapper">
                            {isLoadingTopics ? (
                              <div className="up-topic-loading">
                                <div className="up-mini-spinner" />
                                <span>Requesting topics...</span>
                              </div>
                            ) : !topics || topics.length === 0 ? (
                              <div className="up-empty-topics">
                                <p>No public topics added under this subject yet.</p>
                              </div>
                            ) : (
                              <div className="up-topics">
                                {topics.map((topic) => (
                                  <Link
                                    key={topic._id}
                                    href={`/works/${topic._id}`}
                                    className="up-topic-card up-topic-card-link"
                                    title={`Open ${topic.topic} in works`}
                                  >
                                    <div className="up-topic-header">
                                      <div className="up-topic-title">
                                        <h4 className="up-topic-name">{topic.topic}</h4>
                                        <span className="up-topic-date">
                                          <FiClock className="up-date-icon" />
                                          {formatDate(topic.timestamp)}
                                        </span>
                                      </div>
                                      <div className="up-topic-action-badge">
                                        <span>Open in Works</span>
                                        <FiExternalLink className="up-topic-action-icon" />
                                      </div>
                                    </div>

                                    {topic.content && (
                                      <div className="up-topic-content">
                                        <p>{topic.content}</p>
                                      </div>
                                    )}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* View More Button (appends next page) */}
                {subjectsPagination.page < subjectsPagination.totalPages && (
                  <div className="up-view-more-container">
                    <button
                      type="button"
                      className="up-view-more-btn"
                      onClick={loadMoreSubjects}
                      disabled={loadingMoreSubjects}
                    >
                      {loadingMoreSubjects ? (
                        <>
                          <div className="up-mini-spinner" />
                          <span>Loading more subjects...</span>
                        </>
                      ) : (
                        <>
                          <span>View More</span>
                          <FiChevronDown className="up-view-more-icon" />
                        </>
                      )}
                    </button>
                    <p className="up-view-more-info">
                      Showing {subjectsData.length} of {subjectsPagination.totalRecords} subjects
                    </p>
                  </div>
                )}

                {subjectsPagination.totalRecords > subjectsSize &&
                  subjectsPagination.page >= subjectsPagination.totalPages && (
                    <div className="up-view-more-completed">
                      <p>All {subjectsPagination.totalRecords} subjects loaded</p>
                    </div>
                  )}
              </>
            )}
          </div>
        )}

        {/* Profile Picture Popup Modal Window */}
        {showImagePreview && (
          <div
            className="up-image-modal-backdrop"
            onClick={() => setShowImagePreview(false)}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="up-image-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="up-image-modal-header">
                <div className="up-image-modal-user-info">
                  <FiUser className="up-image-modal-icon" />
                  <span className="up-image-modal-name">{user.name}</span>
                  <span className="up-image-modal-usn">({user.usn})</span>
                </div>
                <button
                  type="button"
                  className="up-image-modal-close-btn"
                  onClick={() => setShowImagePreview(false)}
                  aria-label="Close image preview"
                >
                  <FiX />
                </button>
              </div>

              <div className="up-image-modal-body">
                <img
                  src={user.profileimg || DEFAULT_PROFILE_IMAGE}
                  alt={`${user.name}'s profile picture`}
                  className="up-image-modal-img"
                />
              </div>

              <div className="up-image-modal-footer">
                <span className="up-image-modal-hint">Profile Photo Preview</span>
                <a
                  href={user.profileimg || DEFAULT_PROFILE_IMAGE}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="up-image-modal-action-link"
                >
                  <FiExternalLink /> Open in Full Resolution
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}