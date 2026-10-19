"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  FiPlay,
  FiUploadCloud,
  FiRotateCcw,
  FiFileText,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
  FiCode,
  FiTerminal,
  FiHelpCircle,
  FiShield,
} from "react-icons/fi";
import "./LeetCodeIDE.css";

// Dynamic import of Monaco Editor with SSR disabled
const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280", background: "#1e1e1e" }}>
      Loading Code Editor...
    </div>
  ),
});

export default function LeetCodeIDE() {
  const [problems, setProblems] = useState([]);
  const [selectedSlug, setSelectedSlug] = useState("add-two-numbers");
  const [problem, setProblem] = useState(null);
  const [loadingProblem, setLoadingProblem] = useState(true);

  // Editor State
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");

  // Console State
  const [activeConsoleTab, setActiveConsoleTab] = useState("testcase"); // "testcase" | "testresult"
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);
  const [selectedResultIdx, setSelectedResultIdx] = useState(0);
  const [activeLeftTab, setActiveLeftTab] = useState("description"); // "description" | "help"

  // Execution states
  const [executing, setExecuting] = useState(false);
  const [execMode, setExecMode] = useState("run"); // "run" | "submit"
  const [executionResult, setExecutionResult] = useState(null);
  const [customInputStr, setCustomInputStr] = useState("");
  const [useCustomInput, setUseCustomInput] = useState(false);

  // Check if caller might be admin (from localStorage) just to show Admin link
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("role") || "";
    setIsAdmin(role === "admin" || role === "superadmin");

    // Check URL params for ?problem=...
    const urlParams = new URLSearchParams(window.location.search);
    const probParam = urlParams.get("problem");
    if (probParam) {
      setSelectedSlug(probParam);
    }

    // Fetch list of problems
    fetchProblemsList(probParam || "add-two-numbers");
  }, []);

  async function fetchProblemsList(initialSlug) {
    try {
      const res = await fetch("/api/coding/problems");
      const data = await res.json();
      if (data.success && data.problems?.length > 0) {
        setProblems(data.problems);
        const match = data.problems.find(
          (p) => p.slug === initialSlug || p.problemId === initialSlug
        );
        const targetSlug = match ? (match.slug || match.problemId) : (data.problems[0].slug || data.problems[0].problemId);
        setSelectedSlug(targetSlug);
        loadProblem(targetSlug);
      }
    } catch (err) {
      console.error("Failed to load problem list:", err);
    }
  }

  const loadProblem = useCallback(async (slug) => {
    setLoadingProblem(true);
    setExecutionResult(null);
    try {
      const res = await fetch(`/api/coding/problems/${slug}`);
      const data = await res.json();
      if (data.success && data.problem) {
        const prob = data.problem;
        setProblem(prob);

        // Check localStorage cache for saved code or fallback to template
        const cacheKey = `learnix_code_${prob.problemId}`;
        const savedCode = localStorage.getItem(cacheKey);
        const defaultCode =
          prob.templates?.javascript ||
          `// Write your solution here\nfunction ${prob.functionName || "solution"}() {\n  \n}`;

        setCode(savedCode || defaultCode);

        // Reset selected case
        setSelectedCaseIdx(0);
        setSelectedResultIdx(0);
        setActiveConsoleTab("testcase");
      }
    } catch (err) {
      console.error("Error loading problem:", err);
    } finally {
      setLoadingProblem(false);
    }
  }, []);

  function handleProblemChange(e) {
    const newSlug = e.target.value;
    setSelectedSlug(newSlug);
    const newUrl = new URL(window.location);
    newUrl.searchParams.set("problem", newSlug);
    window.history.pushState({}, "", newUrl);
    loadProblem(newSlug);
  }

  function handleCodeChange(newCode) {
    setCode(newCode || "");
    if (problem) {
      localStorage.setItem(`learnix_code_${problem.problemId}`, newCode || "");
    }
  }

  function handleResetCode() {
    if (!problem) return;
    if (typeof window !== "undefined" && window.confirm("Reset code to default boilerplate template?")) {
      const defaultCode =
        problem.templates?.javascript ||
        `function ${problem.functionName || "solution"}() {\n  \n}`;
      setCode(defaultCode);
      localStorage.setItem(`learnix_code_${problem.problemId}`, defaultCode);
    }
  }

  async function runCode(mode = "run") {
    if (!problem || executing) return;
    setExecuting(true);
    setExecMode(mode);
    setActiveConsoleTab("testresult");

    try {
      let customArgs = undefined;
      if (mode === "run" && useCustomInput && customInputStr.trim()) {
        try {
          customArgs = JSON.parse(customInputStr);
        } catch {
          alert("Invalid custom input: must be a valid JSON array of arguments, e.g. [2, 3]");
          setExecuting(false);
          return;
        }
      }

      const res = await fetch("/api/coding/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: problem.problemId,
          code,
          mode,
          customInput: customArgs,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setExecutionResult(data);
        setSelectedResultIdx(0);
      } else {
        setExecutionResult({
          status: "Error",
          error: data.error || "Failed to execute",
          results: [],
          totalRuntime: 0,
          passedTestCases: 0,
          totalTestCases: 0,
        });
      }
    } catch (err) {
      setExecutionResult({
        status: "Error",
        error: err.message || "Network execution error",
        results: [],
        totalRuntime: 0,
        passedTestCases: 0,
        totalTestCases: 0,
      });
    } finally {
      setExecuting(false);
    }
  }

  if (loadingProblem && !problem) {
    return (
      <div className="lc-workspace" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#9ca3af" }}>
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⚡</div>
          <h2 style={{ color: "#ffffff", margin: "0 0 0.5rem 0" }}>Loading Learnix Coding Playground...</h2>
          <p>Initializing LeetCode interface and connecting to DynamoDB</p>
        </div>
      </div>
    );
  }

  const sampleCases = problem?.sampleCases || [];

  return (
    <div className="lc-workspace">
      {/* ── Top Bar ── */}
      <nav className="lc-navbar">
        <div className="lc-nav-left">
          <Link href="/" className="lc-logo">
            <span className="lc-logo-icon">&lt;/&gt;</span>
            <span>Learnix <span style={{ color: "#f59e0b" }}>Code</span></span>
          </Link>

          {/* Problem Selector Dropdown */}
          <div style={{ position: "relative" }}>
            <select
              value={selectedSlug}
              onChange={handleProblemChange}
              className="lc-problem-select-btn"
            >
              {problems.map((p) => (
                <option key={p.problemId} value={p.slug || p.problemId}>
                  {p.order ? `${p.order}. ` : ""}{p.title} ({p.difficulty})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons: Run & Submit */}
        <div className="lc-nav-center">
          <button
            onClick={() => runCode("run")}
            disabled={executing}
            className="lc-btn-action lc-btn-run"
            title="Run code against sample test cases (Ctrl + ')"
          >
            <FiPlay size={14} />
            <span>{executing && execMode === "run" ? "Running..." : "Run"}</span>
          </button>

          <button
            onClick={() => runCode("submit")}
            disabled={executing}
            className="lc-btn-action lc-btn-submit"
            title="Submit code against all 10 test cases"
          >
            <FiUploadCloud size={15} />
            <span>{executing && execMode === "submit" ? "Evaluating..." : "Submit"}</span>
          </button>
        </div>

        <div className="lc-nav-right">
          {isAdmin && (
            <Link href="/admin/coding" className="lc-nav-link" style={{ color: "#38bdf8" }}>
              <FiShield size={14} /> Admin Dashboard
            </Link>
          )}
          <Link href="/" className="lc-nav-link">
            Exit
          </Link>
        </div>
      </nav>

      {/* ── Workspace Split Body ── */}
      <div className="lc-body">
        {/* Left Pane: Problem Description */}
        <div className="lc-left-pane">
          <div className="lc-pane-header">
            <button
              onClick={() => setActiveLeftTab("description")}
              className={`lc-tab-btn ${activeLeftTab === "description" ? "active" : ""}`}
            >
              <FiFileText size={15} /> Description
            </button>
            <button
              onClick={() => setActiveLeftTab("help")}
              className={`lc-tab-btn ${activeLeftTab === "help" ? "active" : ""}`}
            >
              <FiHelpCircle size={15} /> Guide &amp; Constraints
            </button>
          </div>

          <div className="lc-pane-content">
            {problem && activeLeftTab === "description" && (
              <div>
                <div className="lc-problem-title-row">
                  <h1 className="lc-problem-title">
                    {problem.order ? `${problem.order}. ` : ""}{problem.title}
                  </h1>
                </div>

                <div className="lc-meta-chips">
                  <span
                    className={`lc-difficulty-pill ${
                      problem.difficulty === "Easy"
                        ? "lc-diff-easy"
                        : problem.difficulty === "Medium"
                        ? "lc-diff-medium"
                        : "lc-diff-hard"
                    }`}
                  >
                    {problem.difficulty}
                  </span>

                  {(problem.tags || []).map((t, idx) => (
                    <span key={idx} className="lc-tag-chip">
                      {t}
                    </span>
                  ))}

                  <span className="lc-tag-chip" style={{ color: "#9ca3af" }}>
                    {problem.totalTestCasesCount || 10} Test Cases
                  </span>
                </div>

                {/* Problem Statement Content */}
                <div className="lc-markdown-body">
                  <div style={{ whiteSpace: "pre-line", marginBottom: "1rem" }}>
                    {problem.description}
                  </div>

                  {/* Input & Output Format */}
                  {problem.inputFormat && (
                    <div className="lc-section-box">
                      <h4>Input Format</h4>
                      <p style={{ margin: 0, color: "#9ca3af" }}>{problem.inputFormat}</p>
                    </div>
                  )}

                  {problem.outputFormat && (
                    <div className="lc-section-box">
                      <h4>Output Format</h4>
                      <p style={{ margin: 0, color: "#9ca3af" }}>{problem.outputFormat}</p>
                    </div>
                  )}

                  {/* Constraints */}
                  {problem.constraints?.length > 0 && (
                    <div className="lc-section-box">
                      <h4>Constraints</h4>
                      <ul className="lc-constraints-list">
                        {problem.constraints.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {problem && activeLeftTab === "help" && (
              <div className="lc-markdown-body">
                <h3>About This Coding Environment</h3>
                <p>
                  This coding sandbox allows you to write and execute JavaScript (Node.js) solutions directly in your browser.
                </p>
                <div className="lc-section-box">
                  <h4>💡 How to Run &amp; Test</h4>
                  <ul className="lc-constraints-list">
                    <li>Implement the required function: <code>{problem.functionName}(...)</code></li>
                    <li>Use <strong>Run</strong> to test your solution against visible sample testcases.</li>
                    <li>Use <strong>Submit</strong> to evaluate your code against all 10 comprehensive hidden testcases.</li>
                    <li>Use <code>console.log(...)</code> anywhere in your code to print debug messages to the Output console.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Code Editor + Output Console */}
        <div className="lc-right-pane">
          {/* Top: Editor Card */}
          <div className="lc-editor-card">
            <div className="lc-editor-header">
              <div className="lc-lang-badge">
                <FiCode size={16} />
                <span>JavaScript (Node.js)</span>
              </div>
              <div className="lc-editor-actions">
                <button
                  onClick={handleResetCode}
                  className="lc-icon-btn"
                  title="Reset to default boilerplate code"
                >
                  <FiRotateCcw size={15} />
                </button>
              </div>
            </div>

            <div className="lc-monaco-wrap">
              <Editor
                height="100%"
                language="javascript"
                theme="vs-dark"
                value={code}
                onChange={handleCodeChange}
                options={{
                  fontSize: 14,
                  fontFamily: "'Fira Code', 'Menlo', 'Monaco', monospace",
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  lineNumbers: "on",
                  bracketPairColorization: { enabled: true },
                  padding: { top: 12, bottom: 12 },
                  suggestOnTriggerCharacters: true,
                }}
              />
            </div>
          </div>

          {/* Bottom: Console / Test Cases Card */}
          <div className="lc-console-card">
            <div className="lc-console-header">
              <div className="lc-console-tabs">
                <button
                  onClick={() => setActiveConsoleTab("testcase")}
                  className={`lc-tab-btn ${activeConsoleTab === "testcase" ? "active" : ""}`}
                >
                  <FiTerminal size={14} /> Testcase
                </button>
                <button
                  onClick={() => setActiveConsoleTab("testresult")}
                  className={`lc-tab-btn ${activeConsoleTab === "testresult" ? "active" : ""}`}
                >
                  <FiCheckCircle size={14} /> Test Result
                  {executionResult && (
                    <span
                      style={{
                        marginLeft: "6px",
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background:
                          executionResult.status === "Accepted"
                            ? "var(--lc-easy)"
                            : "var(--lc-hard)",
                      }}
                    />
                  )}
                </button>
              </div>
            </div>

            <div className="lc-console-body">
              {/* ── Testcase Tab ── */}
              {activeConsoleTab === "testcase" && (
                <div>
                  <div className="lc-case-nav">
                    {sampleCases.map((tc, idx) => (
                      <button
                        key={tc.testCaseId || idx}
                        onClick={() => {
                          setSelectedCaseIdx(idx);
                          setUseCustomInput(false);
                        }}
                        className={`lc-case-chip ${!useCustomInput && selectedCaseIdx === idx ? "active" : ""}`}
                      >
                        Case {idx + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setUseCustomInput(true)}
                      className={`lc-case-chip ${useCustomInput ? "active" : ""}`}
                    >
                      + Custom Testcase
                    </button>
                  </div>

                  {!useCustomInput && sampleCases[selectedCaseIdx] && (
                    <div>
                      <div className="lc-param-block">
                        <div className="lc-param-label">Input</div>
                        <div className="lc-param-box">
                          {sampleCases[selectedCaseIdx].rawInput ||
                            JSON.stringify(sampleCases[selectedCaseIdx].input)}
                        </div>
                      </div>

                      <div className="lc-param-block">
                        <div className="lc-param-label">Expected Output</div>
                        <div className="lc-param-box">
                          {JSON.stringify(sampleCases[selectedCaseIdx].expectedOutput)}
                        </div>
                      </div>

                      {sampleCases[selectedCaseIdx].explanation && (
                        <div style={{ color: "#9ca3af", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                          💡 <em>{sampleCases[selectedCaseIdx].explanation}</em>
                        </div>
                      )}
                    </div>
                  )}

                  {useCustomInput && (
                    <div>
                      <div className="lc-param-block">
                        <div className="lc-param-label">Custom Arguments (JSON Array, e.g. [15, 25])</div>
                        <input
                          type="text"
                          value={customInputStr}
                          onChange={(e) => setCustomInputStr(e.target.value)}
                          placeholder="e.g. [50, 100]"
                          style={{
                            width: "100%",
                            background: "#1e1e1e",
                            border: "1px solid #383838",
                            borderRadius: "6px",
                            padding: "0.6rem 0.85rem",
                            color: "#ffffff",
                            fontFamily: "monospace",
                            outline: "none",
                          }}
                        />
                      </div>
                      <p style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                        Click <strong>Run</strong> to test your code with these custom arguments.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Test Result Tab ── */}
              {activeConsoleTab === "testresult" && (
                <div>
                  {!executionResult && !executing && (
                    <div style={{ color: "#6b7280", textAlign: "center", padding: "2rem" }}>
                      Run or Submit your code to see the test results here.
                    </div>
                  )}

                  {executing && (
                    <div style={{ textAlign: "center", padding: "2rem", color: "#9ca3af" }}>
                      <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>⏳</div>
                      <p>{execMode === "submit" ? "Running all 10 test cases..." : "Evaluating sample test cases..."}</p>
                    </div>
                  )}

                  {!executing && executionResult && (
                    <div>
                      {/* Status Banner */}
                      <div
                        className={`lc-status-banner ${
                          executionResult.status === "Accepted"
                            ? "lc-status-accepted"
                            : executionResult.status === "Wrong Answer"
                            ? "lc-status-wrong"
                            : "lc-status-error"
                        }`}
                      >
                        <div className="lc-status-title">
                          {executionResult.status === "Accepted" && <FiCheckCircle size={20} />}
                          {executionResult.status === "Wrong Answer" && <FiXCircle size={20} />}
                          {executionResult.status !== "Accepted" &&
                            executionResult.status !== "Wrong Answer" && (
                              <FiAlertTriangle size={20} />
                            )}
                          <span>{executionResult.status}</span>
                        </div>

                        <div className="lc-status-metrics">
                          <span>
                            {executionResult.passedTestCases} / {executionResult.totalTestCases} Testcases Passed
                          </span>
                          <span style={{ margin: "0 0.5rem" }}>•</span>
                          <span>Runtime: {executionResult.totalRuntime} ms</span>
                        </div>
                      </div>

                      {/* General Error Message if any */}
                      {executionResult.error && (
                        <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "6px", padding: "0.75rem", color: "#f87171", fontFamily: "monospace", fontSize: "0.85rem", marginBottom: "1rem" }}>
                          {executionResult.error}
                        </div>
                      )}

                      {/* Results Navigation by Case */}
                      {executionResult.results?.length > 0 && (
                        <div>
                          <div className="lc-case-nav">
                            {executionResult.results.map((r, idx) => (
                              <button
                                key={idx}
                                onClick={() => setSelectedResultIdx(idx)}
                                className={`lc-case-chip ${selectedResultIdx === idx ? "active" : ""} ${r.passed ? "passed" : "failed"}`}
                              >
                                Case {idx + 1}
                              </button>
                            ))}
                          </div>

                          {executionResult.results[selectedResultIdx] && (
                            <div>
                              {executionResult.results[selectedResultIdx].rawInput && (
                                <div className="lc-param-block">
                                  <div className="lc-param-label">Input</div>
                                  <div className="lc-param-box">
                                    {executionResult.results[selectedResultIdx].rawInput}
                                  </div>
                                </div>
                              )}

                              <div className="lc-param-block">
                                <div className="lc-param-label">Output</div>
                                <div
                                  className="lc-param-box"
                                  style={{
                                    color: executionResult.results[selectedResultIdx].passed
                                      ? "var(--lc-easy)"
                                      : "var(--lc-hard)",
                                  }}
                                >
                                  {JSON.stringify(
                                    executionResult.results[selectedResultIdx].actualOutput
                                  )}
                                </div>
                              </div>

                              {executionResult.results[selectedResultIdx].expectedOutput !== undefined && (
                                <div className="lc-param-block">
                                  <div className="lc-param-label">Expected</div>
                                  <div className="lc-param-box">
                                    {JSON.stringify(
                                      executionResult.results[selectedResultIdx].expectedOutput
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Stdout Logs */}
                              {executionResult.results[selectedResultIdx].logs?.length > 0 && (
                                <div className="lc-param-block">
                                  <div className="lc-param-label">Stdout (Console Output)</div>
                                  <div className="lc-param-box" style={{ color: "#cbd5e1" }}>
                                    {executionResult.results[selectedResultIdx].logs.map((log, lIdx) => (
                                      <div key={lIdx}>{log}</div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
