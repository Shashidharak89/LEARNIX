"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
    FiTrash2, 
    FiPlus, 
    FiBookOpen, 
    FiMapPin, 
    FiAward, 
    FiLayers, 
    FiFileText, 
    FiCalendar, 
    FiArrowLeft,
    FiCheck,
    FiX,
    FiRefreshCw,
    FiClock
} from "react-icons/fi";
import "./SMAdmin.css";

const modelsConfig = {
    SMUniversity: {
        label: "Universities",
        icon: <FiAward />,
        fields: [
            { name: "name", type: "text", required: true, placeholder: "e.g. Visvesvaraya Technological University" },
            { name: "city", type: "text", placeholder: "e.g. Belagavi" },
            { name: "district", type: "text", placeholder: "e.g. Belagavi" }
        ]
    },
    SMCollege: {
        label: "Colleges",
        icon: <FiMapPin />,
        fields: [
            { name: "name", type: "text", required: true, placeholder: "e.g. NMAM Institute of Technology" },
            { name: "university", type: "select", ref: "SMUniversity", required: true },
            { name: "location", type: "text", placeholder: "e.g. Nitte, Karkala" }
        ]
    },
    SMCourse: {
        label: "Courses",
        icon: <FiLayers />,
        fields: [
            { name: "name", type: "text", required: true, placeholder: "e.g. Master of Computer Applications" }
        ]
    },
    SMSemester: {
        label: "Semesters",
        icon: <FiClock />,
        fields: [
            { name: "sem", type: "number", required: true, placeholder: "e.g. 1, 2, 3..." }
        ]
    },
    SMBatch: {
        label: "Batches",
        icon: <FiCalendar />,
        fields: [
            { name: "startyear", type: "number", required: true, placeholder: "e.g. 2023" },
            { name: "endyear", type: "number", required: true, placeholder: "e.g. 2025" }
        ]
    },
    SMSubject: {
        label: "Subjects",
        icon: <FiBookOpen />,
        fields: [
            { name: "name", type: "text", required: true, placeholder: "e.g. Data Structures and Algorithms" },
            { name: "college", type: "select", ref: "SMCollege", required: true },
            { name: "course", type: "select", ref: "SMCourse", required: true },
            { name: "sem", type: "select", ref: "SMSemester", required: true },
            { name: "batch", type: "select", ref: "SMBatch", required: true }
        ]
    },
    SMFiles: {
        label: "Study Files",
        icon: <FiFileText />,
        fields: [
            { name: "name", type: "text", label: "File Name (Optional)", required: false, placeholder: "e.g. Syllabus Unit 1" },
            { name: "fileurl", type: "text", label: "File URL", required: true, placeholder: "e.g. https://raw.githubusercontent.com/.../file.pdf" },
            { name: "sub", type: "select", label: "Subject", ref: "SMSubject", required: true },
            { name: "type", type: "select", label: "File Type", required: true, options: [
                { value: "default", label: "Default" },
                { value: "external", label: "External" }
            ], defaultValue: "default" }
        ]
    }
};

