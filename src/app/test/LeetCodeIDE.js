"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
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
  FiSun,
  FiMoon,
  FiList,
  FiX,
  FiSearch,
  FiChevronRight,
  FiLoader,
} from "react-icons/fi";
import { FaJava, FaPython } from "react-icons/fa";
import { SiJavascript, SiCplusplus } from "react-icons/si";
import { recordCodingEntry, exitCodingEnvironment } from "@/utils/codingExitTracker";
import { areOutputsEqual } from "@/lib/outputComparator";
import MarkdownRenderer from "@/app/components/MarkdownRenderer";
import "./LeetCodeIDE.css";

const THEME_KEY = "learnix-code-theme";

function getLanguageReactIcon(langId, size = 15) {
  const id = (langId || "").toLowerCase();
  if (id.includes("java") && !id.includes("script")) {
    return <FaJava size={size} color="#ea580c" className="lc-react-icon-java" title="Java" />;
  }
  if (id.includes("javascript") || id === "js") {
    return <SiJavascript size={size} color="#f7df1e" className="lc-react-icon-js" title="JavaScript" />;
  }
  if (id.includes("python") || id === "py") {
    return <FaPython size={size} color="#38bdf8" className="lc-react-icon-python" title="Python" />;
  }
  return <SiCplusplus size={size} color="#60a5fa" className="lc-react-icon-cpp" title="C++" />;
}

function getLangDisplay(lang) {
  const id = (lang.languageId || "").toLowerCase();
  let icon = "💻";
  if (id.includes("java") && !id.includes("script")) icon = "☕";
  else if (id.includes("javascript") || id === "js") icon = "⚡";
  else if (id.includes("python") || id === "py") icon = "🐍";
  else if (id.includes("cpp") || id === "c++" || id === "c") icon = "⚙️";
  else if (id.includes("typescript") || id === "ts") icon = "🔷";
  return {
    icon,
    label: `${icon} ${lang.name || id} ${lang.version ? `(${lang.version})` : ""}`.trim(),
  };
}

function getJavaType(typeStr) {
  if (!typeStr) return "void";
  const t = String(typeStr).trim().toLowerCase();
  if (t === "number" || t === "int" || t === "integer") return "int";
  if (t === "long") return "long";
  if (t === "double" || t === "float") return "double";
  if (t === "string") return "String";
  if (t === "boolean" || t === "bool") return "boolean";
  if (t === "char" || t === "character") return "char";
  if (t === "number[]" || t === "int[]" || t === "integer[]" || t === "array<number>" || t === "array") return "int[]";
  if (t === "string[]" || t === "array<string>") return "String[]";
  if (t === "boolean[]" || t === "array<boolean>") return "boolean[]";
  if (t === "char[]") return "char[]";
  if (t === "void") return "void";
  return "Object";
}

function generateJavaBoilerplate(funcName, params = [], retType = "number") {
  const jRet = getJavaType(retType);
  const jRetVal =
    jRet === "int" || jRet === "long" || jRet === "short" || jRet === "byte"
      ? "return 0;"
      : jRet === "double" || jRet === "float"
      ? "return 0.0;"
      : jRet === "boolean"
      ? "return false;"
      : jRet === "String"
      ? 'return "";'
      : jRet === "void"
      ? ""
      : jRet.endsWith("[]")
      ? `return new ${jRet}{};`
      : "return null;";

  const jParams = (params || [])
    .map((p) => {
      const pType = getJavaType(p.type || "number");
      return `${pType} ${p.name || "arg"}`;
    })
    .join(", ");

  return `class Solution {\n    public ${jRet} ${funcName || "solution"}(${jParams}) {\n        // Write your code here\n        ${jRetVal}\n    }\n}`;
}

