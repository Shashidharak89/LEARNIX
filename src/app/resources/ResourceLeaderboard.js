'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ChartColumnIcon, CalendarIcon, ChevronDownIcon, FlameIcon } from '@animateicons/react/lucide';
import ImageLoader from '../components/ImageLoader';
import './styles/ResourceLeaderboard.css';

const DEFAULT_AVATAR = "https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp";

export default function ResourceLeaderboard({ isOpen, onClose }) {
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
      let url = `/api/resources/leaderboard?range=${selectedRange}`;
      if (selectedRange === 'custom') {
        if (from) url += `&from=${encodeURIComponent(from)}`;
        if (to) url += `&to=${encodeURIComponent(to)}`;
      }
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Failed to load leaderboard');
      }
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
    } catch (err) {
      console.error('Error fetching resource leaderboard:', err);
      setError('Unable to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch when opened or when range/custom dates change
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

  // Podiums: standard podium layout places #2 on Left, #1 in Center, #3 on Right
  const first = top3[0];
  const second = top3[1];
  const third = top3[2];

  // Calculate highest topicCount for relative bar scaling
  const maxTopics = Math.max(...top3.map(u => u.topicCount || 0), 1);

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
    <div className="res-lb-container" role="region" aria-label="Uploads Leaderboard">
      {/* Control bar / Range selector */}
      <div className="res-lb-header">
        <div className="res-lb-title-wrap">
          <FlameIcon size={16} className="res-lb-flame-icon" />
          <span className="res-lb-title">Top Contributors</span>
        </div>

        <div className="res-lb-range-pills">
          <button
            type="button"
            className={`res-lb-pill ${range === '7d' ? 'active' : ''}`}
            onClick={() => handleRangeSelect('7d')}
          >
            7D
          </button>
          <button
            type="button"
            className={`res-lb-pill ${range === '30d' ? 'active' : ''}`}
            onClick={() => handleRangeSelect('30d')}
          >
            30D
          </button>
          <button
            type="button"
            className={`res-lb-pill ${range === '90d' ? 'active' : ''}`}
            onClick={() => handleRangeSelect('90d')}
          >
            90D
          </button>
          <button
            type="button"
            className={`res-lb-pill res-lb-pill-custom ${range === 'custom' ? 'active' : ''}`}
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
        <div className="res-lb-custom-inputs">
          <div className="res-lb-date-group">
            <span className="res-lb-date-label">From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="res-lb-date-field"
            />
          </div>
          <div className="res-lb-date-group">
            <span className="res-lb-date-label">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="res-lb-date-field"
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <div className="res-lb-loading">
          <div className="res-lb-spinner" />
          <span className="res-lb-loading-text">Loading top contributors...</span>
        </div>
      ) : error ? (
        <div className="res-lb-empty">{error}</div>
      ) : leaderboard.length === 0 ? (
        <div className="res-lb-empty">No resource uploads recorded for this period yet.</div>
      ) : (
        <>
          {/* Top 3 Bar Graph Podium */}
          <div className="res-lb-podium">
            {/* Rank 2 (Left) */}
            {second ? (
              <div className="res-lb-podium-slot rank-2">
                <Link
                  href={`/users/${second.usn?.toLowerCase()}`}
                  className="res-lb-avatar-wrap rank-2-ring"
                  title={`${second.name} (@${second.usn}) - ${second.topicCount} topics, ${second.imageCount} images`}
                >
                  <img
                    src={second.profileimg || DEFAULT_AVATAR}
                    alt={second.name}
                    className="res-lb-avatar"
                  />
                  <span className="res-lb-rank-badge badge-2">2</span>
                </Link>
                <Link href={`/users/${second.usn?.toLowerCase()}`} className="res-lb-user-name">
                  {second.name?.split(' ')[0]}
                </Link>
                <div
                  className="res-lb-bar bar-2"
                  style={{
                    height: `${Math.max(48, Math.round((second.topicCount / maxTopics) * 96))}px`,
                  }}
                >
                  <span className="res-lb-bar-count">{second.topicCount}</span>
                  <span className="res-lb-bar-sub">topics</span>
                </div>
              </div>
            ) : (
              <div className="res-lb-podium-slot rank-2 placeholder" />
            )}

            {/* Rank 1 (Center) */}
            {first && (
              <div className="res-lb-podium-slot rank-1">
                <div className="res-lb-crown">👑</div>
                <Link
                  href={`/users/${first.usn?.toLowerCase()}`}
                  className="res-lb-avatar-wrap rank-1-ring"
                  title={`${first.name} (@${first.usn}) - ${first.topicCount} topics, ${first.imageCount} images`}
                >
                  <img
                    src={first.profileimg || DEFAULT_AVATAR}
                    alt={first.name}
                    className="res-lb-avatar"
                  />
                  <span className="res-lb-rank-badge badge-1">1</span>
                </Link>
                <Link href={`/users/${first.usn?.toLowerCase()}`} className="res-lb-user-name">
                  {first.name?.split(' ')[0]}
                </Link>
                <div
                  className="res-lb-bar bar-1"
                  style={{
                    height: `${Math.max(68, Math.round((first.topicCount / maxTopics) * 120))}px`,
                  }}
                >
                  <span className="res-lb-bar-count">{first.topicCount}</span>
                  <span className="res-lb-bar-sub">topics</span>
                </div>
              </div>
            )}

            {/* Rank 3 (Right) */}
            {third ? (
              <div className="res-lb-podium-slot rank-3">
                <Link
                  href={`/users/${third.usn?.toLowerCase()}`}
                  className="res-lb-avatar-wrap rank-3-ring"
                  title={`${third.name} (@${third.usn}) - ${third.topicCount} topics, ${third.imageCount} images`}
                >
                  <img
                    src={third.profileimg || DEFAULT_AVATAR}
                    alt={third.name}
                    className="res-lb-avatar"
                  />
                  <span className="res-lb-rank-badge badge-3">3</span>
                </Link>
                <Link href={`/users/${third.usn?.toLowerCase()}`} className="res-lb-user-name">
                  {third.name?.split(' ')[0]}
                </Link>
                <div
                  className="res-lb-bar bar-3"
                  style={{
                    height: `${Math.max(36, Math.round((third.topicCount / maxTopics) * 80))}px`,
                  }}
                >
                  <span className="res-lb-bar-count">{third.topicCount}</span>
                  <span className="res-lb-bar-sub">topics</span>
                </div>
              </div>
            ) : (
              <div className="res-lb-podium-slot rank-3 placeholder" />
            )}
          </div>

          {/* Row of next 7 contributors (ranks 4-10) */}
          {next7.length > 0 && (
            <div className="res-lb-runners-row" title="Ranks 4 - 10">
              {next7.map((user) => (
                <Link
                  key={user.userId || user.usn}
                  href={`/users/${user.usn?.toLowerCase()}`}
                  className="res-lb-runner-item"
                  title={`#${user.rank} ${user.name} (@${user.usn}) - ${user.topicCount} topics, ${user.imageCount} images`}
                >
                  <div className="res-lb-runner-avatar-wrap">
                    <img
                      src={user.profileimg || DEFAULT_AVATAR}
                      alt={user.name}
                      className="res-lb-runner-avatar"
                    />
                    <span className="res-lb-runner-rank">#{user.rank}</span>
                  </div>
                  <span className="res-lb-runner-name">{user.name?.split(' ')[0]}</span>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

