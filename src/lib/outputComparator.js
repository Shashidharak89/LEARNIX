/**
 * Output comparison utilities for Learnix Code.
 * Handles comparison between user output and expected output regardless of
 * quote differences ("hello" vs hello), array string formatting ([1, 2] vs [1,2]),
 * number vs string numbers, and case-insensitive booleans.
 */

/**
 * Strips outer matching quotes (" or ') from a string.
 * Example: '"hello"' -> 'hello', "'world'" -> 'world'
 */
export function stripQuotes(val) {
  if (typeof val !== "string") return val;
  let s = val.trim();
  while (
    (s.startsWith('"') && s.endsWith('"') && s.length >= 2) ||
    (s.startsWith("'") && s.endsWith("'") && s.length >= 2)
  ) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

/**
 * Robust comparison function that handles quotes, data types, and formatting.
 *
 * @param {any} actual - The actual output from user code (e.g. Java stdout or JS return value)
 * @param {any} expected - The expected testcase output
 * @returns {boolean}
 */
export function areOutputsEqual(actual, expected) {
  // 1. Handle null / undefined
  if (actual === undefined || actual === null) {
    return (
      expected === undefined ||
      expected === null ||
      String(expected).trim() === "null" ||
      String(expected).trim() === ""
    );
  }
  if (expected === undefined || expected === null) {
    return String(actual).trim() === "null" || String(actual).trim() === "";
  }

  // 2. Direct exact equality
  if (actual === expected) return true;

  // 3. Boolean check
  if (typeof expected === "boolean" || typeof actual === "boolean") {
    return String(actual).trim().toLowerCase() === String(expected).trim().toLowerCase();
  }

  // 4. Number check
  const numActual = Number(String(actual).trim());
  const numExpected = Number(String(expected).trim());
  if (
    !isNaN(numActual) &&
    !isNaN(numExpected) &&
    typeof actual !== "object" &&
    typeof expected !== "object"
  ) {
    const sA = String(actual).trim();
    const sE = String(expected).trim();
    if (sA !== "" && sE !== "") {
      return Math.abs(numActual - numExpected) < 1e-6;
    }
  }

  // 5. Array vs Array check
  const isActualArr = Array.isArray(actual);
  const isExpectedArr = Array.isArray(expected);

  if (isActualArr && isExpectedArr) {
    if (actual.length !== expected.length) return false;
    for (let i = 0; i < actual.length; i++) {
      if (!areOutputsEqual(actual[i], expected[i])) return false;
    }
    return true;
  }

  const actualStr = String(actual).trim();
  const expectedStr = String(expected).trim();

  // 6. Array vs array-like string representation (e.g. Java Arrays.toString "[1, 2, Fizz]")
  if (isExpectedArr && actualStr.startsWith("[") && actualStr.endsWith("]")) {
    const inner = actualStr.slice(1, -1).trim();
    const actualItems = inner.length === 0 ? [] : inner.split(",").map((s) => s.trim());
    if (actualItems.length !== expected.length) return false;
    for (let i = 0; i < actualItems.length; i++) {
      if (!areOutputsEqual(actualItems[i], expected[i])) return false;
    }
    return true;
  }

  if (isActualArr && expectedStr.startsWith("[") && expectedStr.endsWith("]")) {
    const inner = expectedStr.slice(1, -1).trim();
    const expectedItems = inner.length === 0 ? [] : inner.split(",").map((s) => s.trim());
    if (actual.length !== expectedItems.length) return false;
    for (let i = 0; i < actual.length; i++) {
      if (!areOutputsEqual(actual[i], expectedItems[i])) return false;
    }
    return true;
  }

  // 7. Both are array-like strings e.g. "[1, 2]" and "[1, 2]"
  if (
    actualStr.startsWith("[") &&
    actualStr.endsWith("]") &&
    expectedStr.startsWith("[") &&
    expectedStr.endsWith("]")
  ) {
    const aInner = actualStr.slice(1, -1).trim();
    const eInner = expectedStr.slice(1, -1).trim();
    const aItems = aInner.length === 0 ? [] : aInner.split(",").map((s) => s.trim());
    const eItems = eInner.length === 0 ? [] : eInner.split(",").map((s) => s.trim());
    if (aItems.length !== eItems.length) return false;
    for (let i = 0; i < aItems.length; i++) {
      if (!areOutputsEqual(aItems[i], eItems[i])) return false;
    }
    return true;
  }

  // 8. String comparison with outer quotes stripped
  const strippedActual = stripQuotes(actualStr);
  const strippedExpected = stripQuotes(expectedStr);

  if (strippedActual === strippedExpected) return true;

  // 9. Try JSON parsing
  try {
    const parsedA = JSON.parse(actualStr);
    const parsedE = JSON.parse(expectedStr);
    return areOutputsEqual(parsedA, parsedE);
  } catch {
    // continue
  }

  return strippedActual.replace(/\r\n/g, "\n") === strippedExpected.replace(/\r\n/g, "\n");
}
