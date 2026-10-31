import { python } from "compile-run";
import { areOutputsEqual } from "./outputComparator.js";

/**
 * Clean Python errors to remove temporary system paths and present clear line numbers.
 */
function sanitizePythonError(stderr) {
  if (!stderr) return "Execution failed";
  return stderr
    .replace(/File\s+"[^"]+?",\s+line\s+(\d+)/gi, "Line $1")
    .replace(/\/.*?\/tmp\/python\/[^\s:]+/gi, "solution.py")
    .trim();
}

/**
 * Execute user submitted Python code against test cases using compile-run.
 *
 * @param {Object} options
 * @param {string} options.userCode - The user's Python code
 * @param {string} options.functionName - Target method or function name (e.g. "addTwoNumbers")
 * @param {Array} options.testCases - Array of test case objects
 * @param {number} [options.timeoutMs=8000] - Total execution timeout in ms
 * @param {boolean} [options.stopOnFailure=false] - Whether to stop on first failure
 */
export async function executePythonCode({
  userCode,
  functionName,
  testCases = [],
  timeoutMs = 8000,
  stopOnFailure = false,
}) {
  if (!userCode || typeof userCode !== "string") {
    return {
      status: "Compilation Error",
      error: "No Python code provided to execute",
      passedTestCases: 0,
      totalTestCases: testCases.length,
      results: [],
      totalRuntime: 0,
    };
  }

  // Pre-serialize test cases to JSON
  const testCasesJson = JSON.stringify(testCases);

  const fullProgram = `
import sys
import json
import time
import copy
from typing import List, Dict, Tuple, Set, Optional, Any, Union

${userCode}

def __serialize_output(val):
    if val is None:
        return 'null'
    if isinstance(val, bool):
        return 'true' if val else 'false'
    if isinstance(val, (int, float, str)):
        return str(val)
    if isinstance(val, (list, tuple, dict)):
        try:
            return json.dumps(val)
        except Exception:
            return str(val)
    return str(val)

__sol = None
if 'Solution' in globals() and isinstance(globals()['Solution'], type):
    try:
        __sol = Solution()
    except Exception:
        __sol = None

def __run_func(*args):
    target = '${functionName}'
    if __sol is not None and hasattr(__sol, target):
        return getattr(__sol, target)(*args)
    elif target in globals() and callable(globals()[target]):
        return globals()[target](*args)
    else:
        raise Exception(f"Function '{target}' not found. Please implement class Solution with method '{target}' or a top-level '{target}' function.")

__testcases = json.loads(${JSON.stringify(testCasesJson)})

for idx, tc in enumerate(__testcases):
    args = tc.get('input', [])
    if not isinstance(args, list):
        args = [args]
    call_args = [copy.deepcopy(a) for a in args]
    try:
        start_t = time.perf_counter()
        res = __run_func(*call_args)
        runtime_ms = max(1, round((time.perf_counter() - start_t) * 1000))
        # Support in-place array mutation if function returns None
        if res is None and len(call_args) > 0 and isinstance(call_args[0], (list, dict)):
            res = call_args[0]
        out_str = __serialize_output(res)
        print(f"__TC_RES__|{idx}|{runtime_ms}|{out_str}|__END__")
    except Exception as e:
        err_msg = str(e) if str(e) else type(e).__name__
        print(f"__TC_ERR__|{idx}|0|{err_msg}|__END__")
`;

  try {
    const runResult = await python.runSource(fullProgram, {
      timeout: timeoutMs,
    });

    // Check for syntax or indentation errors (Python reports this in stderr with non-zero exitCode and no stdout)
    if (runResult.exitCode !== 0 && runResult.stderr && !runResult.stdout) {
      const isSyntaxErr =
        runResult.stderr.includes("SyntaxError") ||
        runResult.stderr.includes("IndentationError") ||
        runResult.stderr.includes("TabError");

      return {
        status: isSyntaxErr ? "Compilation Error" : "Runtime Error",
        error: sanitizePythonError(runResult.stderr),
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
        allPassed = false;
        const formattedIn =
          tc.rawInput || (typeof tc.input === "string" ? tc.input : JSON.stringify(tc.input));
        results.push({
          testCaseId: tc.testCaseId || `tc_${i + 1}`,
          order: tc.order || i + 1,
          input: formattedIn,
          rawInput: formattedIn,
          expectedOutput:
            typeof tc.expectedOutput === "string"
              ? tc.expectedOutput
              : JSON.stringify(tc.expectedOutput),
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
        const formattedIn =
          tc.rawInput || (typeof tc.input === "string" ? tc.input : JSON.stringify(tc.input));
        results.push({
          testCaseId: tc.testCaseId || `tc_${i + 1}`,
          order: tc.order || i + 1,
          input: formattedIn,
          rawInput: formattedIn,
          expectedOutput:
            typeof tc.expectedOutput === "string"
              ? tc.expectedOutput
              : JSON.stringify(tc.expectedOutput),
          actualOutput: `Runtime Error: ${parsed.err}`,
          passed: false,
          runtimeMs: 0,
          isSample: tc.isSample !== false,
          explanation: tc.explanation || "",
          logs: [],
        });
        if (stopOnFailure) break;
        continue;
      }

      // Check output equality
      const isMatch = areOutputsEqual(parsed.out, tc.expectedOutput);
      if (!isMatch) allPassed = false;
      totalRuntime += parsed.runtime;

      const formattedIn =
        tc.rawInput || (typeof tc.input === "string" ? tc.input : JSON.stringify(tc.input));

      results.push({
        testCaseId: tc.testCaseId || `tc_${i + 1}`,
        order: tc.order || i + 1,
        input: formattedIn,
        rawInput: formattedIn,
        expectedOutput:
          typeof tc.expectedOutput === "string"
            ? tc.expectedOutput
            : JSON.stringify(tc.expectedOutput),
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
    if (generalError) {
      finalStatus = "Runtime Error";
    } else if (passedCount < testCases.length) {
      finalStatus = "Wrong Answer";
    }

    return {
      status: finalStatus,
      error: generalError,
      passedTestCases: passedCount,
      totalTestCases: testCases.length,
      results,
      totalRuntime: Math.round(totalRuntime),
    };
  } catch (err) {
    console.error("Python execution crash:", err);
    return {
      status: "Runtime Error",
      error: err.message || "Failed to execute Python program",
      passedTestCases: 0,
      totalTestCases: testCases.length,
      results: [],
      totalRuntime: 0,
    };
  }
}
