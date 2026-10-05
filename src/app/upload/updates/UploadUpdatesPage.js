"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { FiPlus, FiX, FiSearch, FiExternalLink, FiCheckCircle, FiAlertCircle, FiInfo } from "react-icons/fi";
import { Bell } from "lucide-react";
import AddUpdateForm from "./AddUpdateForm";
import UpdatesList from "./UpdatesList";
import "./styles/UploadUpdatesPage.css";

export default function UploadUpdatesPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isAddExpanded, setIsAddExpanded] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showToast = (message, type = "info") => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3500);
  };

  const handleUpdateAdded = () => {
    setRefreshKey((k) => k + 1);
    setIsAddExpanded(false);
    showToast("Update added successfully", "success");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setAppliedSearch(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setAppliedSearch("");
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    if (!val.trim() && appliedSearch) {
      setAppliedSearch("");
    }
  };

  return (
    <div className="upload-updates-page">
      <main>
        {/* Intro / Header Card (Matches /updates design with Searchbar & Add button) */}
        <div className="upd-intro-card">
          <div className="upd-intro-header">
            <h1 className="upd-title">
              <Bell className="upd-title-icon" size={24} />
              MY UPDATES
            </h1>
            <div className="upd-action-buttons">
              <button
                type="button"
                className={`upd-action-btn ${isAddExpanded ? "upd-action-btn-expanded" : "upd-action-btn-primary"}`}
                onClick={() => setIsAddExpanded(!isAddExpanded)}
                title={isAddExpanded ? "Close Add Update form" : "Add new update"}
                aria-expanded={isAddExpanded}
              >
                {isAddExpanded ? <FiX className="upd-action-icon" /> : <FiPlus className="upd-action-icon" />}
                <span className="upd-action-text">{isAddExpanded ? "Close Form" : "Add Update"}</span>
              </button>
              <Link href="/updates" className="upd-action-btn upd-action-btn-secondary" title="View Campus Feed">
                <FiExternalLink className="upd-action-icon" />
                <span className="upd-action-text">Campus Feed</span>
              </Link>
            </div>
          </div>

          {/* Search Bar with orbiting light animation (Exact design from /updates) */}
          <form className="upd-search-form" onSubmit={handleSearchSubmit}>
            <div className="upd-search-wrap">
              <FiSearch className="upd-search-icon" />
              <input
                type="text"
                value={searchInput}
                onChange={handleInputChange}
                className="upd-search-input"
                placeholder="Search updates from your account by title, content, or files..."
                aria-label="Search updates from your account"
              />
              {searchInput && (
                <button
                  type="button"
                  className="upd-search-clear-inline"
                  onClick={handleClearSearch}
                  aria-label="Clear search"
                >
                  <FiX size={14} />
                </button>
              )}
            </div>
            <button type="submit" className="upd-search-btn" disabled={!searchInput.trim()}>
              <FiSearch className="upd-search-btn-icon" />
              <span className="upd-search-btn-text">Search</span>
            </button>
          </form>
        </div>

        {/* Collapsible Add Update Form Card */}
        {isAddExpanded && (
          <div className="upd-collapsible-wrapper">
            <AddUpdateForm
              onUpdateAdded={handleUpdateAdded}
              onCancel={() => setIsAddExpanded(false)}
            />
          </div>
        )}

        {/* Updates List with authenticated search query */}
        <UpdatesList
          refreshKey={refreshKey}
          searchQuery={appliedSearch}
          onClearSearch={handleClearSearch}
        />
      </main>

      {/* Floating Screen-Bottom Toast Notification */}
      {toast && (
        <div className={`upl-toast upl-toast-${toast.type || "info"}`} role="status" aria-live="polite">
          <div className="upl-toast-icon-box">
            {toast.type === "success" ? (
              <FiCheckCircle className="upl-toast-icon" />
            ) : toast.type === "error" ? (
              <FiAlertCircle className="upl-toast-icon" />
            ) : (
              <FiInfo className="upl-toast-icon" />
            )}
          </div>
          <span className="upl-toast-text">{toast.message}</span>
          <button
            type="button"
            className="upl-toast-close"
            onClick={() => setToast(null)}
            aria-label="Dismiss message"
          >
            <FiX />
          </button>
        </div>
      )}
    </div>
  );
}
