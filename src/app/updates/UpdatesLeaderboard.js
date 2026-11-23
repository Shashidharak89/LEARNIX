'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { CalendarIcon, FlameIcon } from '@animateicons/react/lucide';
import './styles/UpdatesLeaderboard.css';

const DEFAULT_AVATAR = "https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp";

export default function UpdatesLeaderboard({ isOpen, onClose }) {
  const [range, setRange] = useState('7d'); // '7d' | '30d' | '90d' | 'custom'
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLeaderboard = useCallback(async (selectedRange, from, to) => {
    setIsLoading(true);
    setError(null);
    try {
      let url = `/api/updates/leaderboard?range=${selectedRange}`;
      if (selectedRange === 'custom') {
        if (from) url += `&from=${encodeURIComponent(from)}`;
        if (to) url += `&to=${encodeURIComponent(to)}`;
      }
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Failed to load updates leaderboard');
      }
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
    } catch (err) {
      console.error('Error fetching updates leaderboard:', err);
      setError('Unable to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (range === 'custom') {
        if (fromDate && toDate) {
          fetchLeaderboard('custom', fromDate, toDate);
        }
      } else {
        fetchLeaderboard(range);
      }
    }
  }, [isOpen, range, fromDate, toDate, fetchLeaderboard]);

  if (!isOpen) return null;

  const top3 = leaderboard.slice(0, 3);
  const next7 = leaderboard.slice(3, 10);

  const first = top3[0];
  const second = top3[1];
  const third = top3[2];

  const maxUpdates = Math.max(...top3.map(u => u.updateCount || 0), 1);

  const handleRangeSelect = (r) => {
    if (r === 'custom') {
      setShowDatePicker(prev => !prev);
      setRange('custom');
    } else {
      setShowDatePicker(false);
      setRange(r);
    }
  };

  return (
    <div className="upd-lb-container" role="region" aria-label="Updates Contributors Leaderboard">
      {/* Header with control bar */}
      <div className="upd-lb-header">
        <div className="upd-lb-title-wrap">
          <FlameIcon size={16} className="upd-lb-flame-icon" />
          <span className="upd-lb-title">Top Contributors</span>
        </div>

        <div className="upd-lb-range-pills">
          <button
            type="button"
            className={`upd-lb-pill ${range === '7d' ? 'active' : ''}`}
            onClick={() => handleRangeSelect('7d')}
          >
            7D
          </button>
          <button
            type="button"
            className={`upd-lb-pill ${range === '30d' ? 'active' : ''}`}
            onClick={() => handleRangeSelect('30d')}
          >
            30D
          </button>
          <button
            type="button"
            className={`upd-lb-pill ${range === '90d' ? 'active' : ''}`}
            onClick={() => handleRangeSelect('90d')}
          >
            90D
          </button>
          <button
            type="button"
            className={`upd-lb-pill upd-lb-pill-custom ${range === 'custom' ? 'active' : ''}`}
            onClick={() => handleRangeSelect('custom')}
            title="Custom Date Range"
          >
            <CalendarIcon size={12} />
            <span>Range</span>
          </button>
        </div>
      </div>

      {/* Custom Date Pickers */}
      {showDatePicker && (
        <div className="upd-lb-custom-inputs">
          <div className="upd-lb-date-group">
            <span className="upd-lb-date-label">From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="upd-lb-date-field"
            />
          </div>
          <div className="upd-lb-date-group">
            <span className="upd-lb-date-label">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="upd-lb-date-field"
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <div className="upd-lb-loading">
          <div className="upd-lb-spinner" />
          <span className="upd-lb-loading-text">Loading top contributors...</span>
        </div>
      ) : error ? (
        <div className="upd-lb-empty">{error}</div>
      ) : leaderboard.length === 0 ? (
        <div className="upd-lb-empty">No updates posted for this period yet.</div>
      ) : (
        <>
          {/* Top 3 Bar Graph Podium */}
          <div className="upd-lb-podium">
            {/* Rank 2 (Left) */}
            {second ? (
              <div className="upd-lb-podium-slot rank-2">
                <Link
                  href={`/users/${second.usn?.toLowerCase()}`}
                  className="upd-lb-avatar-wrap rank-2-ring"
                  title={`${second.name} (@${second.usn}) - ${second.updateCount} updates, ${second.fileCount} files`}
                >
                  <img
                    src={second.profileimg || DEFAULT_AVATAR}
                    alt={second.name}
                    className="upd-lb-avatar"
                  />
                  <span className="upd-lb-rank-badge badge-2">2</span>
                </Link>
                <Link href={`/users/${second.usn?.toLowerCase()}`} className="upd-lb-user-name">
                  {second.name?.split(' ')[0]}
                </Link>
                <div
                  className="upd-lb-bar bar-2"
                  style={{
                    height: `${Math.max(48, Math.round((second.updateCount / maxUpdates) * 96))}px`,
                  }}
                >
                  <span className="upd-lb-bar-count">{second.updateCount}</span>
                  <span className="upd-lb-bar-sub">updates</span>
                </div>
              </div>
            ) : (
              <div className="upd-lb-podium-slot rank-2 placeholder" />
            )}

            {/* Rank 1 (Center) */}
            {first && (
              <div className="upd-lb-podium-slot rank-1">
                <div className="upd-lb-crown">👑</div>
                <Link
                  href={`/users/${first.usn?.toLowerCase()}`}
                  className="upd-lb-avatar-wrap rank-1-ring"
                  title={`${first.name} (@${first.usn}) - ${first.updateCount} updates, ${first.fileCount} files`}
                >
                  <img
                    src={first.profileimg || DEFAULT_AVATAR}
                    alt={first.name}
                    className="upd-lb-avatar"
                  />
                  <span className="upd-lb-rank-badge badge-1">1</span>
                </Link>
                <Link href={`/users/${first.usn?.toLowerCase()}`} className="upd-lb-user-name">
                  {first.name?.split(' ')[0]}
                </Link>
                <div
                  className="upd-lb-bar bar-1"
                  style={{
                    height: `${Math.max(68, Math.round((first.updateCount / maxUpdates) * 120))}px`,
                  }}
                >
                  <span className="upd-lb-bar-count">{first.updateCount}</span>
                  <span className="upd-lb-bar-sub">updates</span>
                </div>
              </div>
            )}

            {/* Rank 3 (Right) */}
            {third ? (
              <div className="upd-lb-podium-slot rank-3">
                <Link
                  href={`/users/${third.usn?.toLowerCase()}`}
                  className="upd-lb-avatar-wrap rank-3-ring"
                  title={`${third.name} (@${third.usn}) - ${third.updateCount} updates, ${third.fileCount} files`}
                >
                  <img
                    src={third.profileimg || DEFAULT_AVATAR}
                    alt={third.name}
                    className="upd-lb-avatar"
                  />
                  <span className="upd-lb-rank-badge badge-3">3</span>
                </Link>
                <Link href={`/users/${third.usn?.toLowerCase()}`} className="upd-lb-user-name">
                  {third.name?.split(' ')[0]}
                </Link>
                <div
                  className="upd-lb-bar bar-3"
                  style={{
                    height: `${Math.max(36, Math.round((third.updateCount / maxUpdates) * 80))}px`,
                  }}
                >
                  <span className="upd-lb-bar-count">{third.updateCount}</span>
                  <span className="upd-lb-bar-sub">updates</span>
                </div>
              </div>
            ) : (
              <div className="upd-lb-podium-slot rank-3 placeholder" />
            )}
          </div>

          {/* Row of next 7 contributors (ranks 4-10) */}
          {next7.length > 0 && (
            <div className="upd-lb-runners-row" title="Ranks 4 - 10">
              {next7.map((user) => (
                <Link
                  key={user.userId || user.usn}
                  href={`/users/${user.usn?.toLowerCase()}`}
                  className="upd-lb-runner-item"
                  title={`#${user.rank} ${user.name} (@${user.usn}) - ${user.updateCount} updates, ${user.fileCount} files`}
                >
                  <div className="upd-lb-runner-avatar-wrap">
                    <img
                      src={user.profileimg || DEFAULT_AVATAR}
                      alt={user.name}
                      className="upd-lb-runner-avatar"
                    />
                    <span className="upd-lb-runner-rank">#{user.rank}</span>
                  </div>
                  <span className="upd-lb-runner-name">{user.name?.split(' ')[0]}</span>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

