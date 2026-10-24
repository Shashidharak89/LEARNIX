"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FiCode,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiExternalLink,
  FiX,
  FiArrowLeft,
  FiRefreshCw,
  FiList,
  FiFileText,
  FiCopy,
  FiCheck,
  FiSliders,
  FiCheckCircle,
  FiAlertCircle,
  FiDownload,
  FiClipboard,
  FiTag,
  FiSearch,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import "./CodingManager.css";

// ─── Preformatted Sample JSON String with Topic IDs Reference & Comments ─────
const SAMPLE_PROBLEM_JSON_STRING = `/*
  =============================================================================
  LEARNIX CODING — TOPIC REFERENCE GUIDE
  -----------------------------------------------------------------------------
  Use these topic IDs inside "topicIds": [ "topic-id-1", ... ]:
  
  • "arrays"              -> Arrays
  • "hash-table"          -> Hash Table
  • "strings"             -> Strings
  • "math"                -> Math
  • "two-pointers"        -> Two Pointers
  • "dynamic-programming" -> Dynamic Programming
  • "binary-search"       -> Binary Search
  • "sorting"             -> Sorting
  • "recursion"           -> Recursion
  • "stack"               -> Stack
  • "queue"               -> Queue
  • "linked-list"         -> Linked List
  • "trees"               -> Trees
  • "binary-tree"         -> Binary Tree
  • "graphs"              -> Graphs
  • "sliding-window"      -> Sliding Window
  • "greedy"              -> Greedy
  • "heap"                -> Heap (Priority Queue)
  • "backtracking"        -> Backtracking
  • "bit-manipulation"    -> Bit Manipulation
  • "matrix"              -> Matrix
  • "basics"              -> Basics
  =============================================================================
*/
[
  {
    "title": "Add Two Numbers",
    "slug": "add-two-numbers",
    "difficulty": "Easy",
    "topicIds": [
      "math",     // this id belongs to topic: Math
      "basics"    // this id belongs to topic: Basics
    ],
    "description": "### Problem Statement\\n\\nGiven two integers \`a\` and \`b\`, return their sum.\\n\\n### Example 1:\\n**Input:** \`a = 2, b = 3\`\\n**Output:** \`5\`\\n**Explanation:** \`2 + 3 = 5\`\\n\\n### Example 2:\\n**Input:** \`a = -5, b = 10\`\\n**Output:** \`5\`\\n\\n### Example 3:\\n**Input:** \`a = 0, b = 0\`\\n**Output:** \`0\`",
    "inputFormat": "Two integers \`a\` and \`b\` passed as function arguments.",
    "outputFormat": "Return an integer representing the sum of \`a\` and \`b\`.",
    "constraints": [
      "-10^9 <= a <= 10^9",
      "-10^9 <= b <= 10^9"
    ],
    "functionName": "addTwoNumbers",
    "parameters": [
      { "name": "a", "type": "number" },
      { "name": "b", "type": "number" }
    ],
    "returnType": "number",
    "boilerplateCode": "/**\\n * @param {number} a\\n * @param {number} b\\n * @return {number}\\n */\\nfunction addTwoNumbers(a, b) {\\n    // Write your code here\\n}",
    "javaBoilerplate": "class Solution {\\n    public int addTwoNumbers(int a, int b) {\\n        // Write your code here\\n        return 0;\\n    }\\n}",
    "isActive": true,
    "testCases": [
      {
        "testCaseId": "tc_01",
        "order": 1,
        "input": [2, 3],
        "rawInput": "a = 2, b = 3",
        "expectedOutput": 5,
        "isSample": true,
        "explanation": "2 + 3 = 5"
      },
      {
        "testCaseId": "tc_02",
        "order": 2,
        "input": [-5, 10],
        "rawInput": "a = -5, b = 10",
        "expectedOutput": 5,
        "isSample": true,
        "explanation": "-5 + 10 = 5"
      },
      {
        "testCaseId": "tc_03",
        "order": 3,
        "input": [0, 0],
        "rawInput": "a = 0, b = 0",
        "expectedOutput": 0,
        "isSample": true,
        "explanation": "0 + 0 = 0"
      },
      {
        "testCaseId": "tc_04",
        "order": 4,
        "input": [100, 250],
        "rawInput": "a = 100, b = 250",
        "expectedOutput": 350,
        "isSample": false,
        "explanation": "100 + 250 = 350"
      }
    ]
  },
  {
    "title": "Multiply Two Numbers",
    "slug": "multiply-two-numbers",
    "difficulty": "Easy",
    "topicIds": [
      "math",     // this id belongs to topic: Math
      "basics"    // this id belongs to topic: Basics
    ],
    "description": "### Problem Statement\\n\\nGiven two integers \`a\` and \`b\`, return their product.\\n\\n### Example 1:\\n**Input:** \`a = 4, b = 5\`\\n**Output:** \`20\`\\n**Explanation:** \`4 * 5 = 20\`\\n\\n### Example 2:\\n**Input:** \`a = -3, b = 7\`\\n**Output:** \`-21\`\\n**Explanation:** \`-3 * 7 = -21\`",
    "inputFormat": "Two integers \`a\` and \`b\` passed as function arguments.",
    "outputFormat": "Return an integer representing the product of \`a\` and \`b\`.",
    "constraints": [
      "-10^4 <= a <= 10^4",
      "-10^4 <= b <= 10^4"
    ],
    "functionName": "multiplyTwoNumbers",
    "parameters": [
      { "name": "a", "type": "number" },
      { "name": "b", "type": "number" }
    ],
    "returnType": "number",
    "boilerplateCode": "/**\\n * @param {number} a\\n * @param {number} b\\n * @return {number}\\n */\\nfunction multiplyTwoNumbers(a, b) {\\n    // Write your code here\\n}",
    "javaBoilerplate": "class Solution {\\n    public int multiplyTwoNumbers(int a, int b) {\\n        // Write your code here\\n        return 0;\\n    }\\n}",
    "isActive": true,
    "testCases": [
      {
        "testCaseId": "tc_01",
        "order": 1,
        "input": [4, 5],
        "rawInput": "a = 4, b = 5",
        "expectedOutput": 20,
        "isSample": true,
        "explanation": "4 * 5 = 20"
      },
      {
        "testCaseId": "tc_02",
        "order": 2,
        "input": [-3, 7],
        "rawInput": "a = -3, b = 7",
        "expectedOutput": -21,
        "isSample": true,
        "explanation": "-3 * 7 = -21"
      },
      {
        "testCaseId": "tc_03",
        "order": 3,
        "input": [12, 12],
        "rawInput": "a = 12, b = 12",
        "expectedOutput": 144,
        "isSample": false,
        "explanation": "12 * 12 = 144"
      }
    ]
  }
]`;

