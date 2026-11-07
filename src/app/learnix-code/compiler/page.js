"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  FiPlay,
  FiSquare,
  FiRotateCcw,
  FiTrash2,
  FiTerminal,
  FiCpu,
  FiClock,
  FiSend,
  FiCheckCircle,
  FiAlertTriangle,
  FiInfo,
  FiCopy,
  FiCheck,
  FiMaximize2,
  FiMinimize2,
} from "react-icons/fi";
import LearnixCodeNav from "../components/LearnixCodeNav";
import "./Compiler.css";

const THEME_KEY = "learnix-code-theme";

// Dynamic import of Monaco Editor with SSR disabled
const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="lco-editor-loading">
      <div className="lco-spinner" />
      <span>Loading Code Editor...</span>
    </div>
  ),
});

const BOILERPLATES = {
  java: `import java.util.*;
import java.io.*;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.println("Hello from Learnix Java Compiler!");
        // Write your code here
        
    }
}`,
  python: `import sys

# Solution class boilerplate
class Solution:
    def main(self):
        print("Hello from Learnix Python Compiler!")
        # Write your code here

if __name__ == "__main__":
    sol = Solution()
    sol.main()`,
  javascript: `// Solution class boilerplate (Runs locally in your browser - Unlimited runs)
class Solution {
    main() {
        console.log("Hello from Learnix JavaScript Compiler!");
        // Write your code here
    }
}

new Solution().main();`,
};

const LANGUAGE_CONFIG = {
  java: {
    name: "Java",
    version: "OpenJDK 21",
    monacoLang: "java",
    file: "Solution.java",
    execution: "server",
    badge: "Server Sandbox (30s Limit)",
  },
  python: {
    name: "Python 3",
    version: "Python 3.12",
    monacoLang: "python",
    file: "Solution.py",
    execution: "server",
    badge: "Server Sandbox (30s Limit)",
  },
  javascript: {
    name: "JavaScript",
    version: "V8 (Browser)",
    monacoLang: "javascript",
    file: "Solution.js",
    execution: "client",
    badge: "Client Engine (No Limits)",
  },
};

