"use client";

import { useEffect, useState, useCallback } from "react";
import { FiGlobe, FiChevronDown } from "react-icons/fi";

const DEFAULT_LIMIT = 10;

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function AdminIpLogs({ role }) {
  const [token, setToken] = useState("");
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const tok = localStorage.getItem("token") || "";
    setToken(tok);

    if (typeof window !== "undefined") {
      const params = new window.URLSearchParams(window.location.search);
      const limitParam = Math.max(1, parseInt(params.get("ipLimit") || String(DEFAULT_LIMIT), 10));
      setLimit(limitParam);
    }
  }, []);

  const syncUrl = useCallback((nextPage, nextLimit) => {
    if (typeof window === "undefined") return;
    const params = new window.URLSearchParams(window.location.search);
    params.set("ipPage", String(Math.max(1, nextPage)));
    params.set("ipLimit", String(Math.max(1, nextLimit)));
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
  }, []);

  const fetchLogs = useCallback(async (pageNum = 1, append = false, limitValue = limit) => {
    if (!token) return;

    append ? setLoadingMore(true) : setLoading(true);
    setError("");

    try {
      const query = new window.URLSearchParams({
        page: String(pageNum),
        limit: String(limitValue),
      });

      const res = await fetch(`/api/admin/ip-logs?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to fetch IP logs");
        return;
      }

      const items = data.records || [];
      append ? setLogs((prev) => [...prev, ...items]) : setLogs(items);

      const current = data.paging?.page || pageNum;
      const pages = data.paging?.totalPages || 1;

      setPage(current);
      setTotalPages(pages);
      syncUrl(current, limitValue);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [token, limit, syncUrl]);

  useEffect(() => {
    if (!role || (role !== "admin" && role !== "superadmin")) return;
    if (!token) return;

    const params = new window.URLSearchParams(window.location.search);
    const startPage = Math.max(1, parseInt(params.get("ipPage") || "1", 10));

    const hydrate = async () => {
      setLoading(true);
      setError("");
      try {
        let merged = [];
        let meta = null;

        for (let current = 1; current <= startPage; current += 1) {
          const q = new window.URLSearchParams({ page: String(current), limit: String(limit) });
          const response = await fetch(`/api/admin/ip-logs?${q.toString()}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const payload = await response.json();

          if (!response.ok) {
            throw new Error(payload.error || "Failed to fetch IP logs");
          }

          merged = [...merged, ...(payload.records || [])];
          meta = payload.paging;
        }

        setLogs(merged);
        setPage(startPage);
        setTotalPages(meta?.totalPages || 1);
        syncUrl(startPage, limit);
      } catch (err) {
        setError(err.message || "Network error. Please try again.");
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    hydrate();
  }, [role, token, limit, syncUrl]);

  const onLimitChange = (value) => {
    const parsed = Math.max(1, parseInt(value || String(DEFAULT_LIMIT), 10));
    setLimit(parsed);
    setPage(1);
    syncUrl(1, parsed);
  };

  return (
    <section className="adm-ip-section">
      <div className="adm-ip-head">
        <h2 className="adm-section-title"><FiGlobe size={18} /> IP Logs</h2>
        <p className="adm-section-sub">Latest backend request IP logs (geo summary).</p>
      </div>

      <div className="adm-ip-filter-row">
        <label htmlFor="adm-ip-limit" className="adm-ip-filter-label">Records per request</label>
        <select
          id="adm-ip-limit"
          className="adm-ip-limit-select"
          value={limit}
          onChange={(event) => onLimitChange(event.target.value)}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </div>

      {error && <div className="au-error-banner">{error}</div>}

      <div className="adm-ip-list-wrap">
        {loading ? (
          <div className="au-loading-state"><p>Loading IP logs…</p></div>
        ) : logs.length === 0 ? (
          <p className="au-all-loaded">No IP logs available.</p>
        ) : (
          <div className="adm-ip-list">
            {logs.map((item) => (
              <div className="adm-ip-row" key={item._id}>
                <div className="adm-ip-main">
                  <div className="adm-ip-line"><strong>IP:</strong> {item.ip || "—"}</div>
                  <div className="adm-ip-line"><strong>Network:</strong> {item.network || "—"}</div>
                  <div className="adm-ip-line"><strong>Version:</strong> {item.version || "—"}</div>
                  <div className="adm-ip-line"><strong>City:</strong> {item.city || "—"}</div>
                  <div className="adm-ip-line"><strong>Region:</strong> {item.region || "—"}</div>
                  <div className="adm-ip-line"><strong>Country:</strong> {item.country_name || "—"}</div>
                  <div className="adm-ip-line"><strong>Org:</strong> {item.org || "—"}</div>
                </div>
                <div className="adm-ip-time">{formatDateTime(item.createdAt)}</div>
              </div>
            ))}
          </div>
        )}

        {page < totalPages && (
          <div className="au-view-more-wrap">
            <button
              className="au-view-more-btn"
              disabled={loadingMore}
              onClick={() => fetchLogs(page + 1, true, limit)}
            >
              {loadingMore ? (
                <><span className="au-dots"><span /><span /><span /></span> Loading…</>
              ) : (
                <><FiChevronDown size={16} /> View More</>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