// ─── Dummy Sample JSON Template (Bulk Array Format Object) ───────────────────
const SAMPLE_PROBLEM_JSON = [
  {
    title: "Add Two Numbers",
    slug: "add-two-numbers",
    difficulty: "Easy",
    topicIds: ["math", "basics"],
    tags: ["Math", "Basics"],
    description: "### Problem Statement\n\nGiven two integers `a` and `b`, return their sum.\n\n### Example 1:\n**Input:** `a = 2, b = 3`\n**Output:** `5`\n**Explanation:** `2 + 3 = 5`\n\n### Example 2:\n**Input:** `a = -5, b = 10`\n**Output:** `5`\n\n### Example 3:\n**Input:** `a = 0, b = 0`\n**Output:** `0`",
    inputFormat: "Two integers `a` and `b` passed as function arguments.",
    outputFormat: "Return an integer representing the sum of `a` and `b`.",
    constraints: [
      "-10^9 <= a <= 10^9",
      "-10^9 <= b <= 10^9"
    ],
    functionName: "addTwoNumbers",
    parameters: [
      { name: "a", type: "number" },
      { name: "b", type: "number" }
    ],
    returnType: "number",
    boilerplateCode: `/**
 * @param {number} a
 * @param {number} b
 * @return {number}
 */
function addTwoNumbers(a, b) {
    // Write your code here
}`,
    javaBoilerplate: `class Solution {
    public int addTwoNumbers(int a, int b) {
        // Write your code here
        return 0;
    }
}`,
    isActive: true,
    testCases: [
      {
        testCaseId: "tc_01",
        order: 1,
        input: [2, 3],
        rawInput: "a = 2, b = 3",
        expectedOutput: 5,
        isSample: true,
        explanation: "2 + 3 = 5"
      },
      {
        testCaseId: "tc_02",
        order: 2,
        input: [-5, 10],
        rawInput: "a = -5, b = 10",
        expectedOutput: 5,
        isSample: true,
        explanation: "-5 + 10 = 5"
      },
      {
        testCaseId: "tc_03",
        order: 3,
        input: [0, 0],
        rawInput: "a = 0, b = 0",
        expectedOutput: 0,
        isSample: true,
        explanation: "0 + 0 = 0"
      },
      {
        testCaseId: "tc_04",
        order: 4,
        input: [100, 250],
        rawInput: "a = 100, b = 250",
        expectedOutput: 350,
        isSample: false,
        explanation: "100 + 250 = 350"
      }
    ]
  },
  {
    title: "Multiply Two Numbers",
    slug: "multiply-two-numbers",
    difficulty: "Easy",
    topicIds: ["math", "basics"],
    tags: ["Math", "Basics"],
    description: "### Problem Statement\n\nGiven two integers `a` and `b`, return their product.\n\n### Example 1:\n**Input:** `a = 4, b = 5`\n**Output:** `20`\n**Explanation:** `4 * 5 = 20`\n\n### Example 2:\n**Input:** `a = -3, b = 7`\n**Output:** `-21`\n**Explanation:** `-3 * 7 = -21`",
    inputFormat: "Two integers `a` and `b` passed as function arguments.",
    outputFormat: "Return an integer representing the product of `a` and `b`.",
    constraints: [
      "-10^4 <= a <= 10^4",
      "-10^4 <= b <= 10^4"
    ],
    functionName: "multiplyTwoNumbers",
    parameters: [
      { name: "a", type: "number" },
      { name: "b", type: "number" }
    ],
    returnType: "number",
    boilerplateCode: `/**
 * @param {number} a
 * @param {number} b
 * @return {number}
 */
function multiplyTwoNumbers(a, b) {
    // Write your code here
}`,
    javaBoilerplate: `class Solution {
    public int multiplyTwoNumbers(int a, int b) {
        // Write your code here
        return 0;
    }
}`,
    isActive: true,
    testCases: [
      {
        testCaseId: "tc_01",
        order: 1,
        input: [4, 5],
        rawInput: "a = 4, b = 5",
        expectedOutput: 20,
        isSample: true,
        explanation: "4 * 5 = 20"
      },
      {
        testCaseId: "tc_02",
        order: 2,
        input: [-3, 7],
        rawInput: "a = -3, b = 7",
        expectedOutput: -21,
        isSample: true,
        explanation: "-3 * 7 = -21"
      },
      {
        testCaseId: "tc_03",
        order: 3,
        input: [12, 12],
        rawInput: "a = 12, b = 12",
        expectedOutput: 144,
        isSample: false,
        explanation: "12 * 12 = 144"
      }
    ]
  }
];

