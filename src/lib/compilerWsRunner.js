import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

// 30-second rate limit per IP
const RATE_LIMIT_MS = 30000;
const TIMEOUT_MS = 20000; // 20 seconds hard timeout

// In-memory rate limit map: ip -> timestamp
const compilerRateLimitMap = new Map();

// Active processes map: ws -> childProcess
const activeProcesses = new WeakMap();
const activeTempDirs = new WeakMap();

/**
 * Extract client IP from WebSocket request headers
 */
export function getClientIp(req) {
  if (!req) return "127.0.0.1";
  const forwarded = req.headers && (req.headers["x-forwarded-for"] || req.headers["x-real-ip"]);
  if (forwarded) {
    return String(forwarded).split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "127.0.0.1";
}

/**
 * Check if the given IP is currently rate-limited (30s rule)
 * Returns { allowed: boolean, remainingSec: number }
 */
export function checkCompilerRateLimit(clientIp) {
  const now = Date.now();
  const lastRun = compilerRateLimitMap.get(clientIp) || 0;
  const elapsed = now - lastRun;

  if (elapsed < RATE_LIMIT_MS) {
    const remainingSec = Math.ceil((RATE_LIMIT_MS - elapsed) / 1000);
    return { allowed: false, remainingSec };
  }

  return { allowed: true, remainingSec: 0 };
}

/**
 * Record a run for the given IP
 */
export function recordCompilerRun(clientIp) {
  compilerRateLimitMap.set(clientIp, Date.now());

  // Periodically clean up old IP entries (> 5 minutes)
  if (compilerRateLimitMap.size > 2000) {
    const now = Date.now();
    for (const [ip, ts] of compilerRateLimitMap.entries()) {
      if (now - ts > 300000) {
        compilerRateLimitMap.delete(ip);
      }
    }
  }
}

/**
 * Safely clean up a temporary directory
 */
function cleanupDir(dirPath) {
  if (!dirPath) return;
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  } catch (err) {
    console.error("[Compiler] Failed to cleanup dir:", dirPath, err.message);
  }
}

/**
 * Clean system paths from error messages
 */
function sanitizeCompilerError(stderr, tmpDir) {
  if (!stderr) return "";
  let cleaned = stderr;
  if (tmpDir) {
    cleaned = cleaned.replaceAll(tmpDir + path.sep, "").replaceAll(tmpDir, "");
  }
  return cleaned
    .replace(/\/tmp\/[^\s:]+/g, "Solution")
    .replace(/Line \d+:/, (m) => m)
    .trim();
}

/**
 * Handle incoming compiler WebSocket messages
 */
