import { NextResponse } from "next/server";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { checkCompilerRateLimit, recordCompilerRun } from "@/lib/compilerWsRunner";

export const dynamic = "force-dynamic";

const TIMEOUT_MS = 20000; // 20 seconds timeout

function getClientIp(req) {
  const forwarded = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "127.0.0.1";
}

function cleanupDir(dirPath) {
  if (!dirPath) return;
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  } catch {}
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { language = "java", code = "", input = "" } = body;
    const clientIp = getClientIp(req);

    if (language.toLowerCase() === "javascript" || language.toLowerCase() === "js") {
      return NextResponse.json({
        success: true,
        clientOnly: true,
        message: "JavaScript runs locally on your browser with zero limits.",
      });
    }

    // Rate Limiting Check (30 seconds per IP)
    const { allowed, remainingSec } = checkCompilerRateLimit(clientIp);
    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many requests. Please wait ${remainingSec} seconds to run your program again.`,
          cooldownRemaining: remainingSec,
        },
        { status: 429 }
      );
    }

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json(
        { success: false, error: "No code provided to execute." },
        { status: 400 }
      );
    }

    // Record this run
    recordCompilerRun(clientIp);

    const runId = `learnix-http-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const tmpDir = path.join(os.tmpdir(), runId);
    fs.mkdirSync(tmpDir, { recursive: true });

    const startTime = Date.now();

    // ==========================================
    // JAVA
    // ==========================================
    if (language.toLowerCase() === "java") {
      let javaSource = code;
      if (!javaSource.includes("class Solution")) {
        javaSource = javaSource.replace(/public\s+class\s+[A-Za-z0-9_]+/g, "public class Solution");
      }
      const javaFile = path.join(tmpDir, "Solution.java");
      fs.writeFileSync(javaFile, javaSource, "utf-8");

      // Compile
      const compileResult = await new Promise((resolve) => {
        const javac = spawn("javac", ["Solution.java"], { cwd: tmpDir });
        let stderr = "";
        javac.stderr.on("data", (d) => (stderr += d.toString()));
        javac.on("close", (code) => resolve({ code, stderr }));
        javac.on("error", (err) => resolve({ code: 1, stderr: err.message }));
      });

      if (compileResult.code !== 0) {
        cleanupDir(tmpDir);
        return NextResponse.json({
          success: false,
          status: "Compilation Error",
          stderr: compileResult.stderr.replaceAll(tmpDir, ""),
          executionTimeMs: Date.now() - startTime,
        });
      }

      // Execute with 20s timeout
      const execResult = await new Promise((resolve) => {
        const proc = spawn(
          "java",
          ["-Xmx256m", "-Dfile.encoding=UTF-8", "-Djava.awt.headless=true", "Solution"],
          { cwd: tmpDir }
        );
        let stdout = "";
        let stderr = "";
        let timedOut = false;

        const timer = setTimeout(() => {
          timedOut = true;
          try { proc.kill("SIGKILL"); } catch {}
        }, TIMEOUT_MS);

        if (input && proc.stdin.writable) {
          try {
            proc.stdin.write(input);
            proc.stdin.end();
          } catch {}
        } else {
          try { proc.stdin.end(); } catch {}
        }

        proc.stdout.on("data", (d) => (stdout += d.toString()));
        proc.stderr.on("data", (d) => (stderr += d.toString()));

        proc.on("close", (code) => {
          clearTimeout(timer);
          resolve({ code: timedOut ? 124 : (code ?? 0), stdout, stderr, timedOut });
        });

        proc.on("error", (err) => {
          clearTimeout(timer);
          resolve({ code: 1, stdout, stderr: err.message, timedOut: false });
        });
      });

      cleanupDir(tmpDir);

      if (execResult.timedOut) {
        return NextResponse.json({
          success: false,
          status: "Time Limit Exceeded (20s)",
          error: "Program exceeded 20 seconds time limit and was terminated.",
          stdout: execResult.stdout,
          stderr: execResult.stderr,
          executionTimeMs: 20000,
        });
      }

      return NextResponse.json({
        success: true,
        status: execResult.code === 0 ? "Success" : "Runtime Error",
        exitCode: execResult.code,
        stdout: execResult.stdout,
        stderr: execResult.stderr,
        executionTimeMs: Date.now() - startTime,
      });
    }

    // ==========================================
    // PYTHON
    // ==========================================
    if (language.toLowerCase() === "python" || language.toLowerCase() === "python3") {
      const pyFile = path.join(tmpDir, "Solution.py");
      fs.writeFileSync(pyFile, code, "utf-8");

      const execResult = await new Promise((resolve) => {
        const proc = spawn("python3", ["-u", "Solution.py"], { cwd: tmpDir });
        let stdout = "";
        let stderr = "";
        let timedOut = false;

        const timer = setTimeout(() => {
          timedOut = true;
          try { proc.kill("SIGKILL"); } catch {}
        }, TIMEOUT_MS);

        if (input && proc.stdin.writable) {
          try {
            proc.stdin.write(input);
            proc.stdin.end();
          } catch {}
        } else {
          try { proc.stdin.end(); } catch {}
        }

        proc.stdout.on("data", (d) => (stdout += d.toString()));
        proc.stderr.on("data", (d) => (stderr += d.toString()));

        proc.on("close", (code) => {
          clearTimeout(timer);
          resolve({ code: timedOut ? 124 : (code ?? 0), stdout, stderr, timedOut });
        });

        proc.on("error", (err) => {
          clearTimeout(timer);
          resolve({ code: 1, stdout, stderr: err.message, timedOut: false });
        });
      });

      cleanupDir(tmpDir);

      if (execResult.timedOut) {
        return NextResponse.json({
          success: false,
          status: "Time Limit Exceeded (20s)",
          error: "Program exceeded 20 seconds time limit and was terminated.",
          stdout: execResult.stdout,
          stderr: execResult.stderr,
          executionTimeMs: 20000,
        });
      }

      return NextResponse.json({
        success: true,
        status: execResult.code === 0 ? "Success" : "Runtime Error",
        exitCode: execResult.code,
        stdout: execResult.stdout,
        stderr: execResult.stderr,
        executionTimeMs: Date.now() - startTime,
      });
    }

    cleanupDir(tmpDir);
    return NextResponse.json(
      { success: false, error: "Unsupported language: " + language },
      { status: 400 }
    );
  } catch (err) {
    console.error("[POST /api/compiler/execute error]:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error: " + err.message },
      { status: 500 }
    );
  }
}

