"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/app/components/Navbar";
import QPViewer from "./QPViewer";
import Link from "next/link";
import "./QPAdmin.css";

const modelsConfig = {
    QPUniversities: {
        fields: [
            { name: "name", type: "text", required: true },
            { name: "city", type: "text" },
            { name: "state", type: "text" },
            { name: "district", type: "text" }
        ]
    },
    QPColleges: {
        fields: [
            { name: "name", type: "text", required: true },
            { name: "university", type: "select", ref: "QPUniversities", required: true },
            { name: "location", type: "text" }
        ]
    },
    QPSemesters: {
        fields: [
            { name: "semesterNumber", type: "number", required: true }
        ]
    },
    QPExamType: {
        fields: [
            { name: "name", type: "text", required: true }
        ]
    },
    QPBatches: {
        fields: [
            { name: "startYear", type: "number", required: true },
            { name: "endYear", type: "number", required: true }
        ]
    },
    QPSubjects: {
        fields: [
            { name: "name", type: "text", required: true },
            { name: "course", type: "select", ref: "QPCourse", required: true },
            { name: "semester", type: "select", ref: "QPSemesters", required: true },
            { name: "college", type: "select", ref: "QPColleges", required: true }
        ]
    },
    QPCourse: {
        fields: [
            { name: "name", type: "text", required: true }
        ]
    },
    QPImages: {
        fields: [
            { name: "subject", type: "select", ref: "QPSubjects", required: true },
            { name: "college", type: "select", ref: "QPColleges", required: true },
            { name: "batch", type: "select", ref: "QPBatches", required: true },
            { name: "examtype", type: "select", ref: "QPExamType", required: true },
            { name: "imageUrls", type: "text", label: "Image URLs (comma separated)" },
            { name: "visitLink", type: "text", label: "Visit Link" }
        ],
        customSubmit: true
    }
};

const apiMap = {
    QPUniversities: "/api/qp/v1/universities",
    QPColleges: "/api/qp/v1/colleges",
    QPSemesters: "/api/qp/v1/semesters",
    QPCourse: "/api/qp/v1/courses",
    QPSubjects: "/api/qp/v1/subjects",
    QPBatches: "/api/qp/v1/batches",
    QPExamType: "/api/qp/v1/examtypes",
    QPImages: "/api/qp/v1/images"
};