export async function handleCompilerMessage(ws, req, msg) {
  const { type } = msg;

  // 1. Interactive Stdin: Client sends input to the running program
  if (type === "compiler_stdin") {
    const proc = activeProcesses.get(ws);
    if (proc && !proc.killed && proc.stdin && proc.stdin.writable) {
      try {
        const inputData = typeof msg.data === "string" ? msg.data : "";
        proc.stdin.write(inputData);
      } catch (err) {
        console.error("[Compiler Stdin Error]:", err.message);
      }
    }
    return;
  }

  // 2. Stop/Kill: Client wants to manually terminate the running program
  if (type === "compiler_stop") {
    const proc = activeProcesses.get(ws);
    if (proc && !proc.killed) {
      try {
        proc.kill("SIGKILL");
      } catch {}
      try {
        ws.send(
          JSON.stringify({
            type: "compiler_status",
            status: "terminated",
            message: "Program terminated by user.",
          })
        );
        ws.send(
          JSON.stringify({
            type: "compiler_done",
            exitCode: 130,
            status: "Terminated by User",
          })
        );
      } catch {}
    }
    return;
  }

  // 3. Run: Compile and run program
  if (type === "compiler_run") {
    const { language = "java", code = "", initialInput = "" } = msg;
    const clientIp = getClientIp(req);

    // Javascript runs on client machine only, with NO limits!
    // If a request for JS somehow arrives at server, remind client:
    if (language.toLowerCase() === "javascript" || language.toLowerCase() === "js") {
      ws.send(
        JSON.stringify({
          type: "compiler_status",
          status: "client_execution",
          message: "JavaScript runs locally on your machine with zero limits.",
        })
      );
      return;
    }

    // Rate Limiting Check (30 seconds per IP for Java and Python)
    const { allowed, remainingSec } = checkCompilerRateLimit(clientIp);
    if (!allowed) {
      ws.send(
        JSON.stringify({
          type: "compiler_error",
          error: `Too many requests. Please wait ${remainingSec} seconds to run your program again.`,
          cooldownRemaining: remainingSec,
        })
      );
      return;
    }

    if (!code.trim()) {
      ws.send(
        JSON.stringify({
          type: "compiler_error",
          error: "No code provided to execute.",
        })
      );
      return;
    }

    // Record rate limit for this IP
    recordCompilerRun(clientIp);

    // Kill any existing process on this socket
    const existingProc = activeProcesses.get(ws);
    if (existingProc && !existingProc.killed) {
      try {
        existingProc.kill("SIGKILL");
      } catch {}
    }
    const existingDir = activeTempDirs.get(ws);
    if (existingDir) {
      cleanupDir(existingDir);
    }

    // Create unique temporary workspace directory
    const runId = `learnix-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const tmpDir = path.join(os.tmpdir(), runId);

    try {
      fs.mkdirSync(tmpDir, { recursive: true });
      activeTempDirs.set(ws, tmpDir);
    } catch (err) {
      ws.send(
        JSON.stringify({
          type: "compiler_error",
          error: "Failed to initialize server workspace: " + err.message,
        })
      );
      return;
    }

    const startTime = Date.now();
    let timeoutTimer = null;

    // Helper to cleanup and unbind
    const finishExecution = () => {
      if (timeoutTimer) clearTimeout(timeoutTimer);
      activeProcesses.delete(ws);
      activeTempDirs.delete(ws);
      cleanupDir(tmpDir);
    };

    // ==========================================
    // JAVA EXECUTION PIPELINE
    // ==========================================
    if (language.toLowerCase() === "java") {
      // 1. Prepare Solution.java
      let javaSource = code;
      // Ensure Solution class is present
      if (!javaSource.includes("class Solution")) {
        // If user defined public class with another name, normalize it
        javaSource = javaSource.replace(/public\s+class\s+[A-Za-z0-9_]+/g, "public class Solution");
      }

      const javaFilePath = path.join(tmpDir, "Solution.java");
      fs.writeFileSync(javaFilePath, javaSource, "utf-8");

      // Send status: compiling
      ws.send(
        JSON.stringify({
          type: "compiler_status",
          status: "compiling",
          message: "Server compiling Solution.java with javac...",
        })
      );

      // Spawn javac
      const javac = spawn("javac", ["Solution.java"], { cwd: tmpDir });
      let javacStderr = "";

      javac.stderr.on("data", (chunk) => {
        javacStderr += chunk.toString();
      });

      javac.on("close", (compileCode) => {
        if (compileCode !== 0) {
          const sanitized = sanitizeCompilerError(javacStderr, tmpDir);
          ws.send(
            JSON.stringify({
              type: "compiler_stderr",
              data: sanitized || "Compilation failed with unknown error.\n",
            })
          );
          ws.send(
            JSON.stringify({
              type: "compiler_done",
              exitCode: compileCode,
              status: "Compilation Error",
              executionTimeMs: Date.now() - startTime,
            })
          );
          finishExecution();
          return;
        }

        // Compilation succeeded! Now run Solution
        ws.send(
          JSON.stringify({
            type: "compiler_status",
            status: "running",
            message: "Compilation successful. Running Solution (waiting for output/input)...",
          })
        );

        // Spawn java with memory limits and headless mode
        const javaProc = spawn(
          "java",
          ["-Xmx256m", "-Dfile.encoding=UTF-8", "-Djava.awt.headless=true", "Solution"],
          { cwd: tmpDir }
        );
        activeProcesses.set(ws, javaProc);

        // 20 SECONDS HARD TIMEOUT
        timeoutTimer = setTimeout(() => {
          if (javaProc && !javaProc.killed) {
            try {
              javaProc.kill("SIGKILL");
            } catch {}
            ws.send(
              JSON.stringify({
                type: "compiler_status",
                status: "timeout",
                message: "Execution timed out: Program exceeded 20 seconds time limit and was terminated.",
              })
            );
            ws.send(
              JSON.stringify({
                type: "compiler_done",
                exitCode: 124,
                status: "Time Limit Exceeded (20s)",
                executionTimeMs: 20000,
              })
            );
            finishExecution();
          }
        }, TIMEOUT_MS);

        // If pre-filled input was provided upfront, write to stdin
        if (initialInput && javaProc.stdin.writable) {
          try {
            javaProc.stdin.write(initialInput);
          } catch {}
        }

        // Stream stdout in real-time
        javaProc.stdout.on("data", (chunk) => {
          try {
            ws.send(
              JSON.stringify({
                type: "compiler_stdout",
                data: chunk.toString(),
              })
            );
          } catch {}
        });

        // Stream stderr in real-time
        javaProc.stderr.on("data", (chunk) => {
          try {
            ws.send(
              JSON.stringify({
                type: "compiler_stderr",
                data: chunk.toString(),
              })
            );
          } catch {}
        });

        javaProc.on("close", (exitCode) => {
          const runDuration = Date.now() - startTime;
          try {
            ws.send(
              JSON.stringify({
                type: "compiler_status",
                status: exitCode === 0 ? "completed" : "failed",
                message: `Program completed with exit code ${exitCode} in ${runDuration}ms.`,
              })
            );
            ws.send(
              JSON.stringify({
                type: "compiler_done",
                exitCode: exitCode ?? 0,
                status: exitCode === 0 ? "Success" : "Runtime Error",
                executionTimeMs: runDuration,
              })
            );
          } catch {}
          finishExecution();
        });

        javaProc.on("error", (err) => {
          try {
            ws.send(
              JSON.stringify({
                type: "compiler_stderr",
                data: "Failed to execute Java process: " + err.message + "\n",
              })
            );
            ws.send(
              JSON.stringify({
                type: "compiler_done",
                exitCode: 1,
                status: "Execution Error",
                executionTimeMs: Date.now() - startTime,
              })
            );
          } catch {}
          finishExecution();
        });
      });

      javac.on("error", (err) => {
        ws.send(
          JSON.stringify({
            type: "compiler_stderr",
            data: "Failed to start Java compiler (javac): " + err.message + "\n",
          })
        );
        ws.send(
          JSON.stringify({
            type: "compiler_done",
            exitCode: 1,
            status: "Compiler Error",
            executionTimeMs: Date.now() - startTime,
          })
        );
        finishExecution();
      });

      return;
    }

    // ==========================================
    // PYTHON EXECUTION PIPELINE
    // ==========================================
    if (language.toLowerCase() === "python" || language.toLowerCase() === "python3") {
      const pyFilePath = path.join(tmpDir, "Solution.py");
      fs.writeFileSync(pyFilePath, code, "utf-8");

      ws.send(
        JSON.stringify({
          type: "compiler_status",
          status: "running",
          message: "Executing Solution.py with Python 3 (waiting for output/input)...",
        })
      );

      // Run python3 with unbuffered output (-u) so stdout streams immediately
      const pyProc = spawn("python3", ["-u", "Solution.py"], { cwd: tmpDir });
      activeProcesses.set(ws, pyProc);

      // 20 SECONDS HARD TIMEOUT
      timeoutTimer = setTimeout(() => {
        if (pyProc && !pyProc.killed) {
          try {
            pyProc.kill("SIGKILL");
          } catch {}
          ws.send(
            JSON.stringify({
              type: "compiler_status",
              status: "timeout",
              message: "Execution timed out: Program exceeded 20 seconds time limit and was terminated.",
            })
          );
          ws.send(
            JSON.stringify({
              type: "compiler_done",
              exitCode: 124,
              status: "Time Limit Exceeded (20s)",
              executionTimeMs: 20000,
            })
          );
          finishExecution();
        }
      }, TIMEOUT_MS);

      // If pre-filled input was provided, write to stdin
      if (initialInput && pyProc.stdin.writable) {
        try {
          pyProc.stdin.write(initialInput);
        } catch {}
      }

      pyProc.stdout.on("data", (chunk) => {
        try {
          ws.send(
            JSON.stringify({
              type: "compiler_stdout",
              data: chunk.toString(),
            })
          );
        } catch {}
      });

      pyProc.stderr.on("data", (chunk) => {
        try {
          ws.send(
            JSON.stringify({
              type: "compiler_stderr",
              data: chunk.toString(),
            })
          );
        } catch {}
      });

      pyProc.on("close", (exitCode) => {
        const runDuration = Date.now() - startTime;
        try {
          ws.send(
            JSON.stringify({
              type: "compiler_status",
              status: exitCode === 0 ? "completed" : "failed",
              message: `Program completed with exit code ${exitCode} in ${runDuration}ms.`,
            })
          );
          ws.send(
            JSON.stringify({
              type: "compiler_done",
              exitCode: exitCode ?? 0,
              status: exitCode === 0 ? "Success" : "Runtime Error",
              executionTimeMs: runDuration,
            })
          );
        } catch {}
        finishExecution();
      });

      pyProc.on("error", (err) => {
        try {
          ws.send(
            JSON.stringify({
              type: "compiler_stderr",
              data: "Failed to execute Python process: " + err.message + "\n",
            })
          );
          ws.send(
            JSON.stringify({
              type: "compiler_done",
              exitCode: 1,
              status: "Execution Error",
              executionTimeMs: Date.now() - startTime,
            })
          );
        } catch {}
        finishExecution();
      });

      return;
    }

    // Unsupported language
    ws.send(
      JSON.stringify({
        type: "compiler_error",
        error: `Unsupported language: ${language}. Supported languages are Java, Python, and JavaScript.`,
      })
    );
    finishExecution();
  }
}

/**
 * Handle socket disconnection
 */
export function handleCompilerSocketClose(ws) {
  const proc = activeProcesses.get(ws);
  if (proc && !proc.killed) {
    try {
      proc.kill("SIGKILL");
    } catch {}
  }
  const dir = activeTempDirs.get(ws);
  if (dir) {
    cleanupDir(dir);
  }
  activeProcesses.delete(ws);
  activeTempDirs.delete(ws);
}

