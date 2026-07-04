"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/app/components/Navbar";
import "./QPAdmin.css";

const modelsConfig = {
    QPUniversities: {
        fields: [
            { name: "name", type: "text", required: true },
            { name: "code", type: "text", required: true },
            { name: "state", type: "text" },
            { name: "country", type: "text", default: "India" },
            { name: "isActive", type: "checkbox", default: true }
        ]
    },
    QPColleges: {
        fields: [
            { name: "name", type: "text", required: true },
            { name: "code", type: "text", required: true },
            { name: "university", type: "select", ref: "QPUniversities" },
            { name: "city", type: "text" },
            { name: "state", type: "text" },
            { name: "isActive", type: "checkbox", default: true }
        ]
    },
    QPSemesters: {
        fields: [
            { name: "semesterNumber", type: "number", required: true },
            { name: "name", type: "text", required: true },
            { name: "duration", type: "text", default: "6 months" },
            { name: "isActive", type: "checkbox", default: true }
        ]
    },
    QPExamType: {
        fields: [
            { name: "name", type: "text", required: true },
            { name: "code", type: "text", required: true },
            { name: "description", type: "text" },
            { name: "isInternal", type: "checkbox", default: false },
            { name: "maxMarks", type: "number", default: 100 },
            { name: "isActive", type: "checkbox", default: true }
        ]
    },
    QPBatches: {
        fields: [
            { name: "year", type: "number", required: true },
            { name: "name", type: "text", required: true },
            { name: "startYear", type: "number", required: true },
            { name: "endYear", type: "number", required: true },
            { name: "description", type: "text" },
            { name: "isActive", type: "checkbox", default: true }
        ]
    },
    QPSubjects: {
        fields: [
            { name: "name", type: "text", required: true },
            { name: "code", type: "text", required: true },
            { name: "semester", type: "select", ref: "QPSemesters" },
            { name: "college", type: "select", ref: "QPColleges" },
            { name: "credits", type: "number", default: 4 },
            { name: "description", type: "text" },
            { name: "isActive", type: "checkbox", default: true }
        ]
    },
    QPImages: {
        fields: [
            { name: "semister", type: "text", required: true, label: "Semester Name (e.g. MCA Semester 1)" },
            { name: "batchname", type: "text", required: true, label: "Batch Name (e.g. 2022-2024)" },
            { name: "finalId", type: "text", required: true, label: "Final ID (e.g. QP0103)" },
            { name: "subjectName", type: "text", required: true, label: "Subject Name" },
            { name: "imageUrls", type: "text", label: "Image URLs (comma separated)" },
            { name: "visitlink", type: "text", label: "Visit Link (comma separated)" }
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
        fetchRecords(activeTab);
    }, [activeTab]);

    // Fetch references (e.g. for dropdowns)
    useEffect(() => {
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
            // Reconstruct nested JSON format for QPImages
            const imageUrlsList = payload.imageUrls ? payload.imageUrls.split(',').map(s => s.trim()).filter(Boolean) : [];
            const visitLinksList = payload.visitlink ? payload.visitlink.split(',').map(s => s.trim()).filter(Boolean) : [];

            payload = {
                semister: payload.semister,
                batches: [
                    {
                        batchname: payload.batchname,
                        final: {
                            id: payload.finalId,
                            imageurls: {
                                [payload.subjectName]: imageUrlsList
                            },
                            visitlink: visitLinksList
                        }
                    }
                ]
            };
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
            } else {
                setMessage({ type: "error", text: json.error || json.message });
            }
        } catch (error) {
            setMessage({ type: "error", text: error.message });
        }
        setLoading(false);
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
                </div>

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
                                                    {refDoc.name || refDoc.semesterNumber || refDoc._id}
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
                                        {activeTab === "QPImages" ? (
                                            <div>
                                                <strong>{record.semister}</strong>
                                                <pre className="qp-json-preview">
                                                    {JSON.stringify(record.batches, null, 2)}
                                                </pre>
                                            </div>
                                        ) : (
                                            <div>
                                                <strong>{record.name || record.semesterNumber || record.year}</strong>
                                                <span className="qp-record-code">{record.code && ` (${record.code})`}</span>
                                            </div>
                                        )}
                                        <div className="qp-record-meta">ID: {record._id}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