export default function SMAdmin() {
    const [activeTab, setActiveTab] = useState("SMUniversity");
    const [formData, setFormData] = useState({});
    const [records, setRecords] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [references, setReferences] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(null); // stores ID being deleted
    const [message, setMessage] = useState(null);
    const [fileUrls, setFileUrls] = useState([""]);

    const handleUrlChange = (index, value) => {
        const newUrls = [...fileUrls];
        newUrls[index] = value;
        setFileUrls(newUrls);
    };

    const addUrlField = () => {
        setFileUrls([...fileUrls, ""]);
    };

    const removeUrlField = (index) => {
        const newUrls = fileUrls.filter((_, i) => i !== index);
        setFileUrls(newUrls.length > 0 ? newUrls : [""]);
    };

    const fetchRecords = async (modelName, pageNum = 1) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/sm-models?model=${modelName}&page=${pageNum}&limit=15`, {
                cache: "no-store"
            });
            const json = await res.json();
            if (json.success) {
                if (pageNum === 1) {
                    setRecords(json.data);
                } else {
                    setRecords(prev => [...prev, ...json.data]);
                }
                setTotalPages(json.pagination?.totalPages || 1);
            }
        } catch (error) {
            console.error("Error fetching records:", error);
            setMessage({ type: "error", text: "Failed to load records." });
        }
        setLoading(false);
    };

    // Fetch records for the active tab
    useEffect(() => {
        setPage(1);
        setRecords([]);
        fetchRecords(activeTab, 1);
    }, [activeTab]);

    // Fetch references (e.g. for dropdowns)
    useEffect(() => {
        const refs = {};
        const config = modelsConfig[activeTab];
        const refModels = config.fields.filter(f => f.ref).map(f => f.ref);

        Promise.all(refModels.map(async (refModel) => {
            const res = await fetch(`/api/admin/sm-models?model=${refModel}`, {
                cache: "no-store"
            });
            const json = await res.json();
            if (json.success) {
                refs[refModel] = json.data;
            }
        })).then(() => {
            setReferences(refs);
        });

        // Reset form data
        const initialForm = {};
        config.fields.forEach(f => {
            initialForm[f.name] = f.defaultValue !== undefined ? f.defaultValue : "";
        });
        setFormData(initialForm);
        setFileUrls([""]);
        setMessage(null);
    }, [activeTab]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        setMessage(null);

        try {
            let submitData = formData;
            if (activeTab === "SMFiles") {
                const activeUrls = fileUrls.map(u => u.trim()).filter(Boolean);
                if (activeUrls.length === 0) {
                    setMessage({ type: "error", text: "Please enter at least one File URL." });
                    setSubmitLoading(false);
                    return;
                }
                const cleanUrl = (url) => {
                    if (!url) return url;
                    let cleaned = url;
                    if (cleaned.includes("github.com") && !cleaned.includes("raw.github.com")) {
                        cleaned = cleaned.replace(/github\.com/g, "raw.github.com");
                    }
                    return cleaned.replace(/\/blob\//g, "/")
                                  .replace(/\/bolb\//g, "/");
                };
                submitData = activeUrls.map(url => ({
                    name: formData.name || "",
                    fileurl: cleanUrl(url),
                    sub: formData.sub,
                    type: formData.type || "default"
                }));
            }

            const res = await fetch("/api/admin/sm-models", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    modelName: activeTab,
                    data: submitData
                })
            });
            const json = await res.json();

            if (json.success) {
                setMessage({ type: "success", text: "Record added successfully!" });
                setPage(1);
                fetchRecords(activeTab, 1); // refresh

                // Reset only text inputs, keep dropdowns populated to make batch entries easier
                const config = modelsConfig[activeTab];
                const resetForm = { ...formData };
                config.fields.forEach(f => {
                    if (f.type !== "select") {
                        resetForm[f.name] = "";
                    }
                });
                setFormData(resetForm);
                if (activeTab === "SMFiles") {
                    setFileUrls([""]);
                }
            } else {
                setMessage({ type: "error", text: json.error || json.message || "Failed to create record." });
            }
        } catch (error) {
            setMessage({ type: "error", text: error.message || "An unexpected error occurred." });
        }
        setSubmitLoading(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this record? This action cannot be undone.")) return;
        setDeleteLoading(id);
        setMessage(null);

        try {
            const res = await fetch(`/api/admin/sm-models?model=${activeTab}&id=${id}`, {
                method: "DELETE"
            });
            const json = await res.json();

            if (json.success) {
                setMessage({ type: "success", text: "Record deleted successfully." });
                // Filter out deleted record locally to avoid full reload
                setRecords(prev => prev.filter(r => r._id !== id));
            } else {
                setMessage({ type: "error", text: json.error || json.message || "Failed to delete record." });
            }
        } catch (error) {
            setMessage({ type: "error", text: error.message || "Failed to delete record." });
        }
        setDeleteLoading(null);
    };

    return (
        <div className="sm-admin-container">
            <div className="sm-admin-content">
                
                {/* Back to Dashboard Link */}
                <div className="sm-admin-back">
                    <Link href="/admin" className="sm-back-link">
                        <FiArrowLeft /> Back to Admin Dashboard
                    </Link>
                </div>

                <header className="sm-admin-header">
                    <div className="sm-header-badge">
                        <FiBookOpen />
                        <span>Study Materials Management</span>
                    </div>
                    <h1>Study Materials Control Panel</h1>
                    <p>Manage universities, colleges, courses, semesters, batches, subjects, and resource file URLs.</p>
                </header>

                {/* Tab Navigation */}
                <div className="sm-admin-tabs">
                    {Object.keys(modelsConfig).map(modelName => {
                        const config = modelsConfig[modelName];
                        return (
                            <button
                                key={modelName}
                                className={`sm-admin-tab ${activeTab === modelName ? "active" : ""}`}
                                onClick={() => setActiveTab(modelName)}
                            >
                                <span className="tab-icon">{config.icon}</span>
                                <span className="tab-label">{config.label}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="sm-admin-main">
                    
                    {/* Form Section */}
                    <div className="sm-admin-form-section">
                        <div className="section-header">
                            <span className="section-icon"><FiPlus /></span>
                            <h2>Add New {modelsConfig[activeTab].label.slice(0, -1)}</h2>
                        </div>

                        {message && (
                            <div className={`sm-admin-alert ${message.type}`}>
                                {message.type === "success" ? <FiCheck /> : <FiX />}
                                <span>{message.text}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="sm-admin-form">
                            {modelsConfig[activeTab].fields.map((field) => (
                                <div key={field.name} className="sm-form-group">
                                    <label>
                                        {field.label || field.name} {field.required && <span className="required">*</span>}
                                    </label>

                                    {activeTab === "SMFiles" && field.name === "fileurl" ? (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                            {fileUrls.map((url, idx) => (
                                                <div key={idx} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                                    <input
                                                        type="text"
                                                        value={url}
                                                        onChange={(e) => handleUrlChange(idx, e.target.value)}
                                                        placeholder={field.placeholder}
                                                        required={idx === 0}
                                                        className="sm-input"
                                                        style={{ flex: 1 }}
                                                    />
                                                    {fileUrls.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeUrlField(idx)}
                                                            style={{
                                                                background: "#fee2e2",
                                                                color: "#ef4444",
                                                                border: "1px solid #fecaca",
                                                                borderRadius: "6px",
                                                                width: "36px",
                                                                height: "36px",
                                                                cursor: "pointer",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                flexShrink: 0
                                                            }}
                                                            title="Remove URL"
                                                        >
                                                            <FiTrash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={addUrlField}
                                                style={{
                                                    alignSelf: "flex-start",
                                                    background: "#f3e8ff",
                                                    color: "#7c3aed",
                                                    border: "1px solid #d8b4fe",
                                                    borderRadius: "6px",
                                                    padding: "6px 12px",
                                                    fontSize: "12px",
                                                    fontWeight: "600",
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "4px"
                                                }}
                                            >
                                                <FiPlus size={14} /> Add URL Field
                                            </button>
                                        </div>
                                    ) : field.type === "text" || field.type === "number" ? (
                                        <input
                                            type={field.type}
                                            name={field.name}
                                            value={formData[field.name] || ""}
                                            onChange={handleInputChange}
                                            placeholder={field.placeholder}
                                            required={field.required}
                                            className="sm-input"
                                        />
                                    ) : field.type === "select" ? (
                                        <select
                                            name={field.name}
                                            value={formData[field.name] || ""}
                                            onChange={handleInputChange}
                                            required={field.required}
                                            className="sm-input"
                                        >
                                            <option value="">-- Select {field.label || field.name} --</option>
                                            {field.options && field.options.map(opt => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                            {!field.options && references[field.ref] && references[field.ref].map(refDoc => (
                                                <option key={refDoc._id} value={refDoc._id}>
                                                    {field.ref === "SMSemester" ? `Semester ${refDoc.sem}` :
                                                     field.ref === "SMBatch" ? `${refDoc.startyear}-${refDoc.endyear}` :
                                                     field.ref === "SMCollege" ? `${refDoc.name} (${refDoc.university?.name || "No University"})` :
                                                     field.ref === "SMSubject" ? `${refDoc.name} (${refDoc.course?.name || "Course"}, College: ${refDoc.college?.name || "College"}, Sem: ${refDoc.sem?.sem || "N/A"}, Batch: ${refDoc.batch ? refDoc.batch.startyear + "-" + refDoc.batch.endyear : "N/A"})` :
                                                     (refDoc.name || refDoc._id)}
                                                </option>
                                            ))}
                                        </select>
                                    ) : null}
                                </div>
                            ))}

                            <button type="submit" disabled={submitLoading} className="sm-submit-btn">
                                {submitLoading ? (
                                    <>
                                        <FiRefreshCw className="spin" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <span>Save Record</span>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Records List Section */}
                    <div className="sm-admin-list-section">
                        <div className="section-header">
                            <span className="section-icon"><FiLayers /></span>
                            <h2>Existing {modelsConfig[activeTab].label}</h2>
                        </div>

                        <div className="sm-records-list">
                            {loading && records.length === 0 ? (
                                <div className="sm-list-loader">
                                    <FiRefreshCw className="spin" />
                                    <p>Loading records...</p>
                                </div>
                            ) : records.length === 0 ? (
                                <div className="sm-empty-state">
                                    <p>No records found in the database.</p>
                                </div>
                            ) : (
                                <div className="sm-records-grid">
                                    {records.map((record) => (
                                        <div key={record._id} className="sm-record-card">
                                            <div className="sm-card-body">
                                                <span className="sm-record-id">ID: {record._id}</span>
                                                
                                                {/* Specialized rendering based on active model type */}
                                                {activeTab === "SMUniversity" && (
                                                    <div className="sm-card-details">
                                                        <h3 className="sm-record-title">{record.name}</h3>
                                                        <p className="sm-record-sub">City: {record.city || "N/A"} | District: {record.district || "N/A"}</p>
                                                    </div>
                                                )}

                                                {activeTab === "SMCollege" && (
                                                    <div className="sm-card-details">
                                                        <h3 className="sm-record-title">{record.name}</h3>
                                                        <p className="sm-record-sub">University: {record.university?.name || "N/A"}</p>
                                                        <p className="sm-record-sub">Location: {record.location || "N/A"}</p>
                                                    </div>
                                                )}

                                                {activeTab === "SMCourse" && (
                                                    <div className="sm-card-details">
                                                        <h3 className="sm-record-title">{record.name}</h3>
                                                    </div>
                                                )}

                                                {activeTab === "SMSemester" && (
                                                    <div className="sm-card-details">
                                                        <h3 className="sm-record-title">Semester {record.sem}</h3>
                                                    </div>
                                                )}

                                                {activeTab === "SMBatch" && (
                                                    <div className="sm-card-details">
                                                        <h3 className="sm-record-title">Batch: {record.startyear}-{record.endyear}</h3>
                                                    </div>
                                                )}

                                                {activeTab === "SMSubject" && (
                                                    <div className="sm-card-details">
                                                        <h3 className="sm-record-title">{record.name}</h3>
                                                        <p className="sm-record-sub">College: {record.college?.name || "N/A"}</p>
                                                        <p className="sm-record-sub">Course: {record.course?.name || "N/A"}</p>
                                                        <p className="sm-record-sub">Semester: {record.sem?.sem || "N/A"}</p>
                                                        <p className="sm-record-sub">Batch: {record.batch ? `${record.batch.startyear}-${record.batch.endyear}` : "N/A"}</p>
                                                    </div>
                                                )}

                                                {activeTab === "SMFiles" && (
                                                    <div className="sm-card-details">
                                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
                                                            <h3 className="sm-record-title" style={{ margin: 0 }}>
                                                                {record.name || decodeURIComponent(record.fileurl.split("/").pop().split("?")[0])}
                                                            </h3>
                                                            <span style={{
                                                                fontSize: "11px",
                                                                padding: "2px 6px",
                                                                borderRadius: "4px",
                                                                background: record.type === "external" ? "#fee2e2" : "#dcfce7",
                                                                color: record.type === "external" ? "#b91c1c" : "#166534",
                                                                fontWeight: "600",
                                                                textTransform: "capitalize"
                                                            }}>
                                                                {record.type || "default"}
                                                            </span>
                                                        </div>
                                                        <h4 className="sm-record-sub" style={{ marginTop: "4px", fontWeight: "bold" }}>File URL:</h4>
                                                        <a href={record.fileurl} target="_blank" rel="noopener noreferrer" className="sm-file-link" style={{ wordBreak: "break-all", display: "block", marginBottom: "8px" }}>
                                                            {record.fileurl}
                                                        </a>
                                                        <p className="sm-record-sub">Subject: {record.sub?.name || "N/A"}</p>
                                                        {record.sub?.college && (
                                                            <p className="sm-record-sub">College: {record.sub.college.name}</p>
                                                        )}
                                                        {record.sub?.sem && (
                                                            <p className="sm-record-sub">Semester: {record.sub.sem.sem}</p>
                                                        )}
                                                        {record.sub?.batch && (
                                                            <p className="sm-record-sub">Batch: {record.sub.batch.startyear}-{record.sub.batch.endyear}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="sm-card-actions">
                                                <button 
                                                    onClick={() => handleDelete(record._id)} 
                                                    disabled={deleteLoading === record._id}
                                                    className="sm-delete-btn"
                                                    title="Delete Record"
                                                >
                                                    {deleteLoading === record._id ? (
                                                        <FiRefreshCw className="spin" />
                                                    ) : (
                                                        <FiTrash2 />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {page < totalPages && (
                                <div className="sm-view-more-container">
                                    <button 
                                        className="sm-view-more-btn"
                                        onClick={() => {
                                            const nextPage = page + 1;
                                            setPage(nextPage);
                                            fetchRecords(activeTab, nextPage);
                                        }}
                                        disabled={loading}
                                    >
                                        {loading ? "Loading..." : "Load More"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
