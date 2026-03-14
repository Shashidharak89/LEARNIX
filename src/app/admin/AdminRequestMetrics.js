"use client";

import { useEffect, useState, useCallback } from "react";
import { FiActivity, FiCalendar, FiChevronDown, FiBarChart2, FiTrendingUp } from "react-icons/fi";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

const HISTORY_PAGE_LIMIT = 10;
const RANGE_OPTIONS = [7, 30, 90];
const ZERO_METRICS = { works: 0, worksmain: 0, quote: 0 };

function formatCount(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function formatDateLabel(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatChartDateLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

export default function AdminRequestMetrics({ role }) {
  const [token, setToken] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [rangeDays, setRangeDays] = useState(7);

  const [totals, setTotals] = useState(ZERO_METRICS);
  const [dayStats, setDayStats] = useState(ZERO_METRICS);
  const [trendData, setTrendData] = useState([]);

  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const tok = localStorage.getItem("token") || "";
    setToken(tok);
  }, []);

  const fetchMetrics = useCallback(
    async (pageNum = 1, append = false, options = {}) => {
      if (!token) return;
      const dateKey = options.dateKey ?? selectedDate;
      const chartRange = options.rangeDays ?? rangeDays;

      append ? setLoadingMore(true) : setLoading(true);
      setError("");

      try {
        const query = new window.URLSearchParams({
          page: String(pageNum),
          limit: String(HISTORY_PAGE_LIMIT),
          date: dateKey,
          rangeDays: String(chartRange),
        });

        const res = await fetch(`/api/admin/request-metrics?${query.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to fetch metrics");
          return;
        }

        setTotals(data.totals || ZERO_METRICS);
        setDayStats(data.dayStats || data.selectedDate || data.today || ZERO_METRICS);
        setTrendData(data.trend?.records || []);

        append ? setHistory((prev) => [...prev, ...(data.history || [])]) : setHistory(data.history || []);

        setPage(data.paging?.page || 1);
        setTotalPages(data.paging?.totalPages || 1);
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [token, selectedDate, rangeDays]
  );

  useEffect(() => {
    if (!role || (role !== "admin" && role !== "superadmin")) return;
    if (!token) return;
    fetchMetrics(1, false, { dateKey: selectedDate, rangeDays });
  }, [role, token, selectedDate, rangeDays, fetchMetrics]);

  const metricCards = [
    { key: "works", label: "Works Requests", color: "adm-summary-blue" },
    { key: "worksmain", label: "Works Main (/works/[id])", color: "adm-summary-green" },
    { key: "quote", label: "Quote Requests", color: "adm-summary-yellow" },
  ];

  const todayKey = new Date().toISOString().slice(0, 10);
  const isTodaySelected = selectedDate === todayKey;
  const dayStatsLabel = isTodaySelected ? "Today so far" : `Date: ${formatDateLabel(selectedDate)}`;

  return (
    <section className="adm-req-section">
      <div className="adm-req-head">
        <h2 className="adm-section-title"><FiBarChart2 size={18} /> Request Metrics</h2>
        <p className="adm-section-sub">Track backend request counts by type and date.</p>
      </div>

      {error && <div className="au-error-banner">{error}</div>}

      <div className="adm-req-grid-two">
        <div className="adm-req-panel">
          <div className="adm-req-panel-top">
            <h3 className="adm-req-panel-title">Day Stats</h3>
            <span className="adm-req-panel-chip">{dayStatsLabel}</span>
          </div>
          <div className="adm-req-filter-row">
            <label htmlFor="adm-req-date" className="adm-req-filter-label">
              <FiCalendar size={14} /> Pick date
            </label>
            <input
              id="adm-req-date"
              type="date"
              value={selectedDate}
              className="adm-req-date-input"
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </div>
          <div className="adm-summary adm-summary-compact">
            {metricCards.map((metric) => (
              <div key={`day-${metric.key}`} className={`adm-summary-card ${metric.color}`}>
                <div className="adm-summary-icon"><FiActivity size={20} /></div>
                <div>
                  <div className="adm-summary-value">{formatCount(dayStats[metric.key])}</div>
                  <div className="adm-summary-label">{metric.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="adm-req-panel">
          <div className="adm-req-panel-top">
            <h3 className="adm-req-panel-title">All Time</h3>
            <span className="adm-req-panel-chip">Lifetime totals</span>
          </div>
          <div className="adm-summary adm-summary-compact">
            {metricCards.map((metric) => (
              <div key={`all-${metric.key}`} className={`adm-summary-card ${metric.color}`}>
                <div className="adm-summary-icon"><FiActivity size={20} /></div>
                <div>
                  <div className="adm-summary-value">{formatCount(totals[metric.key])}</div>
                  <div className="adm-summary-label">{metric.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="adm-req-chart-wrap">
        <div className="adm-req-chart-head">
          <h3 className="adm-req-panel-title"><FiTrendingUp size={16} /> Request Trend</h3>
          <div className="adm-req-range-group">
            {RANGE_OPTIONS.map((days) => (
              <button
                key={days}
                type="button"
                className={`adm-req-range-btn ${rangeDays === days ? "adm-req-range-btn-active" : ""}`}
                onClick={() => setRangeDays(days)}
              >
                Last {days} days
              </button>
            ))}
          </div>
        </div>

        <div className="adm-req-chart-area">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={trendData} margin={{ top: 8, right: 20, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="datetime"
                tickFormatter={formatChartDateLabel}
                tick={{ fontSize: 12, fill: "#6b7280" }}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
              <Tooltip
                formatter={(value, name) => [formatCount(value), name]}
                labelFormatter={(value) => formatDateLabel(value)}
              />
              <Legend />
              <Line type="monotone" dataKey="works" name="Works" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="worksmain" name="Works Main" stroke="#10b981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="quote" name="Quote" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="adm-req-history-wrap">
        <h3 className="adm-req-panel-title">Daily Records (latest first)</h3>

        {loading ? (
          <div className="au-loading-state"><p>Loading request records…</p></div>
        ) : (
          <>
            <div className="adm-req-history-list">
              {history.map((item) => (
                <div className="adm-req-history-row" key={item._id}>
                  <div className="adm-req-history-date">{formatDateLabel(item.datetime)}</div>
                  <div className="adm-req-history-counts">
                    <span>Works: {formatCount(item.works)}</span>
                    <span>Main: {formatCount(item.worksmain)}</span>
                    <span>Quote: {formatCount(item.quote)}</span>
                  </div>
                </div>
              ))}
            </div>

            {history.length === 0 && (
              <p className="au-all-loaded">No request records yet.</p>
            )}

            {page < totalPages && (
              <div className="au-view-more-wrap">
                <button
                  className="au-view-more-btn"
                  disabled={loadingMore}
                  onClick={() => fetchMetrics(page + 1, true, { dateKey: selectedDate, rangeDays })}
                >
                  {loadingMore ? (
                    <><span className="au-dots"><span /><span /><span /></span> Loading…</>
                  ) : (
                    <><FiChevronDown size={16} /> View More</>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
