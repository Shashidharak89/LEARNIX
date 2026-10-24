"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
} from "react-icons/fi";
import "./CodingManager.css";

// ─── Dummy Sample JSON Template (Standard LeetCode-style structure) ───────────
const SAMPLE_PROBLEM_JSON = {
  title: "Add Two Numbers",
  slug: "add-two-numbers",
  difficulty: "Easy",
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
  order: 1,
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
    },
    {
      testCaseId: "tc_05",
      order: 5,
      input: [-100, -200],
      rawInput: "a = -100, b = -200",
      expectedOutput: -300,
      isSample: false,
      explanation: "-100 + -200 = -300"
    },
    {
      testCaseId: "tc_06",
      order: 6,
      input: [999999999, 1],
      rawInput: "a = 999999999, b = 1",
      expectedOutput: 1000000000,
      isSample: false,
      explanation: "999999999 + 1 = 1000000000"
    },
    {
      testCaseId: "tc_07",
      order: 7,
      input: [-50, 50],
      rawInput: "a = -50, b = 50",
      expectedOutput: 0,
      isSample: false,
      explanation: "-50 + 50 = 0"
    },
    {
      testCaseId: "tc_08",
      order: 8,
      input: [12345, 67890],
      rawInput: "a = 12345, b = 67890",
      expectedOutput: 80235,
      isSample: false,
      explanation: "12345 + 67890 = 80235"
    },
    {
      testCaseId: "tc_09",
      order: 9,
      input: [7, -15],
      rawInput: "a = 7, b = -15",
      expectedOutput: -8,
      isSample: false,
      explanation: "7 + -15 = -8"
    },
    {
      testCaseId: "tc_10",
      order: 10,
      input: [42, 58],
      rawInput: "a = 42, b = 58",
      expectedOutput: 100,
      isSample: false,
      explanation: "42 + 58 = 100"
    }
  ]
};

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

  // Form Fields
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    difficulty: "Easy",
    tags: "Math, Algorithms",
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
  }, []);

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

  function openCreateModal(initialTab = "form") {
    setEditingId(null);
    setActiveModalTab(initialTab);
    const initialParams = [{ name: "a", type: "number" }, { name: "b", type: "number" }];
    const defaultTemplate = generateJsBoilerplate("solution", initialParams, "number");
    const defaultJavaTemplate = generateJavaBoilerplate("solution", initialParams, "number");

    setFormData({
      title: "",
      slug: "",
      difficulty: "Easy",
      tags: "Math, Basics",
      description: "### Problem Statement\n\nGiven two integers a and b, return their sum.",
      inputFormat: "Two integers passed as function arguments.",
      outputFormat: "Return the calculated integer result.",
      constraints: "-10^9 <= a, b <= 10^9",
      functionName: "solution",
      returnType: "number",
      parameters: initialParams,
      jsTemplate: defaultTemplate,
      javaTemplate: defaultJavaTemplate,
      order: problems.length + 1,
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
      const sampleStr = JSON.stringify(SAMPLE_PROBLEM_JSON, null, 2);
      setJsonInput(sampleStr);
      setJsonParsed(SAMPLE_PROBLEM_JSON);
      setJsonError(null);
    }

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
    const text = JSON.stringify(SAMPLE_PROBLEM_JSON, null, 2);
    if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setJsonCopied(true);
      setTimeout(() => setJsonCopied(false), 2200);
    } else {
      alert("Dummy sample JSON copied to clipboard!");
    }
  }

  function handleLoadSample() {
    const text = JSON.stringify(SAMPLE_PROBLEM_JSON, null, 2);
    setJsonInput(text);
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

    const title = parsed.title || parsed.name || parsed.questionTitle || parsed.problemName;
    if (!title || typeof title !== "string") {
      alert("Validation Error: Please specify a 'title' or 'name' for the problem.");
      return;
    }

    const functionName = parsed.functionName || parsed.function || parsed.fn || parsed.methodName || "solution";

    // Normalize parameters
    let rawParams = parsed.parameters || parsed.params || [];
    if (!Array.isArray(rawParams)) rawParams = [];
    const parameters = rawParams.map((p, idx) => {
      if (typeof p === "string") return { name: p, type: "any" };
      return {
        name: p?.name || `arg${idx + 1}`,
        type: p?.type || "any",
      };
    });

    const returnType = parsed.returnType || parsed.return_type || parsed.outputType || "any";

    // Extract testcases flexibly
    const rawCases = parsed.testCases || parsed.test_cases || parsed.testcases || parsed.tests || [];
    if (!Array.isArray(rawCases) || rawCases.length === 0) {
      alert("Validation Error: 'testCases' array is required with at least 1 test case.");
      return;
    }

    // Determine boilerplate templates (strictly starter skeleton, never working code)
    let jsTemplate =
      parsed.boilerplateCode ||
      parsed.boilerplate ||
      parsed.starterCode ||
      parsed.template ||
      parsed.templates?.javascript;

    if (!jsTemplate) {
      jsTemplate = generateJsBoilerplate(functionName, parameters, returnType);
    }

    let javaTemplate =
      parsed.javaBoilerplate ||
      parsed.templates?.java;

    if (!javaTemplate) {
      javaTemplate = generateJavaBoilerplate(functionName, parameters, returnType);
    }

    setJsonSaving(true);
    try {
      const cleanSlug = (parsed.slug || title)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

      const payload = {
        title,
        slug: cleanSlug,
        difficulty: parsed.difficulty || "Easy",
        tags: Array.isArray(parsed.tags)
          ? parsed.tags
          : typeof parsed.tags === "string"
          ? parsed.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : ["Basics"],
        description: parsed.description || parsed.statement || "",
        inputFormat: parsed.inputFormat || "",
        outputFormat: parsed.outputFormat || "",
        constraints: Array.isArray(parsed.constraints)
          ? parsed.constraints
          : typeof parsed.constraints === "string"
          ? parsed.constraints.split("\n").map((c) => c.trim()).filter(Boolean)
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
        order: Number(parsed.order) || (problems.length + 1),
        isActive: parsed.isActive !== false,
        testCases: rawCases.map((tc, idx) => {
          let inp = tc.input !== undefined ? tc.input : (tc.args !== undefined ? tc.args : []);
          let exp = tc.expectedOutput !== undefined ? tc.expectedOutput : (tc.output !== undefined ? tc.output : (tc.expected !== undefined ? tc.expected : ""));

          const inputStr = typeof inp === "string" ? inp : JSON.stringify(inp);
          const outputStr = typeof exp === "string" ? exp : JSON.stringify(exp);

          return {
            testCaseId: tc.testCaseId || tc.id || `tc_${String(idx + 1).padStart(2, "0")}`,
            order: tc.order || idx + 1,
            input: inputStr,
            rawInput: tc.rawInput || inputStr,
            expectedOutput: outputStr,
            isSample: tc.isSample !== undefined ? Boolean(tc.isSample) : idx < 3,
            explanation: tc.explanation || "",
          };
        }),
      };

      const res = await fetch("/api/admin/coding/problems", {
        method: "POST",
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
        alert(`Problem "${payload.title}" created successfully with ${payload.testCases.length} test cases!`);
      } else {
        alert(data.error || "Failed to create problem from JSON");
      }
    } catch (err) {
      alert("Error saving problem from JSON: " + err.message);
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

  return (
    <div className="ac-container">
      {/* Header */}
      <header className="ac-header">
        <div className="ac-header-left">
          <h1>
            <FiCode /> Coding Problems Management
          </h1>
          <p>
            Create, edit, and configure LeetCode-style questions, JavaScript boilerplate templates, and normalized test cases.
          </p>
        </div>
        <div className="ac-header-actions">
          <Link href="/admin" className="ac-btn ac-btn-outline">
            <FiArrowLeft /> Back to Admin
          </Link>
          <Link href="/test" target="_blank" className="ac-btn ac-btn-outline">
            <FiExternalLink /> Live /test Page
          </Link>
          <button onClick={() => openCreateModal("json")} className="ac-btn ac-btn-outline">
            <FiFileText /> Insert via JSON
          </button>
          <button onClick={() => openCreateModal("form")} className="ac-btn ac-btn-primary">
            <FiPlus /> Create New Question
          </button>
        </div>
      </header>

      {/* Loading & Error States */}
      {loading && (
        <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
          <FiRefreshCw className="animate-spin" size={28} />
          <p style={{ marginTop: "0.5rem" }}>Loading problems from DynamoDB...</p>
        </div>
      )}

      {error && (
        <div style={{ background: "#fee2e2", border: "1px solid #fecaca", padding: "1rem", borderRadius: "10px", color: "#b91c1c", marginBottom: "1.5rem" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Problem Cards */}
      {!loading && problems.length === 0 && !error && (
        <div style={{ textAlign: "center", padding: "3rem", background: "#f8fafc", borderRadius: "14px", border: "1px dashed #cbd5e1" }}>
          <FiList size={40} color="#94a3b8" />
          <h3 style={{ margin: "1rem 0 0.5rem 0", color: "#334155" }}>No Coding Problems Found</h3>
          <p style={{ color: "#64748b", marginBottom: "1.25rem" }}>Create your first problem to appear on the <code>/test</code> route.</p>
          <button onClick={openCreateModal} className="ac-btn ac-btn-primary">
            <FiPlus /> Create Problem
          </button>
        </div>
      )}

      <div className="ac-grid">
        {problems.map((p) => (
          <div key={p.problemId} className="ac-card">
            <div>
              <div className="ac-card-top">
                <div>
                  <h3 className="ac-card-title">{p.title}</h3>
                  <span className="ac-card-slug">{p.problemId}</span>
                </div>
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

              <div className="ac-card-desc">{p.description}</div>

              <div className="ac-tags">
                {(p.tags || []).map((t, idx) => (
                  <span key={idx} className="ac-tag">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="ac-card-meta">
              <span>{p.testCasesCount || 0} Test Cases</span>
              <div className="ac-card-actions">
                <Link
                  href={`/test?problem=${p.slug || p.problemId}`}
                  target="_blank"
                  className="ac-btn ac-btn-secondary"
                  title="Test in frontend"
                  style={{ padding: "0.4rem 0.6rem" }}
                >
                  <FiExternalLink />
                </Link>
                <button
                  onClick={() => openEditModal(p)}
                  className="ac-btn ac-btn-secondary"
                  title="Edit question"
                  style={{ padding: "0.4rem 0.6rem" }}
                >
                  <FiEdit />
                </button>
                <button
                  onClick={() => handleDelete(p.problemId)}
                  className="ac-btn ac-btn-danger"
                  title="Delete question"
                  style={{ padding: "0.4rem 0.6rem" }}
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

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
                  )}
                </div>

                {/* Sticky Footer for JSON view */}
                <div className="ac-modal-sticky-footer">
                  <div className="ac-footer-status">
                    {jsonSaving ? (
                      <span style={{ color: "#2563eb", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <FiRefreshCw className="animate-spin" /> Saving problem to DynamoDB...
                      </span>
                    ) : jsonParsed && !jsonError ? (
                      <span style={{ color: "#16a34a", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <FiCheckCircle /> Ready to create: {jsonParsed.title || jsonParsed.name || "Problem"}
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
                          <FiRefreshCw className="animate-spin" /> Creating Problem...
                        </>
                      ) : (
                        <>
                          <FiPlus /> Paste &amp; Create Problem
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

              {/* Input & Output Format */}
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

              {/* Constraints */}
              <div className="ac-form-group">
                <label className="ac-label">Constraints (one per line)</label>
                <textarea
                  rows={3}
                  value={formData.constraints}
                  onChange={(e) => setFormData({ ...formData, constraints: e.target.value })}
                  placeholder="-10^9 <= a <= 10^9"
                  className="ac-textarea"
                />
              </div>

              {/* Function Signature & Parameters */}
              <div className="ac-section-title">
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
                <div key={pIdx} style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
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
                  rows={8}
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

              <div className="ac-form-group">
                <textarea
                  rows={8}
                  value={formData.jsTemplate}
                  onChange={(e) => setFormData({ ...formData, jsTemplate: e.target.value })}
                  className="ac-textarea ac-code-input"
                  placeholder="Enter JavaScript boilerplate template code..."
                />
              </div>

              {/* Test Cases */}
              <div className="ac-section-title">
                <span>Test Cases ({formData.testCases.length})</span>
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
    </div>
  );
}
