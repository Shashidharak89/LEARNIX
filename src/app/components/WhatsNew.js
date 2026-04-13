"use client";

import { useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import { MdNewReleases } from "react-icons/md";
import "./styles/WhatsNew.css";

export default function WhatsNew() {
  const [expandedUpdate, setExpandedUpdate] = useState(0);

  const latestUpdates = [
    {
      title: "Topic Summarize Added",
      date: "Apr 13, 2026",
      description:
        "On topic pages (/works/[id]), you can now summarize the full topic with AI using the Summarize with AI button. This helps you quickly understand long topics in a concise student-friendly format.",
    },
    {
      title: "AI Image Analysis + Advanced Retry Added",
      date: "Apr 13, 2026",
      description:
        "On topic pages (/works/[id]), you can now tap a small AI Analyze icon on each image to extract text and instantly get a clean summary. After the first summary appears, you will also see an Advanced Retry button at the bottom of that summary area. Advanced Retry refines the extracted text grammar using LanguageTool and then generates an improved summary again.",
    },
    {
      title: "Learnix is now available on mobile app",
      date: "Apr 08, 2026",
      description:
        "Now you can use Learnix on your Android phone too. Just tap the download button on the home page and install the Learnix app to access resources, tools, and chats more easily on mobile.",
    },
    {
      title: "In-App Chat & Share to Learnix Users",
      date: "Apr 07, 2026",
      description:
        "We added direct user-to-user chat in Learnix. You can now open chats from user profiles, see recent conversations on /chat, send messages in WhatsApp-style flow, and load older messages with View More. We also added Share from /works/[id] to send topic links directly to Learnix users (multi-select), plus Copy Link and external 3-dot share options.",
    },
    {
      title: "Public Quick Sharing (24h) Added",
      date: "Mar 19, 2026",
      description:
        "You can now post short public text updates directly from the home page (below the quote section). Posts appear instantly for everyone, preserve line breaks exactly as typed, and auto-expire after 24 hours. Home shows latest 3 posts with a View More button that opens /public-texts (latest 10 per page with server paging).",
    },
    {
      title: "Daily Login Streaks Added",
      date: "Mar 13, 2026",
      description:
        "Streaks are now tracked from 12:00 AM to 12:00 AM (calendar-day based). Logging in on consecutive days increases streak by 1. Missing a day resets streak to 0. Highest Streak is tracked automatically and shown on profile and search user pages.",
    },
    {
      title: "Unlisted Visibility for Subject & Topic",
      date: "Mar 13, 2026",
      description:
        "You can now upload Subjects and Topics as Unlisted. Unlisted content stays hidden from /works listings and search, but remains accessible through direct owner-managed links where permitted. This adds better privacy control between Public and Private modes.",
    },
    {
      title: "View Question Papers by Subject (New!)",
      date: "Mar 10, 2026",
      description:
        "You can now view all question papers for a specific subject in one place! Go to the Question Papers page (/qp), pick any subject in the 'Download by Subject' section, and click the new teal View button. A dedicated viewer opens at /qp/query/{subject} — showing every paper for that subject compiled on one page, with inline expand on click, page number toggle, slideshow mode with keyboard navigation, range download as PDF (full or selected pages), and a share button. Opens in a new tab!",
    },
    {
      title: "Chat Support Added",
      date: "Mar 07, 2026",
      description:
        "You can now chat with Learnix support for instant help. Visit /support to open the chat and get assistance.",
    },
    {
      title: "Previous Year Question Papers Added",
      date: "Mar 03, 2026",
      description:
        "Access a comprehensive collection of previous year question papers! Browse and download MSE 1, MSE 2, and Final Exam papers organized by semester and batch. View papers online directly in the viewer, download as PDF (full or selected pages), and share with friends. Navigate to /qp or use the Question Papers link in the navigation to explore all available papers!",
    },
    {
      title: "Articles Section Added",
      date: "Feb 28, 2026",
      description:
        "Discover insights, updates, and stories from the Learnix community! We've added a new Articles section where you can read about how Learnix is solving study material challenges, our journey from a personal project to a public platform, and learn about easy file sharing tools. Check it out in the footer Quick Links or visit /articles directly!",
    },
    {
      title: "Save Topics for Instant Access",
      date: "Feb 22, 2026",
      description:
        "Bookmark your favorite topics and access them instantly without any server delay! Save any topic from the Uploaded Works page using the 3-dot menu or from individual topic pages. Your saved topics are stored locally and load immediately when you revisit. Use the new filter icon to view only your saved topics. Perfect for quick revision and easy access to frequently referenced materials!",
    },
    {
      title: "Personal Review/Comment on Topics",
      date: "Feb 18, 2026",
      description:
        "Share private feedback directly with content uploaders! Leave personalized reviews on any topic - choose from Feedback, Suggestion, Mistake, or Appreciation types. Your reviews are private and visible only to you and the uploader. Uploaders receive instant notifications via the bell icon and can view all feedback in a dedicated management page. Features include reply threads, copy text, mark as read, and delete options through a convenient 3-dot menu. Perfect for constructive feedback and improving study materials!",
    },
    {
      title: "Search Filter in Uploaded Works",
      date: "Feb 11, 2026",
      description:
        "Filter study materials by subject and topic in the Uploaded Works section! Scroll through subjects horizontally and select multiple subjects to view content from all of them together (OR logic). Then drill down by selecting multiple topics to narrow your search. Works seamlessly with the search bar for powerful content discovery. Find exactly what you're looking for with ease!",
    },
    {
      title: "Page Number Toggle for Topic Images",
      date: "Feb 07, 2026",
      description:
        "Now you can easily view page numbers on topic images with our new optional toggle button. Enable or disable page numbers (displayed 1, 2, 3, etc.) directly on each image. Disabled by default, giving you full control over your viewing preference. Perfect for referencing and studying materials.",
    },
    {
      title: "Customized Pages Download as PDF",
      date: "Feb 04, 2026",
      description:
        "Download exactly the pages you need from any topic! Instead of downloading all pages, select specific pages or choose a range (From: X, To: Y) to create your custom PDF. Use the new dropdown menu on the Download button to access the page selection modal and download only what matters to you.",
    },
    {
      title: "Quick File Share - New Feature",
      date: "Jan 28, 2026",
      description:
        "Upload any file instantly and get a unique code! Share your files with anyone without login required. Perfect for quick file transfers, assignments, and documents. Simply upload, get a code, and others can download using that code on any device.",
    },
    {
      title: "New Study Materials Available",
      date: "Jan 20, 2026",
      description:
        "We've added comprehensive study materials for 3rd semester courses including Blockchain Technology, Cloud Computing, and AI/ML modules. All materials are now available in the Study Materials section with downloadable resources.",
    },
    {
      title: "Improved File Viewer",
      date: "Jan 15, 2026",
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
              <div className="wn__title_block">
                <span className="wn__card_title">{update.title}</span>
                <span className="wn__update_date">Updated: {update.date || "Earlier"}</span>
              </div>
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