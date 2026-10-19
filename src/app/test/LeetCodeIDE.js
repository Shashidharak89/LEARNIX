"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiPlay,
  FiUploadCloud,
  FiRotateCcw,
  FiFileText,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
  FiTerminal,
  FiHelpCircle,
  FiShield,
  FiLogOut,
  FiChevronDown,
  FiChevronUp,
  FiCopy,
  FiCheck,
  FiAlignLeft,
  FiMaximize2,
  FiMinimize2,
  FiClock,
  FiUser,
  FiLogIn,
  FiCode,
} from "react-icons/fi";
import { recordCodingEntry, exitCodingEnvironment } from "@/utils/codingExitTracker";
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

export default function LeetCodeIDE({ initialProblemId = "add-two-numbers", baseUrl = "/learnix-code/problems" }) {
  const router = useRouter();
  const [problems, setProblems] = useState([]);
  const [selectedSlug, setSelectedSlug] = useState(initialProblemId);
  const [problem, setProblem] = useState(null);
  const [loadingProblem, setLoadingProblem] = useState(true);

  // Panel Resizing State
  const [leftWidthPercent, setLeftWidthPercent] = useState(45);
  const [consoleHeight, setConsoleHeight] = useState(280);
  const [isDragging, setIsDragging] = useState(null); // null | "vertical" | "horizontal" | "corner"
  const [isEditorMaximized, setIsEditorMaximized] = useState(false);
  const bodyRef = useRef(null);
  const editorRef = useRef(null);

  // Editor State
  const [code, setCode] = useState("");
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [copiedCode, setCopiedCode] = useState(false);

  // Console State
  const [activeConsoleTab, setActiveConsoleTab] = useState("testcase"); // "testcase" | "testresult" | "submissions"
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);
  const [selectedResultIdx, setSelectedResultIdx] = useState(0);
  const [activeLeftTab, setActiveLeftTab] = useState("description"); // "description" | "help" | "submissions"

  // Submissions & Auth State
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");

  // Execution states
  const [executing, setExecuting] = useState(false);
  const [execMode, setExecMode] = useState("run"); // "run" | "submit"
  const [executionResult, setExecutionResult] = useState(null);
  const [customInputStr, setCustomInputStr] = useState("");
  const [useCustomInput, setUseCustomInput] = useState(false);

  // Check if caller might be admin (from localStorage) just to show Admin link
  const [isAdmin, setIsAdmin] = useState(false);

  function handleExit() {
    exitCodingEnvironment(router);
  }

  const handlePointerDown = (type) => (e) => {
    e.preventDefault();
    setIsDragging(type);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e) => {
      if (!bodyRef.current) return;
      const bodyRect = bodyRef.current.getBoundingClientRect();

      if (isDragging === "vertical" || isDragging === "corner") {
        const offsetX = e.clientX - bodyRect.left;
        const totalWidth = bodyRect.width;
        let newPercent = (offsetX / totalWidth) * 100;
        // Clamp between 20% and 75%
        newPercent = Math.max(20, Math.min(75, newPercent));
        setLeftWidthPercent(newPercent);
      }

      if (isDragging === "horizontal" || isDragging === "corner") {
        // Dragging down minimizes console, dragging up expands console
        const newHeight = bodyRect.bottom - e.clientY;
        const maxHeight = Math.max(120, bodyRect.height - 100);
        const clampedHeight = Math.max(42, Math.min(maxHeight, newHeight));
        setConsoleHeight(clampedHeight);
      }
    };

    const handlePointerUp = () => {
      setIsDragging(null);
      if (editorRef.current) {
        setTimeout(() => {
          editorRef.current?.layout();
        }, 50);
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging]);

  const fetchSubmissions = useCallback(async (targetProblemId) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
    if (!token) {
      setSubmissions([]);
      return;
    }

    const pid = targetProblemId || problem?.problemId || selectedSlug;
    if (!pid) return;

    setLoadingSubmissions(true);
    try {
      const res = await fetch(`/api/coding/submissions?problemId=${encodeURIComponent(pid)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setSubmissions(data.submissions || []);
      } else {
        setSubmissions([]);
      }
    } catch (err) {
      console.error("Failed to load submissions:", err);
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  }, [problem, selectedSlug]);

  useEffect(() => {
    const role = (typeof window !== "undefined" && localStorage.getItem("role")) || "";
    setIsAdmin(role === "admin" || role === "superadmin");

    const token = (typeof window !== "undefined" && localStorage.getItem("token")) || "";
    setIsLoggedIn(Boolean(token));
    const storedName =
      (typeof window !== "undefined" && (localStorage.getItem("name") || localStorage.getItem("usn"))) || "";
    setUserName(storedName);

    // Track original entry outside coding section
    recordCodingEntry();

    // Immediately remove any extra navbar padding
    if (typeof document !== "undefined") {
      document.body.classList.add("no-learnix-navbar-pad");
      document.body.style.paddingTop = "0px";

      // Detect if extra space is still kept by stale styles and trigger auto-refresh once
      const computedPad = parseFloat(window.getComputedStyle(document.body).paddingTop);
      if (computedPad > 10) {
        document.body.style.paddingTop = "0px";
        if (typeof window !== "undefined" && typeof window.sessionStorage !== "undefined" && !window.sessionStorage.getItem("learnix_code_nav_refreshed")) {
          window.sessionStorage.setItem("learnix_code_nav_refreshed", "1");
          window.location.reload();
        }
      }
    }

    // Check URL params for ?problem=... or use initialProblemId
    let probParam = initialProblemId;
    if (typeof window !== "undefined") {
      const urlParams = new window.URLSearchParams(window.location.search);
      const q = urlParams.get("problem");
      if (q) probParam = q;
    }
    setSelectedSlug(probParam);

    // Fetch list of problems
    fetchProblemsList(probParam);

    return () => {
      if (typeof document !== "undefined") {
        document.body.classList.remove("no-learnix-navbar-pad");
        document.body.style.paddingTop = "";
      }
    };
  }, [initialProblemId]);

  async function fetchProblemsList(initialSlug) {
    try {
      const res = await fetch("/api/coding/problems");
      const data = await res.json();
      if (data.success && data.problems?.length > 0) {
        setProblems(data.problems);
        const match = data.problems.find(
          (p, idx) =>
            String(p.order || idx + 1) === String(initialSlug) ||
            p.slug === initialSlug ||
            p.problemId === initialSlug
        );
        const targetParam = match
          ? String(match.order || data.problems.indexOf(match) + 1)
          : (initialSlug || "1");
        setSelectedSlug(targetParam);
        loadProblem(targetParam);
      }
    } catch (err) {
      console.error("Failed to load problem list:", err);
    }
  }

  const loadProblem = useCallback(async (slugOrId) => {
    setLoadingProblem(true);
    setExecutionResult(null);
    try {
      const res = await fetch(`/api/coding/problems/${slugOrId}`);
      const data = await res.json();
      if (data.success && data.problem) {
        const prob = data.problem;
        setProblem(prob);
        if (prob.order) {
          setSelectedSlug(String(prob.order));
        }

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

        // Load past submissions for this problem if logged in
        fetchSubmissions(prob.problemId);
      }
    } catch (err) {
      console.error("Error loading problem:", err);
    } finally {
      setLoadingProblem(false);
    }
  }, [fetchSubmissions]);

  function handleProblemChange(e) {
    const newId = e.target.value;
    setSelectedSlug(newId);
    if (typeof window !== "undefined") {
      if (window.location.pathname.startsWith("/learnix-code/problems")) {
        router.push(`${baseUrl}/${newId}`);
      } else {
        const newUrl = new URL(window.location);
        newUrl.searchParams.set("problem", newId);
        window.history.pushState({}, "", newUrl);
        loadProblem(newId);
      }
    }
  }

  function handleCodeChange(newCode) {
    setCode(newCode || "");
    if (problem) {
      localStorage.setItem(`learnix_code_${problem.problemId}`, newCode || "");
    }
  }

  function handleFormatCode() {
    if (editorRef.current) {
      editorRef.current.getAction("editor.action.formatDocument")?.run();
    }
  }

  function handleCopyCode() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
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

    const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

    // Require authentication for submit mode
    if (mode === "submit" && !token) {
      setShowLoginPrompt(true);
      return;
    }

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

      const headers = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/coding/execute", {
        method: "POST",
        headers,
        body: JSON.stringify({
          problemId: problem.problemId,
          code,
          mode,
          customInput: customArgs,
        }),
      });

      const data = await res.json();
      if (data.requiresLogin) {
        setShowLoginPrompt(true);
        setExecuting(false);
        return;
      }

      if (data.success) {
        setExecutionResult(data);
        setSelectedResultIdx(0);
        if (mode === "submit") {
          fetchSubmissions(problem.problemId);
        }
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

  function renderSubmissionsView() {
    if (!isLoggedIn) {
      return (
        <div className="lc-auth-gate-box">
          <div style={{ fontSize: "2.2rem", marginBottom: "0.5rem" }}>🔒</div>
          <h3 style={{ color: "#ffffff", margin: "0 0 0.5rem 0" }}>Log In to Track Submissions</h3>
          <p style={{ color: "#9ca3af", maxWidth: "420px", margin: "0 auto 1.25rem auto", fontSize: "0.9rem", lineHeight: 1.6 }}>
            You can test and run your solution freely using <strong>Run</strong>. To submit your code, evaluate against all hidden testcases, and record your score in DynamoDB, please log in with your Learnix account.
          </p>
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
              }
            }}
            className="lc-btn-action lc-btn-submit"
            style={{ margin: "0 auto" }}
          >
            <FiLogIn size={15} />
            <span>Log In to Learnix</span>
          </button>
        </div>
      );
    }

    if (loadingSubmissions) {
      return (
        <div style={{ padding: "2.5rem", textAlign: "center", color: "#9ca3af" }}>
          <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>⏳</div>
          <p>Loading your submission history from DynamoDB...</p>
        </div>
      );
    }

    if (submissions.length === 0) {
      return (
        <div style={{ padding: "2.5rem 1.5rem", textAlign: "center", color: "#9ca3af" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📝</div>
          <h3 style={{ color: "#ffffff", margin: "0 0 0.5rem 0" }}>No Submissions Yet</h3>
          <p style={{ maxWidth: "420px", margin: "0 auto", fontSize: "0.9rem" }}>
            Submit your solution above to evaluate against all 10 testcases and record your submission!
          </p>
        </div>
      );
    }

    return (
      <div className="lc-submissions-list">
        <div className="lc-submissions-header-row">
          <span>Status</span>
          <span>Cases Passed</span>
          <span>Runtime</span>
          <span>Submitted</span>
          <span style={{ textAlign: "right" }}>Actions</span>
        </div>
        {submissions.map((sub) => {
          const isPassed = sub.status === "Accepted";
          return (
            <div key={sub.submissionId} className="lc-submission-card">
              <div className="lc-sub-col">
                <span
                  className={`lc-sub-status-pill ${
                    isPassed
                      ? "lc-sub-accepted"
                      : sub.status === "Wrong Answer"
                      ? "lc-sub-wrong"
                      : "lc-sub-error"
                  }`}
                >
                  {isPassed ? <FiCheckCircle size={13} /> : <FiXCircle size={13} />}
                  <span>{sub.status}</span>
                </span>
              </div>

              <div
                className="lc-sub-col"
                style={{
                  color: isPassed ? "var(--lc-easy)" : sub.status === "Wrong Answer" ? "#f87171" : "#fbbf24",
                  fontWeight: 600,
                }}
              >
                {sub.passedTestCases} / {sub.totalTestCases || 10}
              </div>

              <div className="lc-sub-col" style={{ color: "#9ca3af", fontFamily: "monospace", fontSize: "0.85rem" }}>
                {sub.totalRuntime} ms
              </div>

              <div className="lc-sub-col" style={{ color: "#6b7280", fontSize: "0.8rem" }}>
                {new Date(sub.submittedAt).toLocaleDateString()} {new Date(sub.submittedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>

              <div className="lc-sub-col lc-sub-actions">
                <button
                  onClick={() => {
                    setCode(sub.code);
                    alert("Solution restored into code editor!");
                  }}
                  className="lc-sub-btn"
                  title="Load code into editor"
                >
                  <FiRotateCcw size={12} />
                  <span>Load</span>
                </button>
                <button
                  onClick={() => setSelectedSubmission(sub)}
                  className="lc-sub-btn lc-sub-btn-primary"
                  title="View code and details"
                >
                  <FiCode size={12} />
                  <span>View</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
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
              {problems.map((p, pIdx) => {
                const numericId = String(p.order || pIdx + 1);
                return (
                  <option key={p.problemId} value={numericId}>
                    {numericId}. {p.title} ({p.difficulty})
                  </option>
                );
              })}
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
            title="Submit code against all 10 test cases (Requires Login)"
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

          {isLoggedIn ? (
            <span className="lc-user-pill">
              <FiUser size={13} />
              <span>{userName || "Account"}</span>
            </span>
          ) : (
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
                }
              }}
              className="lc-btn-login-nav"
              title="Log in to submit code"
            >
              <FiLogIn size={13} />
              <span>Log In</span>
            </button>
          )}

          <button
            onClick={handleExit}
            className="lc-btn-exit"
            title="Exit coding environment and return to previous page"
          >
            <FiLogOut size={14} />
            <span>Exit</span>
          </button>
        </div>
      </nav>

      {/* ── Workspace Split Body ── */}
      <div className="lc-body" ref={bodyRef}>
        {/* Full-screen dragging glass overlay to capture pointer moves across Monaco and text */}
        {isDragging && (
          <div
            className="lc-drag-glass"
            style={{
              cursor:
                isDragging === "vertical"
                  ? "col-resize"
                  : isDragging === "horizontal"
                  ? "row-resize"
                  : "nwse-resize",
            }}
          />
        )}

        {/* Left Pane: Problem Description */}
        <div
          className="lc-left-pane"
          style={{
            flex: `0 0 ${leftWidthPercent}%`,
            width: `${leftWidthPercent}%`,
            maxWidth: `${leftWidthPercent}%`,
          }}
        >
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
            <button
              onClick={() => {
                setActiveLeftTab("submissions");
                fetchSubmissions();
              }}
              className={`lc-tab-btn ${activeLeftTab === "submissions" ? "active" : ""}`}
            >
              <FiClock size={15} /> Submissions
              {submissions.length > 0 && (
                <span className="lc-count-badge">{submissions.length}</span>
              )}
            </button>
          </div>

          <div className="lc-pane-content">
            {activeLeftTab === "submissions" && renderSubmissionsView()}
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
                  <div style={{ whiteSpace: "pre-line", marginBottom: "1.25rem" }}>
                    {problem.description}
                  </div>

                  {/* ── 3 Example Testcases with Outputs in Description Section ── */}
                  {sampleCases && sampleCases.length > 0 && (
                    <div className="lc-examples-section">
                      {sampleCases.slice(0, 3).map((sc, idx) => (
                        <div key={sc.testCaseId || idx} className="lc-example-card">
                          <div className="lc-example-title">Example {idx + 1}:</div>
                          <div className="lc-example-content">
                            <div className="lc-example-line">
                              <span className="lc-example-key">Input:</span>{" "}
                              <code className="lc-example-code">
                                {sc.rawInput ||
                                  (Array.isArray(sc.input)
                                    ? sc.input
                                        .map((v) =>
                                          typeof v === "object" ? JSON.stringify(v) : String(v)
                                        )
                                        .join(", ")
                                    : JSON.stringify(sc.input))}
                              </code>
                            </div>
                            <div className="lc-example-line">
                              <span className="lc-example-key">Output:</span>{" "}
                              <code className="lc-example-code lc-example-code-out">
                                {typeof sc.expectedOutput === "object"
                                  ? JSON.stringify(sc.expectedOutput)
                                  : String(sc.expectedOutput)}
                              </code>
                            </div>
                            {sc.explanation && (
                              <div className="lc-example-line">
                                <span className="lc-example-key">Explanation:</span>{" "}
                                <span className="lc-example-explanation">
                                  {sc.explanation}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

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

        {/* ── Vertical Resizer Gutter between Left and Right Panes ── */}
        <div
          className={`lc-resizer-vertical ${isDragging === "vertical" ? "dragging" : ""}`}
          onPointerDown={handlePointerDown("vertical")}
          onDoubleClick={() => setLeftWidthPercent(45)}
          title="Drag horizontally to resize panes (Double-click to reset to 45%)"
        >
          <div className="lc-resizer-grip-v" />
        </div>

        {/* ── Right Pane: Code Editor + Output Console ── */}
        <div
          className="lc-right-pane"
          style={{
            flex: `1 1 calc(${100 - leftWidthPercent}% - 8px)`,
            minWidth: 0,
            width: `calc(${100 - leftWidthPercent}% - 8px)`,
          }}
        >
          {/* Top: Editor Card */}
          <div className={`lc-editor-card ${isEditorMaximized ? "lc-editor-maximized" : ""}`}>
            <div className="lc-editor-header">
              <div className="lc-lang-badge">
                <span className="lc-js-icon">JS</span>
                <span className="lc-lang-text">JavaScript</span>
                <span className="lc-lang-env">Node.js ES6+</span>
              </div>
              <div className="lc-editor-actions">
                <button
                  onClick={handleFormatCode}
                  className="lc-action-btn"
                  title="Format code indentation and spacing"
                >
                  <FiAlignLeft size={13} />
                  <span>Format</span>
                </button>
                <button
                  onClick={handleCopyCode}
                  className="lc-action-btn"
                  title="Copy code to clipboard"
                >
                  {copiedCode ? <FiCheck size={13} color="#00b8a3" /> : <FiCopy size={13} />}
                  <span>{copiedCode ? "Copied!" : "Copy"}</span>
                </button>
                <button
                  onClick={handleResetCode}
                  className="lc-action-btn"
                  title="Reset to default boilerplate code"
                >
                  <FiRotateCcw size={13} />
                  <span>Reset</span>
                </button>
                <button
                  onClick={() => setIsEditorMaximized(!isEditorMaximized)}
                  className="lc-icon-btn"
                  title={isEditorMaximized ? "Restore Layout" : "Maximize Code Panel"}
                >
                  {isEditorMaximized ? <FiMinimize2 size={14} /> : <FiMaximize2 size={14} />}
                </button>
              </div>
            </div>

            <div className="lc-monaco-wrap">
              <Editor
                height="100%"
                language="javascript"
                theme="vs-dark"
                value={code}
                onMount={(editor) => {
                  editorRef.current = editor;
                  editor.onDidChangeCursorPosition((e) => {
                    setCursorPos({ line: e.position.lineNumber, col: e.position.column });
                  });
                }}
                onChange={handleCodeChange}
                options={{
                  fontSize: 14,
                  fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', Consolas, monospace",
                  fontLigatures: true,
                  lineHeight: 22,
                  cursorBlinking: "smooth",
                  cursorSmoothCaretAnimation: "on",
                  smoothScrolling: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  lineNumbers: "on",
                  bracketPairColorization: { enabled: true },
                  guides: {
                    bracketPairs: true,
                    indentation: true,
                  },
                  autoClosingBrackets: "always",
                  autoClosingQuotes: "always",
                  formatOnPaste: true,
                  formatOnType: true,
                  padding: { top: 14, bottom: 14 },
                  suggestOnTriggerCharacters: true,
                  quickSuggestions: { other: true, comments: false, strings: true },
                  renderLineHighlight: "line",
                  roundedSelection: true,
                }}
              />
            </div>

            {/* Editor Footer / Status Bar */}
            <div className="lc-editor-footer">
              <div className="lc-footer-left">
                <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
                <span className="lc-footer-sep">•</span>
                <span>Spaces: 2</span>
              </div>
              <div className="lc-footer-right">
                <span>UTF-8</span>
                <span className="lc-footer-sep">•</span>
                <span>JavaScript</span>
              </div>
            </div>
          </div>

          {/* ── Horizontal Resizer Gutter between Editor and Console (Hidden when maximized) ── */}
          {!isEditorMaximized && (
            <div
              className={`lc-resizer-horizontal ${isDragging === "horizontal" ? "dragging" : ""}`}
              onPointerDown={handlePointerDown("horizontal")}
              onDoubleClick={() => setConsoleHeight((prev) => (prev <= 45 ? 280 : 42))}
              title="Drag up/down to adjust console height (Drag down to minimize, double-click to toggle)"
            >
              {/* Corner Resizer Handle at top-left of the Console Field */}
              <div
                className={`lc-corner-resizer ${isDragging === "corner" ? "dragging" : ""}`}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  handlePointerDown("corner")(e);
                }}
                title="Hold and drag this corner to adjust width & height simultaneously"
              >
                <span className="lc-corner-icon" />
              </div>

              <div className="lc-resizer-grip-h" />
            </div>
          )}

          {/* Bottom: Console / Test Cases Card (Hidden when maximized) */}
          {!isEditorMaximized && (
            <div
              className={`lc-console-card ${consoleHeight <= 45 ? "lc-console-minimized" : ""}`}
              style={{ height: `${consoleHeight}px` }}
            >
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
                <button
                  onClick={() => {
                    setActiveConsoleTab("submissions");
                    fetchSubmissions();
                  }}
                  className={`lc-tab-btn ${activeConsoleTab === "submissions" ? "active" : ""}`}
                >
                  <FiClock size={14} /> Submissions
                  {submissions.length > 0 && (
                    <span className="lc-count-badge">{submissions.length}</span>
                  )}
                </button>
              </div>

              <div className="lc-console-header-actions">
                <button
                  onClick={() => setConsoleHeight((prev) => (prev <= 45 ? 280 : 42))}
                  className="lc-icon-btn"
                  title={consoleHeight <= 45 ? "Expand Console" : "Minimize Console"}
                >
                  {consoleHeight <= 45 ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                </button>
              </div>
            </div>

            {consoleHeight > 45 && (
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

              {/* ── Submissions Tab in Console ── */}
              {activeConsoleTab === "submissions" && (
                <div style={{ padding: "0.25rem 0" }}>
                  {renderSubmissionsView()}
                </div>
              )}
            </div>
          )}
          </div>
        )}
        </div>
      </div>

      {/* ── Login Prompt Modal ── */}
      {showLoginPrompt && (
        <div className="lc-modal-backdrop" onClick={() => setShowLoginPrompt(false)}>
          <div className="lc-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="lc-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <FiShield size={20} color="#f59e0b" />
                <h3 style={{ margin: 0, color: "#ffffff", fontSize: "1.1rem" }}>Login Required to Submit</h3>
              </div>
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="lc-icon-btn"
                style={{ fontSize: "1rem" }}
              >
                ✕
              </button>
            </div>

            <div className="lc-modal-body">
              <p style={{ margin: "0 0 1rem 0", color: "#e5e7eb", lineHeight: 1.6 }}>
                You are currently testing in guest mode. You can freely run and verify your code using the <strong>Run</strong> button without logging in.
              </p>
              <p style={{ margin: "0 0 1.5rem 0", color: "#9ca3af", fontSize: "0.9rem", lineHeight: 1.6 }}>
                To <strong>Submit</strong> your solution against all 10 hidden testcases, verify your solution, and store your submission history in DynamoDB, please log in with your Learnix account.
              </p>

              <div className="lc-modal-actions">
                <button
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
                    }
                  }}
                  className="lc-btn-modal-login"
                >
                  <FiLogIn size={15} />
                  <span>Log In to Submit</span>
                </button>
                <button
                  onClick={() => setShowLoginPrompt(false)}
                  className="lc-btn-modal-cancel"
                >
                  Keep Testing as Guest
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Selected Submission Code View Modal ── */}
      {selectedSubmission && (
        <div className="lc-modal-backdrop" onClick={() => setSelectedSubmission(null)}>
          <div className="lc-modal-box lc-modal-box-large" onClick={(e) => e.stopPropagation()}>
            <div className="lc-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                <span
                  className={`lc-sub-status-pill ${
                    selectedSubmission.status === "Accepted"
                      ? "lc-sub-accepted"
                      : selectedSubmission.status === "Wrong Answer"
                      ? "lc-sub-wrong"
                      : "lc-sub-error"
                  }`}
                >
                  {selectedSubmission.status === "Accepted" ? <FiCheckCircle size={13} /> : <FiXCircle size={13} />}
                  <span>{selectedSubmission.status}</span>
                </span>
                <span style={{ color: "#ffffff", fontWeight: 600 }}>
                  Submission Details
                </span>
                <span style={{ color: "#9ca3af", fontSize: "0.85rem" }}>
                  ({selectedSubmission.passedTestCases} / {selectedSubmission.totalTestCases || 10} Cases Passed • {selectedSubmission.totalRuntime} ms)
                </span>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="lc-icon-btn"
                style={{ fontSize: "1rem" }}
              >
                ✕
              </button>
            </div>

            <div className="lc-modal-body">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                  Submitted on {new Date(selectedSubmission.submittedAt).toLocaleString()}
                </span>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => {
                      if (typeof navigator !== "undefined" && navigator.clipboard) {
                        navigator.clipboard.writeText(selectedSubmission.code);
                        alert("Code copied to clipboard!");
                      }
                    }}
                    className="lc-action-btn"
                  >
                    <FiCopy size={13} />
                    <span>Copy Code</span>
                  </button>
                  <button
                    onClick={() => {
                      setCode(selectedSubmission.code);
                      setSelectedSubmission(null);
                      alert("Solution restored into code editor!");
                    }}
                    className="lc-action-btn"
                    style={{ background: "var(--lc-accent)", color: "#ffffff", borderColor: "var(--lc-accent)" }}
                  >
                    <FiRotateCcw size={13} />
                    <span>Load into Editor</span>
                  </button>
                </div>
              </div>

              <pre className="lc-submission-code-view">
                <code>{selectedSubmission.code}</code>
              </pre>

              {selectedSubmission.error && (
                <div style={{ marginTop: "1rem", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "6px", padding: "0.75rem", color: "#f87171", fontFamily: "monospace", fontSize: "0.85rem" }}>
                  <strong>Error:</strong> {selectedSubmission.error}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
