"use client";

import React, { useState, useEffect } from "react";
import { FiChevronRight, FiChevronDown, FiBookmark, FiPlusCircle, FiTrash2 } from "react-icons/fi";
import SMDirectoryNode from "@/app/admin/study-materials/SMDirectoryNode";
import SMPreferenceSelector from "./SMPreferenceSelector";

export default function SMPreferenceCard() {
    const [preferences, setPreferences] = useState([]);
    const [expandedMap, setExpandedMap] = useState({});
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);

    const loadPreferences = () => {
        if (typeof window !== "undefined") {
            try {
                const stored = localStorage.getItem("sm_user_preferences");
                if (stored) {
                    setPreferences(JSON.parse(stored));
                } else {
                    // Migration check from single sm_user_preference
                    const single = localStorage.getItem("sm_user_preference");
                    if (single) {
                        const parsed = JSON.parse(single);
                        const prefId = `batch_${parsed.batchId}`;
                        const title = `${parsed.courseName} / Semester ${parsed.sem} / ${parsed.startyear}-${parsed.endyear}`;
                        const subtitle = `${parsed.collegeName} • ${parsed.universityName}`;
                        const migrated = [{
                            id: prefId,
                            type: "batch",
                            data: { _id: parsed.batchId, startyear: parsed.startyear, endyear: parsed.endyear },
                            parentParams: { collegeId: parsed.collegeId, courseId: parsed.courseId, semesterId: parsed.semesterId },
                            title,
                            subtitle
                        }];
                        localStorage.setItem("sm_user_preferences", JSON.stringify(migrated));
                        localStorage.removeItem("sm_user_preference");
                        setPreferences(migrated);
                    } else {
                        setPreferences([]);
                    }
                }
            } catch (e) {
                console.error("Error parsing preferences", e);
            }
        }
    };

    useEffect(() => {
        loadPreferences();
        const handleUpdate = () => loadPreferences();
        window.addEventListener("sm_preference_updated", handleUpdate);
        return () => window.removeEventListener("sm_preference_updated", handleUpdate);
    }, []);

    const toggleExpand = (prefId) => {
        setExpandedMap(prev => ({
            ...prev,
            [prefId]: !prev[prefId]
        }));
    };

    const handleRemovePreference = (prefId, e) => {
        e.stopPropagation();
        if (typeof window !== "undefined") {
            try {
                const updated = preferences.filter(p => p.id !== prefId);
                localStorage.setItem("sm_user_preferences", JSON.stringify(updated));
                setPreferences(updated);
                window.dispatchEvent(new Event("sm_preference_updated"));
            } catch (err) {
                console.error("Failed to remove preference", err);
            }
        }
    };

    const handleSaveFromModal = (newPref) => {
        if (typeof window !== "undefined") {
            try {
                const prefId = `batch_${newPref.batchId}`;
                const title = `${newPref.courseName} / Semester ${newPref.sem} / ${newPref.startyear}-${newPref.endyear}`;
                const subtitle = `${newPref.collegeName} • ${newPref.universityName}`;
                const item = {
                    id: prefId,
                    type: "batch",
                    data: { _id: newPref.batchId, startyear: newPref.startyear, endyear: newPref.endyear },
                    parentParams: { collegeId: newPref.collegeId, courseId: newPref.courseId, semesterId: newPref.semesterId },
                    title,
                    subtitle
                };

                let list = JSON.parse(localStorage.getItem("sm_user_preferences") || "[]");
                if (!list.some(p => p.id === prefId)) {
                    list.push(item);
                    localStorage.setItem("sm_user_preferences", JSON.stringify(list));
                    window.dispatchEvent(new Event("sm_preference_updated"));
                }
            } catch (err) {
                console.error("Failed to save modal preference", err);
            }
        }
        setIsSelectorOpen(false);
    };

    return (
        <div style={{ marginBottom: "14px" }}>
            {/* If no preferences are set */}
            {preferences.length === 0 ? (
                <div 
                    onClick={() => setIsSelectorOpen(true)}
                    className="sm-pref-empty-card"
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div className="sm-pref-badge-icon">
                            <FiBookmark size={16} color="#0ea5e9" />
                        </div>
                        <div>
                            <span className="sm-pref-empty-title">Your Preferences</span>
                            <p className="sm-pref-empty-sub">
                                Select preferences below in the directory tree or configure one here
                            </p>
                        </div>
                    </div>
                    <button type="button" className="sm-pref-add-btn">
                        <FiPlusCircle size={15} />
                        Set Preference
                    </button>
                </div>
            ) : (
                /* Multiple Preferences List */
                <div className="sm-pref-list-container">
                    <div className="sm-pref-list-header">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <FiBookmark size={16} color="#0ea5e9" />
                            <h3 className="sm-pref-list-title">
                                Your Preferences 
                                <span className="sm-pref-count-tag">{preferences.length}</span>
                            </h3>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsSelectorOpen(true)}
                            className="sm-pref-add-btn-sm"
                        >
                            <FiPlusCircle size={14} />
                            Add Preference
                        </button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
                        {preferences.map((pref) => {
                            const isExpanded = !!expandedMap[pref.id];
                            return (
                                <div key={pref.id} className="sm-pref-card-container">
                                    <div 
                                        onClick={() => toggleExpand(pref.id)}
                                        className={`sm-pref-card-header ${isExpanded ? "expanded" : ""}`}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px", overflow: "hidden" }}>
                                            <span style={{ color: "#0ea5e9", display: "flex", alignItems: "center" }}>
                                                {isExpanded ? <FiChevronDown size={20} /> : <FiChevronRight size={20} />}
                                            </span>
                                            <div style={{ overflow: "hidden" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                                    <span className="sm-pref-type-tag">{pref.type}</span>
                                                    <h4 className="sm-pref-card-title">{pref.title}</h4>
                                                </div>
                                                {pref.subtitle && (
                                                    <p className="sm-pref-card-sub">{pref.subtitle}</p>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={(e) => handleRemovePreference(pref.id, e)}
                                            className="sm-pref-action-btn clear"
                                            title="Remove Preference"
                                        >
                                            <FiTrash2 size={14} />
                                        </button>
                                    </div>

                                    {/* Expanded Tree for this Preference */}
                                    {isExpanded && (
                                        <div className="sm-pref-card-body">
                                            <SMDirectoryNode
                                                level={0}
                                                type={pref.type}
                                                data={pref.data}
                                                parentParams={pref.parentParams || {}}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Modal for setting new preference */}
            {isSelectorOpen && (
                <SMPreferenceSelector
                    onSave={handleSaveFromModal}
                    onClose={() => setIsSelectorOpen(false)}
                />
            )}
        </div>
    );
}
