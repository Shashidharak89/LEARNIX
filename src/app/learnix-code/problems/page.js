"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiLayers, FiSearch, FiArrowRight } from "react-icons/fi";
import LearnixCodeNav from "../components/LearnixCodeNav";
import "./ProblemsList.css";

export default function ProblemsListPage() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadProblems() {
      try {
        const res = await fetch("/api/coding/problems");
        const data = await res.json();
        if (data.success) {
          setProblems(data.problems || []);
        }
      } catch (err) {
        console.error("Failed to load problems:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProblems();
  }, []);

  const filtered = problems.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="lcp-wrapper">
      <LearnixCodeNav />

      <main className="lcp-main">
        {/* Header */}
        <div className="lcp-header">
          <div>
            <h1>
              <FiLayers color="#38bdf8" /> Problems Repository
            </h1>
            <p>
              Select a coding challenge to launch the real-time LeetCode-style editor and test sandbox.
            </p>
          </div>

          <div className="lcp-search-box">
            <FiSearch color="#64748b" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search problems..."
              className="lcp-search-input"
            />
          </div>
        </div>

        {/* Problems Table */}
        <div className="lcp-table-card">
          <div className="lcp-table-head">
            <div className="lcp-col-id">#</div>
            <div className="lcp-col-title">Problem Name</div>
            <div className="lcp-col-diff">Difficulty</div>
            <div className="lcp-col-action">Action</div>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
              Loading all challenges from DynamoDB...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
              No problems match your search.
            </div>
          ) : (
            <div className="lcp-table-body">
              {filtered.map((p, index) => {
                const problemId = p.order || index + 1;
                return (
                  <Link
                    key={p.problemId || index}
                    href={`/learnix-code/problems/${problemId}`}
                    className="lcp-row"
                  >
                    <div className="lcp-col-id lcp-row-id">{problemId}</div>
                    <div className="lcp-col-title">
                      <span className="lcp-row-title">{p.title}</span>
                    </div>
                    <div className="lcp-col-diff">
                      <span
                        className={`lcp-diff-pill ${
                          p.difficulty === "Easy"
                            ? "lcp-diff-easy"
                            : p.difficulty === "Medium"
                            ? "lcp-diff-medium"
                            : "lcp-diff-hard"
                        }`}
                      >
                        {p.difficulty}
                      </span>
                    </div>
                    <div className="lcp-col-action">
                      <span className="lcp-arrow-action">
                        Solve <FiArrowRight size={14} />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