export default function OnlineCompilerPage() {
  const [language, setLanguage] = useState("java");
  const [code, setCode] = useState(BOILERPLATES.java);
  const [theme, setTheme] = useState("dark");

  // Output terminal entries: array of { type: "stdout" | "stderr" | "system" | "input", text: string }
  const [terminalOutput, setTerminalOutput] = useState([
    {
      type: "system",
      text: "[Learnix Online Compiler ready. Select a language and click 'Run Code'.]\n",
    },
  ]);

  // Real-time server status banner (e.g. Compiling..., Running..., etc.)
  const [serverStatus, setServerStatus] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [executionStats, setExecutionStats] = useState(null); // { timeMs, exitCode, status }

  // 30s Server Rate limit countdown (only applies to Java & Python)
  const [cooldown, setCooldown] = useState(0);

  // Tabs for console: "terminal" | "stdin"
  const [consoleTab, setConsoleTab] = useState("terminal");
  const [stdinInput, setStdinInput] = useState("");
  const [liveInputValue, setLiveInputValue] = useState("");

  const [copied, setCopied] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  const socketRef = useRef(null);
  const terminalBottomRef = useRef(null);
  const cooldownTimerRef = useRef(null);

  // Load theme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY);
    setTheme(saved === "light" ? "light" : "dark");
  }, []);

  function toggleTheme() {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem(THEME_KEY, next);
      return next;
    });
  }

  // Handle cooldown countdown
  useEffect(() => {
    if (cooldown > 0) {
      cooldownTimerRef.current = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(cooldownTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, [cooldown]);

  // Auto-scroll terminal when new output arrives
  useEffect(() => {
    if (terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [terminalOutput]);

  // WebSocket Connection Management
  const connectWebSocket = useCallback(async () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      return socketRef.current;
    }

    try {
      // 1. Fetch WebSocket server info
      const res = await fetch("/api/compiler/ws-info").catch(() => null);
      const data = res ? await res.json().catch(() => ({})) : {};
      const port = data.port || 5001;

      const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
      const protocol = isSecure ? "wss:" : "ws:";
      const hostname =
        typeof window !== "undefined" ? window.location.hostname || "localhost" : "localhost";
      const wsUrl = `${protocol}//${hostname}:${port}`;

      return new Promise((resolve) => {
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setWsConnected(true);
          resolve(ws);
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            handleIncomingWsMessage(msg);
          } catch {}
        };

        ws.onerror = (err) => {
          console.warn("[Compiler WS Warning]:", err);
          setWsConnected(false);
          resolve(null);
        };

        ws.onclose = () => {
          setWsConnected(false);
        };

        socketRef.current = ws;
      });
    } catch {
      setWsConnected(false);
      return null;
    }
  }, []);

  // Handle incoming WS messages from server
  function handleIncomingWsMessage(msg) {
    const { type } = msg;

    if (type === "compiler_status") {
      setServerStatus(msg.message || "");
      setTerminalOutput((prev) => [
        ...prev,
        { type: "system", text: `[Server]: ${msg.message}\n` },
      ]);
    } else if (type === "compiler_stdout") {
      setTerminalOutput((prev) => [...prev, { type: "stdout", text: msg.data }]);
    } else if (type === "compiler_stderr") {
      setTerminalOutput((prev) => [...prev, { type: "stderr", text: msg.data }]);
    } else if (type === "compiler_done") {
      setIsRunning(false);
      setExecutionStats({
        timeMs: msg.executionTimeMs || 0,
        exitCode: msg.exitCode,
        status: msg.status || (msg.exitCode === 0 ? "Success" : "Runtime Error"),
      });
      setServerStatus(
        `Process finished with exit code ${msg.exitCode} (${msg.executionTimeMs || 0}ms)`
      );
    } else if (type === "compiler_error") {
      setIsRunning(false);
      setTerminalOutput((prev) => [
        ...prev,
        { type: "stderr", text: `[Error]: ${msg.error}\n` },
      ]);
      if (msg.cooldownRemaining) {
        setCooldown(msg.cooldownRemaining);
      }
      setServerStatus(msg.error);
    }
  }

  // Change Language & Load Boilerplate
  function handleLanguageChange(newLang) {
    if (newLang === language) return;
    setLanguage(newLang);
    setCode(BOILERPLATES[newLang]);
    setExecutionStats(null);
    setServerStatus("");
    setTerminalOutput([
      {
        type: "system",
        text: `[Switched language to ${LANGUAGE_CONFIG[newLang].name}. Class 'Solution' boilerplate loaded.]\n`,
      },
    ]);
  }

  function handleResetCode() {
    if (confirm("Reset current editor code back to the default boilerplate?")) {
      setCode(BOILERPLATES[language]);
    }
  }

  function handleClearConsole() {
    setTerminalOutput([]);
    setServerStatus("");
    setExecutionStats(null);
  }

  function handleCopyCode() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  // Send interactive input during live execution
  function handleSendInteractiveInput(e) {
    if (e) e.preventDefault();
    if (!liveInputValue) return;

    const dataToSend = liveInputValue + "\n";
    // Echo in terminal as interactive input
    setTerminalOutput((prev) => [...prev, { type: "input", text: `> ${liveInputValue}\n` }]);
    setLiveInputValue("");

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "compiler_stdin",
          data: dataToSend,
        })
      );
    }
  }

  // Stop/Kill running program
  function handleStopProgram() {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "compiler_stop",
        })
      );
    }
    setIsRunning(false);
    setServerStatus("Terminating program...");
  }

  // ==========================================
  // RUN CODE CONTROLLER
  // ==========================================
  async function handleRunCode() {
    if (isRunning) return;

    // Check rate limit (only for server languages: Java & Python)
    if (language !== "javascript" && cooldown > 0) {
      alert(`Too many requests. Please wait ${cooldown} seconds to run your program again.`);
      return;
    }

    setIsRunning(true);
    setExecutionStats(null);
    setConsoleTab("terminal");

    // Clear previous output with start banner
    setTerminalOutput([
      {
        type: "system",
        text: `[Running ${LANGUAGE_CONFIG[language].name} program at ${new Date().toLocaleTimeString()}]...\n`,
      },
    ]);

    // ──────────────────────────────────────────
    // JAVASCRIPT: Client-Side Engine (NO LIMITS)
    // ──────────────────────────────────────────
    if (language === "javascript") {
      setServerStatus("Executing in local browser VM...");
      const startT = performance.now();

      try {
        const capturedLogs = [];
        const customConsole = {
          log: (...args) => {
            const str = args
              .map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)))
              .join(" ");
            capturedLogs.push({ type: "stdout", text: str + "\n" });
          },
          error: (...args) => {
            const str = args
              .map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)))
              .join(" ");
            capturedLogs.push({ type: "stderr", text: str + "\n" });
          },
          warn: (...args) => {
            const str = args
              .map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)))
              .join(" ");
            capturedLogs.push({ type: "stderr", text: `[Warn]: ${str}\n` });
          },
          info: (...args) => {
            const str = args
              .map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)))
              .join(" ");
            capturedLogs.push({ type: "stdout", text: str + "\n" });
          },
        };

        // Prepare simulated stdin lines for client JS
        const inputLines = (stdinInput || "").split("\n");
        let inputPointer = 0;
        const customReadline = () => {
          if (inputPointer < inputLines.length) {
            return inputLines[inputPointer++];
          }
          return null;
        };

        // Execute in safe function context
        const runFn = new Function("console", "readline", code);
        runFn(customConsole, customReadline);

        const duration = Math.round(performance.now() - startT);
        setTerminalOutput((prev) => [
          ...prev,
          ...capturedLogs,
          {
            type: "system",
            text: `\n[Program finished in ${duration}ms (Client-side Execution - Zero Rate Limit)]\n`,
          },
        ]);
        setExecutionStats({
          timeMs: duration,
          exitCode: 0,
          status: "Success",
        });
        setServerStatus(`Completed in ${duration}ms (Client execution)`);
      } catch (err) {
        const duration = Math.round(performance.now() - startT);
        setTerminalOutput((prev) => [
          ...prev,
          { type: "stderr", text: `Uncaught Error: ${err.message}\n` },
          {
            type: "system",
            text: `\n[Program exited with error in ${duration}ms]\n`,
          },
        ]);
        setExecutionStats({
          timeMs: duration,
          exitCode: 1,
          status: "Runtime Error",
        });
        setServerStatus(`Error: ${err.message}`);
      } finally {
        setIsRunning(false);
      }
      return;
    }

    // ──────────────────────────────────────────
    // JAVA & PYTHON: Server-Side Execution (WebSocket + HTTP Fallback)
    // ──────────────────────────────────────────
    // Set 30-second rate limit cooldown for server languages
    setCooldown(30);

    // Try WebSocket connection first
    const ws = await connectWebSocket();

    if (ws && ws.readyState === WebSocket.OPEN) {
      setServerStatus("Connected to server via WebSocket. Sending program payload...");
      ws.send(
        JSON.stringify({
          type: "compiler_run",
          language,
          code,
          initialInput: stdinInput,
        })
      );
    } else {
      // HTTP Streaming Fallback
      setServerStatus("Connecting to server via HTTP fallback...");
      try {
        const res = await fetch("/api/compiler/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language, code, input: stdinInput }),
        });

        const data = await res.json();

        if (res.status === 429) {
          setCooldown(data.cooldownRemaining || 30);
          setTerminalOutput((prev) => [
            ...prev,
            { type: "stderr", text: `[Rate Limit]: ${data.error}\n` },
          ]);
          setServerStatus(data.error);
          setIsRunning(false);
          return;
        }

        if (data.stdout) {
          setTerminalOutput((prev) => [...prev, { type: "stdout", text: data.stdout }]);
        }
        if (data.stderr) {
          setTerminalOutput((prev) => [...prev, { type: "stderr", text: data.stderr }]);
        }
        if (data.error && !data.stderr) {
          setTerminalOutput((prev) => [...prev, { type: "stderr", text: data.error + "\n" }]);
        }

        setExecutionStats({
          timeMs: data.executionTimeMs || 0,
          exitCode: data.exitCode ?? 0,
          status: data.status || "Completed",
        });
        setServerStatus(`Completed in ${data.executionTimeMs || 0}ms (HTTP)`);
      } catch (err) {
        setTerminalOutput((prev) => [
          ...prev,
          { type: "stderr", text: `Connection error: ${err.message}\n` },
        ]);
        setServerStatus("Failed to communicate with server");
      } finally {
        setIsRunning(false);
      }
    }
  }

  const isServerLang = language !== "javascript";
  const isCooldownActive = isServerLang && cooldown > 0;

  return (
    <div className={`lco-wrapper lco-theme-${theme}`}>
      <LearnixCodeNav theme={theme} onToggleTheme={toggleTheme} />

      <main className="lco-main">
        {/* Top Action Bar */}
        <div className="lco-action-bar">
          <div className="lco-bar-left">
            <h1 className="lco-page-title">
              Compile & Run <span className="lco-accent-text">Programs</span>
            </h1>

            {/* Language Selector Tabs */}
            <div className="lco-lang-tabs">
              {Object.keys(LANGUAGE_CONFIG).map((langKey) => {
                const cfg = LANGUAGE_CONFIG[langKey];
                const active = language === langKey;
                return (
                  <button
                    key={langKey}
                    type="button"
                    onClick={() => handleLanguageChange(langKey)}
                    className={`lco-lang-tab ${active ? "active" : ""}`}
                    disabled={isRunning}
                  >
                    <span className="lco-lang-name">{cfg.name}</span>
                    <span className="lco-lang-ver">{cfg.version}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lco-bar-right">
            {/* Execution Badge */}
            <span
              className={`lco-exec-badge ${
                isServerLang ? "lco-badge-server" : "lco-badge-client"
              }`}
            >
              <FiCpu size={12} />
              <span>{LANGUAGE_CONFIG[language].badge}</span>
            </span>

            {/* Cooldown pill for server languages */}
            {isCooldownActive && (
              <span className="lco-cooldown-pill" title="Rate limit: 1 run per 30 seconds">
                <FiClock size={12} />
                <span>Cooldown: {cooldown}s</span>
              </span>
            )}

            {/* Stop Button (shown while running) */}
            {isRunning && isServerLang && (
              <button
                type="button"
                onClick={handleStopProgram}
                className="lco-stop-btn"
                title="Terminate running process"
              >
                <FiSquare size={14} />
                <span>Stop</span>
              </button>
            )}

            {/* Run Button */}
            <button
              type="button"
              onClick={handleRunCode}
              disabled={isRunning || isCooldownActive}
              className={`lco-run-btn ${isRunning ? "running" : ""} ${
                isCooldownActive ? "disabled-cooldown" : ""
              }`}
            >
              {isRunning ? (
                <>
                  <div className="lco-spinner-small" />
                  <span>Running...</span>
                </>
              ) : isCooldownActive ? (
                <>
                  <FiClock size={16} />
                  <span>Wait {cooldown}s</span>
                </>
              ) : (
                <>
                  <FiPlay size={16} />
                  <span>Run Program</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Workspace Split (Editor & Terminal) */}
        <div className="lco-workspace">
          {/* Editor Column */}
          <section className="lco-editor-panel">
            <div className="lco-panel-header">
              <div className="lco-panel-title-group">
                <span className="lco-file-tab active">
                  <span>{LANGUAGE_CONFIG[language].file}</span>
                </span>
                <span className="lco-class-hint">
                  Class: <strong>Solution</strong>
                </span>
              </div>

              <div className="lco-panel-actions">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="lco-icon-btn"
                  title="Copy code"
                >
                  {copied ? <FiCheck size={14} color="#10b981" /> : <FiCopy size={14} />}
                </button>
                <button
                  type="button"
                  onClick={handleResetCode}
                  className="lco-icon-btn"
                  title="Reset code to default boilerplate"
                >
                  <FiRotateCcw size={14} />
                </button>
              </div>
            </div>

            <div className="lco-editor-container">
              <Editor
                height="100%"
                language={LANGUAGE_CONFIG[language].monacoLang}
                theme={theme === "dark" ? "vs-dark" : "light"}
                value={code}
                onChange={(val) => setCode(val || "")}
                options={{
                  fontSize: 14,
                  fontFamily: '"Fira Code", "SF Mono", Consolas, monospace',
                  minimap: { enabled: false },
                  automaticLayout: true,
                  tabSize: 4,
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  lineNumbers: "on",
                  cursorBlinking: "smooth",
                  formatOnPaste: true,
                  renderWhitespace: "none",
                }}
              />
            </div>
          </section>

          {/* Console / Terminal Column */}
          <section className="lco-console-panel">
            <div className="lco-panel-header">
              <div className="lco-console-tabs">
                <button
                  type="button"
                  onClick={() => setConsoleTab("terminal")}
                  className={`lco-console-tab ${consoleTab === "terminal" ? "active" : ""}`}
                >
                  <FiTerminal size={14} />
                  <span>Output Console</span>
                  {terminalOutput.length > 1 && (
                    <span className="lco-output-dot" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setConsoleTab("stdin")}
                  className={`lco-console-tab ${consoleTab === "stdin" ? "active" : ""}`}
                >
                  <FiCpu size={14} />
                  <span>Standard Input (stdin)</span>
                  {stdinInput && <span className="lco-output-dot" />}
                </button>
              </div>

              <div className="lco-panel-actions">
                {executionStats && (
                  <span className="lco-stat-pill">
                    <FiClock size={11} />
                    <span>{executionStats.timeMs}ms</span>
                    <span
                      className={`lco-status-tag ${
                        executionStats.exitCode === 0 ? "success" : "error"
                      }`}
                    >
                      {executionStats.status}
                    </span>
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleClearConsole}
                  className="lco-icon-btn"
                  title="Clear console output"
                >
                  <FiTrash2 size={14} />
                </button>
              </div>
            </div>

            {/* Server Status Live Banner */}
            {serverStatus && (
              <div
                className={`lco-server-banner ${
                  isRunning ? "pulse" : executionStats?.exitCode === 0 ? "done" : "warn"
                }`}
              >
                <span className="lco-banner-dot" />
                <span className="lco-banner-text">{serverStatus}</span>
              </div>
            )}

            {/* Console Content */}
            <div className="lco-console-body">
              {consoleTab === "terminal" ? (
                <div className="lco-terminal-window">
                  {terminalOutput.map((item, index) => {
                    let className = "lco-line-stdout";
                    if (item.type === "stderr") className = "lco-line-stderr";
                    if (item.type === "system") className = "lco-line-system";
                    if (item.type === "input") className = "lco-line-input";

                    return (
                      <span key={index} className={className}>
                        {item.text}
                      </span>
                    );
                  })}
                  <div ref={terminalBottomRef} />
                </div>
              ) : (
                <div className="lco-stdin-tab">
                  <div className="lco-stdin-header">
                    <span>Enter multiline standard input (passed to stdin on run):</span>
                  </div>
                  <textarea
                    value={stdinInput}
                    onChange={(e) => setStdinInput(e.target.value)}
                    placeholder="Enter input for Scanner(System.in) or Python input()..."
                    className="lco-stdin-textarea"
                  />
                </div>
              )}
            </div>

            {/* Interactive Stdin Bar (For live input while Java/Python is running) */}
            <form className="lco-interactive-bar" onSubmit={handleSendInteractiveInput}>
              <div className="lco-interactive-input-wrap">
                <span className="lco-prompt-arrow">&gt;</span>
                <input
                  type="text"
                  value={liveInputValue}
                  onChange={(e) => setLiveInputValue(e.target.value)}
                  placeholder={
                    isRunning
                      ? "Program is running. Type input and press Enter..."
                      : "Type input and press Enter..."
                  }
                  className="lco-interactive-input"
                />
              </div>
              <button
                type="submit"
                disabled={!liveInputValue.trim()}
                className="lco-send-input-btn"
                title="Send input to process stdin"
              >
                <FiSend size={13} />
                <span>Send</span>
              </button>
            </form>
          </section>
        </div>

        {/* Bottom Rules / Info Banner */}
        <footer className="lco-footer-info">
          <div className="lco-info-item">
            <FiInfo size={14} className="lco-info-icon" />
            <span>
              <strong>Boilerplate:</strong> The main class name is <code>Solution</code>. You can write custom helper methods, classes, and algorithms inside.
            </span>
          </div>
          <div className="lco-info-item">
            <FiClock size={14} className="lco-info-icon" />
            <span>
              <strong>Server Sandbox:</strong> Java & Python have a <strong>30s rate limit per IP</strong> and a <strong>20s execution timeout</strong>.
            </span>
          </div>
          <div className="lco-info-item">
            <FiCpu size={14} className="lco-info-icon" />
            <span>
              <strong>JavaScript:</strong> Runs 100% locally in your browser with <strong>zero limits</strong> and instant execution.
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}

