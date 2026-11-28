"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FiActivity, FiArrowLeft, FiCalendar, FiChevronLeft, FiChevronRight, FiRefreshCw } from "react-icons/fi";
import { authFetch } from "@/lib/clientAuth";
import { getLearnixDateId } from "@/lib/pageVisits";
import "./PageVisitsManager.css";

function shiftDate(date, amount) {
  const next = new Date(`${date}T12:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + amount);
  return next.toISOString().slice(0, 10);
}

export default function PageVisitsManager() {
  const today = useMemo(() => getLearnixDateId(), []);
  const [date, setDate] = useState(today);
  const [record, setRecord] = useState({ visits: [], totalVisits: 0, pageCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadVisits = useCallback(async (selectedDate, quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const response = await authFetch(`/api/admin/page-visits?date=${encodeURIComponent(selectedDate)}`, { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.error || "Could not load page visits.");
      setRecord(data);
    } catch (loadError) {
      setError(loadError.message || "Could not load page visits.");
      setRecord({ visits: [], totalVisits: 0, pageCount: 0 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadVisits(date);
  }, [date, loadVisits]);

  return (
    <main className="pvm-page">
      <Link href="/admin" className="pvm-back-link"><FiArrowLeft size={16} /> Back to Admin Dashboard</Link>

      <header className="pvm-header-card">
        <div className="pvm-heading">
          <span className="pvm-heading-icon"><FiActivity size={21} /></span>
          <div>
            <p className="pvm-eyebrow">ADMIN ANALYTICS</p>
            <h1>Page Visits</h1>
            <p className="pvm-subtitle">Daily page traffic across Learnix. Dynamic pages are grouped by route.</p>
          </div>
        </div>
        <div className="pvm-date-controls">
          <button
            type="button"
            className="pvm-icon-button"
            onClick={() => setDate((current) => shiftDate(current, -1))}
            aria-label="Previous day"
            title="Previous day"
          ><FiChevronLeft size={18} /></button>
          <label className="pvm-date-input-wrap">
            <FiCalendar size={16} aria-hidden="true" />
            <input type="date" value={date} max={today} onChange={(event) => event.target.value && setDate(event.target.value)} aria-label="Select visit date" />
          </label>
          <button
            type="button"
            className="pvm-icon-button"
            onClick={() => setDate((current) => shiftDate(current, 1))}
            disabled={date >= today}
            aria-label="Next day"
            title="Next day"
          ><FiChevronRight size={18} /></button>
          <button
            type="button"
            className="pvm-icon-button pvm-refresh-button"
            onClick={() => loadVisits(date, true)}
            disabled={loading || refreshing}
            aria-label="Refresh page visits"
            title="Refresh"
          ><FiRefreshCw size={16} className={refreshing ? "pvm-spin" : ""} /></button>
        </div>
      </header>

      {error && <div className="pvm-error" role="alert">{error}</div>}

      <section className="pvm-stats" aria-label="Visit summary">
        <article className="pvm-stat-card">
          <span className="pvm-stat-label">Total page visits</span>
          <strong>{loading ? "—" : record.totalVisits.toLocaleString("en-IN")}</strong>
          <span className="pvm-stat-note">For {date}</span>
        </article>
        <article className="pvm-stat-card pvm-stat-card--blue">
          <span className="pvm-stat-label">Routes visited</span>
          <strong>{loading ? "—" : record.pageCount.toLocaleString("en-IN")}</strong>
          <span className="pvm-stat-note">Unique normalized routes</span>
        </article>
      </section>

      <section className="pvm-table-card" aria-labelledby="pvm-table-title">
        <div className="pvm-table-heading">
          <div>
            <h2 id="pvm-table-title">Visits by page</h2>
            <p>Dynamic routes are grouped under their route template.</p>
          </div>
          <span className="pvm-count-pill">{loading ? "Loading…" : `${record.pageCount} pages`}</span>
        </div>
        <div className="pvm-table-scroll">
          <table className="pvm-table">
            <thead><tr><th>Page URL</th><th>Visits</th></tr></thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }, (_, index) => <tr key={index}><td><span className="pvm-skeleton" /></td><td><span className="pvm-skeleton pvm-skeleton-count" /></td></tr>)
              ) : record.visits.length ? (
                record.visits.map((visit) => (
                  <tr key={visit.pageurl}>
                    <td><code>{visit.pageurl}</code></td>
                    <td><strong className="pvm-visits-count">{Number(visit.count || 0).toLocaleString("en-IN")}</strong></td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={2}><div className="pvm-empty"><FiActivity size={25} /><strong>No visits recorded for this day</strong><span>Page views will appear here as users browse Learnix.</span></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
