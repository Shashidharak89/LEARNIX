"use client";

import { useEffect, useState, useCallback } from "react";
import { FiActivity, FiCalendar, FiChevronDown, FiBarChart2 } from "react-icons/fi";

const HISTORY_PAGE_LIMIT = 10;

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

export default function AdminRequestMetrics({ role }) {
  const [token, setToken] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [totals, setTotals] = useState({ works: 0, worksmain: 0, quote: 0 });
  const [today, setToday] = useState({ works: 0, worksmain: 0, quote: 0 });
  const [selected, setSelected] = useState({ works: 0, worksmain: 0, quote: 0 });

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
    async (pageNum = 1, append = false, dateKey = selectedDate) => {
      if (!token) return;
      append ? setLoadingMore(true) : setLoading(true);
      setError("");

      try {
        const query = new window.URLSearchParams({
          page: String(pageNum),
          limit: String(HISTORY_PAGE_LIMIT),
          date: dateKey,
        });

        const res = await fetch(`/api/admin/request-metrics?${query.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to fetch metrics");
          return;
        }

        setTotals(data.totals || { works: 0, worksmain: 0, quote: 0 });
        setToday(data.today || { works: 0, worksmain: 0, quote: 0 });
        setSelected(data.selectedDate || { works: 0, worksmain: 0, quote: 0 });

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
    [token, selectedDate]
  );

  useEffect(() => {
    if (!role || (role !== "admin" && role !== "superadmin")) return;
    if (!token) return;
    fetchMetrics(1, false, selectedDate);
  }, [role, token, selectedDate, fetchMetrics]);

  const metricCards = [
    { key: "works", label: "Works Requests", color: "adm-summary-blue" },
    { key: "worksmain", label: "Works Main (/works/[id])", color: "adm-summary-green" },
    { key: "quote", label: "Quote Requests", color: "adm-summary-yellow" },
  ];

  return (
    <section className="adm-req-section">
      <div className="adm-req-head">
        <h2 className="adm-section-title"><FiBarChart2 size={18} /> Request Metrics</h2>
        <p className="adm-section-sub">Track backend request counts by type and date.</p>
      </div>

      {error && <div className="au-error-banner">{error}</div>}

      <div className="adm-summary">
        {metricCards.map((metric) => (
          <div key={`all-${metric.key}`} className={`adm-summary-card ${metric.color}`}>
            <div className="adm-summary-icon"><FiActivity size={20} /></div>
            <div>
              <div className="adm-summary-value">{formatCount(totals[metric.key])}</div>
              <div className="adm-summary-label">All Time · {metric.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="adm-req-filter-row">
        <label htmlFor="adm-req-date" className="adm-req-filter-label">
          <FiCalendar size={14} /> Select date
        </label>
        <input
          id="adm-req-date"
          type="date"
          value={selectedDate}
          className="adm-req-date-input"
          onChange={(event) => setSelectedDate(event.target.value)}
        />
      </div>

      <div className="adm-req-grid-two">
        <div className="adm-req-panel">
          <h3 className="adm-req-panel-title">Today</h3>
          <div className="adm-req-lines">
            <p>Works: <strong>{formatCount(today.works)}</strong></p>
            <p>Works Main: <strong>{formatCount(today.worksmain)}</strong></p>
            <p>Quote: <strong>{formatCount(today.quote)}</strong></p>
          </div>
        </div>
        <div className="adm-req-panel">
          <h3 className="adm-req-panel-title">Selected Date</h3>
          <div className="adm-req-lines">
            <p>Works: <strong>{formatCount(selected.works)}</strong></p>
            <p>Works Main: <strong>{formatCount(selected.worksmain)}</strong></p>
            <p>Quote: <strong>{formatCount(selected.quote)}</strong></p>
          </div>
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
                  onClick={() => fetchMetrics(page + 1, true, selectedDate)}
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
