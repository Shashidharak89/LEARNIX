"use client";

import { useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import { MdNewReleases } from "react-icons/md";
import "./styles/WhatsNew.css";

export default function WhatsNew() {
  const [expandedUpdate, setExpandedUpdate] = useState(-1);

  const latestUpdates = [
    {
      title: "Save Topics for Instant Access",
      description:
        "Bookmark your favorite topics and access them instantly without any server delay! Save any topic from the Uploaded Works page using the 3-dot menu or from individual topic pages. Your saved topics are stored locally and load immediately when you revisit. Use the new filter icon to view only your saved topics. Perfect for quick revision and easy access to frequently referenced materials!",
    },
    {
      title: "Personal Review/Comment on Topics",
      description:
        "Share private feedback directly with content uploaders! Leave personalized reviews on any topic - choose from Feedback, Suggestion, Mistake, or Appreciation types. Your reviews are private and visible only to you and the uploader. Uploaders receive instant notifications via the bell icon and can view all feedback in a dedicated management page. Features include reply threads, copy text, mark as read, and delete options through a convenient 3-dot menu. Perfect for constructive feedback and improving study materials!",
    },
    {
      title: "Search Filter in Uploaded Works",
      description:
        "Filter study materials by subject and topic in the Uploaded Works section! Scroll through subjects horizontally and select multiple subjects to view content from all of them together (OR logic). Then drill down by selecting multiple topics to narrow your search. Works seamlessly with the search bar for powerful content discovery. Find exactly what you're looking for with ease!",
    },
    {
      title: "Page Number Toggle for Topic Images",
      description:
        "Now you can easily view page numbers on topic images with our new optional toggle button. Enable or disable page numbers (displayed 1, 2, 3, etc.) directly on each image. Disabled by default, giving you full control over your viewing preference. Perfect for referencing and studying materials.",
    },
    {
      title: "Customized Pages Download as PDF",
      description:
        "Download exactly the pages you need from any topic! Instead of downloading all pages, select specific pages or choose a range (From: X, To: Y) to create your custom PDF. Use the new dropdown menu on the Download button to access the page selection modal and download only what matters to you.",
    },
    {
      title: "Quick File Share - New Feature",
      description:
        "Upload any file instantly and get a unique code! Share your files with anyone without login required. Perfect for quick file transfers, assignments, and documents. Simply upload, get a code, and others can download using that code on any device.",
    },
    {
      title: "New Study Materials Available",
      description:
        "We've added comprehensive study materials for 3rd semester courses including Blockchain Technology, Cloud Computing, and AI/ML modules. All materials are now available in the Study Materials section with downloadable resources.",
    },
    {
      title: "Improved File Viewer",
      description:
        "Experience faster document viewing with our new integrated file viewer. Preview PDFs, documents, and presentations directly without leaving the platform.",
    },
  ];

  return (
    <section className="wn__section_wrapper">
      <div className="wn__header_container">
        <div className="wn__icon_wrapper">
          <MdNewReleases className="wn__header_icon" />
        </div>
        <h2 className="wn__main_title">What's New</h2>
      </div>

      <div className="wn__updates_grid">
        {latestUpdates.map((update, idx) => (
          <div
            key={idx}
            className={`wn__card ${
              expandedUpdate === idx ? "wn__card_expanded" : ""
            }`}
          >
            <button
              className="wn__card_header"
              onClick={() =>
                setExpandedUpdate(expandedUpdate === idx ? -1 : idx)
              }
              aria-expanded={expandedUpdate === idx}
            >
              <span className="wn__card_title">{update.title}</span>
              <FiChevronDown
                className={`wn__chevron_icon ${
                  expandedUpdate === idx ? "wn__chevron_rotated" : ""
                }`}
              />
            </button>

            <div className={`wn__content_wrapper ${expandedUpdate === idx ? "wn__content_visible" : ""}`}>
              <div className="wn__content_text">{update.description}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}