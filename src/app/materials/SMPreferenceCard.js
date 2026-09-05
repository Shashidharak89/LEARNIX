"use client";

import React, { useState, useEffect } from "react";
import { FiChevronRight, FiChevronDown, FiBookmark, FiEdit2, FiTrash2, FiBookOpen, FiPlusCircle } from "react-icons/fi";
import SMDirectoryNode from "@/app/admin/study-materials/SMDirectoryNode";
import SMPreferenceSelector from "./SMPreferenceSelector";

export default function SMPreferenceCard() {
    const [preference, setPreference] = useState(null);
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Read stored preference on mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("sm_user_preference");
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    setPreference(parsed);
                } catch (e) {
                    console.error("Error parsing preference", e);
                }
            }
        }
    }, []);

    const fetchSubjects = async (pref) => {
        if (!pref || !pref.batchId) return;
        setLoading(true);
        setError("");
        try {
            const url = `/api/sm/v1/subjects/by-batch?collegeId=${pref.collegeId}&courseId=${pref.courseId}&semesterId=${pref.semesterId}&batchId=${pref.batchId}&page=1&limit=50`;
            const res = await fetch(url, { cache: "no-store" });
            const json = await res.json();
            if (json.success) {
                setSubjects(json.data || []);
            } else {
                setError(json.error || "Failed to load preference subjects");
            }
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    };

    const handleToggleExpand = () => {
        if (!expanded && subjects.length === 0 && preference) {
            fetchSubjects(preference);
        }
        setExpanded(!expanded);
    };

    const handleSavePreference = (newPref) => {
        setPreference(newPref);
        setSubjects([]);
        setExpanded(false);
        setIsSelectorOpen(false);
    };

    const handleClearPreference = (e) => {
        e.stopPropagation();
        if (typeof window !== "undefined") {
            localStorage.removeItem("sm_user_preference");
        }
        setPreference(null);
        setSubjects([]);
        setExpanded(false);
    };

    return (
        <div style={{ marginBottom: "20px" }}>
            {/* If no preference is set */}
            {!preference ? (
                <div 
                    onClick={() => setIsSelectorOpen(true)}
                    className="sm-pref-empty-card"
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div className="sm-pref-badge-icon">
                            <FiBookmark size={18} color="#7c3aed" />
                        </div>
                        <div>
                            <span className="sm-pref-empty-title">Your Preference</span>
                            <p className="sm-pref-empty-sub">Quickly access your Course & Subjects directly</p>
                        </div>
                    </div>
                    <button type="button" className="sm-pref-add-btn">
                        <FiPlusCircle size={15} />
                        Set Preference
                    </button>
                </div>
            ) : (
                /* Preference saved card (Collapsed by default) */
                <div className="sm-pref-card-container">
                    <div 
                        onClick={handleToggleExpand}
                        className={`sm-pref-card-header ${expanded ? "expanded" : ""}`}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", overflow: "hidden" }}>
                            <span style={{ color: "#7c3aed", display: "flex", alignItems: "center" }}>
                                {expanded ? <FiChevronDown size={20} /> : <FiChevronRight size={20} />}
                            </span>
                            <div className="sm-pref-badge-icon">
                                <FiBookmark size={18} color="#7c3aed" />
                            </div>
                            <div style={{ overflow: "hidden" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                    <span className="sm-pref-tag-badge">Your Preference</span>
                                    <h3 className="sm-pref-card-title">
                                        {preference.courseName} / Semester {preference.sem} / {preference.startyear}-{preference.endyear}
                                    </h3>
                                </div>
                                <p className="sm-pref-card-sub">
                                    {preference.collegeName} • {preference.universityName}
                                </p>
                            </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }} onClick={(e) => e.stopPropagation()}>
                            <button
                                type="button"
                                onClick={() => setIsSelectorOpen(true)}
                                className="sm-pref-action-btn edit"
                                title="Edit Preference"
                            >
                                <FiEdit2 size={14} />
                                Edit
                            </button>
                            <button
                                type="button"
                                onClick={handleClearPreference}
                                className="sm-pref-action-btn clear"
                                title="Clear Preference"
                            >
                                <FiTrash2 size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Expanded Subject Tree */}
                    {expanded && (
                        <div className="sm-pref-card-body">
                            {loading ? (
                                <p style={{ textAlign: "center", color: "#888", padding: "16px 0", fontSize: "14px" }}>
                                    Loading your subjects...
                                </p>
                            ) : error ? (
                                <p style={{ color: "red", textAlign: "center", padding: "16px 0", fontSize: "14px" }}>
                                    {error}
                                </p>
                            ) : subjects.length > 0 ? (
                                <div>
                                    <div style={{ 
                                        display: "flex", alignItems: "center", gap: "6px", 
                                        fontSize: "12px", fontWeight: "700", color: "#7c3aed", 
                                        marginBottom: "10px", paddingBottom: "6px", borderBottom: "1px dashed #e9d5ff" 
                                    }}>
                                        <FiBookOpen size={14} />
                                        <span>SUBJECTS ({subjects.length})</span>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                        {subjects.map(subj => (
                                            <SMDirectoryNode
                                                key={subj._id}
                                                type="subject"
                                                data={subj}
                                                parentParams={{
                                                    collegeId: preference.collegeId,
                                                    courseId: preference.courseId,
                                                    semesterId: preference.semesterId,
                                                    batchId: preference.batchId
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p style={{ textAlign: "center", color: "#888", padding: "16px 0", fontSize: "14px" }}>
                                    No subjects found for your selected preference.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Modal for setting or editing preference */}
            {isSelectorOpen && (
                <SMPreferenceSelector
                    currentPreference={preference}
                    onSave={handleSavePreference}
                    onClose={() => setIsSelectorOpen(false)}
                />
            )}
        </div>
    );
}
