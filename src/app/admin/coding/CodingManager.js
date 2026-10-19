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
} from "react-icons/fi";
import "./CodingManager.css";

export default function CodingManager() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

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

  function generateJsBoilerplate(funcName, params, retType, title) {
    const paramsDoc = (params || [])
      .map((p) => ` * @param {${p.type || "any"}} ${p.name || "arg"}`)
      .join("\n");
    const paramNames = (params || []).map((p) => p.name || "arg").join(", ");

    return `/**
 * ${title || "Solution"}
 * 
${paramsDoc}
 * @return {${retType || "any"}}
 */
function ${funcName || "solution"}(${paramNames}) {
    // Write your code here
    
}`;
  }

  function openCreateModal() {
    setEditingId(null);
    const initialParams = [{ name: "a", type: "number" }, { name: "b", type: "number" }];
    const defaultTemplate = generateJsBoilerplate("solution", initialParams, "number", "New Problem");

    setFormData({
      title: "",
      slug: "",
      difficulty: "Easy",
      tags: "Math, Basics",
      description: "### Problem Statement\n\nWrite a function to solve...",
      inputFormat: "Two integers passed as function arguments.",
      outputFormat: "Return the calculated integer result.",
      constraints: "-10^9 <= a, b <= 10^9",
      functionName: "solution",
      returnType: "number",
      parameters: initialParams,
      jsTemplate: defaultTemplate,
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
    setIsModalOpen(true);
  }

  async function openEditModal(problem) {
    setEditingId(problem.problemId);
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
          jsTemplate: p.templates?.javascript || "",
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
        },
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
      const newTemplate = generateJsBoilerplate(prev.functionName, newParams, prev.returnType, prev.title);
      return { ...prev, parameters: newParams, jsTemplate: newTemplate };
    });
  }

  function removeParameter(index) {
    setFormData((prev) => {
      const newParams = prev.parameters.filter((_, i) => i !== index);
      const newTemplate = generateJsBoilerplate(prev.functionName, newParams, prev.returnType, prev.title);
      return { ...prev, parameters: newParams, jsTemplate: newTemplate };
    });
  }

  function updateParameter(index, field, value) {
    setFormData((prev) => {
      const newParams = [...prev.parameters];
      newParams[index] = { ...newParams[index], [field]: value };
      const newTemplate = generateJsBoilerplate(prev.functionName, newParams, prev.returnType, prev.title);
      return { ...prev, parameters: newParams, jsTemplate: newTemplate };
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
          <button onClick={openCreateModal} className="ac-btn ac-btn-primary">
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
              <h2>{editingId ? `Edit Question: ${formData.title}` : "Create New Coding Question"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="ac-close-btn">
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSave} className="ac-modal-body">
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
                      const tmpl = generateJsBoilerplate(fn, formData.parameters, formData.returnType, formData.title);
                      setFormData({ ...formData, functionName: fn, jsTemplate: tmpl });
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
                      const tmpl = generateJsBoilerplate(formData.functionName, formData.parameters, rt, formData.title);
                      setFormData({ ...formData, returnType: rt, jsTemplate: tmpl });
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

              {/* Boilerplate Code */}
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
                  <FiRefreshCw /> Regenerate Default
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

              <div className="ac-modal-footer">
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
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