export default function CodingManager() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState("form"); // "form" | "json"

  // JSON Quick Import State
  const [jsonInput, setJsonInput] = useState("");
  const [jsonParsed, setJsonParsed] = useState(null);
  const [jsonError, setJsonError] = useState(null);
  const [jsonCopied, setJsonCopied] = useState(false);
  const [jsonSaving, setJsonSaving] = useState(false);

  // Topic Management State
  const [topics, setTopics] = useState([]);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");
  const [newTopicId, setNewTopicId] = useState("");
  const [newTopicDesc, setNewTopicDesc] = useState("");
  const [topicSaving, setTopicSaving] = useState(false);
  const [topicCopied, setTopicCopied] = useState("");

  // Toolbar & Filtering State
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");

  // Collapsible Form Accordions State
  const [formAccordions, setFormAccordions] = useState({
    formats: false,
    templates: false,
    testcases: true,
  });

  // Form Fields
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    difficulty: "Easy",
    tags: "Math, Basics",
    topicIds: ["math", "basics"],
    description: "",
    inputFormat: "",
    outputFormat: "",
    constraints: "-10^9 <= a <= 10^9\n-10^9 <= b <= 10^9",
    functionName: "solution",
    returnType: "number",
    parameters: [{ name: "a", type: "number" }, { name: "b", type: "number" }],
    jsTemplate: "",
    javaTemplate: "",
    order: 1,
    isActive: true,
    testCases: [
      {
        testCaseId: "tc_01",
        input: "[2, 3]",
        rawInput: "a = 2, b = 3",
        expectedOutput: "5",
        isSample: true,
        explanation: "2 + 3 = 5",
      },
      {
        testCaseId: "tc_02",
        input: "[-5, 10]",
        rawInput: "a = -5, b = 10",
        expectedOutput: "5",
        isSample: true,
        explanation: "-5 + 10 = 5",
      },
    ],
  });

  useEffect(() => {
    const storedToken = localStorage.getItem("token") || "";
    setToken(storedToken);
    fetchProblems(storedToken);
    fetchTopics(storedToken);
  }, []);

  async function fetchTopics(authToken) {
    try {
      const res = await fetch("/api/admin/coding/topics", {
        headers: { Authorization: `Bearer ${authToken || token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.topics)) {
        setTopics(data.topics);
      }
    } catch (err) {
      console.error("Failed to load topics:", err);
    }
  }

  async function handleCreateTopic(e) {
    if (e) e.preventDefault();
    if (!newTopicName.trim()) {
      alert("Please enter a Topic Name.");
      return;
    }
    setTopicSaving(true);
    try {
      const res = await fetch("/api/admin/coding/topics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newTopicName.trim(),
          topicId: newTopicId.trim() || undefined,
          description: newTopicDesc.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.topic) {
        setTopics((prev) => [...prev, data.topic]);
        setNewTopicName("");
        setNewTopicId("");
        setNewTopicDesc("");
        alert(data.message || `Topic "${data.topic.name}" created successfully!`);
      } else {
        alert(data.error || "Failed to create topic");
      }
    } catch (err) {
      alert("Error creating topic: " + err.message);
    } finally {
      setTopicSaving(false);
    }
  }

  function toggleTopicSelection(tId, tName) {
    setFormData((prev) => {
      const currentIds = Array.isArray(prev.topicIds) ? [...prev.topicIds] : [];
      const currentTags = (prev.tags || "").split(",").map((t) => t.trim()).filter(Boolean);

      let nextIds;
      let nextTags;

      if (currentIds.includes(tId)) {
        nextIds = currentIds.filter((id) => id !== tId);
        nextTags = currentTags.filter((t) => t.toLowerCase() !== tName.toLowerCase());
      } else {
        nextIds = [...currentIds, tId];
        if (!currentTags.some((t) => t.toLowerCase() === tName.toLowerCase())) {
          nextTags = [...currentTags, tName];
        } else {
          nextTags = currentTags;
        }
      }

      return {
        ...prev,
        topicIds: nextIds,
        tags: nextTags.join(", "),
      };
    });
  }

  async function fetchProblems(jwtToken) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/coding/problems", {
        headers: {
          Authorization: `Bearer ${jwtToken || token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setProblems(data.problems || []);
      } else {
        setError(data.error || "Failed to load problems");
      }
    } catch (err) {
      setError(err.message || "Network error loading problems");
    } finally {
      setLoading(false);
    }
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

  // Pure skeleton boilerplate generator - strictly comments and empty stub, NEVER actual working code
  function generateJsBoilerplate(funcName, params, retType) {
    const paramsDoc = (params || [])
      .map((p) => ` * @param {${p.type || "any"}} ${p.name || "arg"}`)
      .join("\n");
    const paramNames = (params || []).map((p) => p.name || "arg").join(", ");

    return `/**
${paramsDoc ? paramsDoc + "\n" : ""} * @return {${retType || "any"}}
 */
function ${funcName || "solution"}(${paramNames}) {
    // Write your code here
}`;
  }

  function openCreateModal(initialTab = "json") {
    setEditingId(null);
    setActiveModalTab(initialTab);
    const initialParams = [{ name: "a", type: "number" }, { name: "b", type: "number" }];
    const defaultTemplate = generateJsBoilerplate("solution", initialParams, "number");
    const defaultJavaTemplate = generateJavaBoilerplate("solution", initialParams, "number");

    const maxExistingOrder = problems.reduce((max, p) => {
      const o = Number(p.order);
      return !isNaN(o) && o > max ? o : max;
    }, 0);
    const nextOrder = Math.max(problems.length, maxExistingOrder) + 1;

    setFormData({
      title: "",
      slug: "",
      difficulty: "Easy",
      tags: "Math, Basics",
      topicIds: ["math", "basics"],
      description: "### Problem Statement\n\nGiven two integers a and b, return their sum.",
      inputFormat: "Two integers passed as function arguments.",
      outputFormat: "Return the calculated integer result.",
      constraints: "-10^9 <= a, b <= 10^9",
      functionName: "solution",
      returnType: "number",
      parameters: initialParams,
      jsTemplate: defaultTemplate,
      javaTemplate: defaultJavaTemplate,
      order: nextOrder,
      isActive: true,
      testCases: [
        {
          testCaseId: "tc_01",
          input: "[1, 2]",
          rawInput: "a = 1, b = 2",
          expectedOutput: "3",
          isSample: true,
          explanation: "1 + 2 = 3",
        },
      ],
    });

    if (initialTab === "json" && !jsonInput) {
      setJsonInput(SAMPLE_PROBLEM_JSON_STRING);
      setJsonParsed(SAMPLE_PROBLEM_JSON);
      setJsonError(null);
    }

    // Always reset accordion state on open
    setFormAccordions({ formats: false, templates: false, testcases: true });

    setIsModalOpen(true);
  }

  // Clean comments and trailing commas if user pastes JS-like object notation
  function tryCleanJson(str) {
    if (!str) return "";
    return str
      .replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, "$1")
      .replace(/,\s*([\]}])/g, "$1")
      .trim();
  }

  // JSON Quick Import Handlers
  function handleJsonTextChange(val) {
    setJsonInput(val);
    if (!val || !val.trim()) {
      setJsonParsed(null);
      setJsonError(null);
      return;
    }
    try {
      const parsed = JSON.parse(val);
      setJsonParsed(parsed);
      setJsonError(null);
    } catch (firstErr) {
      try {
        const cleaned = tryCleanJson(val);
        const parsed = JSON.parse(cleaned);
        setJsonParsed(parsed);
        setJsonError(null);
      } catch {
        setJsonParsed(null);
        setJsonError(firstErr.message);
      }
    }
  }

  async function handlePasteClipboard() {
    try {
      if (typeof navigator !== "undefined" && navigator?.clipboard?.readText) {
        const clipText = await navigator.clipboard.readText();
        if (clipText) {
          handleJsonTextChange(clipText);
        }
      } else {
        alert("Clipboard read not supported by browser. Please paste using Ctrl+V or Cmd+V.");
      }
    } catch {
      alert("Clipboard access was blocked. Please paste directly into the editor using Ctrl+V or Cmd+V.");
    }
  }

  function handleCopySample() {
    if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(SAMPLE_PROBLEM_JSON_STRING);
      setJsonCopied(true);
      setTimeout(() => setJsonCopied(false), 2200);
    } else {
      alert("Dummy sample JSON copied to clipboard!");
    }
  }

  function handleLoadSample() {
    setJsonInput(SAMPLE_PROBLEM_JSON_STRING);
    setJsonParsed(SAMPLE_PROBLEM_JSON);
    setJsonError(null);
  }

  function handlePrettifyJson() {
    if (!jsonInput.trim()) return;
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(parsed, null, 2));
      setJsonParsed(parsed);
      setJsonError(null);
    } catch {
      try {
        const cleaned = tryCleanJson(jsonInput);
        const parsed = JSON.parse(cleaned);
        setJsonInput(JSON.stringify(parsed, null, 2));
        setJsonParsed(parsed);
        setJsonError(null);
      } catch (err) {
        setJsonError("Cannot prettify invalid JSON: " + err.message);
      }
    }
  }

  function handleClearJson() {
    setJsonInput("");
    setJsonParsed(null);
    setJsonError(null);
  }

  function normalizeProblemPayload(item, assignedOrder, index = 0) {
    const title = item.title || item.name || item.questionTitle || item.problemName;
    if (!title || typeof title !== "string") {
      throw new Error(`Problem at index ${index + 1} is missing a required 'title' or 'name'.`);
    }

    const functionName = item.functionName || item.function || item.fn || item.methodName || "solution";

    // Normalize parameters
    let rawParams = item.parameters || item.params || [];
    if (!Array.isArray(rawParams)) rawParams = [];
    const parameters = rawParams.map((p, pIdx) => {
      if (typeof p === "string") return { name: p, type: "any" };
      return {
        name: p?.name || `arg${pIdx + 1}`,
        type: p?.type || "any",
      };
    });

    const returnType = item.returnType || item.return_type || item.outputType || "any";

    // Extract testcases flexibly
    const rawCases = item.testCases || item.test_cases || item.testcases || item.tests || [];
    if (!Array.isArray(rawCases) || rawCases.length === 0) {
      throw new Error(`Problem "${title}" requires a 'testCases' array with at least 1 test case.`);
    }

    // Determine boilerplate templates (strictly starter skeleton, never working code)
    let jsTemplate =
      item.boilerplateCode ||
      item.boilerplate ||
      item.starterCode ||
      item.template ||
      item.templates?.javascript;

    if (!jsTemplate) {
      jsTemplate = generateJsBoilerplate(functionName, parameters, returnType);
    }

    let javaTemplate =
      item.javaBoilerplate ||
      item.templates?.java;

    if (!javaTemplate) {
      javaTemplate = generateJavaBoilerplate(functionName, parameters, returnType);
    }

    const cleanSlug = (item.slug || title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    // Extract topicIds & tags
    let rawTopicIds = item.topicIds || item.topics || [];
    if (typeof rawTopicIds === "string") {
      rawTopicIds = rawTopicIds.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
    }
    if (!Array.isArray(rawTopicIds)) rawTopicIds = [];

    let rawTags = Array.isArray(item.tags)
      ? item.tags
      : typeof item.tags === "string"
      ? item.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    if (rawTags.length === 0 && rawTopicIds.length > 0) {
      rawTags = rawTopicIds.map((tid) => {
        const found = topics.find((t) => t.topicId === tid);
        return found ? found.name : tid.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      });
    }

    if (rawTopicIds.length === 0 && rawTags.length > 0) {
      rawTopicIds = rawTags.map((tag) => tag.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""));
    }

    return {
      title,
      slug: cleanSlug,
      difficulty: item.difficulty || "Easy",
      tags: rawTags.length > 0 ? rawTags : ["Basics"],
      topicIds: rawTopicIds,
      description: item.description || item.statement || "",
      inputFormat: item.inputFormat || "",
      outputFormat: item.outputFormat || "",
      constraints: Array.isArray(item.constraints)
        ? item.constraints
        : typeof item.constraints === "string"
        ? item.constraints.split("\n").map((c) => c.trim()).filter(Boolean)
        : [],
      functionName,
      returnType,
      parameters,
      templates: {
        javascript: jsTemplate,
        java: javaTemplate,
      },
      boilerplateCode: jsTemplate,
      javaBoilerplate: javaTemplate,
      order: assignedOrder,
      isActive: item.isActive !== false,
      testCases: rawCases.map((tc, tcIdx) => {
        let inp = tc.input !== undefined ? tc.input : (tc.args !== undefined ? tc.args : []);
        let exp = tc.expectedOutput !== undefined ? tc.expectedOutput : (tc.output !== undefined ? tc.output : (tc.expected !== undefined ? tc.expected : ""));

        const inputStr = typeof inp === "string" ? inp : JSON.stringify(inp);
        const outputStr = typeof exp === "string" ? exp : JSON.stringify(exp);

        return {
          testCaseId: tc.testCaseId || tc.id || `tc_${String(tcIdx + 1).padStart(2, "0")}`,
          order: tc.order || tcIdx + 1,
          input: inputStr,
          rawInput: tc.rawInput || inputStr,
          expectedOutput: outputStr,
          isSample: tc.isSample !== undefined ? Boolean(tc.isSample) : tcIdx < 3,
          explanation: tc.explanation || "",
        };
      }),
    };
  }

  async function handleCreateFromJson() {
    if (!jsonInput || !jsonInput.trim()) {
      alert("Please paste or load problem JSON data first.");
      return;
    }

    let parsed = jsonParsed;
    if (!parsed) {
      try {
        parsed = JSON.parse(jsonInput);
      } catch {
        try {
          parsed = JSON.parse(tryCleanJson(jsonInput));
        } catch (err) {
          alert("JSON Syntax Error: " + err.message + "\nPlease fix the JSON syntax or ensure all keys/strings use double quotes.");
          return;
        }
      }
    }

    // Support both single problem object AND array of problems
    const rawList = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.problems)
      ? parsed.problems
      : [parsed];

    if (rawList.length === 0) {
      alert("No problems found in the JSON data.");
      return;
    }

    // Determine current maximum problem order
    const maxExistingOrder = problems.reduce((max, p) => {
      const o = Number(p.order);
      return !isNaN(o) && o > max ? o : max;
    }, 0);
    // If total problem available is 11 then next will be 12 for sure
    const startOrder = Math.max(problems.length, maxExistingOrder) + 1;

    let payloads;
    try {
      payloads = rawList.map((item, idx) => {
        // If single problem and user explicitly customized a higher order, respect it; otherwise auto-assign
        const assignedOrder =
          rawList.length === 1 && Number(item.order) > 0
            ? Number(item.order)
            : startOrder + idx;
        return normalizeProblemPayload(item, assignedOrder, idx);
      });
    } catch (valErr) {
      alert("Validation Error: " + valErr.message);
      return;
    }

    setJsonSaving(true);
    try {
      const res = await fetch("/api/admin/coding/problems", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payloads),
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchProblems(token);
        const orderSummary = payloads.map((p) => `#${p.order}`).join(", ");
        alert(`Successfully created ${payloads.length} problem(s) (Assigned Problem ${orderSummary})!`);
      } else {
        alert(data.error || "Failed to create problem(s) from JSON");
      }
    } catch (err) {
      alert("Error saving problem(s) from JSON: " + err.message);
    } finally {
      setJsonSaving(false);
    }
  }

  async function openEditModal(problem) {
    setEditingId(problem.problemId);
    setActiveModalTab("form");
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/coding/problems/${problem.problemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.problem) {
        const p = data.problem;
        const tcs = (data.testCases || []).map((tc) => ({
          testCaseId: tc.testCaseId,
          input: typeof tc.input === "string" ? tc.input : JSON.stringify(tc.input),
          rawInput: tc.rawInput || "",
          expectedOutput: typeof tc.expectedOutput === "string" ? tc.expectedOutput : JSON.stringify(tc.expectedOutput),
          isSample: tc.isSample ?? true,
          explanation: tc.explanation || "",
        }));

        setFormData({
          title: p.title || "",
          slug: p.slug || p.problemId,
          difficulty: p.difficulty || "Easy",
          tags: Array.isArray(p.tags) ? p.tags.join(", ") : "",
          topicIds: Array.isArray(p.topicIds) ? p.topicIds : (Array.isArray(p.tags) ? p.tags.map((t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")) : []),
          description: p.description || "",
          inputFormat: p.inputFormat || "",
          outputFormat: p.outputFormat || "",
          constraints: Array.isArray(p.constraints) ? p.constraints.join("\n") : (p.constraints || ""),
          functionName: p.functionName || "solution",
          returnType: p.returnType || "any",
          parameters: p.parameters || [],
          jsTemplate: p.templates?.javascript || p.boilerplateCode || generateJsBoilerplate(p.functionName, p.parameters, p.returnType),
          javaTemplate: p.templates?.java || p.javaBoilerplate || generateJavaBoilerplate(p.functionName, p.parameters, p.returnType),
          order: p.order || 1,
          isActive: p.isActive !== false,
          testCases: tcs.length > 0 ? tcs : [{ testCaseId: "tc_01", input: "[]", rawInput: "", expectedOutput: "0", isSample: true, explanation: "" }],
        });
        // Reset accordions so edit modal always starts clean
        setFormAccordions({ formats: false, templates: false, testcases: true });
        setIsModalOpen(true);
      } else {
        alert(data.error || "Failed to fetch problem details");
      }
    } catch (err) {
      alert("Error loading problem details: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(problemId) {
    if (typeof window !== "undefined" && !window.confirm(`Are you sure you want to delete problem "${problemId}" and all its test cases?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/coding/problems/${problemId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        fetchProblems(token);
      } else {
        alert(data.error || "Failed to delete problem");
      }
    } catch (err) {
      alert("Error deleting problem: " + err.message);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        title: formData.title,
        slug: formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        difficulty: formData.difficulty,
        tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
        topicIds: Array.isArray(formData.topicIds) ? formData.topicIds : [],
        description: formData.description,
        inputFormat: formData.inputFormat,
        outputFormat: formData.outputFormat,
        constraints: formData.constraints.split("\n").map((c) => c.trim()).filter(Boolean),
        functionName: formData.functionName,
        returnType: formData.returnType,
        parameters: formData.parameters,
        templates: {
          javascript: formData.jsTemplate,
          java: formData.javaTemplate,
        },
        boilerplateCode: formData.jsTemplate,
        javaBoilerplate: formData.javaTemplate,
        order: Number(formData.order) || 1,
        isActive: formData.isActive,
        testCases: formData.testCases.map((tc, idx) => ({
          testCaseId: tc.testCaseId || `tc_${String(idx + 1).padStart(2, "0")}`,
          order: idx + 1,
          input: tc.input,
          rawInput: tc.rawInput,
          expectedOutput: tc.expectedOutput,
          isSample: Boolean(tc.isSample),
          explanation: tc.explanation || "",
        })),
      };

      const url = editingId
        ? `/api/admin/coding/problems/${editingId}`
        : `/api/admin/coding/problems`;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchProblems(token);
      } else {
        alert(data.error || "Failed to save problem");
      }
    } catch (err) {
      alert("Error saving: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  // Parameter helpers
  function addParameter() {
    setFormData((prev) => {
      const newParams = [...prev.parameters, { name: `arg${prev.parameters.length + 1}`, type: "number" }];
      const jsTmpl = generateJsBoilerplate(prev.functionName, newParams, prev.returnType, prev.title);
      const javaTmpl = generateJavaBoilerplate(prev.functionName, newParams, prev.returnType);
      return { ...prev, parameters: newParams, jsTemplate: jsTmpl, javaTemplate: javaTmpl };
    });
  }

  function removeParameter(index) {
    setFormData((prev) => {
      const newParams = prev.parameters.filter((_, i) => i !== index);
      const jsTmpl = generateJsBoilerplate(prev.functionName, newParams, prev.returnType, prev.title);
      const javaTmpl = generateJavaBoilerplate(prev.functionName, newParams, prev.returnType);
      return { ...prev, parameters: newParams, jsTemplate: jsTmpl, javaTemplate: javaTmpl };
    });
  }

  function updateParameter(index, field, value) {
    setFormData((prev) => {
      const newParams = [...prev.parameters];
      newParams[index] = { ...newParams[index], [field]: value };
      const jsTmpl = generateJsBoilerplate(prev.functionName, newParams, prev.returnType, prev.title);
      const javaTmpl = generateJavaBoilerplate(prev.functionName, newParams, prev.returnType);
      return { ...prev, parameters: newParams, jsTemplate: jsTmpl, javaTemplate: javaTmpl };
    });
  }

  // Test Case helpers
  function addTestCase() {
    setFormData((prev) => ({
      ...prev,
      testCases: [
        ...prev.testCases,
        {
          testCaseId: `tc_${String(prev.testCases.length + 1).padStart(2, "0")}`,
          input: "[0, 0]",
          rawInput: "",
          expectedOutput: "0",
          isSample: false,
          explanation: "",
        },
      ],
    }));
  }

  function removeTestCase(index) {
    setFormData((prev) => ({
      ...prev,
      testCases: prev.testCases.filter((_, i) => i !== index),
    }));
  }

  function updateTestCase(index, field, value) {
    setFormData((prev) => {
      const updated = [...prev.testCases];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, testCases: updated };
    });
  }

  const filteredProblems = problems.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.title?.toLowerCase().includes(q) ||
      p.slug?.toLowerCase().includes(q) ||
      String(p.order || "").includes(q) ||
      (p.topicIds && p.topicIds.some((t) => t.toLowerCase().includes(q))) ||
      (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)));

    const matchesDiff =
      difficultyFilter === "all" ||
      (p.difficulty && p.difficulty.toLowerCase() === difficultyFilter.toLowerCase());

    return matchesSearch && matchesDiff;
  });

  return (
    <div className="ac-container">
      {/* Header - Apple Style Clean White */}
      <header className="ac-header">
        <div className="ac-header-left">
          <div className="ac-header-brand">
            <Image
              src="/learnix-code-logo.png"
              alt="Learnix Code"
              width={34}
              height={34}
              className="ac-header-logo"
            />
            <div>
              <div className="ac-header-headline-row">
                <h1 className="ac-header-title">Coding Problems</h1>
                <span className="ac-header-stat-pill">
                  {problems.length} {problems.length === 1 ? "Problem" : "Problems"}
                </span>
                <span className="ac-header-topic-pill">
                  {topics.length} Topics
                </span>
              </div>
              <p className="ac-header-subtitle">
                Configure LeetCode-style challenges, test cases, and algorithmic topics
              </p>
            </div>
          </div>
        </div>

        <div className="ac-header-actions">
          <Link href="/admin" className="ac-btn ac-btn-outline" title="Return to Admin Overview">
            <FiArrowLeft size={15} /> <span>Admin</span>
          </Link>
          <button
            onClick={() => setIsTopicModalOpen(true)}
            className="ac-btn ac-btn-outline"
            title="Manage and create topics"
          >
            <FiTag size={15} /> <span>Topics ({topics.length})</span>
          </button>
          <Link href="/test" target="_blank" className="ac-btn ac-btn-outline" title="Open live testing playground">
            <FiExternalLink size={15} /> <span>Live Arena</span>
          </Link>
          <button
            onClick={() => openCreateModal("json")}
            className="ac-btn ac-btn-primary"
            title="Add problem via JSON or Form"
          >
            <FiPlus size={16} /> <span>Add Problem</span>
          </button>
        </div>
      </header>

      {/* Toolbar: Search & Difficulty Filters */}
      <div className="ac-toolbar">
        <div className="ac-search-box">
          <FiSearch className="ac-search-icon" size={16} />
          <input
            type="text"
            placeholder="Search problems by title, topic, or #order..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ac-search-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="ac-search-clear-btn"
              title="Clear search"
            >
              <FiX size={14} />
            </button>
          )}
        </div>

        <div className="ac-difficulty-tabs">
          {["all", "Easy", "Medium", "Hard"].map((diff) => (
            <button
              key={diff}
              type="button"
              onClick={() => setDifficultyFilter(diff)}
              className={`ac-diff-tab ${difficultyFilter === diff ? "active" : ""}`}
            >
              {diff === "all" ? "All" : diff}
            </button>
          ))}
        </div>
      </div>

      {/* Lightweight Apple Shimmer Skeleton Loader */}
      {loading && (
        <div className="ac-skeleton-list">
          {[1, 2, 3, 4, 5].map((idx) => (
            <div key={idx} className="ac-skeleton-row">
              <div className="ac-skeleton-order ac-shimmer" />
              <div className="ac-skeleton-body">
                <div className="ac-skeleton-title ac-shimmer" />
                <div className="ac-skeleton-tags">
                  <div className="ac-skeleton-pill ac-shimmer" style={{ width: "70px" }} />
                  <div className="ac-skeleton-pill ac-shimmer" style={{ width: "100px" }} />
                  <div className="ac-skeleton-pill ac-shimmer" style={{ width: "85px" }} />
                </div>
              </div>
              <div className="ac-skeleton-actions ac-shimmer" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="ac-error-banner">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredProblems.length === 0 && !error && (
        <div className="ac-empty-box">
          <FiList size={40} color="#94a3b8" />
          <h3>{searchQuery || difficultyFilter !== "all" ? "No Matching Problems Found" : "No Coding Problems Found"}</h3>
          <p>
            {searchQuery || difficultyFilter !== "all"
              ? "Try adjusting your search query or difficulty filter."
              : "Create your first problem using the button above to get started."}
          </p>
          {(searchQuery || difficultyFilter !== "all") ? (
            <button
              onClick={() => {
                setSearchQuery("");
                setDifficultyFilter("all");
              }}
              className="ac-btn ac-btn-outline"
            >
              Clear Filters
            </button>
          ) : (
            <button onClick={() => openCreateModal("json")} className="ac-btn ac-btn-primary">
              <FiPlus /> Add Problem
            </button>
          )}
        </div>
      )}

      {/* Problem Cards - One Problem Per Row */}
      {!loading && filteredProblems.length > 0 && (
        <div className="ac-list-rows">
          {filteredProblems.map((p, index) => {
            const displayOrder = p.order || index + 1;
            return (
              <div key={p.problemId} className="ac-row-card">
                <div className="ac-row-left">
                  <div className="ac-row-order" title={`Problem #${displayOrder}`}>
                    #{displayOrder}
                  </div>

                  <div className="ac-row-content">
                    <div className="ac-row-title-row">
                      <h3 className="ac-row-title">{p.title}</h3>
                      <span
                        className={`ac-badge ${
                          p.difficulty === "Easy"
                            ? "ac-badge-easy"
                            : p.difficulty === "Medium"
                            ? "ac-badge-medium"
                            : "ac-badge-hard"
                        }`}
                      >
                        {p.difficulty}
                      </span>
                    </div>

                    <div className="ac-row-topics-row">
                      {p.topicIds && p.topicIds.length > 0 ? (
                        p.topicIds.map((tid, idx) => {
                          const found = topics.find((t) => t.topicId === tid);
                          return (
                            <span key={idx} className="ac-tag" title={`Topic ID: ${tid}`}>
                              <FiTag style={{ fontSize: "0.68rem", marginRight: "3px" }} />
                              {found ? found.name : tid}
                            </span>
                          );
                        })
                      ) : (
                        (p.tags || []).map((t, idx) => (
                          <span key={idx} className="ac-tag">
                            {t}
                          </span>
                        ))
                      )}
                      <span className="ac-row-tc-count">
                        {p.testCasesCount || (p.testCases ? p.testCases.length : 0)} testcases
                      </span>
                    </div>
                  </div>
                </div>

                <div className="ac-row-actions">
                  <Link
                    href={`/test?problem=${p.slug || p.problemId}`}
                    target="_blank"
                    className="ac-btn-icon ac-btn-icon-live"
                    title="Test problem in sandbox"
                  >
                    <FiExternalLink size={15} />
                    <span>Live</span>
                  </Link>
                  <button
                    onClick={() => openEditModal(p)}
                    className="ac-btn-icon ac-btn-icon-edit"
                    title="Edit problem configuration"
                  >
                    <FiEdit size={15} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(p.problemId)}
                    className="ac-btn-icon ac-btn-icon-delete"
                    title="Delete problem"
                  >
                    <FiTrash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="ac-modal-overlay">
          <div className="ac-modal">
            <div className="ac-modal-header">
              <h2>{editingId ? `Edit Question: ${formData.title}` : activeModalTab === "json" ? "Fast Question Creator via JSON" : "Create New Coding Question"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="ac-close-btn">
                <FiX />
              </button>
            </div>

            {!editingId && (
              <div className="ac-modal-tabs">
                <button
                  type="button"
                  className={`ac-modal-tab ${activeModalTab === "form" ? "active" : ""}`}
                  onClick={() => setActiveModalTab("form")}
                >
                  <FiSliders /> Form Builder
                </button>
                <button
                  type="button"
                  className={`ac-modal-tab ${activeModalTab === "json" ? "active" : ""}`}
                  onClick={() => setActiveModalTab("json")}
                >
                  <FiFileText /> JSON Data Insert
                </button>
              </div>
            )}

            {activeModalTab === "json" && !editingId ? (
              <div className="ac-modal-content-wrapper">
                <div className="ac-json-wrapper">
                  {/* Information Banner with Dummy Sample Actions */}
                  <div className="ac-json-banner">
                    <div className="ac-json-banner-text">
                      <h4>
                        <FiCode /> Quick Problem Creation via JSON
                      </h4>
                      <p>
                        Paste problem specifications in JSON format. Note: Boilerplate must be starter skeleton code (with JSDoc and <code>{"// Write your code here"}</code>), not actual working solution code.
                      </p>
                    </div>
                    <div className="ac-json-banner-actions">
                      <button
                        type="button"
                        onClick={handleCopySample}
                        className={`ac-json-tool-btn ${jsonCopied ? "ac-json-tool-btn-copied" : "ac-json-tool-btn-primary"}`}
                        title="Copy standard dummy sample format to clipboard"
                      >
                        {jsonCopied ? <FiCheck /> : <FiCopy />}
                        <span>{jsonCopied ? "Copied Sample JSON!" : "Copy Sample JSON"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleLoadSample}
                        className="ac-json-tool-btn"
                        title="Load sample template into the editor"
                      >
                        <FiDownload />
                        <span>Load Sample into Editor</span>
                      </button>
                    </div>
                  </div>

                  {/* Editor Toolbar */}
                  <div className="ac-json-toolbar">
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <span className="ac-json-toolbar-title">
                        <FiFileText /> Problem JSON Specification
                      </span>
                      {jsonInput && (
                        <span className="ac-json-stats-badge">
                          {jsonInput.split("\n").length} lines · {jsonInput.length.toLocaleString()} chars
                        </span>
                      )}
                    </div>
                    <div className="ac-json-actions-group">
                      <button
                        type="button"
                        onClick={handlePasteClipboard}
                        className="ac-json-tool-btn"
                        title="Paste text from clipboard"
                      >
                        <FiClipboard /> Paste Clipboard
                      </button>
                      <button
                        type="button"
                        onClick={handlePrettifyJson}
                        className="ac-json-tool-btn"
                        title="Format JSON with indentation"
                      >
                        <FiRefreshCw /> Prettify
                      </button>
                      <button
                        type="button"
                        onClick={handleClearJson}
                        className="ac-json-tool-btn"
                        title="Clear editor contents"
                      >
                        <FiTrash2 /> Clear
                      </button>
                    </div>
                  </div>

                  {/* Topic IDs Reference Guide Bar */}
                  <div className="ac-topic-guide-bar">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                        <FiTag color="#2563eb" size={16} />
                        <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#1e3a8a" }}>
                          Available Topic IDs ({topics.length}):
                        </span>
                        <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                          (Click any topic below to copy its ID into your clipboard)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsTopicModalOpen(true)}
                        className="ac-json-tool-btn"
                        style={{ padding: "0.25rem 0.65rem", fontSize: "0.75rem", background: "#ffffff" }}
                      >
                        <FiPlus /> Manage / Create Topics
                      </button>
                    </div>

                    <div className="ac-topic-chips-scroll" style={{ width: "100%", marginTop: "0.3rem" }}>
                      {topics.map((t) => (
                        <span
                          key={t.topicId}
                          className="ac-topic-chip-tag"
                          title={`Click to copy "${t.topicId}"`}
                          onClick={() => {
                            if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
                              navigator.clipboard.writeText(`"${t.topicId}"`);
                              setTopicCopied(t.topicId);
                              setTimeout(() => setTopicCopied(""), 2000);
                            }
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>{t.name}</span>
                          <code>{topicCopied === t.topicId ? "✓ Copied!" : `"${t.topicId}"`}</code>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* JSON Editor Textarea */}
                  <textarea
                    className="ac-json-editor-box"
                    rows={16}
                    value={jsonInput}
                    onChange={(e) => handleJsonTextChange(e.target.value)}
                    placeholder={`Paste problem JSON here or click "Load Sample into Editor"...

Example structure:
{
  "title": "Add Two Numbers",
  "difficulty": "Easy",
  "tags": ["Math"],
  "description": "Given two integers a and b...",
  "functionName": "addTwoNumbers",
  "parameters": [{ "name": "a", "type": "number" }, { "name": "b", "type": "number" }],
  "returnType": "number",
  "boilerplateCode": "/**\\n * @param {number} a\\n * @param {number} b\\n * @return {number}\\n */\\nfunction addTwoNumbers(a, b) {\\n    // Write your code here\\n}",
  "testCases": [...]
}`}
                  />

                  {/* Live Real-time Status & Validation */}
                  {jsonError && (
                    <div className="ac-json-status-card ac-json-status-error">
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700 }}>
                        <FiAlertCircle size={18} />
                        <span>JSON Syntax Error</span>
                      </div>
                      <div style={{ fontFamily: "monospace", fontSize: "0.82rem", whiteSpace: "pre-wrap" }}>
                        {jsonError}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "#b91c1c" }}>
                        Tip: Ensure all object keys and strings are enclosed in double quotes <code>&quot;...&quot;</code> and check for unclosed brackets or trailing commas.
                      </div>
                    </div>
                  )}

                  {jsonParsed && !jsonError && (
                    Array.isArray(jsonParsed) ? (
                      <div className="ac-json-status-card ac-json-status-valid">
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700 }}>
                            <FiCheckCircle size={18} />
                            <span>Valid Problem Array Detected ({jsonParsed.length} Problems)</span>
                          </div>
                          <span className="ac-badge ac-badge-easy" style={{ fontSize: "0.75rem" }}>
                            Bulk Import Ready
                          </span>
                        </div>

                        <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "240px", overflowY: "auto" }}>
                          {jsonParsed.map((p, idx) => {
                            const maxExisting = problems.reduce((max, item) => Math.max(max, Number(item.order) || 0), 0);
                            const autoOrder = Math.max(problems.length, maxExisting) + 1 + idx;
                            const tcCount = Array.isArray(p.testCases || p.test_cases || p.tests)
                              ? (p.testCases || p.test_cases || p.tests).length
                              : 0;
                            return (
                              <div
                                key={idx}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  padding: "0.55rem 0.8rem",
                                  background: "#f8fafc",
                                  borderRadius: "6px",
                                  border: "1px solid #e2e8f0",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                  <span className="ac-badge ac-badge-easy" style={{ fontWeight: 700, padding: "2px 7px" }}>
                                    #{autoOrder}
                                  </span>
                                  <span style={{ fontWeight: 600, color: "#0f172a" }}>
                                    {p.title || p.name || `Problem ${idx + 1}`}
                                  </span>
                                  <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                                    ({p.difficulty || "Easy"})
                                  </span>
                                </div>
                                <div style={{ fontSize: "0.78rem", color: "#475569" }}>
                                  <code>{p.functionName || "solution"}()</code> · {tcCount} test cases
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="ac-json-status-card ac-json-status-valid">
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700 }}>
                            <FiCheckCircle size={18} />
                            <span>Valid Problem Schema Detected</span>
                          </div>
                          <span className="ac-badge ac-badge-easy" style={{ fontSize: "0.75rem" }}>
                            {jsonParsed.difficulty || "Easy"}
                          </span>
                        </div>

                        <div className="ac-json-preview-grid">
                          <div className="ac-json-preview-item">
                            <span className="ac-json-preview-label">Title</span>
                            <span className="ac-json-preview-val">{jsonParsed.title || jsonParsed.name || "—"}</span>
                          </div>
                          <div className="ac-json-preview-item">
                            <span className="ac-json-preview-label">Function Signature</span>
                            <span className="ac-json-preview-val">
                              {jsonParsed.functionName || jsonParsed.fn || "solution"}
                              ({(jsonParsed.parameters || jsonParsed.params || []).map((p) => typeof p === "string" ? p : p.name).join(", ")}) →{" "}
                              {jsonParsed.returnType || "any"}
                            </span>
                          </div>
                          <div className="ac-json-preview-item">
                            <span className="ac-json-preview-label">Test Cases</span>
                            <span className="ac-json-preview-val">
                              {Array.isArray(jsonParsed.testCases || jsonParsed.test_cases || jsonParsed.tests)
                                ? (jsonParsed.testCases || jsonParsed.test_cases || jsonParsed.tests).length
                                : 0} Cases
                            </span>
                          </div>
                          <div className="ac-json-preview-item">
                            <span className="ac-json-preview-label">Boilerplate Stub</span>
                            <span className="ac-json-preview-val" style={{ color: "#2563eb" }}>
                              {jsonParsed.boilerplateCode || jsonParsed.boilerplate || jsonParsed.starterCode || jsonParsed.templates?.javascript
                                ? "Custom Starter Skeleton"
                                : "Auto-generated Starter Stub"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* Sticky Footer for JSON view */}
                <div className="ac-modal-sticky-footer">
                  <div className="ac-footer-status">
                    {jsonSaving ? (
                      <span style={{ color: "#2563eb", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <FiRefreshCw className="animate-spin" /> Saving problem(s) to DynamoDB...
                      </span>
                    ) : jsonParsed && !jsonError ? (
                      <span style={{ color: "#16a34a", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <FiCheckCircle /> Ready to create: {Array.isArray(jsonParsed) ? `${jsonParsed.length} Problems (Bulk Array)` : (jsonParsed.title || jsonParsed.name || "Problem")}
                      </span>
                    ) : jsonError ? (
                      <span style={{ color: "#dc2626", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <FiAlertCircle /> Fix syntax error above to proceed
                      </span>
                    ) : (
                      <span>Paste JSON or click &quot;Load Sample into Editor&quot;</span>
                    )}
                  </div>
                  <div className="ac-modal-footer-actions">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="ac-btn ac-btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateFromJson}
                      disabled={jsonSaving || (!jsonParsed && !jsonInput.trim())}
                      className="ac-btn ac-btn-primary"
                      style={{ minWidth: "210px" }}
                    >
                      {jsonSaving ? (
                        <>
                          <FiRefreshCw className="animate-spin" /> Creating Problem(s)...
                        </>
                      ) : (
                        <>
                          <FiPlus /> Paste &amp; Create {Array.isArray(jsonParsed) ? `${jsonParsed.length} Problems` : "Problem"}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
            <form onSubmit={handleSave} className="ac-modal-content-wrapper">
              <div className="ac-modal-body">
              {/* Basic Fields */}
              <div className="ac-form-row">
                <div className="ac-form-group">
                  <label className="ac-label">Question Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Add Two Numbers"
                    className="ac-input"
                  />
                </div>
                <div className="ac-form-group">
                  <label className="ac-label">Slug / ID</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="e.g. add-two-numbers (auto if blank)"
                    className="ac-input"
                  />
                </div>
              </div>

              <div className="ac-form-row">
                <div className="ac-form-group">
                  <label className="ac-label">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="ac-select"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div className="ac-form-group">
                  <label className="ac-label">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="Math, Algorithms, Basics"
                    className="ac-input"
                  />
                </div>
                <div className="ac-form-group">
                  <label className="ac-label">
                    Problem # <span style={{ fontSize: "0.75rem", color: "#64748b" }}>(Auto-assigned)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.order || ""}
                    onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) || 1 })}
                    placeholder="e.g. 12"
                    className="ac-input"
                  />
                </div>
              </div>

              {/* Topics Reference & Interactive Selection */}
              <div className="ac-form-group">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                  <label className="ac-label" style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <FiTag color="#2563eb" /> Topics Reference <span style={{ fontSize: "0.75rem", color: "#64748b" }}>(Click pill to toggle topic IDs)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsTopicModalOpen(true)}
                    className="ac-btn ac-btn-secondary"
                    style={{ padding: "0.25rem 0.65rem", fontSize: "0.75rem" }}
                  >
                    <FiPlus /> Manage / Create Topics
                  </button>
                </div>

                <div className="ac-topic-pills-wrap">
                  {topics.map((top) => {
                    const isSelected = (formData.topicIds || []).includes(top.topicId);
                    return (
                      <span
                        key={top.topicId}
                        onClick={() => toggleTopicSelection(top.topicId, top.name)}
                        className={`ac-topic-pill ${isSelected ? "selected" : ""}`}
                        title={top.description || top.name}
                      >
                        {isSelected && <FiCheck size={12} />}
                        <span>{top.name}</span>
                        <code>({top.topicId})</code>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div className="ac-form-group">
                <label className="ac-label">Problem Statement (Markdown supported)</label>
                <textarea
                  rows={6}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the problem, examples, and details..."
                  className="ac-textarea"
                />
              </div>

              {/* Collapsible Section 1: Formats & Constraints */}
              <div className="ac-accordion-card">
                <button
                  type="button"
                  className="ac-accordion-trigger"
                  onClick={() => setFormAccordions((prev) => ({ ...prev, formats: !prev.formats }))}
                >
                  <div className="ac-accordion-trigger-left">
                    <FiSliders size={16} color="#ea580c" />
                    <span className="ac-accordion-title">Input, Output Formats &amp; Constraints</span>
                    <span className="ac-accordion-badge">Optional</span>
                  </div>
                  <div className="ac-accordion-trigger-right">
                    <span className="ac-accordion-state-label">
                      {formAccordions.formats ? "Collapse" : "Expand"}
                    </span>
                    {formAccordions.formats ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                  </div>
                </button>

                {formAccordions.formats && (
                  <div className="ac-accordion-content">
                    <div className="ac-form-row">
                      <div className="ac-form-group">
                        <label className="ac-label">Input Format</label>
                        <textarea
                          rows={2}
                          value={formData.inputFormat}
                          onChange={(e) => setFormData({ ...formData, inputFormat: e.target.value })}
                          placeholder="Describe input parameters format..."
                          className="ac-textarea"
                        />
                      </div>
                      <div className="ac-form-group">
                        <label className="ac-label">Output Format</label>
                        <textarea
                          rows={2}
                          value={formData.outputFormat}
                          onChange={(e) => setFormData({ ...formData, outputFormat: e.target.value })}
                          placeholder="Describe expected return value format..."
                          className="ac-textarea"
                        />
                      </div>
                    </div>

                    <div className="ac-form-group" style={{ marginBottom: 0 }}>
                      <label className="ac-label">Constraints (one per line)</label>
                      <textarea
                        rows={3}
                        value={formData.constraints}
                        onChange={(e) => setFormData({ ...formData, constraints: e.target.value })}
                        placeholder="-10^9 <= a <= 10^9"
                        className="ac-textarea"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Collapsible Section 2: Code Templates & Function Signature */}
              <div className="ac-accordion-card">
                <button
                  type="button"
                  className="ac-accordion-trigger"
                  onClick={() => setFormAccordions((prev) => ({ ...prev, templates: !prev.templates }))}
                >
                  <div className="ac-accordion-trigger-left">
                    <FiCode size={16} color="#ea580c" />
                    <span className="ac-accordion-title">Function Signature &amp; Boilerplate Templates</span>
                    <span className="ac-accordion-badge">
                      {formData.parameters.length} Parameters · Java &amp; JS
                    </span>
                  </div>
                  <div className="ac-accordion-trigger-right">
                    <span className="ac-accordion-state-label">
                      {formAccordions.templates ? "Collapse" : "Expand"}
                    </span>
                    {formAccordions.templates ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                  </div>
                </button>

                {formAccordions.templates && (
                  <div className="ac-accordion-content">
                    <div className="ac-section-title" style={{ marginTop: 0 }}>
                      <span>Function Signature &amp; Parameters</span>
                      <button
                        type="button"
                        onClick={addParameter}
                        className="ac-btn ac-btn-secondary"
                        style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem" }}
                      >
                        <FiPlus /> Add Parameter
                      </button>
                    </div>

                    <div className="ac-form-row">
                      <div className="ac-form-group">
                        <label className="ac-label">Function Name</label>
                        <input
                          type="text"
                          value={formData.functionName}
                          onChange={(e) => {
                            const fn = e.target.value;
                            const jsTmpl = generateJsBoilerplate(fn, formData.parameters, formData.returnType, formData.title);
                            const javaTmpl = generateJavaBoilerplate(fn, formData.parameters, formData.returnType);
                            setFormData({ ...formData, functionName: fn, jsTemplate: jsTmpl, javaTemplate: javaTmpl });
                          }}
                          placeholder="e.g. addTwoNumbers"
                          className="ac-input"
                        />
                      </div>
                      <div className="ac-form-group">
                        <label className="ac-label">Return Type</label>
                        <select
                          value={formData.returnType}
                          onChange={(e) => {
                            const rt = e.target.value;
                            const jsTmpl = generateJsBoilerplate(formData.functionName, formData.parameters, rt, formData.title);
                            const javaTmpl = generateJavaBoilerplate(formData.functionName, formData.parameters, rt);
                            setFormData({ ...formData, returnType: rt, jsTemplate: jsTmpl, javaTemplate: javaTmpl });
                          }}
                          className="ac-select"
                        >
                          <option value="number">number</option>
                          <option value="string">string</option>
                          <option value="boolean">boolean</option>
                          <option value="number[]">number[]</option>
                          <option value="string[]">string[]</option>
                          <option value="object">object</option>
                          <option value="any">any</option>
                        </select>
                      </div>
                    </div>

                    {/* Parameter Rows */}
                    {formData.parameters.map((param, pIdx) => (
                      <div key={pIdx} style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "0.5rem" }}>
                        <input
                          type="text"
                          value={param.name}
                          placeholder="param name (e.g. a)"
                          onChange={(e) => updateParameter(pIdx, "name", e.target.value)}
                          className="ac-input"
                          style={{ flex: 1 }}
                        />
                        <select
                          value={param.type}
                          onChange={(e) => updateParameter(pIdx, "type", e.target.value)}
                          className="ac-select"
                          style={{ width: "140px" }}
                        >
                          <option value="number">number</option>
                          <option value="string">string</option>
                          <option value="boolean">boolean</option>
                          <option value="number[]">number[]</option>
                          <option value="string[]">string[]</option>
                          <option value="object">object</option>
                          <option value="any">any</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => removeParameter(pIdx)}
                          className="ac-btn ac-btn-danger"
                          style={{ padding: "0.5rem" }}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    ))}

                    {/* Java Boilerplate Code */}
                    <div className="ac-section-title">
                      <span>Java Boilerplate Code Template</span>
                      <button
                        type="button"
                        onClick={() => {
                          const tmpl = generateJavaBoilerplate(formData.functionName, formData.parameters, formData.returnType);
                          setFormData({ ...formData, javaTemplate: tmpl });
                        }}
                        className="ac-btn ac-btn-secondary"
                        style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem" }}
                      >
                        <FiRefreshCw /> Regenerate Java Default
                      </button>
                    </div>

                    <div className="ac-form-group">
                      <textarea
                        rows={7}
                        value={formData.javaTemplate}
                        onChange={(e) => setFormData({ ...formData, javaTemplate: e.target.value })}
                        className="ac-textarea ac-code-input"
                        placeholder="Enter Java boilerplate template code (class Solution { ... })..."
                      />
                    </div>

                    {/* JavaScript Boilerplate Code */}
                    <div className="ac-section-title">
                      <span>JavaScript Boilerplate Code Template</span>
                      <button
                        type="button"
                        onClick={() => {
                          const tmpl = generateJsBoilerplate(formData.functionName, formData.parameters, formData.returnType, formData.title);
                          setFormData({ ...formData, jsTemplate: tmpl });
                        }}
                        className="ac-btn ac-btn-secondary"
                        style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem" }}
                      >
                        <FiRefreshCw /> Regenerate JS Default
                      </button>
                    </div>

                    <div className="ac-form-group" style={{ marginBottom: 0 }}>
                      <textarea
                        rows={7}
                        value={formData.jsTemplate}
                        onChange={(e) => setFormData({ ...formData, jsTemplate: e.target.value })}
                        className="ac-textarea ac-code-input"
                        placeholder="Enter JavaScript boilerplate template code..."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Collapsible Section 3: Test Cases */}
              <div className="ac-accordion-card">
                <button
                  type="button"
                  className="ac-accordion-trigger"
                  onClick={() => setFormAccordions((prev) => ({ ...prev, testcases: !prev.testcases }))}
                >
                  <div className="ac-accordion-trigger-left">
                    <FiCheckCircle size={16} color="#16a34a" />
                    <span className="ac-accordion-title">Test Cases Configuration</span>
                    <span className="ac-accordion-badge">
                      {formData.testCases.length} Testcases
                    </span>
                  </div>
                  <div className="ac-accordion-trigger-right">
                    <span className="ac-accordion-state-label">
                      {formAccordions.testcases ? "Collapse" : "Expand"}
                    </span>
                    {formAccordions.testcases ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                  </div>
                </button>

                {formAccordions.testcases && (
                  <div className="ac-accordion-content">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                      <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                        Specify inputs (as JSON argument array) and expected output.
                      </span>
                      <button
                        type="button"
                        onClick={addTestCase}
                        className="ac-btn ac-btn-secondary"
                        style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem" }}
                      >
                        <FiPlus /> Add Test Case
                      </button>
                    </div>

                    {formData.testCases.map((tc, tcIdx) => (
                      <div key={tcIdx} className="ac-tc-box">
                        <div className="ac-tc-header">
                          <span className="ac-tc-badge">Test Case #{tcIdx + 1} ({tc.testCaseId})</span>
                          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                            <label style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.35rem", cursor: "pointer" }}>
                              <input
                                type="checkbox"
                                checked={tc.isSample}
                                onChange={(e) => updateTestCase(tcIdx, "isSample", e.target.checked)}
                              />
                              <span>Sample Case (visible to user)</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => removeTestCase(tcIdx)}
                              className="ac-btn ac-btn-danger"
                              style={{ padding: "0.3rem 0.5rem", fontSize: "0.75rem" }}
                            >
                              <FiTrash2 /> Remove
                            </button>
                          </div>
                        </div>

                        <div className="ac-form-row">
                          <div className="ac-form-group">
                            <label className="ac-label">Input (JSON array of arguments) *</label>
                            <input
                              type="text"
                              value={tc.input}
                              onChange={(e) => updateTestCase(tcIdx, "input", e.target.value)}
                              placeholder="[2, 3]"
                              className="ac-input"
                              style={{ fontFamily: "monospace" }}
                            />
                          </div>
                          <div className="ac-form-group">
                            <label className="ac-label">Expected Output (JSON value) *</label>
                            <input
                              type="text"
                              value={tc.expectedOutput}
                              onChange={(e) => updateTestCase(tcIdx, "expectedOutput", e.target.value)}
                              placeholder="5"
                              className="ac-input"
                              style={{ fontFamily: "monospace" }}
                            />
                          </div>
                        </div>

                        <div className="ac-form-row">
                          <div className="ac-form-group">
                            <label className="ac-label">Raw Input Display (e.g. a = 2, b = 3)</label>
                            <input
                              type="text"
                              value={tc.rawInput}
                              onChange={(e) => updateTestCase(tcIdx, "rawInput", e.target.value)}
                              placeholder="a = 2, b = 3"
                              className="ac-input"
                            />
                          </div>
                          <div className="ac-form-group">
                            <label className="ac-label">Explanation (optional)</label>
                            <input
                              type="text"
                              value={tc.explanation}
                              onChange={(e) => updateTestCase(tcIdx, "explanation", e.target.value)}
                              placeholder="2 + 3 equals 5"
                              className="ac-input"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

                </div>
                <div className="ac-modal-sticky-footer">
                  <div className="ac-footer-status">
                    <span>{editingId ? "Editing existing question" : "Configuring new question"}</span>
                  </div>
                  <div className="ac-modal-footer-actions">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="ac-btn ac-btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="ac-btn ac-btn-primary"
                    >
                      {saving ? "Saving..." : editingId ? "Update Question" : "Create Question"}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Topics Management Modal */}
      {isTopicModalOpen && (
        <div className="ac-modal-overlay">
          <div className="ac-modal" style={{ maxWidth: "800px", maxHeight: "90vh" }}>
            <div className="ac-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <FiTag color="#2563eb" size={22} />
                <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Coding Topics Management</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsTopicModalOpen(false)}
                className="ac-close-btn"
              >
                <FiX />
              </button>
            </div>

            <div className="ac-modal-body" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Create New Topic Box */}
              <form onSubmit={handleCreateTopic} style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <h4 style={{ margin: "0 0 0.75rem 0", display: "flex", alignItems: "center", gap: "0.4rem", color: "#0f172a" }}>
                  <FiPlus /> Create New Coding Topic
                </h4>
                <div className="ac-form-row">
                  <div className="ac-form-group">
                    <label className="ac-label">Topic Name *</label>
                    <input
                      type="text"
                      required
                      value={newTopicName}
                      onChange={(e) => {
                        setNewTopicName(e.target.value);
                        if (!newTopicId || newTopicId === newTopicName.toLowerCase().replace(/[^a-z0-9]+/g, "-")) {
                          setNewTopicId(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""));
                        }
                      }}
                      placeholder="e.g. Bitmask"
                      className="ac-input"
                    />
                  </div>
                  <div className="ac-form-group">
                    <label className="ac-label">Topic ID / Slug (used in problem references)</label>
                    <input
                      type="text"
                      value={newTopicId}
                      onChange={(e) => setNewTopicId(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}
                      placeholder="e.g. bitmask (auto if blank)"
                      className="ac-input"
                    />
                  </div>
                </div>
                <div className="ac-form-group" style={{ marginTop: "0.5rem" }}>
                  <label className="ac-label">Description (optional)</label>
                  <input
                    type="text"
                    value={newTopicDesc}
                    onChange={(e) => setNewTopicDesc(e.target.value)}
                    placeholder="Short description of this coding algorithmic concept..."
                    className="ac-input"
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.75rem" }}>
                  <button
                    type="submit"
                    disabled={topicSaving || !newTopicName.trim()}
                    className="ac-btn ac-btn-primary"
                  >
                    {topicSaving ? <FiRefreshCw className="animate-spin" /> : <FiPlus />}
                    <span>{topicSaving ? "Creating..." : "Create Topic"}</span>
                  </button>
                </div>
              </form>

              {/* Existing Topics List */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
                  <h4 style={{ margin: 0, color: "#0f172a", fontSize: "1rem" }}>
                    All Topics ({topics.length})
                  </h4>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    Click ID to copy to clipboard
                  </span>
                </div>

                <div className="ac-topics-grid">
                  {topics.map((t) => (
                    <div key={t.topicId} className="ac-topic-card">
                      <div className="ac-topic-card-header">
                        <span className="ac-topic-card-title">{t.name}</span>
                        <span
                          className="ac-topic-card-id"
                          title="Click to copy ID"
                          onClick={() => {
                            if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
                              navigator.clipboard.writeText(t.topicId);
                              setTopicCopied(t.topicId);
                              setTimeout(() => setTopicCopied(""), 2000);
                            }
                          }}
                        >
                          {topicCopied === t.topicId ? "✓ Copied" : t.topicId}
                        </span>
                      </div>
                      <div className="ac-topic-card-desc">
                        {t.description || "No description provided."}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "auto", display: "flex", justifyContent: "space-between" }}>
                        <span>Order #{t.order || "—"}</span>
                        <span>{t.problemsCount !== undefined ? `${t.problemsCount} problem(s)` : ""}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="ac-modal-sticky-footer" style={{ justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setIsTopicModalOpen(false)}
                className="ac-btn ac-btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
