"use client";

import React, { useState, useEffect } from "react";
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

export default function QPAdminPage() {
    const [activeTab, setActiveTab] = useState("QPUniversities");
    const [formData, setFormData] = useState({});
    const [records, setRecords] = useState([]);
    const [references, setReferences] = useState({});
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    // Fetch records for the active tab
    useEffect(() => {
        if (activeTab === "Viewer") return;
        fetchRecords(activeTab);
    }, [activeTab]);

    // Fetch references (e.g. for dropdowns)
    useEffect(() => {
        if (activeTab === "Viewer") return;

        const refs = {};
        const config = modelsConfig[activeTab];
        const refModels = config.fields.filter(f => f.ref).map(f => f.ref);

        Promise.all(refModels.map(async (refModel) => {
            const res = await fetch(`/api/admin/qp-models?model=${refModel}`);
            const json = await res.json();
            if (json.success) {
                refs[refModel] = json.data;
            }
        })).then(() => {
            setReferences(refs);
        });

        // Reset form
        const initialForm = {};
        config.fields.forEach(f => {
            initialForm[f.name] = f.default !== undefined ? f.default : (f.type === "checkbox" ? false : "");
        });
        setFormData(initialForm);
        setMessage(null);
    }, [activeTab]);

    const fetchRecords = async (modelName) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/qp-models?model=${modelName}`);
            const json = await res.json();
            if (json.success) {
                setRecords(json.data);
            }
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        let payload = { ...formData };

        if (activeTab === "QPImages") {
            const imageUrlsList = payload.imageUrls ? payload.imageUrls.split(',').map(s => s.trim()).filter(Boolean) : [];
            payload.imageUrls = imageUrlsList;
        }

        try {
            const res = await fetch("/api/admin/qp-models", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    modelName: activeTab,
                    data: payload
                })
            });
            const json = await res.json();

            if (json.success) {
                setMessage({ type: "success", text: "Record added successfully!" });
                fetchRecords(activeTab); // refresh

                // Keep references and reset other fields if needed, but a full reset is simpler
                const config = modelsConfig[activeTab];
                const resetForm = { ...formData };
                config.fields.forEach(f => {
                    if (f.type !== "select") {
                        resetForm[f.name] = "";
                    }
                });
                setFormData(resetForm);
            } else {
                setMessage({ type: "error", text: json.error || json.message });
            }
        } catch (error) {
            setMessage({ type: "error", text: error.message });
        }
        setLoading(false);
    };

    const getReferenceLabel = (refModel, id) => {
        if (!references[refModel]) return id;
        const refDoc = references[refModel].find(r => r._id === id);
        if (!refDoc) return id;

        if (refModel === "QPBatches") return `${refDoc.startYear}-${refDoc.endYear}`;
        if (refModel === "QPSemesters") return `Sem ${refDoc.semesterNumber}`;
        return refDoc.name || id;
    };

    return (
        <div className="qp-admin-container">
            <Navbar />
            <div className="qp-admin-content">
                <header className="qp-admin-header">
                    <h1>QP Admin Dashboard</h1>
                    <p>Manage Universities, Colleges, Semesters, Subjects, and Questions</p>
                </header>

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
                        <div className="qp-admin-form-section">
                            <h2>Create New {activeTab.replace("QP", "")}</h2>
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
                                                value={formData[field.name] || ""}
                                                onChange={handleInputChange}
                                                required={field.required}
                                                className="qp-input"
                                            />
                                        ) : field.type === "checkbox" ? (
                                            <input
                                                type="checkbox"
                                                name={field.name}
                                                checked={formData[field.name] || false}
                                                onChange={handleInputChange}
                                                className="qp-checkbox"
                                            />
                                        ) : field.type === "select" ? (
                                            <select
                                                name={field.name}
                                                value={formData[field.name] || ""}
                                                onChange={handleInputChange}
                                                required={field.required}
                                                className="qp-input"
                                            >
                                                <option value="">-- Select {field.name} --</option>
                                                {references[field.ref] && references[field.ref].map(refDoc => (
                                                    <option key={refDoc._id} value={refDoc._id}>
                                                        {field.ref === "QPBatches" ? `${refDoc.startYear}-${refDoc.endYear}` :
                                                            field.ref === "QPSemesters" ? `Semester ${refDoc.semesterNumber}` :
                                                                (refDoc.name || refDoc._id)}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : null}
                                    </div>
                                ))}
                                <button type="submit" disabled={loading} className="qp-submit-btn">
                                    {loading ? "Saving..." : "Save Record"}
                                </button>
                            </form>
                        </div>

                        <div className="qp-admin-list-section">
                            <h2>Existing {activeTab.replace("QP", "")} Records</h2>
                            <div className="qp-records-list">
                                {loading && records.length === 0 ? (
                                    <p>Loading...</p>
                                ) : records.length === 0 ? (
                                    <p>No records found.</p>
                                ) : (
                                    records.map((record) => (
                                        <div key={record._id} className="qp-record-card">
                                            <div className="qp-record-meta-top">ID: {record._id}</div>
                                            <div className="qp-record-details">
                                                {modelsConfig[activeTab].fields.map(f => (
                                                    <div key={f.name} className="qp-record-detail-item">
                                                        <span className="qp-record-detail-label">{f.name}: </span>
                                                        <span className="qp-record-detail-value">
                                                            {f.type === 'select' ?
                                                                getReferenceLabel(f.ref, record[f.name]) :
                                                                f.name === 'imageUrls' ?
                                                                    (record[f.name] && record[f.name].length) + " images" :
                                                                    String(record[f.name] || 'N/A')
                                                            }
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
