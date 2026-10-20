"use client";

import { useState, useEffect, useMemo } from "react";
import { FiCheck, FiInfo, FiChevronDown } from "react-icons/fi";
import { authFetch } from "@/lib/clientAuth";
import "./styles/CodingProfileStats.css";

export default function CodingProfileStats({ usn = "", userId = "" }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isGaugeHovered, setIsGaugeHovered] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState(null); // { x, y, text }
  const [selectedYear] = useState("Current");

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        setError(null);

        let url = "/api/coding/user-stats";
        const queryParts = [];
        if (usn) queryParts.push(`usn=${encodeURIComponent(usn)}`);
        if (userId) queryParts.push(`userId=${encodeURIComponent(userId)}`);
        if (queryParts.length > 0) {
          url += `?${queryParts.join("&")}`;
        }

        const res = await authFetch(url);
        const data = await res.json();

        if (data.success && data.stats) {
          setStats(data.stats);
        } else {
          setError(data.error || "Failed to load coding statistics");
        }
      } catch (err) {
        console.error("Error loading coding profile stats:", err);
        setError(err.message || "Failed to fetch coding stats");
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [usn, userId]);

  // Compute 52/53 weeks x 7 days calendar grid for the past 365 days
  const calendarData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const map = stats?.calendar || {};

    // Determine the end day of the grid (today's day of week: 0=Sun, 6=Sat)
    // We want 53 columns of 7 days, ending at the current week
    const currentDayOfWeek = today.getDay(); // 0-6
    const totalDays = 52 * 7 + (currentDayOfWeek + 1);

    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (totalDays - 1));

    const weeks = [];
    let currentWeek = [];
    const months = [];
    let lastMonth = -1;

    const cursor = new Date(startDate);

    while (cursor <= today) {
      const dateStr = cursor.toISOString().split("T")[0];
      const count = map[dateStr] || 0;
      const m = cursor.getMonth();

      // Track month labels at the start of a month
      if (m !== lastMonth && cursor.getDate() <= 7) {
        months.push({
          colIndex: weeks.length,
          name: cursor.toLocaleString("default", { month: "short" }),
        });
        lastMonth = m;
      }

      currentWeek.push({
        date: dateStr,
        count,
        level:
          count === 0
            ? 0
            : count <= 2
            ? 1
            : count <= 5
            ? 2
            : count <= 8
            ? 3
            : 4,
        dateFormatted: cursor.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return { weeks, months };
  }, [stats]);

  if (loading) {
    return (
      <div className="cps-loading-box">
        <div className="cps-mini-spinner" />
        <span>Loading Learnix coding activity...</span>
      </div>
    );
  }

  if (error || !stats) {
    return null; // Gracefully hide if not authenticated or error
  }

  // Calculate SVG arc parameters for the circular gauge
  const radius = 64;
  const circumference = 2 * Math.PI * radius; // ~402.12
  // Open gauge arc spans 260 degrees (leaving 100 degrees open at the bottom)
  const arcLength = circumference * (260 / 360); // ~290.4

  const total = Math.max(1, stats.totalProblems);
  const easyRatio = Math.min(1, stats.easy.solved / total);
  const medRatio = Math.min(1, stats.medium.solved / total);
  const hardRatio = Math.min(1, stats.hard.solved / total);

  const easyStroke = arcLength * easyRatio;
  const medStroke = arcLength * medRatio;
  const hardStroke = arcLength * hardRatio;

  // Split acceptance into integer and decimal parts for styling (e.g. 71 and .32%)
  const rateParts = String(stats.acceptanceRate || "0.00").split(".");
  const rateInt = rateParts[0] || "0";
  const rateDec = rateParts[1] ? `.${rateParts[1]}%` : ".00%";

  return (
    <div className="cps-root-container">
      <div className="cps-top-card">
        {/* ── Left: Circular Progress Gauge ── */}
        <div
          className="cps-gauge-col"
          onMouseEnter={() => setIsGaugeHovered(true)}
          onMouseLeave={() => setIsGaugeHovered(false)}
        >
          <div className="cps-gauge-wrapper">
            <svg
              className="cps-gauge-svg"
              width="170"
              height="170"
              viewBox="0 0 160 160"
            >
              {/* Background Track Arc */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                className="cps-gauge-track"
                strokeWidth="6"
                strokeDasharray={`${arcLength} ${circumference}`}
                strokeLinecap="round"
                transform="rotate(140 80 80)"
              />

              {/* Easy Arc (Teal) */}
              {easyStroke > 0 && (
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  className="cps-arc-easy"
                  strokeWidth="6"
                  strokeDasharray={`${easyStroke} ${circumference}`}
                  strokeLinecap="round"
                  transform="rotate(140 80 80)"
                />
              )}

              {/* Medium Arc (Amber) */}
              {medStroke > 0 && (
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  className="cps-arc-med"
                  strokeWidth="6"
                  strokeDasharray={`${medStroke} ${circumference}`}
                  strokeDashoffset={-easyStroke}
                  strokeLinecap="round"
                  transform="rotate(140 80 80)"
                />
              )}

              {/* Hard Arc (Red) */}
              {hardStroke > 0 && (
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  className="cps-arc-hard"
                  strokeWidth="6"
                  strokeDasharray={`${hardStroke} ${circumference}`}
                  strokeDashoffset={-(easyStroke + medStroke)}
                  strokeLinecap="round"
                  transform="rotate(140 80 80)"
                />
              )}
            </svg>

            {/* Inner Center Text — Toggle between Solved & Acceptance on Hover */}
            <div className="cps-gauge-center">
              {!isGaugeHovered ? (
                // ── Normal View (Image 1) ──
                <div className="cps-center-content animate-fade">
                  <div className="cps-val-line">
                    <span className="cps-big-num">{stats.solvedCount}</span>
                    <span className="cps-total-num">/{stats.totalProblems}</span>
                  </div>
                  <div className="cps-status-badge">
                    <FiCheck size={14} className="cps-check-icon" />
                    <span>Solved</span>
                  </div>
                </div>
              ) : (
                // ── Hover View (Image 2) ──
                <div className="cps-center-content animate-fade">
                  <div className="cps-val-line">
                    <span className="cps-big-num">{rateInt}</span>
                    <span className="cps-rate-dec">{rateDec}</span>
                  </div>
                  <div className="cps-status-badge-hover">
                    <span>Acceptance</span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Tag located in the bottom gap of circle */}
            <div className="cps-gauge-bottom-tag">
              {!isGaugeHovered ? (
                <span>
                  <strong>{stats.attemptingCount}</strong> Attempting
                </span>
              ) : (
                <span>
                  <strong>{stats.totalSubmissions}</strong>{" "}
                  {stats.totalSubmissions === 1 ? "submission" : "submissions"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: Difficulty Breakdown Cards ── */}
        <div className="cps-diff-col">
          {/* Easy */}
          <div className="cps-diff-card is-easy">
            <span className="cps-diff-title">Easy</span>
            <span className="cps-diff-fraction">
              <strong>{stats.easy.solved}</strong>/{stats.easy.total}
            </span>
          </div>

          {/* Medium */}
          <div className="cps-diff-card is-med">
            <span className="cps-diff-title">Med.</span>
            <span className="cps-diff-fraction">
              <strong>{stats.medium.solved}</strong>/{stats.medium.total}
            </span>
          </div>

          {/* Hard */}
          <div className="cps-diff-card is-hard">
            <span className="cps-diff-title">Hard</span>
            <span className="cps-diff-fraction">
              <strong>{stats.hard.solved}</strong>/{stats.hard.total}
            </span>
          </div>
        </div>
      </div>

      {/* ── Submission Activity Calendar Heatmap (Image 3) ── */}
      <div className="cps-calendar-card">
        {/* Heatmap Header */}
        <div className="cps-cal-header">
          <div className="cps-cal-title-wrap">
            <span className="cps-cal-total-bold">
              {stats.annualSubmissions || stats.totalSubmissions || 0}
            </span>
            <span className="cps-cal-title-text">
              submissions in the past one year
            </span>
            <span
              className="cps-info-trigger"
              title="Verified submissions evaluated across Learnix Code in the past 365 days"
            >
              <FiInfo size={14} />
            </span>
          </div>

          <div className="cps-cal-meta-wrap">
            <span className="cps-cal-meta-item">
              Total active days:{" "}
              <strong className="cps-meta-strong">{stats.totalActiveDays}</strong>
            </span>
            <span className="cps-cal-meta-item">
              Max streak:{" "}
              <strong className="cps-meta-strong">{stats.maxStreak}</strong>
            </span>

            <div className="cps-year-dropdown">
              <span>{selectedYear}</span>
              <FiChevronDown size={14} />
            </div>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="cps-cal-grid-outer">
          <div className="cps-cal-scroll">
            <div className="cps-cal-matrix">
              {calendarData.weeks.map((week, wIdx) => (
                <div key={wIdx} className="cps-cal-col">
                  {week.map((day) => (
                    <div
                      key={day.date}
                      className={`cps-cal-cell level-${day.level}`}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setActiveTooltip({
                          x: rect.left + rect.width / 2,
                          y: rect.top - 8,
                          text: `${day.count} ${
                            day.count === 1 ? "submission" : "submissions"
                          } on ${day.dateFormatted}`,
                        });
                      }}
                      onMouseLeave={() => setActiveTooltip(null)}
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* Month labels below columns */}
            <div className="cps-cal-months">
              {calendarData.months.map((m, mIdx) => (
                <span
                  key={mIdx}
                  className="cps-cal-month-lbl"
                  style={{
                    left: `${m.colIndex * 14}px`,
                  }}
                >
                  {m.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Tooltip for Heatmap Cells */}
      {activeTooltip && (
        <div
          className="cps-floating-tooltip"
          style={{
            left: `${activeTooltip.x}px`,
            top: `${activeTooltip.y}px`,
          }}
        >
          {activeTooltip.text}
        </div>
      )}
    </div>
  );
}
