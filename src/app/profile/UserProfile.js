"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Script from "next/script";
import {
  FiCalendar,
  FiBook,
  FiEyeOff,
  FiClock,
  FiChevronRight,
  FiChevronDown,
  FiSearch,
  FiSettings,
  FiLogIn,
  FiAlertCircle,
  FiMail,
  FiCheckCircle,
  FiCamera,
  FiList,
  FiZap,
  FiTrendingUp,
  FiX,
  FiHelpCircle,
  FiUserPlus,
  FiLock,
  FiUser,
  FiExternalLink,
  FiArrowUp,
  FiArrowDown,
  FiGlobe
} from "react-icons/fi";
import { HiAcademicCap } from "react-icons/hi";
import ChangeName from './ChangeName';
import ChangePassword from './ChangePassword';
import ProfileImageEditor from './ProfileImageEditor';
import UserProfileSkeleton from './UserProfileSkeleton';
import machineLearningSvg from './icons/Mapping for machine learning.svg';
import './styles/UserProfile.css';
import { authFetch } from '@/lib/clientAuth';

export default function UserProfile({ googleClientId = "" }) {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [profileImage, setProfileImage] = useState("https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp");
  const [quote, setQuote] = useState("");
  const [showResources, setShowResources] = useState(false);

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

  // Google bind state
  const [googleScriptReady, setGoogleScriptReady] = useState(false);
  const [isBindingGoogle, setIsBindingGoogle] = useState(false);
  const [googleBindMessage, setGoogleBindMessage] = useState("");
  const [googleBindError, setGoogleBindError] = useState(false);
  const googleButtonRef = useRef(null);
  const searchDebounceRef = useRef(null);

  useEffect(() => {
    fetchUserProfile();
    fetchQuote();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowSettings(false);
      }
    };
    if (showSettings) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSettings]);

  useEffect(() => {
    let intervalId = null;
    const tick = async () => {
      try {
        const usn = localStorage.getItem("usn");
        if (!usn) return;
        await authFetch("/api/user/active", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usn }),
        });
      } catch (err) {
        console.error("Failed to update active time:", err);
      }
    };
    intervalId = setInterval(tick, 60000);
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const handleGoogleCredential = useCallback(async (response) => {
    const credential = String(response?.credential || "").trim();
    if (!credential) {
      setGoogleBindError(true);
      setGoogleBindMessage("Google did not return a valid credential.");
      return;
    }

    try {
      setIsBindingGoogle(true);
      setGoogleBindError(false);
      setGoogleBindMessage("");

      const res = await authFetch("/api/auth/google/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Google verification failed");
      }

      setGoogleBindMessage("Google account linked successfully!");
      if (data?.user?.email) {
        setUser((prev) => (prev ? { ...prev, email: data.user.email } : prev));
      }
    } catch (err) {
      setGoogleBindError(true);
      setGoogleBindMessage(err.message || "Failed to link Google account.");
    } finally {
      setIsBindingGoogle(false);
    }
  }, []);

  useEffect(() => {
    if (!googleScriptReady || !user || user.email || !googleClientId || !googleButtonRef.current) return;
    if (!window.google?.accounts?.id) return;

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: handleGoogleCredential,
    });

    googleButtonRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: "outline",
      size: "large",
      shape: "pill",
      text: "continue_with",
      logo_alignment: "left",
      width: 280,
    });
  }, [googleScriptReady, user, googleClientId, handleGoogleCredential]);

  const fetchQuote = async () => {
    try {
      const response = await fetch('https://zenquotes.io/api/random');
      const data = await response.json();
      if (data && data[0] && data[0].q) {
        setQuote(data[0].q);
      }
    } catch (error) {
      console.error('Error fetching quote:', error);
      setQuote("Every journey begins with a single step.");
    }
  };

  const fetchUserProfile = async () => {
    setLoading(true);
    setHasError(false);
    try {
      const usn = typeof window !== 'undefined' ? localStorage.getItem("usn") : null;
      if (!usn) {
        setUser(null);
        setHasError(false);
        setMessage("Guest Mode");
        setLoading(false);
        return;
      }

      const res = await authFetch(`/api/user?usn=${usn}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setUser(null);
          setHasError(false);
          setMessage("Guest Mode");
          setLoading(false);
          return;
        }
        throw new Error(data?.error || "Failed to fetch user profile");
      }

      setUser(data.user);
      setProfileImage(data.user.profileimg || "https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp");
      setMessage("");
      setHasError(false);
    } catch (err) {
      console.error(err);
      setHasError(true);
      if (err.response?.status === 404) {
        setMessage("Profile not found! Something went wrong, please login again.");
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        setMessage("Authentication failed! Please login again.");
      } else {
        setMessage("Something went wrong! Please login again.");
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch paginated subjects using auth header, supporting append
  const fetchUserSubjects = useCallback(async ({
    page = 1,
    size = 10,
    search = "",
    order = "asc",
    append = false
  } = {}) => {
    if (append) {
      setLoadingMoreSubjects(true);
    } else {
      setLoadingSubjects(true);
    }
    setSubjectsError("");
    try {
      const query = typeof window !== 'undefined' 
        ? new window.URLSearchParams({
            page: String(page),
            size: String(size),
            search: String(search),
            order: String(order),
          })
        : { toString: () => `page=${page}&size=${size}&search=${encodeURIComponent(search)}&order=${order}` };

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
  }, []);

  // Request topics under a specific subject using auth header
  const toggleSubjectTopics = async (subjectId) => {
    const isCurrentlyExpanded = !!expandedSubjectIds[subjectId];
    if (isCurrentlyExpanded) {
      setExpandedSubjectIds((prev) => ({ ...prev, [subjectId]: false }));
      return;
    }

    setExpandedSubjectIds((prev) => ({ ...prev, [subjectId]: true }));

    // If topics already loaded for this subject, don't re-fetch
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
    return <UserProfileSkeleton />;
  }

  if (hasError) {
    return (
      <div className="up-container">
        <div className="up-wrapper">
          <div className="up-error-container">
            <div className="up-error-content">
              <FiAlertCircle className="up-error-icon" />
              <h3 className="up-error-title">Oops! Something went wrong</h3>
              <p className="up-error-message">{message}</p>
              <Link href="/login" className="up-login-btn">
                <FiLogIn className="up-login-icon" />
                Login Again
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="up-container">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGoogleScriptReady(true)}
      />
      <div className="up-wrapper">
        {/* Page Title: My Profile in our app theme design (No breadcrumb) */}
        <div className="up-page-header">
          <h1 className="up-page-title">My Profile</h1>
        </div>

        {user ? (
          <>
            {/* Top Main Profile Card with broader height */}
            <div className="up-main-card">
              {/* Decorative Corner Accents */}
              <div className="up-card-accent-blue" />
              <div className="up-card-accent-yellow">
                <div className="up-card-dots" />
              </div>
              <div className="up-card-dots-left" />

              {/* Settings Gear Button */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="up-settings-gear-btn"
                title="Account Settings"
              >
                <FiSettings />
              </button>

              {/* Settings Modal Window */}
              {showSettings && (
                <div
                  className="up-settings-modal-backdrop"
                  onClick={() => setShowSettings(false)}
                  role="dialog"
                  aria-modal="true"
                >
                  <div
                    className="up-settings-modal-container"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="up-settings-header">
                      <div className="up-settings-title-group">
                        <div className="up-settings-header-icon-wrap">
                          <FiSettings className="up-settings-header-icon" />
                        </div>
                        <div>
                          <h2 className="up-settings-main-title">Account Settings</h2>
                          <p className="up-settings-subtitle">
                            Update your photo, display name, and security password
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowSettings(false)}
                        className="up-settings-close-btn"
                        title="Close settings"
                        aria-label="Close settings"
                      >
                        <FiX />
                      </button>
                    </div>

                    <div className="up-settings-grid">
                      <ProfileImageEditor
                        profileImage={profileImage}
                        setProfileImage={setProfileImage}
                        usn={localStorage.getItem("usn")}
                      />
                      <ChangeName usn={localStorage.getItem("usn")} />
                      <ChangePassword usn={localStorage.getItem("usn")} />
                    </div>
                  </div>
                </div>
              )}

              {/* Main Profile Body */}
              <div className="up-main-card-body">
                {/* Left Profile Info */}
                <div className="up-profile-left">
                  <div className="up-avatar-wrapper">
                    <img 
                      src={profileImage} 
                      alt={user.name} 
                      className="up-avatar-img"
                    />
                    <button
                      onClick={() => setShowSettings(true)}
                      className="up-avatar-edit-badge"
                      title="Edit Profile Image"
                    >
                      <FiCamera />
                    </button>
                  </div>

                  <div className="up-user-details">
                    <h2 className="up-user-fullname">{user.name}</h2>
                    <div className="up-user-usn">{user.usn}</div>
                    
                    <p className="up-user-quote">
                      {quote ? quote : "Every journey begins with a single step."}
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
                      {user.email && (
                        <div className="up-meta-pill">
                          <FiMail className="up-meta-icon" />
                          <span>{user.email}</span>
                        </div>
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

              {/* Google Account Binding Box */}
              {!user.email && (
                <div className="up-google-bind-box">
                  <h4 className="up-google-bind-title">Bind your Google account</h4>
                  <p className="up-google-bind-subtitle">
                    Add your verified Google email to your profile.
                  </p>
                  {googleClientId ? (
                    <div ref={googleButtonRef} className="up-google-button-slot" />
                  ) : (
                    <p className="up-google-status is-error">
                      Google Client ID is missing in environment configuration.
                    </p>
                  )}
                  {isBindingGoogle && (
                    <div className="up-google-loading">
                      <div className="up-mini-spinner"></div>
                      <span>Linking Google account...</span>
                    </div>
                  )}
                  {googleBindMessage && (
                    <p className={`up-google-status ${googleBindError ? "is-error" : "is-success"}`}>
                      {googleBindError ? <FiAlertCircle /> : <FiCheckCircle />}
                      <span>{googleBindMessage}</span>
                    </p>
                  )}
                </div>
              )}
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

            {/* Expanded Resources Area with Auth-Protected Pagination */}
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
                      {subjectsSearch ? "No matching subjects found" : "No subjects added yet"}
                    </h3>
                    <p className="up-empty-text">
                      {subjectsSearch
                        ? `No results for "${subjectsSearch}". Try a different keyword.`
                        : "Start creating subjects and uploading topics to build your profile!"}
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
                                <span className={`up-visibility-pill is-${(subject.visibility || "public").toLowerCase()}`} title={`Subject visibility: ${subject.visibility || "public"}`}>
                                  {subject.visibility === "private" ? (
                                    <FiLock className="up-visibility-icon" />
                                  ) : subject.visibility === "unlisted" ? (
                                    <FiEyeOff className="up-visibility-icon" />
                                  ) : (
                                    <FiGlobe className="up-visibility-icon" />
                                  )}
                                  <span>{subject.visibility || "public"}</span>
                                </span>
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
                                    <p>No topics added under this subject yet.</p>
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
                                            <div className="up-topic-title-top">
                                              <h4 className="up-topic-name">{topic.topic}</h4>
                                              <span className={`up-visibility-pill is-${(topic.visibility || "public").toLowerCase()} up-topic-vis-pill`} title={`Topic visibility: ${topic.visibility || "public"}`}>
                                                {topic.visibility === "private" ? (
                                                  <FiLock className="up-visibility-icon" />
                                                ) : topic.visibility === "unlisted" ? (
                                                  <FiEyeOff className="up-visibility-icon" />
                                                ) : (
                                                  <FiGlobe className="up-visibility-icon" />
                                                )}
                                                <span>{topic.visibility || "public"}</span>
                                              </span>
                                            </div>
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
          </>
        ) : (
          <>
            {/* Guest / Logged Out Profile Card with broader height */}
            <div className="up-main-card is-guest">
              <div className="up-card-accent-blue" />
              <div className="up-card-accent-yellow">
                <div className="up-card-dots" />
              </div>
              <div className="up-card-dots-left" />

              <div className="up-main-card-body">
                {/* Left Profile Info */}
                <div className="up-profile-left">
                  <div className="up-avatar-wrapper is-guest-avatar">
                    <div className="up-guest-avatar-circle">
                      <span className="up-guest-avatar-qm">?</span>
                    </div>
                  </div>

                  <div className="up-user-details">
                    <div className="up-guest-badge">
                      <FiHelpCircle className="up-guest-badge-icon" /> Guest Profile
                    </div>
                    <h2 className="up-user-fullname">Guest Student</h2>
                    <div className="up-user-usn">USN: ???</div>

                    <p className="up-user-quote">
                      {quote ? quote : "Unlock your full academic potential! Log in or sign up to access study materials, track daily streaks, and save resources."}
                    </p>

                    <div className="up-meta-list">
                      <div className="up-meta-pill">
                        <HiAcademicCap className="up-meta-icon" />
                        <span>Student Mode</span>
                      </div>
                      <div className="up-meta-pill">
                        <FiUser className="up-meta-icon" />
                        <span>Not Logged In</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right 4 Stat Cards Grid with Question Marks (Uploads removed) */}
                <div className="up-stats-grid">
                  <div className="up-stat-card is-subjects is-guest-stat">
                    <div className="up-stat-icon-wrapper">
                      <FiBook />
                    </div>
                    <div className="up-stat-value up-qm-glow">?</div>
                    <div className="up-stat-label">Subjects</div>
                  </div>

                  <div className="up-stat-card is-topics is-guest-stat">
                    <div className="up-stat-icon-wrapper">
                      <FiList />
                    </div>
                    <div className="up-stat-value up-qm-glow">?</div>
                    <div className="up-stat-label">Topics</div>
                  </div>

                  <div className="up-stat-card is-streak is-guest-stat">
                    <div className="up-stat-icon-wrapper">
                      <FiZap />
                    </div>
                    <div className="up-stat-value up-qm-glow">?</div>
                    <div className="up-stat-label">Streak</div>
                  </div>

                  <div className="up-stat-card is-highest-streak is-guest-stat">
                    <div className="up-stat-icon-wrapper">
                      <FiTrendingUp />
                    </div>
                    <div className="up-stat-value up-qm-glow">?</div>
                    <div className="up-stat-label">Highest streak</div>
                  </div>
                </div>
              </div>

              {/* Login / Register Now Callout Box */}
              <div className="up-guest-cta-box">
                <div className="up-guest-cta-content">
                  <div className="up-guest-cta-icon-wrap">
                    <FiLock />
                  </div>
                  <div className="up-guest-cta-text">
                    <h3 className="up-guest-cta-title">Ready to unlock your profile?</h3>
                    <p className="up-guest-cta-subtitle">
                      Sign in or create a Learnix account to view your uploaded resources, track daily learning streaks, and manage settings.
                    </p>
                  </div>
                </div>
                <div className="up-guest-cta-actions">
                  <Link href="/login" className="up-guest-btn-login">
                    <FiLogIn /> Login Now
                  </Link>
                  <Link href="/signup" className="up-guest-btn-signup">
                    <FiUserPlus /> Register Now
                  </Link>
                </div>
              </div>
            </div>

            {/* Bottom Resources Banner Card for Guest */}
            <div className="up-resources-banner-card is-guest-banner">
              <div className="up-banner-graphic-left">
                <svg width="105" height="90" viewBox="0 0 120 100" fill="none">
                  <ellipse cx="60" cy="90" rx="50" ry="6" fill="#cbd5e1" opacity="0.5"/>
                  <path d="M15 30C15 26.6863 17.6863 24 21 24H42L50 32H99C102.314 32 105 34.6863 105 38V80C105 83.3137 102.314 86 99 86H21C17.6863 86 15 83.3137 15 80V30Z" fill="#2563eb" opacity="0.85"/>
                  <rect x="35" y="16" width="30" height="40" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2"/>
                  <line x1="41" y1="26" x2="57" y2="26" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="41" y1="32" x2="53" y2="32" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M12 40C12 36.6863 14.6863 34 18 34H102C105.314 34 108 36.6863 108 40V82C108 85.3137 105.314 88 102 88H18C14.6863 88 12 85.3137 12 82V40Z" fill="#007bff"/>
                  <circle cx="60" cy="62" r="16" fill="#ffffff"/>
                  <text x="60" y="68" textAnchor="middle" fill="#007bff" fontSize="18" fontWeight="bold">?</text>
                </svg>
              </div>

              <div className="up-banner-center">
                <h3 className="up-banner-heading">Explore Resources & Study Materials</h3>
                <p className="up-banner-subtext">
                  Browse question papers, subject topics, and study notes on Learnix
                </p>

                <Link href="/works" className="up-banner-action-btn">
                  Browse All Resources <FiChevronRight />
                </Link>
              </div>

              <div className="up-banner-graphic-right">
                <img
                  src={machineLearningSvg.src || machineLearningSvg}
                  alt="Machine Learning Mapping"
                  className="up-banner-ml-img"
                  style={{ width: "160px", height: "105px", objectFit: "contain" }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
