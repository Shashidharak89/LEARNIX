"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Script from "next/script";
import {
  FiCalendar,
  FiBook,
  FiImage,
  FiEyeOff,
  FiClock,
  FiChevronRight,
  FiSearch,
  FiSettings,
  FiUpload,
  FiCloud,
  FiGrid,
  FiLogIn,
  FiAlertCircle,
  FiMail,
  FiCheckCircle,
  FiCamera,
  FiList,
  FiZap,
  FiTrendingUp,
  FiX
} from "react-icons/fi";
import { HiAcademicCap } from "react-icons/hi";
import ChangeName from './ChangeName';
import ChangePassword from './ChangePassword';
import ProfileImageEditor from './ProfileImageEditor';
import UserProfileSkeleton from './UserProfileSkeleton';
import './styles/UserProfile.css';
import { authFetch, signOutFromBrowser } from '@/lib/clientAuth';

export default function UserProfile({ googleClientId = "" }) {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [hasError, setHasError] = useState(false);
  const [expandedUploads, setExpandedUploads] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [visibleTopics, setVisibleTopics] = useState({});
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [profileImage, setProfileImage] = useState("https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp");
  const [quote, setQuote] = useState("");
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const [loadingUploads, setLoadingUploads] = useState(false);
  const [visibleSubjectsCount, setVisibleSubjectsCount] = useState(3);
  const [googleScriptReady, setGoogleScriptReady] = useState(false);
  const [isBindingGoogle, setIsBindingGoogle] = useState(false);
  const [googleBindMessage, setGoogleBindMessage] = useState("");
  const [googleBindError, setGoogleBindError] = useState(false);
  const googleButtonRef = useRef(null);

  const TOPICS_PER_LOAD = 5;
  const SUBJECTS_PER_LOAD = 3;

  useEffect(() => {
    fetchUserProfile();
    fetchQuote();
  }, []);

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

  useEffect(() => {
    if (user && user.hasUploadsLoaded) {
      handleSearch(searchQuery);
    }
  }, [user, searchQuery]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLoadingMore) {
            const subjectIndex = parseInt(entry.target.dataset.subjectIndex);
            loadMoreTopics(subjectIndex);
          }
        });
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const sentinels = document.querySelectorAll('.up-scroll-sentinel');
    sentinels.forEach((sentinel) => observer.observe(sentinel));

    return () => observer.disconnect();
  }, [filteredSubjects, visibleTopics, isLoadingMore]);

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
      setIsLoadingQuote(true);
      const response = await fetch('https://zenquotes.io/api/random');
      const data = await response.json();
      if (data && data[0] && data[0].q) {
        setQuote(data[0].q);
      }
    } catch (error) {
      console.error('Error fetching quote:', error);
      setQuote("Every journey begins with a single step.");
    } finally {
      setIsLoadingQuote(false);
    }
  };

  const fetchUserProfile = async () => {
    setLoading(true);
    setHasError(false);
    try {
      const usn = localStorage.getItem("usn");
      if (!usn) {
        setMessage("Please login to view your profile.");
        setHasError(true);
        setLoading(false);
        return;
      }

      const res = await authFetch(`/api/user?usn=${usn}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          signOutFromBrowser("Your session expired. Please login again.");
          return;
        }
        throw new Error(data?.error || "Failed to fetch user profile");
      }

      setUser(data.user);
      setProfileImage(data.user.profileimg || "https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp");
      setMessage("");
      setHasError(false);

      const initialVisible = {};
      if (data.user.subjects) {
        data.user.subjects.forEach((subject, index) => {
          initialVisible[index] = Math.min(TOPICS_PER_LOAD, subject.topics?.length || 0);
        });
      }
      setVisibleTopics(initialVisible);
    } catch (err) {
      console.error(err);
      setHasError(true);
      if (err.response?.status === 404) {
        setMessage("Profile not found! Something went wrong, please login again.");
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        setMessage("Authentication failed! Please login again.");
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        setMessage("Network error occurred! Please check your connection and login again.");
      } else {
        setMessage("Something went wrong! Please login again.");
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserUploads = async () => {
    if (user?.hasUploadsLoaded || loadingUploads) return;
    setLoadingUploads(true);
    try {
      const usn = localStorage.getItem("usn");
      if (!usn) return;

      const res = await authFetch(`/api/user?usn=${usn}&includeUploads=true`);
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.user) {
        setUser((prev) => ({
          ...prev,
          subjects: data.user.subjects || [],
          subjectsCount: data.user.subjectsCount ?? (data.user.subjects?.length || 0),
          topicsCount: data.user.topicsCount,
          uploadsCount: data.user.uploadsCount,
          hasUploadsLoaded: true
        }));
        setFilteredSubjects(data.user.subjects || []);

        const initialVisible = {};
        if (data.user.subjects) {
          data.user.subjects.forEach((subject, index) => {
            initialVisible[index] = Math.min(TOPICS_PER_LOAD, subject.topics?.length || 0);
          });
        }
        setVisibleTopics(initialVisible);
      }
    } catch (err) {
      console.error("Error fetching user uploads:", err);
    } finally {
      setLoadingUploads(false);
    }
  };

  const loadMoreTopics = useCallback((subjectIndex) => {
    if (isLoadingMore) return;
    const subject = filteredSubjects[subjectIndex];
    if (!subject || !subject.topics) return;
    
    const currentVisible = visibleTopics[subjectIndex] || 0;
    const totalTopics = subject.topics.length;
    if (currentVisible >= totalTopics) return;
    
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleTopics((prev) => ({
        ...prev,
        [subjectIndex]: Math.min(currentVisible + TOPICS_PER_LOAD, totalTopics)
      }));
      setIsLoadingMore(false);
    }, 300);
  }, [filteredSubjects, visibleTopics, isLoadingMore]);

  const handleSearch = (query) => {
    if (!user) return;
    if (!user.hasUploadsLoaded && query.trim()) {
      setShowResources(true);
      fetchUserUploads();
      return;
    }
    if (!user.subjects) return;

    if (!query.trim()) {
      setFilteredSubjects(user.subjects);
      return;
    }

    const searchTerm = query.toLowerCase();
    const filtered = user.subjects.map((subject) => {
      const filteredTopics = subject.topics?.filter((topic) => 
        subject.subject.toLowerCase().includes(searchTerm) ||
        topic.topic.toLowerCase().includes(searchTerm)
      ) || [];
      return {
        ...subject,
        topics: filteredTopics
      };
    }).filter((subject) => 
      subject.subject.toLowerCase().includes(searchTerm) || 
      subject.topics.length > 0
    );
    
    setFilteredSubjects(filtered);
    const newVisible = {};
    filtered.forEach((subject, index) => {
      newVisible[index] = Math.min(TOPICS_PER_LOAD, subject.topics?.length || 0);
    });
    setVisibleTopics(newVisible);
  };

  const toggleUploadsView = (subjectIndex, topicIndex) => {
    const key = `${subjectIndex}-${topicIndex}`;
    setExpandedUploads((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
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
        {/* Page Header & Breadcrumb */}
        <div className="up-page-header">
          <h1 className="up-page-title">My Account</h1>
          <div className="up-breadcrumb">
            <Link href="/" className="up-breadcrumb-link">Home</Link>
            <span className="up-breadcrumb-sep">&gt;</span>
            <span className="up-breadcrumb-current">My Account</span>
          </div>
        </div>

        {user && (
          <>
            {/* Top Main Profile Card */}
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

              {/* Settings Panel */}
              {showSettings && (
                <div className="up-settings-container">
                  <div className="up-settings-header">
                    <div className="up-settings-title-group">
                      <FiSettings className="up-settings-header-icon" />
                      <h2>Account Settings</h2>
                    </div>
                    <button 
                      onClick={() => setShowSettings(false)} 
                      className="up-settings-close-btn"
                      title="Close settings"
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

                {/* Right 5 Stat Cards */}
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

                  {/* Card 3: Uploads */}
                  <div className="up-stat-card is-uploads">
                    <div className="up-stat-icon-wrapper">
                      <FiCloud />
                    </div>
                    <div className="up-stat-value">{user.uploadsCount ?? 0}</div>
                    <div className="up-stat-label">Uploads</div>
                  </div>

                  {/* Card 4: Streak */}
                  <div className="up-stat-card is-streak">
                    <div className="up-stat-icon-wrapper">
                      <FiZap />
                    </div>
                    <div className="up-stat-value">{user.streaks || 1}</div>
                    <div className="up-stat-label">Streak</div>
                  </div>

                  {/* Card 5: Highest streak */}
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
                    if (showResources) {
                      setShowResources(false);
                    } else {
                      setShowResources(true);
                      if (!user?.hasUploadsLoaded) {
                        fetchUserUploads();
                      }
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
                <svg width="150" height="95" viewBox="0 0 180 110" fill="none">
                  <ellipse cx="90" cy="100" rx="80" ry="6" fill="#cbd5e1" opacity="0.4"/>
                  <circle cx="140" cy="50" r="40" fill="#e0eeff" opacity="0.7"/>
                  <rect x="25" y="78" width="110" height="16" rx="4" fill="#3b82f6"/>
                  <rect x="30" y="82" width="105" height="8" rx="2" fill="#ffffff"/>
                  <rect x="25" y="78" width="12" height="16" rx="2" fill="#1d4ed8"/>
                  <rect x="20" y="60" width="115" height="16" rx="4" fill="#fbbf24"/>
                  <rect x="25" y="64" width="110" height="8" rx="2" fill="#ffffff"/>
                  <rect x="20" y="60" width="12" height="16" rx="2" fill="#d97706"/>
                  <rect x="30" y="42" width="100" height="16" rx="4" fill="#0ea5e9"/>
                  <rect x="35" y="46" width="95" height="8" rx="2" fill="#ffffff"/>
                  <rect x="30" y="42" width="12" height="16" rx="2" fill="#0284c7"/>
                  <rect x="35" y="24" width="90" height="16" rx="4" fill="#60a5fa"/>
                  <rect x="40" y="28" width="85" height="8" rx="2" fill="#ffffff"/>
                  <rect x="35" y="24" width="12" height="16" rx="2" fill="#2563eb"/>
                  <path d="M148 74L152 94H168L172 74H148Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2"/>
                  <path d="M152 74C152 64 158 56 160 56C162 56 168 64 168 74H152Z" fill="#4ade80"/>
                  <path d="M158 74C158 66 164 60 166 60C168 60 174 66 174 74H158Z" fill="#22c55e" opacity="0.8"/>
                </svg>
              </div>
            </div>

            {/* Expanded Resources Area */}
            {showResources && (
              <div className="up-expanded-resources-section">
                <div className="up-search">
                  <FiSearch className="up-search-icon" />
                  <input
                    type="text"
                    placeholder="Search subjects and topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="up-search-input"
                  />
                </div>

                {loadingUploads ? (
                  <div className="up-uploads-loading" style={{ textAlign: "center", padding: "40px 16px" }}>
                    <div className="up-mini-spinner" style={{ margin: "0 auto 12px auto" }}></div>
                    <p style={{ color: "#6b7280", fontSize: "14px", fontWeight: 500 }}>Loading your uploaded subjects & topics...</p>
                  </div>
                ) : !filteredSubjects || filteredSubjects.length === 0 ? (
                  <div className="up-empty">
                    {searchQuery ? (
                      <>
                        <FiSearch className="up-empty-icon" />
                        <h3 className="up-empty-title">No Results Found</h3>
                        <p className="up-empty-text">Try different search terms</p>
                      </>
                    ) : (
                      <>
                        <FiBook className="up-empty-icon" />
                        <h3 className="up-empty-title">No Subjects Added</h3>
                        <p className="up-empty-text">Start building your learning profile!</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="up-subjects">
                    {filteredSubjects.slice(0, visibleSubjectsCount).map((subject, subjectIndex) => {
                      const visibleCount = visibleTopics[subjectIndex] || 0;
                      const hasMoreTopics = subject.topics && subject.topics.length > visibleCount;
                      const displayTopics = subject.topics?.slice(0, visibleCount) || [];

                      return (
                        <div key={subjectIndex} className="up-subject-card">
                          <div className="up-subject-header">
                            <div className="up-subject-title">
                              <FiBook className="up-subject-icon" />
                              <h3 className="up-subject-name">{subject.subject}</h3>
                            </div>
                            <div className="up-subject-badge">
                              {subject.topics?.length || 0} topics
                            </div>
                          </div>

                          {!subject.topics || subject.topics.length === 0 ? (
                            <div className="up-empty-topics">
                              <p>No topics added yet</p>
                            </div>
                          ) : (
                            <div className="up-topics">
                              {displayTopics.map((topic, topicIndex) => {
                                const key = `${subjectIndex}-${topicIndex}`;
                                const isExpanded = expandedUploads[key];
                                const validImages = topic.images?.filter((img) => img && img.trim() !== '') || [];

                                return (
                                  <div key={topicIndex} className="up-topic-card">
                                    <div className="up-topic-header">
                                      <div className="up-topic-title">
                                        <h4 className="up-topic-name">{topic.topic}</h4>
                                        <span className="up-topic-date">
                                          <FiClock className="up-date-icon" />
                                          {formatDate(topic.timestamp)}
                                        </span>
                                      </div>

                                      {validImages.length > 0 && (
                                        <button
                                          onClick={() => toggleUploadsView(subjectIndex, topicIndex)}
                                          className="up-uploads-btn"
                                        >
                                          <FiImage className="up-btn-icon" />
                                          <span>
                                            {validImages.length} {validImages.length === 1 ? 'upload' : 'uploads'}
                                          </span>
                                          <FiChevronRight
                                            className={`up-chevron ${isExpanded ? 'is-expanded' : ''}`}
                                          />
                                        </button>
                                      )}
                                    </div>

                                    {topic.content && (
                                      <div className="up-topic-content">
                                        <p>{topic.content}</p>
                                      </div>
                                    )}

                                    {isExpanded && validImages.length > 0 && (
                                      <div className="up-images-grid">
                                        {validImages.map((image, imageIndex) => {
                                          const imageKey = `${subjectIndex}-${topicIndex}-${imageIndex}`;
                                          const isLoaded = loadedImages.has(imageKey);

                                          return (
                                            <div
                                              key={imageIndex}
                                              className="up-image-container up-image-lazy"
                                              data-image-key={imageKey}
                                            >
                                              {isLoaded ? (
                                                <img
                                                  src={image}
                                                  alt={`Upload ${imageIndex + 1}`}
                                                  className="up-upload-image"
                                                  loading="lazy"
                                                />
                                              ) : (
                                                <div className="up-image-placeholder up-shimmer">
                                                  <FiImage className="up-placeholder-icon" />
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}

                              {hasMoreTopics && (
                                <div
                                  className="up-scroll-sentinel"
                                  data-subject-index={subjectIndex}
                                >
                                  {isLoadingMore && (
                                    <div className="up-topic-loading">
                                      <div className="up-mini-spinner" />
                                      <span>Loading topics...</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {filteredSubjects.length > visibleSubjectsCount && (
                      <div className="up-load-more-subjects">
                        <button
                          onClick={() => setVisibleSubjectsCount((prev) => prev + SUBJECTS_PER_LOAD)}
                          className="up-load-more-btn"
                        >
                          Load More Subjects
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
