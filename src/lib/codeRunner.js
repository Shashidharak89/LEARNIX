import vm from "node:vm";
import { performance } from "node:perf_hooks";

/**
 * Execute user submitted JavaScript code against test cases in an isolated VM sandbox.
 * 
 * @param {Object} options
 * @param {string} options.userCode - The user's JavaScript code
 * @param {string} options.functionName - Target entry function name (e.g. "addTwoNumbers")
 * @param {Array} options.testCases - Array of test case objects
 * @param {number} [options.timeoutMs=2000] - Execution timeout in ms per test case
 * @param {boolean} [options.stopOnFailure=false] - Whether to stop running on first failure (used for submit mode)
 */
export function executeCode({
  userCode,
  functionName,
  testCases = [],
  timeoutMs = 2000,
  stopOnFailure = false,
}) {
  if (!userCode || typeof userCode !== "string") {
    return {
      status: "Compilation Error",
      error: "No code provided to execute",
      passedTestCases: 0,
      totalTestCases: testCases.length,
      results: [],
      totalRuntime: 0,
    };
  }

  const results = [];
  let allPassed = true;
  let totalRuntime = 0;
  let generalError = null;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const logs = [];

    const customConsole = {
      log: (...args) =>
        logs.push(
          args
            .map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a)))
            .join(" ")
        ),
      error: (...args) => logs.push("[error] " + args.join(" ")),
      warn: (...args) => logs.push("[warn] " + args.join(" ")),
      info: (...args) => logs.push("[info] " + args.join(" ")),
    };

    const sandbox = {
      console: customConsole,
      Math,
      Number,
      String,
      Array,
      Object,
      Boolean,
      Date,
      parseInt,
      parseFloat,
      isNaN,
      isFinite,
      JSON,
      Map,
      Set,
      BigInt,
      RegExp,
      Infinity,
      NaN,
      returnValue: undefined,
    };

    const context = vm.createContext(sandbox);

    try {
      const runnerCode = `
        ${userCode}
        if (typeof ${functionName} !== "function") {
          throw new Error("Function '${functionName}' is not defined. Please implement '${functionName}'.");
        }
        returnValue = ${functionName}(...__args__);
      `;

      let args = tc.input;
      if (!Array.isArray(args)) {
        args = [args];
      }
      sandbox.__args__ = args;

      const script = new vm.Script(runnerCode);
      const start = performance.now();
      script.runInContext(context, { timeout: timeoutMs });
      const elapsed = Math.round((performance.now() - start) * 100) / 100;
      totalRuntime += elapsed;

      const actualOutput = sandbox.returnValue;
      const isMatch =
        JSON.stringify(actualOutput) === JSON.stringify(tc.expectedOutput);

      if (!isMatch) {
        allPassed = false;
      }

      results.push({
        testCaseId: tc.testCaseId || `tc_${i + 1}`,
        order: tc.order || i + 1,
        isSample: tc.isSample ?? true,
        input: tc.input,
        rawInput: tc.rawInput || (Array.isArray(tc.input) ? tc.input.join(", ") : String(tc.input)),
        expectedOutput: tc.expectedOutput,
        actualOutput: actualOutput !== undefined ? actualOutput : null,
        passed: isMatch,
        runtimeMs: elapsed,
        logs,
      });

      if (!isMatch && stopOnFailure) {
        break;
      }
    } catch (err) {
      allPassed = false;
      const isTimeout =
        err.message?.includes("timed out") || err.code === "ERR_SCRIPT_EXECUTION_TIMEOUT";
      const errorMsg = isTimeout
        ? `Time Limit Exceeded: Script execution exceeded ${timeoutMs}ms limit.`
        : err.message || "Unknown execution error";

      generalError = errorMsg;

      results.push({
        testCaseId: tc.testCaseId || `tc_${i + 1}`,
        order: tc.order || i + 1,
        isSample: tc.isSample ?? true,
        input: tc.input,
        rawInput: tc.rawInput || (Array.isArray(tc.input) ? tc.input.join(", ") : String(tc.input)),
        expectedOutput: tc.expectedOutput,
        actualOutput: null,
        error: errorMsg,
        passed: false,
        runtimeMs: 0,
        logs,
      });

      if (stopOnFailure || isTimeout) {
        break;
      }
    }
  }

  let finalStatus = "Accepted";
  if (generalError?.includes("Time Limit Exceeded")) {
    finalStatus = "Time Limit Exceeded";
  } else if (generalError) {
    finalStatus = "Runtime Error";
  } else if (!allPassed) {
    finalStatus = "Wrong Answer";
  }

  return {
    status: finalStatus,
    error: generalError,
    totalRuntime: Math.round(totalRuntime * 100) / 100,
    passedTestCases: results.filter((r) => r.passed).length,
    totalTestCases: testCases.length,
    results,
  };
}