// Dynamic import of Monaco Editor with SSR disabled
const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--lc-text-secondary)", background: "var(--lc-bg-card)" }}>
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
  const [languages, setLanguages] = useState([
    { languageId: "java", name: "Java", monacoLang: "java", version: "OpenJDK 25" },
    { languageId: "javascript", name: "JavaScript", monacoLang: "javascript", version: "ES6+" },
  ]);
  const [selectedLanguage, setSelectedLanguage] = useState("java");
  const [cooldown, setCooldown] = useState(0); // 10s cooldown timer
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
  const [useCustomInput, setUseCustomInput] = useState(false);

  // Theme state ("dark" | "light")
  const [theme, setTheme] = useState("dark");

  // Check if caller might be admin (from localStorage) just to show Admin link
  const [isAdmin, setIsAdmin] = useState(false);

  // Sidebar Problem List Drawer State
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarProblems, setSidebarProblems] = useState([]);
  const [sidebarLoading, setSidebarLoading] = useState(false);
  const [sidebarLoadingMore, setSidebarLoadingMore] = useState(false);
  const [sidebarSearchInput, setSidebarSearchInput] = useState("");
  const [sidebarActiveSearch, setSidebarActiveSearch] = useState("");
  const [sidebarPage, setSidebarPage] = useState(1);
  const [sidebarHasMore, setSidebarHasMore] = useState(false);
  const [sidebarTotal, setSidebarTotal] = useState(0);

  const fetchSidebarProblems = useCallback(async (opts = {}) => {
    const { pageToFetch = 1, search = "", append = false } = opts;
    if (append) {
      setSidebarLoadingMore(true);
    } else {
      setSidebarLoading(true);
    }
    try {
      const params = new URLSearchParams({
        page: String(pageToFetch),
        size: "20",
        search: search.trim(),
        difficulty: "all",
      });
      const res = await fetch(`/api/coding/problems?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        const incoming = data.problems || [];
        if (append) {
          setSidebarProblems((prev) => {
            const existing = new Set(prev.map((p) => p.problemId));
            return [...prev, ...incoming.filter((p) => !existing.has(p.problemId))];
          });
        } else {
          setSidebarProblems(incoming);
        }
        setSidebarPage(data.page || pageToFetch);
        setSidebarHasMore(Boolean(data.hasMore));
        setSidebarTotal(data.total || 0);
      }
    } catch (err) {
      console.error("Failed to load sidebar problems:", err);
    } finally {
      setSidebarLoading(false);
      setSidebarLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (isSidebarOpen && sidebarProblems.length === 0) {
      fetchSidebarProblems({ pageToFetch: 1, search: "" });
    }
  }, [isSidebarOpen, sidebarProblems.length, fetchSidebarProblems]);

  useEffect(() => {
    if (!isSidebarOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSidebarOpen]);

  function handleSidebarSearchSubmit(e) {
    e.preventDefault();
    setSidebarActiveSearch(sidebarSearchInput);
    fetchSidebarProblems({ pageToFetch: 1, search: sidebarSearchInput, append: false });
  }

  function handleSidebarClearSearch() {
    setSidebarSearchInput("");
    setSidebarActiveSearch("");
    fetchSidebarProblems({ pageToFetch: 1, search: "", append: false });
  }

  function handleSelectProblemFromSidebar(problemItem) {
    const targetParam = String(problemItem.order || problemItem.slug || problemItem.problemId);
    setSelectedSlug(targetParam);
    if (typeof window !== "undefined") {
      if (window.location.pathname.startsWith("/learnix-code/problems")) {
        router.push(`${baseUrl}/${targetParam}`);
      } else {
        const newUrl = new URL(window.location);
        newUrl.searchParams.set("problem", targetParam);
        window.history.pushState({}, "", newUrl);
        loadProblem(targetParam);
      }
    }
    setSidebarOpen(false);
  }

  // Cooldown countdown effect (internal 5s timer)
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Fetch supported languages from DynamoDB API
  useEffect(() => {
    async function fetchLanguages() {
      try {
        const res = await fetch("/api/coding/languages");
        const data = await res.json();
        if (data.success && data.languages?.length > 0) {
          setLanguages(data.languages);
        }
      } catch (err) {
        console.error("Failed to load languages:", err);
      }
    }
    fetchLanguages();
  }, []);

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

    // Load saved theme preference
    const savedTheme = (typeof window !== "undefined" && localStorage.getItem(THEME_KEY)) || "";
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    }

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

  const getLanguageTemplate = useCallback((prob, lang) => {
    if (!prob) return "";
    const cacheKey = `learnix_code_${prob.problemId}_${lang}`;
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(cacheKey);
      if (saved) return saved;
      if (lang === "javascript") {
        const oldSaved = localStorage.getItem(`learnix_code_${prob.problemId}`);
        if (oldSaved) return oldSaved;
      }
    }
    if (prob.templates && prob.templates[lang]) {
      return prob.templates[lang];
    }
    if (lang === "java") {
      return (
        prob.javaBoilerplate ||
        generateJavaBoilerplate(prob.functionName, prob.parameters, prob.returnType)
      );
    }
    return (
      prob.boilerplateCode ||
      `function ${prob.functionName || "solution"}(${(prob.parameters || []).map((p) => p.name || "arg").join(", ")}) {\n  // Write your code here\n}`
    );
  }, []);

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

        // Load cached code or boilerplate template for currently selected language
        const templateCode = getLanguageTemplate(prob, selectedLanguage);
        setCode(templateCode);

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
  }, [fetchSubmissions, getLanguageTemplate, selectedLanguage]);

  function handleLanguageChange(newLang) {
    if (!problem) return;
    if (typeof window !== "undefined") {
      localStorage.setItem(`learnix_code_${problem.problemId}_${selectedLanguage}`, code);
    }
    setSelectedLanguage(newLang);
    const nextCode = getLanguageTemplate(problem, newLang);
    setCode(nextCode);
  }

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
    if (problem && typeof window !== "undefined") {
      localStorage.setItem(`learnix_code_${problem.problemId}_${selectedLanguage}`, newCode || "");
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

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(THEME_KEY, next);
    }
  }

  function handleResetCode() {
    if (!problem) return;
    if (typeof window !== "undefined" && window.confirm(`Reset ${selectedLanguage.toUpperCase()} code to default boilerplate template?`)) {
      let defaultCode = problem.templates?.[selectedLanguage];
      if (!defaultCode) {
        if (selectedLanguage === "java") {
          defaultCode =
            problem.javaBoilerplate ||
            generateJavaBoilerplate(problem.functionName, problem.parameters, problem.returnType);
        } else {
          defaultCode =
            problem.boilerplateCode ||
            `function ${problem.functionName || "solution"}(${(problem.parameters || []).map((p) => p.name || "arg").join(", ")}) {\n  // Write your code here\n}`;
        }
      }
      setCode(defaultCode);
      if (typeof window !== "undefined") {
        localStorage.setItem(`learnix_code_${problem.problemId}_${selectedLanguage}`, defaultCode);
      }
    }
  }

  // Client-side JavaScript evaluation for immediate, zero-latency run mode
  function executeJavaScriptInBrowser(userCode, functionName, testCases) {
    const getTime = () =>
      typeof window !== "undefined" && window.performance ? window.performance.now() : Date.now();

    const startTime = getTime();
    const capturedLogs = [];

    try {
      const wrappedCode = `
        "use strict";
        const console = {
          log: (...args) => capturedLogs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
          error: (...args) => capturedLogs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
          warn: (...args) => capturedLogs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
          info: (...args) => capturedLogs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '))
        };
        ${userCode}
        if (typeof ${functionName} !== 'function') {
          throw new Error('Function "${functionName}" is not defined in your code.');
        }
        return ${functionName};
      `;

      const userFn = new Function("capturedLogs", wrappedCode)(capturedLogs);

      const results = [];
      for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        const tcStart = getTime();
        let actualOutput;
        let error = null;
        let passed = false;

        try {
          const inputArgs = Array.isArray(tc.input) ? tc.input : [tc.input];
          const copiedArgs = JSON.parse(JSON.stringify(inputArgs));
          actualOutput = userFn(...copiedArgs);
          passed = areOutputsEqual(actualOutput, tc.expectedOutput);
        } catch (err) {
          error = err.message || String(err);
        }

        const tcEnd = getTime();
        const rawInputStr = Array.isArray(tc.input)
          ? tc.input.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(", ")
          : (typeof tc.input === "object" ? JSON.stringify(tc.input) : String(tc.input));

        results.push({
          testCaseIndex: i + 1,
          input: tc.input,
          rawInput: rawInputStr,
          expectedOutput: tc.expectedOutput,
          actualOutput: actualOutput !== undefined ? actualOutput : null,
          passed,
          runtime: Math.round((tcEnd - tcStart) * 100) / 100,
          logs: [...capturedLogs],
          error,
        });
      }

      const totalRuntime = Math.max(1, Math.round(getTime() - startTime));
      const passedTestCases = results.filter((r) => r.passed).length;
      const allPassed = passedTestCases === results.length;

      return {
        success: true,
        mode: "run",
        language: "javascript",
        status: allPassed ? "Accepted" : "Wrong Answer",
        totalTestCases: results.length,
        passedTestCases,
        totalRuntime,
        results,
        stdout: capturedLogs.join("\n"),
      };
    } catch (err) {
      return {
        success: false,
        mode: "run",
        language: "javascript",
        status: "Runtime Error",
        error: err.message || String(err),
        results: [],
        totalRuntime: 0,
        passedTestCases: 0,
        totalTestCases: testCases.length,
      };
    }
  }

  async function runCode(mode = "run") {
    if (!problem || executing) return;

    // 5s cooldown restriction (internal limit, spam prevention)
    if (cooldown > 0) {
      alert("You are submitting too frequently! Please wait a moment before trying again.");
      return;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

    // Require authentication for submit mode
    if (mode === "submit" && !token) {
      setShowLoginPrompt(true);
      return;
    }

    // Set 5s cooldown timer immediately
    setCooldown(5);
    setExecuting(true);
    setExecMode(mode);
    setActiveConsoleTab("testresult");

    // Auto-expand testcase/testresult panel if minimized
    if (consoleHeight <= 50) {
      setConsoleHeight(280);
    }
    if (isEditorMaximized) {
      setIsEditorMaximized(false);
    }

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

      // If JavaScript in "run" mode: run directly in browser
      if (selectedLanguage === "javascript" && mode === "run") {
        let casesToTest;
        if (customArgs !== undefined) {
          casesToTest = [{ input: customArgs, expectedOutput: null }];
        } else {
          casesToTest = problem.sampleCases || problem.testCases?.slice(0, 3) || [];
        }

        const clientResult = executeJavaScriptInBrowser(code, problem.functionName, casesToTest);
        setExecutionResult(clientResult);
        setSelectedResultIdx(0);
        setExecuting(false);
        return;
      }

      // For Java (Run or Submit) or JavaScript (Submit mode): execute on server
      const headers = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/coding/execute", {
        method: "POST",
        headers,
        body: JSON.stringify({
          problemId: problem.problemId,
          language: selectedLanguage,
          code,
          mode,
          customInput: customArgs,
        }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setCooldown(data.cooldownRemaining || 5);
        setExecutionResult({
          status: "Rate Limited",
          error: data.error || "You are submitting too frequently! Please wait a moment before trying again.",
          results: [],
          totalRuntime: 0,
          passedTestCases: 0,
          totalTestCases: 0,
        });
        setExecuting(false);
        return;
      }

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
          <h3 style={{ color: "var(--lc-text-primary)", margin: "0 0 0.5rem 0" }}>Log In to Track Submissions</h3>
          <p style={{ color: "var(--lc-text-secondary)", maxWidth: "420px", margin: "0 auto 1.25rem auto", fontSize: "0.9rem", lineHeight: 1.6 }}>
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
        <div style={{ padding: "2.5rem", textAlign: "center", color: "var(--lc-text-secondary)" }}>
          <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>⏳</div>
          <p>Loading your submission history from DynamoDB...</p>
        </div>
      );
    }

    if (submissions.length === 0) {
      return (
        <div style={{ padding: "2.5rem 1.5rem", textAlign: "center", color: "var(--lc-text-secondary)" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📝</div>
          <h3 style={{ color: "var(--lc-text-primary)", margin: "0 0 0.5rem 0" }}>No Submissions Yet</h3>
          <p style={{ maxWidth: "420px", margin: "0 auto", fontSize: "0.9rem" }}>
            Submit your solution above to evaluate against all 10 testcases and record your submission!
          </p>
        </div>
      );
    }

    return (
      <div className="lc-submissions-container">
        <div className="lc-submissions-list">
          <div className="lc-submissions-header-row">
            <span className="lc-sh-order">#</span>
            <span className="lc-sh-status">Status</span>
            <span className="lc-sh-lang">Language</span>
            <span className="lc-sh-runtime">Runtime</span>
            <span className="lc-sh-cases">Cases</span>
            <span className="lc-sh-actions">Actions</span>
          </div>
          {submissions.map((sub, idx) => {
            const isPassed = sub.status === "Accepted";
            const subLang = (sub.language || "javascript").toLowerCase();
            const orderNum = submissions.length - idx;
            const submittedDate = sub.submittedAt ? new Date(sub.submittedAt) : null;
            const dateStr = submittedDate
              ? submittedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              : "";

            return (
              <div
                key={sub.submissionId || idx}
                className="lc-submission-card"
                onClick={() => setSelectedSubmission(sub)}
                title="Click to view full solution code"
              >
                <div className="lc-sub-cell lc-sub-cell-order">
                  <span className="lc-sub-order-badge">{orderNum}</span>
                </div>

                <div className="lc-sub-cell lc-sub-cell-status">
                  <span
                    className={`lc-sub-status-title ${
                      isPassed
                        ? "accepted"
                        : sub.status === "Wrong Answer"
                        ? "wrong"
                        : "error"
                    }`}
                  >
                    {sub.status || "Submitted"}
                  </span>
                  {dateStr && <span className="lc-sub-date-label">{dateStr}</span>}
                </div>

                <div className="lc-sub-cell lc-sub-cell-lang">
                  <span className={`lc-sub-lang-pill ${subLang.includes("java") && !subLang.includes("script") ? "java" : "javascript"}`}>
                    {getLanguageReactIcon(subLang, 12)}
                    <span>{subLang.includes("java") && !subLang.includes("script") ? "Java" : "JavaScript"}</span>
                  </span>
                </div>

                <div className="lc-sub-cell lc-sub-cell-runtime">
                  <span className="lc-sub-runtime-val">
                    <FiClock size={12} className="lc-sub-runtime-icon" />
                    <span>{sub.totalRuntime != null ? `${sub.totalRuntime} ms` : "N/A"}</span>
                  </span>
                </div>

                <div className="lc-sub-cell lc-sub-cell-cases">
                  <span
                    className="lc-sub-cases-text"
                    style={{
                      color: isPassed ? "var(--lc-easy)" : sub.status === "Wrong Answer" ? "#f87171" : "#fbbf24",
                    }}
                  >
                    {sub.passedTestCases != null ? `${sub.passedTestCases}/${sub.totalTestCases || 10}` : "N/A"}
                  </span>
                </div>

                <div className="lc-sub-cell lc-sub-cell-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => {
                      if (sub.language && sub.language !== selectedLanguage) {
                        setSelectedLanguage(sub.language);
                      }
                      setCode(sub.code);
                      if (problem && typeof window !== "undefined") {
                        localStorage.setItem(
                          `learnix_code_${problem.problemId}_${sub.language || selectedLanguage}`,
                          sub.code
                        );
                      }
                      alert(`Restored ${sub.language ? sub.language.toUpperCase() : "solution"} into code editor!`);
                    }}
                    className="lc-sub-btn lc-sub-btn-load"
                    title="Load solution into code editor"
                  >
                    <FiRotateCcw size={13} />
                    <span className="lc-sub-btn-text">Load</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSubmission(sub)}
                    className="lc-sub-btn lc-sub-btn-view"
                    title="View solution code"
                  >
                    <FiCode size={13} />
                    <span className="lc-sub-btn-text">Code</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (loadingProblem && !problem) {
    return (
      <div className={`lc-workspace ${theme === "light" ? "lc-theme-light" : "lc-theme-dark"}`} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "var(--lc-text-secondary)" }}>
          <div style={{ marginBottom: "1.2rem" }}>
            <Image
              src="/learnix-code-logo.png"
              alt="Learnix Code"
              width={64}
              height={64}
              style={{ filter: "drop-shadow(0 0 16px rgba(245, 158, 11, 0.45))", animation: "pulse 2s infinite" }}
              priority
            />
          </div>
          <h2 style={{ color: "var(--lc-text-primary)", margin: "0 0 0.5rem 0" }}>Loading Learnix Coding Playground...</h2>
          <p>Initializing LeetCode interface and connecting to DynamoDB</p>
        </div>
      </div>
    );
  }

  const sampleCases = (problem?.sampleCases && problem.sampleCases.length > 0)
    ? problem.sampleCases
    : (problem?.testCases?.slice(0, 3) || []);

  return (
    <div className={`lc-workspace ${theme === "light" ? "lc-theme-light" : "lc-theme-dark"}`}>
      {/* ── Slide-Out Problem List Drawer ── */}
      <div
        className={`lc-drawer-overlay ${isSidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`lc-drawer ${isSidebarOpen ? "open" : ""}`} aria-label="Problems Drawer">
        {/* Header */}
        <div className="lc-drawer-header">
          <div className="lc-drawer-header-left">
            <span className="lc-drawer-title">Problem List</span>
            {sidebarTotal > 0 && (
              <span className="lc-drawer-count">{sidebarTotal} Questions</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lc-drawer-close-btn"
            title="Close problem list"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="lc-drawer-search-wrap">
          <form className="lc-drawer-search-form" onSubmit={handleSidebarSearchSubmit}>
            <FiSearch size={14} className="lc-drawer-search-icon" />
            <input
              type="text"
              value={sidebarSearchInput}
              onChange={(e) => setSidebarSearchInput(e.target.value)}
              placeholder="Search questions..."
              className="lc-drawer-search-input"
            />
            {sidebarSearchInput && (
              <button
                type="button"
                onClick={handleSidebarClearSearch}
                className="lc-drawer-search-clear"
                title="Clear"
              >
                <FiX size={13} />
              </button>
            )}
          </form>
        </div>

        {/* Problem List Items */}
        <div className="lc-drawer-body">
          {sidebarLoading ? (
            <div className="lc-drawer-loading">
              <FiLoader className="lc-spin" size={20} />
              <span>Loading questions...</span>
            </div>
          ) : sidebarProblems.length === 0 ? (
            <div className="lc-drawer-empty">
              <span>No questions found</span>
              {sidebarActiveSearch && (
                <button
                  type="button"
                  onClick={handleSidebarClearSearch}
                  className="lc-drawer-retry-btn"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="lc-drawer-items">
              {sidebarProblems.map((p, index) => {
                const pNum = p.order || index + 1;
                const isCurrent =
                  String(selectedSlug) === String(pNum) ||
                  (problem && (problem.problemId === p.problemId || String(problem.order) === String(pNum)));
                const diffClass =
                  p.difficulty === "Easy"
                    ? "easy"
                    : p.difficulty === "Medium"
                    ? "medium"
                    : "hard";

                return (
                  <button
                    key={p.problemId || index}
                    type="button"
                    onClick={() => handleSelectProblemFromSidebar(p)}
                    className={`lc-drawer-item ${isCurrent ? "active" : ""}`}
                  >
                    <div className="lc-drawer-item-left">
                      <span className="lc-drawer-item-status">
                        {isCurrent ? (
                          <FiCheck size={14} className="lc-status-check active" />
                        ) : (
                          <span className="lc-status-bullet" />
                        )}
                      </span>
                      <span className="lc-drawer-item-title">
                        {pNum}. {p.title}
                      </span>
                    </div>
                    <span className={`lc-drawer-item-diff ${diffClass}`}>
                      {p.difficulty}
                    </span>
                  </button>
                );
              })}

              {/* View More button */}
              {sidebarHasMore && (
                <div className="lc-drawer-view-more-wrap">
                  <button
                    type="button"
                    onClick={() =>
                      fetchSidebarProblems({
                        pageToFetch: sidebarPage + 1,
                        search: sidebarActiveSearch,
                        append: true,
                      })
                    }
                    disabled={sidebarLoadingMore}
                    className="lc-drawer-view-more-btn"
                  >
                    {sidebarLoadingMore ? (
                      <>
                        <FiLoader className="lc-spin" size={14} />
                        <span>Loading...</span>
                      </>
                    ) : (
                      <span>View More</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* ── Top Bar ── */}
      <nav className="lc-navbar">
        <div className="lc-nav-left">
          <Link href="/learnix-code" className="lc-logo" title="Back to Learnix Code Arena">
            <Image
              src="/learnix-code-logo.png"
              alt="Learnix Code Logo"
              width={28}
              height={28}
              className="lc-logo-img"
              priority
            />
            <span>Learnix <span style={{ color: "#f59e0b" }}>Code</span></span>
          </Link>

          <div className="lc-nav-divider" />

          {/* Problem List Sidebar Trigger */}
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lc-btn-problem-list"
            title="Open Problem List"
          >
            <FiList size={16} />
            <span>Problem List</span>
            <FiChevronRight size={14} className="lc-btn-pl-chevron" />
          </button>
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
            <span>
              {executing && execMode === "run"
                ? "Running..."
                : "Run"}
            </span>
          </button>

          <button
            onClick={() => runCode("submit")}
            disabled={executing}
            className="lc-btn-action lc-btn-submit"
            title="Submit code against all test cases (Requires Login)"
          >
            <FiUploadCloud size={15} />
            <span>
              {executing && execMode === "submit"
                ? "Evaluating..."
                : "Submit"}
            </span>
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

          {/* Theme toggle button */}
          <button
            onClick={toggleTheme}
            className="lc-btn-theme"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <FiSun size={15} /> : <FiMoon size={15} />}
          </button>

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

                  <span className="lc-tag-chip">
                    {problem.totalTestCasesCount || 10} Test Cases
                  </span>
                </div>

                {/* Problem Statement Content */}
                <div className="lc-markdown-body">
                  <div className="lc-description-wrapper" style={{ marginBottom: "1.5rem" }}>
                    <MarkdownRenderer content={problem.description} />
                  </div>

                  {/* ── 3 Example Testcases with Outputs in Description Section ── */}
                  {sampleCases && sampleCases.length > 0 && !problem.description?.includes("Example 1") && (
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
                      <p style={{ margin: 0, color: "var(--lc-text-secondary)" }}>{problem.inputFormat}</p>
                    </div>
                  )}

                  {problem.outputFormat && (
                    <div className="lc-section-box">
                      <h4>Output Format</h4>
                      <p style={{ margin: 0, color: "var(--lc-text-secondary)" }}>{problem.outputFormat}</p>
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
                  This coding sandbox allows you to write and execute code solutions directly in an interactive IDE.
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
              <div className="lc-lang-select-wrap">
                <span className="lc-lang-selected-icon">
                  {getLanguageReactIcon(selectedLanguage, 15)}
                </span>
                <select
                  value={selectedLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="lc-lang-select"
                  title="Switch programming language"
                >
                  {languages.map((lang) => (
                    <option key={lang.languageId} value={lang.languageId}>
                      {lang.name} {lang.version ? `(${lang.version})` : ""}
                    </option>
                  ))}
                </select>
                <FiChevronDown size={12} className="lc-lang-arrow-icon" />
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
                language={selectedLanguage === "java" ? "java" : "javascript"}
                theme={theme === "light" ? "vs" : "vs-dark"}
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
                            (Array.isArray(sampleCases[selectedCaseIdx].input)
                              ? sampleCases[selectedCaseIdx].input
                                  .map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v)))
                                  .join(", ")
                              : typeof sampleCases[selectedCaseIdx].input === "object"
                              ? JSON.stringify(sampleCases[selectedCaseIdx].input)
                              : String(sampleCases[selectedCaseIdx].input ?? "N/A"))}
                        </div>
                      </div>

                      <div className="lc-param-block">
                        <div className="lc-param-label">Expected Output</div>
                        <div className="lc-param-box">
                          {typeof sampleCases[selectedCaseIdx].expectedOutput === "object"
                            ? JSON.stringify(sampleCases[selectedCaseIdx].expectedOutput)
                            : String(sampleCases[selectedCaseIdx].expectedOutput ?? "N/A")}
                        </div>
                      </div>

                      {sampleCases[selectedCaseIdx].explanation && (
                        <div style={{ color: "var(--lc-text-muted)", fontSize: "0.85rem", marginTop: "0.5rem" }}>
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
                          className="lc-custom-input"
                        />
                      </div>
                      <p style={{ fontSize: "0.8rem", color: "var(--lc-text-muted)" }}>
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
                    <div style={{ color: "var(--lc-text-muted)", textAlign: "center", padding: "2rem" }}>
                      Run or Submit your code to see the test results here.
                    </div>
                  )}

                  {executing && (
                    <div style={{ textAlign: "center", padding: "2rem", color: "var(--lc-text-secondary)" }}>
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

                      {/* Compiler or Runtime Error Message if any */}
                      {(executionResult.compileError || executionResult.error) && (
                        <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "6px", padding: "0.75rem", color: "#f87171", fontFamily: "monospace", fontSize: "0.85rem", marginBottom: "1rem", whiteSpace: "pre-wrap" }}>
                          {executionResult.compileError || executionResult.error}
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
                              {/* Always display Input for the test case */}
                              <div className="lc-param-block">
                                <div className="lc-param-label">Input</div>
                                <div className="lc-param-box">
                                  {executionResult.results[selectedResultIdx].rawInput ||
                                    (executionResult.results[selectedResultIdx].input !== undefined
                                      ? (Array.isArray(executionResult.results[selectedResultIdx].input)
                                          ? executionResult.results[selectedResultIdx].input
                                              .map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v)))
                                              .join(", ")
                                          : typeof executionResult.results[selectedResultIdx].input === "object"
                                          ? JSON.stringify(executionResult.results[selectedResultIdx].input)
                                          : String(executionResult.results[selectedResultIdx].input))
                                      : (sampleCases[selectedResultIdx]?.rawInput ||
                                         (Array.isArray(sampleCases[selectedResultIdx]?.input)
                                           ? sampleCases[selectedResultIdx].input
                                               .map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v)))
                                               .join(", ")
                                           : typeof sampleCases[selectedResultIdx]?.input === "object"
                                           ? JSON.stringify(sampleCases[selectedResultIdx].input)
                                           : String(sampleCases[selectedResultIdx]?.input ?? "N/A"))))}
                                </div>
                              </div>

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
                                  {typeof executionResult.results[selectedResultIdx].actualOutput === "object"
                                    ? JSON.stringify(executionResult.results[selectedResultIdx].actualOutput)
                                    : String(executionResult.results[selectedResultIdx].actualOutput ?? "None")}
                                </div>
                              </div>

                              {executionResult.results[selectedResultIdx].expectedOutput !== undefined && (
                                <div className="lc-param-block">
                                  <div className="lc-param-label">Expected Output</div>
                                  <div className="lc-param-box">
                                    {typeof executionResult.results[selectedResultIdx].expectedOutput === "object"
                                      ? JSON.stringify(executionResult.results[selectedResultIdx].expectedOutput)
                                      : String(executionResult.results[selectedResultIdx].expectedOutput)}
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
                <h3 style={{ margin: 0, color: "var(--lc-text-primary)", fontSize: "1.1rem" }}>Login Required to Submit</h3>
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
              <p style={{ margin: "0 0 1rem 0", color: "var(--lc-text-primary)", lineHeight: 1.6 }}>
                You are currently testing in guest mode. You can freely run and verify your code using the <strong>Run</strong> button without logging in.
              </p>
              <p style={{ margin: "0 0 1.5rem 0", color: "var(--lc-text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>
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
                <span
                  className={`lc-sub-lang-pill ${
                    (selectedSubmission.language || "javascript") === "java" ? "java" : "javascript"
                  }`}
                >
                  {getLanguageReactIcon(selectedSubmission.language, 12)}
                  <span>{(selectedSubmission.language || "javascript") === "java" ? "Java" : "JavaScript"}</span>
                </span>
                <span style={{ color: "var(--lc-text-primary)", fontWeight: 600 }}>
                  Submission Details
                </span>
                <span style={{ color: "var(--lc-text-secondary)", fontSize: "0.85rem" }}>
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
                      if (selectedSubmission.language && selectedSubmission.language !== selectedLanguage) {
                        setSelectedLanguage(selectedSubmission.language);
                      }
                      setCode(selectedSubmission.code);
                      if (problem && typeof window !== "undefined") {
                        localStorage.setItem(
                          `learnix_code_${problem.problemId}_${selectedSubmission.language || selectedLanguage}`,
                          selectedSubmission.code
                        );
                      }
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

              <div className="lc-sub-code-editor-box">
                <Editor
                  height="360px"
                  language={(selectedSubmission.language || "javascript") === "java" ? "java" : "javascript"}
                  theme={theme === "light" ? "vs" : "vs-dark"}
                  value={selectedSubmission.code}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 13,
                    fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    wordWrap: "on",
                    padding: { top: 12, bottom: 12 },
                  }}
                />
              </div>

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
