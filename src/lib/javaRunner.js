import { java } from "compile-run";

/**
 * Format JavaScript value to Java literal expression.
 */
function toJavaLiteral(val) {
  if (val === null || val === undefined) return "null";
  if (typeof val === "boolean") return String(val);
  if (typeof val === "number") {
    if (Number.isInteger(val)) {
      if (val > 2147483647 || val < -2147483648) {
        return `${val}L`;
      }
      return String(val);
    }
    return `${val}d`;
  }
  if (typeof val === "string") {
    return JSON.stringify(val);
  }
  if (Array.isArray(val)) {
    if (val.length === 0) return "new int[]{}";
    if (typeof val[0] === "number") {
      if (val.some((v) => !Number.isInteger(v))) {
        return `new double[]{${val.join(", ")}}`;
      }
      return `new int[]{${val.join(", ")}}`;
    }
    if (typeof val[0] === "string") {
      return `new String[]{${val.map((s) => JSON.stringify(s)).join(", ")}}`;
    }
    if (typeof val[0] === "boolean") {
      return `new boolean[]{${val.join(", ")}}`;
    }
  }
  return JSON.stringify(val);
}

/**
 * Compare actual Java output with expected test case output.
 */
function areOutputsEqual(actualStr, expected) {
  if (actualStr === undefined || actualStr === null) return false;
  const cleanActual = String(actualStr).trim();

  if (expected === null || expected === undefined) {
    return cleanActual === "null" || cleanActual === "";
  }

  // Boolean comparison
  if (typeof expected === "boolean") {
    return cleanActual.toLowerCase() === String(expected).toLowerCase();
  }

  // Number comparison
  if (typeof expected === "number") {
    const num = Number(cleanActual);
    if (!isNaN(num)) {
      return Math.abs(num - expected) < 1e-6;
    }
    return cleanActual === String(expected);
  }

  // String comparison
  if (typeof expected === "string") {
    if (cleanActual === expected) return true;
    // Check if expected is stringified JSON
    try {
      const parsed = JSON.parse(expected);
      return areOutputsEqual(cleanActual, parsed);
    } catch {
      return cleanActual === expected;
    }
  }

  // Array comparison
  if (Array.isArray(expected)) {
    // Java Arrays.toString produces [1, 2, 3]
    try {
      const parsedActual = JSON.parse(cleanActual);
      return JSON.stringify(parsedActual) === JSON.stringify(expected);
    } catch {
      // Direct bracket normalization
      const normActual = cleanActual.replace(/\s+/g, "");
      const normExpected = JSON.stringify(expected).replace(/\s+/g, "");
      return normActual === normExpected;
    }
  }

  return cleanActual === String(expected);
}

/**
 * Clean compiler errors to remove system temp paths and adjust line numbers.
 */
function sanitizeCompilerError(stderr) {
  if (!stderr) return "Compilation failed";
  return stderr
    .replace(/\/.*?\/Main\.java:(\d+):/g, "Line $1:")
    .replace(/\[at.*?\]/g, "")
    .trim();
}

/**
 * Execute user submitted Java code against test cases using compile-run.
 * 
 * @param {Object} options
 * @param {string} options.userCode - The user's Java code
 * @param {string} options.functionName - Target method name (e.g. "addTwoNumbers")
 * @param {Array} options.testCases - Array of test case objects
 * @param {number} [options.timeoutMs=10000] - Total execution timeout in ms
 * @param {boolean} [options.stopOnFailure=false] - Whether to stop on first failure
 */