export default function QPAdminPage() {
    const [activeTab, setActiveTab] = useState("QPUniversities");
    const [formData, setFormData] = useState({});
    const [records, setRecords] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [references, setReferences] = useState({});
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    // Auth & Permission states
    const [token, setToken] = useState("");
    const [userRole, setUserRole] = useState(null);

    // Edit and action states
    const [editingRecord, setEditingRecord] = useState(null);
    const [actionLoadingId, setActionLoadingId] = useState(null);

    // Load auth token & role from localStorage
    useEffect(() => {
        if (typeof window !== "undefined") {
            const tok = localStorage.getItem("token") || "";
            const role = localStorage.getItem("role") || "";
            setToken(tok);
            setUserRole(role);
        }
    }, []);

    const getAuthToken = useCallback(() => {
        if (token) return token;
        if (typeof window !== "undefined") {
            return localStorage.getItem("token") || "";
        }
        return "";
    }, [token]);

    const isAdmin = userRole === "admin" || userRole === "superadmin";

    // Reset form fields for a given model
    const resetFormFields = useCallback((modelName) => {
        const config = modelsConfig[modelName];
        if (!config) return;
        const initialForm = {};
        config.fields.forEach(f => {
            initialForm[f.name] = f.default !== undefined ? f.default : (f.type === "checkbox" ? false : "");
        });
        setFormData(initialForm);
        setEditingRecord(null);
    }, []);

    // Fetch references (e.g. for dropdowns)
    const fetchReferences = useCallback(async (modelName) => {
        if (modelName === "Viewer") return;
        const config = modelsConfig[modelName];
        if (!config) return;
        const refModels = config.fields.filter(f => f.ref).map(f => f.ref);
        if (refModels.length === 0) return;

        const refs = {};
        await Promise.all(refModels.map(async (refModel) => {
            try {
                const res = await fetch(`/api/admin/qp-models?model=${refModel}`);
                const json = await res.json();
                if (json.success) {
                    refs[refModel] = json.data;
                }
            } catch (err) {
                console.error(`Failed to fetch references for ${refModel}:`, err);
            }
        }));
        setReferences(prev => ({ ...prev, ...refs }));
    }, []);

    // Fetch records for the active tab (Latest records retrieval)
    const fetchRecords = useCallback(async (modelName, pageNum = 1) => {
        if (modelName === "Viewer") return;
        setLoading(true);
        try {
            const endpoint = apiMap[modelName];
            const res = await fetch(`${endpoint}?page=${pageNum}&limit=20`);
            const json = await res.json();
            if (json.success) {
                if (pageNum === 1) {
                    setRecords(json.data || []);
                } else {
                    setRecords(prev => [...prev, ...(json.data || [])]);
                }
                setTotalPages(json.pagination?.totalPages || 1);
            }
        } catch (error) {
            console.error("Error fetching records:", error);
        }
        setLoading(false);
    }, []);

    // Handle tab change
    useEffect(() => {
        if (activeTab === "Viewer") return;
        setPage(1);
        setRecords([]);
        resetFormFields(activeTab);
        setMessage(null);
        fetchRecords(activeTab, 1);
        fetchReferences(activeTab);
    }, [activeTab, fetchRecords, fetchReferences, resetFormFields]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    // Pre-populate form when user clicks "Edit"
    const handleStartEdit = (record) => {
        setEditingRecord(record);
        const config = modelsConfig[activeTab];
        const populated = {};
        config.fields.forEach(f => {
            const val = record[f.name];
            if (f.name === "imageUrls") {
                populated[f.name] = Array.isArray(val) ? val.join(", ") : (val || "");
            } else if (f.type === "select") {
                if (val && typeof val === "object") {
                    populated[f.name] = String(val._id || "");
                } else {
                    populated[f.name] = val !== undefined && val !== null ? String(val) : "";
                }
            } else if (f.type === "checkbox") {
                populated[f.name] = Boolean(val);
            } else {
                populated[f.name] = val !== undefined && val !== null ? val : "";
            }
        });
        setFormData(populated);
        setMessage({
            type: "info",
            text: `Editing ${activeTab.replace("QP", "")} (ID: ${record._id}). Modify the fields and click "Update Record".`
        });
        if (typeof window !== "undefined") {
            window.scrollTo({ top: 180, behavior: "smooth" });
        }
    };

    // Cancel edit mode
    const handleCancelEdit = () => {
        resetFormFields(activeTab);
        setMessage(null);
    };

    // Submit handler: Supports both Create (POST) and Update (PUT)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const currentToken = getAuthToken();
        if (!currentToken) {
            setMessage({
                type: "error",
                text: "Authentication required. Please log in with an Admin or Super Admin account."
            });
            setLoading(false);
            return;
        }

        let payload = { ...formData };

        if (activeTab === "QPImages") {
            const imageUrlsList = payload.imageUrls
                ? payload.imageUrls.split(',').map(s => s.trim()).filter(Boolean)
                : [];
            payload.imageUrls = imageUrlsList;
        }

        try {
            if (editingRecord) {
                // UPDATE RECORD (PUT)
                const res = await fetch("/api/admin/qp-models", {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${currentToken}`
                    },
                    body: JSON.stringify({
                        modelName: activeTab,
                        id: editingRecord._id,
                        data: payload
                    })
                });
                const json = await res.json();

                if (json.success) {
                    setMessage({
                        type: "success",
                        text: `${activeTab.replace("QP", "")} updated successfully!`
                    });
                    resetFormFields(activeTab);
                    setPage(1);
                    fetchRecords(activeTab, 1);
                    fetchReferences(activeTab);
                } else {
                    setMessage({
                        type: "error",
                        text: json.error || json.message || "Failed to update record"
                    });
                }
            } else {
                // CREATE NEW RECORD (POST)
                const res = await fetch("/api/admin/qp-models", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${currentToken}`
                    },
                    body: JSON.stringify({
                        modelName: activeTab,
                        data: payload
                    })
                });
                const json = await res.json();

                if (json.success) {
                    setMessage({
                        type: "success",
                        text: `${activeTab.replace("QP", "")} added successfully!`
                    });
                    setPage(1);
                    fetchRecords(activeTab, 1);
                    fetchReferences(activeTab);

                    // Keep select fields and visitLink for quick repetitive entries
                    const config = modelsConfig[activeTab];
                    const resetForm = { ...formData };
                    config.fields.forEach(f => {
                        if (f.type !== "select" && f.name !== "visitLink") {
                            resetForm[f.name] = "";
                        }
                    });
                    setFormData(resetForm);
                } else {
                    setMessage({
                        type: "error",
                        text: json.error || json.message || "Failed to save record"
                    });
                }
            }
        } catch (error) {
            setMessage({ type: "error", text: error.message });
        }
        setLoading(false);
    };

    // Delete handler (DELETE)
    const handleDelete = async (record) => {
        const currentToken = getAuthToken();
        if (!currentToken) {
            setMessage({
                type: "error",
                text: "Authentication required. Please log in with an Admin or Super Admin account to delete records."
            });
            return;
        }

        const modelLabel = activeTab.replace("QP", "");
        const confirmed = window.confirm(
            `Are you sure you want to delete this ${modelLabel} (ID: ${record._id})? This action cannot be undone.`
        );
        if (!confirmed) return;

        setActionLoadingId(String(record._id));
        try {
            const res = await fetch(`/api/admin/qp-models?model=${activeTab}&id=${record._id}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${currentToken}`
                },
                body: JSON.stringify({
                    modelName: activeTab,
                    id: record._id
                })
            });
            const json = await res.json();

            if (json.success) {
                setMessage({
                    type: "success",
                    text: `${modelLabel} deleted successfully!`
                });

                if (editingRecord && String(editingRecord._id) === String(record._id)) {
                    handleCancelEdit();
                }

                // Remove immediately from existing list
                setRecords(prev => prev.filter(r => String(r._id) !== String(record._id)));
                fetchReferences(activeTab);
            } else {
                setMessage({
                    type: "error",
                    text: json.error || json.message || "Failed to delete record"
                });
            }
        } catch (error) {
            setMessage({ type: "error", text: error.message });
        }
        setActionLoadingId(null);
    };

    const getReferenceLabel = (refModel, val) => {
        if (val === null || val === undefined) return "N/A";

        // If val is a populated object from Mongoose
        if (typeof val === "object") {
            if (refModel === "QPBatches") {
                if (val.startYear && val.endYear) return `${val.startYear}-${val.endYear}`;
            }
            if (refModel === "QPSemesters") {
                if (val.semesterNumber !== undefined) return `Sem ${val.semesterNumber}`;
            }
            if (val.name) return String(val.name);
            if (val.title) return String(val.title);
            if (val._id) {
                if (references[refModel] && Array.isArray(references[refModel])) {
                    const refDoc = references[refModel].find(r => String(r._id) === String(val._id));
                    if (refDoc) {
                        if (refModel === "QPBatches") return `${refDoc.startYear}-${refDoc.endYear}`;
                        if (refModel === "QPSemesters") return `Sem ${refDoc.semesterNumber}`;
                        if (refDoc.name) return String(refDoc.name);
                    }
                }
                return String(val._id);
            }
            return "N/A";
        }

        // If val is an ID string/number
        if (references[refModel] && Array.isArray(references[refModel])) {
            const refDoc = references[refModel].find(r => String(r._id) === String(val));
            if (refDoc) {
                if (refModel === "QPBatches") return `${refDoc.startYear}-${refDoc.endYear}`;
                if (refModel === "QPSemesters") return `Sem ${refDoc.semesterNumber}`;
                return String(refDoc.name || refDoc._id || val);
            }
        }

        return String(val);
    };

    return (
        <div className="qp-admin-container">
            <Navbar />
            <div className="qp-admin-content">
                <header className="qp-admin-header">
                    <h1>QP Admin Dashboard</h1>
                    <p>Manage Universities, Colleges, Semesters, ExamType, Batches, Subjects, Courses, and Images</p>
                </header>

                {/* Auth status indicator */}
                <div className="qp-admin-auth-bar">
                    <div>
                        <strong>Security & Permissions: </strong>
                        <span>Create, Edit, and Delete actions require an authenticated Admin / Super Admin token.</span>
                    </div>
                    <div>
                        {isAdmin ? (
                            <span className={`qp-auth-badge ${userRole}`}>
                                🛡️ Role: {userRole}
                            </span>
                        ) : (
                            <span className="qp-auth-badge unauthorized">
                                ⚠️ Non-Admin ({userRole || "Guest"})
                            </span>
                        )}
                    </div>
                </div>

                <div className="qp-admin-tabs">
                    {Object.keys(modelsConfig).map(model => (
                        <button
                            key={model}
                            className={`qp-admin-tab ${activeTab === model ? "active" : ""}`}
                            onClick={() => setActiveTab(model)}
                        >
                            {model.replace("QP", "")}
                        </button>
                    ))}
                    <button
                        className={`qp-admin-tab ${activeTab === "Viewer" ? "active" : ""}`}
                        onClick={() => setActiveTab("Viewer")}
                        style={{ borderLeft: "2px solid #e5e7eb", marginLeft: "10px", paddingLeft: "20px" }}
                    >
                        Viewer 👀
                    </button>
                    <Link
                        href="/admin/qp-api-tester"
                        className="qp-admin-tab"
                        style={{ marginLeft: "10px", textDecoration: "none", color: "inherit" }}
                    >
                        API Tester 🛠️
                    </Link>
                </div>

                {activeTab === "Viewer" ? (
                    <QPViewer />
                ) : (
                    <div className="qp-admin-main">
                        {/* Form Section */}
                        <div className="qp-admin-form-section">
                            <h2>
                                <span>{editingRecord ? `Edit ${activeTab.replace("QP", "")}` : `Create New ${activeTab.replace("QP", "")}`}</span>
                                {editingRecord && (
                                    <span className="qp-editing-badge">Editing Mode</span>
                                )}
                            </h2>

                            {editingRecord && (
                                <div className="qp-editing-banner">
                                    <span>Currently editing record <code>{editingRecord._id}</code></span>
                                    <button
                                        type="button"
                                        onClick={handleCancelEdit}
                                        style={{ background: "transparent", border: "none", color: "#1e40af", cursor: "pointer", fontWeight: 700 }}
                                    >
                                        ✕ Cancel
                                    </button>
                                </div>
                            )}

                            {message && (
                                <div className={`qp-admin-alert ${message.type}`}>
                                    {message.text}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="qp-admin-form">
                                {modelsConfig[activeTab].fields.map((field) => (
                                    <div key={field.name} className="qp-form-group">
                                        <label>
                                            {field.label || field.name} {field.required && <span className="required">*</span>}
                                        </label>

                                        {field.type === "text" || field.type === "number" ? (
                                            <input
                                                type={field.type}
                                                name={field.name}
                                                value={formData[field.name] ?? ""}
                                                onChange={handleInputChange}
                                                required={field.required}
                                                className="qp-input"
                                                disabled={loading}
                                            />
                                        ) : field.type === "checkbox" ? (
                                            <input
                                                type="checkbox"
                                                name={field.name}
                                                checked={Boolean(formData[field.name])}
                                                onChange={handleInputChange}
                                                className="qp-checkbox"
                                                disabled={loading}
                                            />
                                        ) : field.type === "select" ? (
                                            <select
                                                name={field.name}
                                                value={formData[field.name] || ""}
                                                onChange={handleInputChange}
                                                required={field.required}
                                                className="qp-input"
                                                disabled={loading}
                                            >
                                                <option value="">-- Select {field.name} --</option>
                                                {references[field.ref] && references[field.ref].map(refDoc => (
                                                    <option key={String(refDoc._id)} value={String(refDoc._id)}>
                                                        {field.ref === "QPBatches" ? `${refDoc.startYear}-${refDoc.endYear}` :
                                                            field.ref === "QPSemesters" ? `Semester ${refDoc.semesterNumber}` :
                                                                String(refDoc.name || refDoc._id)}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : null}
                                    </div>
                                ))}

                                <div className="qp-form-buttons">
                                    <button type="submit" disabled={loading} className="qp-submit-btn">
                                        {loading
                                            ? (editingRecord ? "Updating..." : "Saving...")
                                            : (editingRecord ? "Update Record" : "Save Record")}
                                    </button>

                                    {editingRecord && (
                                        <button
                                            type="button"
                                            onClick={handleCancelEdit}
                                            className="qp-cancel-btn"
                                            disabled={loading}
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* List Section (Latest records retrieval with Edit & Delete options) */}
                        <div className="qp-admin-list-section">
                            <h2>
                                <span>Existing {activeTab.replace("QP", "")} Records</span>
                                <span style={{ fontSize: "0.85rem", color: "#6b7280", fontWeight: 400 }}>
                                    {records.length} displayed
                                </span>
                            </h2>

                            <div className="qp-records-list">
                                {loading && records.length === 0 ? (
                                    <p>Loading latest records...</p>
                                ) : records.length === 0 ? (
                                    <p>No records found.</p>
                                ) : (
                                    records.map((record) => {
                                        const isBeingEdited = editingRecord && String(editingRecord._id) === String(record._id);
                                        const isDeleting = actionLoadingId === String(record._id);

                                        return (
                                            <div
                                                key={String(record._id)}
                                                className={`qp-record-card ${isBeingEdited ? "editing" : ""}`}
                                            >
                                                <div className="qp-record-header-row">
                                                    <div className="qp-record-meta-top">ID: {String(record._id)}</div>
                                                    {isBeingEdited && (
                                                        <span className="qp-editing-tag">Active Edit</span>
                                                    )}
                                                </div>

                                                <div className="qp-record-details">
                                                    {modelsConfig[activeTab].fields.map(f => (
                                                        <div key={f.name} className="qp-record-detail-item">
                                                            <span className="qp-record-detail-label">{f.name}: </span>
                                                            <span className="qp-record-detail-value">
                                                                {f.type === 'select' ?
                                                                    getReferenceLabel(f.ref, record[f.name]) :
                                                                    f.name === 'imageUrls' ?
                                                                        (Array.isArray(record[f.name]) ? record[f.name].length : 0) + " images" :
                                                                        typeof record[f.name] === 'object' && record[f.name] !== null ?
                                                                            (record[f.name].name || record[f.name].title || String(record[f.name]._id || 'N/A')) :
                                                                            String(record[f.name] ?? 'N/A')
                                                                }
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="qp-record-actions">
                                                    <button
                                                        type="button"
                                                        className="qp-btn-edit"
                                                        onClick={() => handleStartEdit(record)}
                                                        disabled={loading || isDeleting}
                                                        title="Edit this record"
                                                    >
                                                        ✏️ Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="qp-btn-delete"
                                                        onClick={() => handleDelete(record)}
                                                        disabled={loading || isDeleting}
                                                        title="Delete this record"
                                                    >
                                                        {isDeleting ? "Deleting..." : "🗑️ Delete"}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}

                                {page < totalPages && (
                                    <div style={{ textAlign: "center", marginTop: "20px" }}>
                                        <button
                                            className="qp-submit-btn"
                                            style={{ backgroundColor: "#6b7280", width: "auto", display: "inline-block", padding: "10px 20px" }}
                                            onClick={() => {
                                                const nextPage = page + 1;
                                                setPage(nextPage);
                                                fetchRecords(activeTab, nextPage);
                                            }}
                                            disabled={loading}
                                        >
                                            {loading ? "Loading..." : "View More"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