export async function executeJavaCode({
  userCode,
  functionName,
  testCases = [],
  timeoutMs = 12000,
  stopOnFailure = false,
}) {
  if (!userCode || typeof userCode !== "string") {
    return {
      status: "Compilation Error",
      error: "No Java code provided to execute",
      passedTestCases: 0,
      totalTestCases: testCases.length,
      results: [],
      totalRuntime: 0,
    };
  }

  // 1. Prepare user code
  let sanitizedUserCode = userCode
    // Replace public class Solution with class Solution so Main.java compiles as single unit
    .replace(/public\s+class\s+Solution/g, "class Solution")
    // If user has other public class, change to package-private
    .replace(/public\s+class\s+([A-Za-z0-9_]+)/g, "class $1");

  // If user only wrote methods without class, wrap in class Solution
  if (!sanitizedUserCode.includes("class ")) {
    sanitizedUserCode = `class Solution {\n${sanitizedUserCode}\n}`;
  }

  // 2. Build test cases runner in Main.java
  const tcCalls = testCases.map((tc, idx) => {
    let args = tc.input;
    if (typeof args === "string") {
      try {
        args = JSON.parse(args);
      } catch {
        args = [args];
      }
    }
    if (!Array.isArray(args)) {
      args = [args];
    }

    const javaArgs = args.map((arg) => toJavaLiteral(arg)).join(", ");

    return `
        try {
            long __start = System.nanoTime();
            Object __res = __sol.${functionName}(${javaArgs});
            long __runtimeMs = Math.max(1, (System.nanoTime() - __start) / 1000000);
            System.out.println("__TC_RES__|" + ${idx} + "|" + __runtimeMs + "|" + __formatOutput(__res) + "|__END__");
        } catch (Throwable __t) {
            String __errMsg = __t.getMessage() != null ? __t.getMessage() : __t.getClass().getSimpleName();
            System.out.println("__TC_ERR__|" + ${idx} + "|0|" + __errMsg + "|__END__");
        }
    `;
  });

  const fullProgram = `
import java.util.*;
import java.io.*;
import java.math.*;

${sanitizedUserCode}

public class Main {
    static String __formatOutput(Object obj) {
        if (obj == null) return "null";
        if (obj instanceof int[]) return Arrays.toString((int[]) obj);
        if (obj instanceof long[]) return Arrays.toString((long[]) obj);
        if (obj instanceof double[]) return Arrays.toString((double[]) obj);
        if (obj instanceof boolean[]) return Arrays.toString((boolean[]) obj);
        if (obj instanceof byte[]) return Arrays.toString((byte[]) obj);
        if (obj instanceof short[]) return Arrays.toString((short[]) obj);
        if (obj instanceof float[]) return Arrays.toString((float[]) obj);
        if (obj instanceof char[]) return String.valueOf((char[]) obj);
        if (obj instanceof Object[]) return Arrays.deepToString((Object[]) obj);
        return String.valueOf(obj);
    }

    public static void main(String[] args) {
        Solution __sol = new Solution();
        ${tcCalls.join("\n")}
    }
}
`;

  try {
    const runResult = await java.runSource(fullProgram, {
      timeout: timeoutMs,
    });

    // Check for compilation errors
    if (runResult.errorType === "compile-time" || (runResult.exitCode !== 0 && runResult.stderr && !runResult.stdout)) {
      return {
        status: "Compilation Error",
        error: sanitizeCompilerError(runResult.stderr),
        passedTestCases: 0,
        totalTestCases: testCases.length,
        results: [],
        totalRuntime: 0,
      };
    }

    // Check for timeout / SIGTERM
    if (runResult.exitCode === 143 || (!runResult.stdout && runResult.exitCode !== 0)) {
      return {
        status: "Time Limit Exceeded",
        error: `Execution timed out (> ${Math.round(timeoutMs / 1000)}s)`,
        passedTestCases: 0,
        totalTestCases: testCases.length,
        results: [],
        totalRuntime: timeoutMs,
      };
    }

    // Parse testcase outputs
    const stdout = runResult.stdout || "";
    const parsedOutputs = new Map();
    const lines = stdout.split("\n");

    for (const line of lines) {
      if (line.startsWith("__TC_RES__|")) {
        const parts = line.split("|");
        const idx = parseInt(parts[1], 10);
        const runtime = parseFloat(parts[2]) || 1;
        const out = parts.slice(3, parts.length - 1).join("|");
        parsedOutputs.set(idx, { type: "res", runtime, out });
      } else if (line.startsWith("__TC_ERR__|")) {
        const parts = line.split("|");
        const idx = parseInt(parts[1], 10);
        const err = parts.slice(3, parts.length - 1).join("|");
        parsedOutputs.set(idx, { type: "err", runtime: 0, err });
      }
    }

    const results = [];
    let allPassed = true;
    let totalRuntime = 0;
    let generalError = null;

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const parsed = parsedOutputs.get(i);

      if (!parsed) {
        // Did not reach this test case
        allPassed = false;
        results.push({
          testCaseId: tc.testCaseId || `tc_${i + 1}`,
          order: tc.order || i + 1,
          input: tc.rawInput || (typeof tc.input === "string" ? tc.input : JSON.stringify(tc.input)),
          expectedOutput: typeof tc.expectedOutput === "string" ? tc.expectedOutput : JSON.stringify(tc.expectedOutput),
          actualOutput: "Execution incomplete",
          passed: false,
          runtimeMs: 0,
          isSample: tc.isSample !== false,
          explanation: tc.explanation || "",
          logs: [],
        });
        if (stopOnFailure) break;
        continue;
      }

      if (parsed.type === "err") {
        allPassed = false;
        if (!generalError) generalError = parsed.err;
        results.push({
          testCaseId: tc.testCaseId || `tc_${i + 1}`,
          order: tc.order || i + 1,
          input: tc.rawInput || (typeof tc.input === "string" ? tc.input : JSON.stringify(tc.input)),
          expectedOutput: typeof tc.expectedOutput === "string" ? tc.expectedOutput : JSON.stringify(tc.expectedOutput),
          actualOutput: `Runtime Error: ${parsed.err}`,
          passed: false,
          runtimeMs: parsed.runtime,
          isSample: tc.isSample !== false,
          explanation: tc.explanation || "",
          logs: [`[Error] ${parsed.err}`],
        });
        if (stopOnFailure) break;
        continue;
      }

      totalRuntime += parsed.runtime;
      const isMatch = areOutputsEqual(parsed.out, tc.expectedOutput);
      if (!isMatch) {
        allPassed = false;
      }

      results.push({
        testCaseId: tc.testCaseId || `tc_${i + 1}`,
        order: tc.order || i + 1,
        input: tc.rawInput || (typeof tc.input === "string" ? tc.input : JSON.stringify(tc.input)),
        expectedOutput: typeof tc.expectedOutput === "string" ? tc.expectedOutput : JSON.stringify(tc.expectedOutput),
        actualOutput: parsed.out,
        passed: isMatch,
        runtimeMs: parsed.runtime,
        isSample: tc.isSample !== false,
        explanation: tc.explanation || "",
        logs: [],
      });

      if (!isMatch && stopOnFailure) {
        break;
      }
    }

    const passedCount = results.filter((r) => r.passed).length;
    let finalStatus = "Accepted";
    if (!allPassed) {
      if (generalError) {
        finalStatus = "Runtime Error";
      } else {
        finalStatus = "Wrong Answer";
      }
    }

    return {
      status: finalStatus,
      error: generalError,
      passedTestCases: passedCount,
      totalTestCases: testCases.length,
      results,
      totalRuntime: Math.round(totalRuntime * 100) / 100,
    };
  } catch (err) {
    console.error("Java execution internal error:", err);
    return {
      status: "Runtime Error",
      error: err.message || "Failed to execute Java code",
      passedTestCases: 0,
      totalTestCases: testCases.length,
      results: [],
      totalRuntime: 0,
    };
  }
}
