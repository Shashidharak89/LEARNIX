"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
    ChevronRightIcon, 
    ChevronDownIcon, 
    BookmarkIcon, 
    CirclePlusIcon, 
    Trash2Icon 
} from "@animateicons/react/lucide";
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

    const emptyBookmarkRef = useRef(null);
    const emptyPlusRef = useRef(null);
    const listBookmarkRef = useRef(null);
    const listPlusRef = useRef(null);

    return (
        <div className="sm-pref-card-section">
            {/* If no preferences are set */}
            {preferences.length === 0 ? (
                <div 
                    onClick={() => setIsSelectorOpen(true)}
                    onMouseEnter={() => {
                        emptyBookmarkRef.current?.startAnimation?.();
                        emptyPlusRef.current?.startAnimation?.();
                    }}
                    onMouseLeave={() => {
                        emptyBookmarkRef.current?.stopAnimation?.();
                        emptyPlusRef.current?.stopAnimation?.();
                    }}
                    className="sm-pref-empty-card"
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div className="sm-pref-badge-icon">
                            <BookmarkIcon ref={emptyBookmarkRef} size={18} color="#0ea5e9" />
                        </div>
                        <div>
                            <span className="sm-pref-empty-title">Your Preferences</span>
                            <p className="sm-pref-empty-sub">
                                Select preferences below in the directory tree or configure one here
                            </p>
                        </div>
                    </div>
                    <button type="button" className="sm-pref-add-btn">
                        <CirclePlusIcon ref={emptyPlusRef} size={16} />
                        <span>Set Preference</span>
                    </button>
                </div>
            ) : (
                /* Multiple Preferences List */
                <div className="sm-pref-list-container">
                    <div className="sm-pref-list-header">
                        <div 
                            style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
                            onMouseEnter={() => listBookmarkRef.current?.startAnimation?.()}
                            onMouseLeave={() => listBookmarkRef.current?.stopAnimation?.()}
                        >
                            <BookmarkIcon ref={listBookmarkRef} size={18} color="#0ea5e9" />
                            <h3 className="sm-pref-list-title">
                                Your Preferences 
                                <span className="sm-pref-count-tag">{preferences.length}</span>
                            </h3>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsSelectorOpen(true)}
                            onMouseEnter={() => listPlusRef.current?.startAnimation?.()}
                            onMouseLeave={() => listPlusRef.current?.stopAnimation?.()}
                            className="sm-pref-add-btn-sm"
                        >
                            <CirclePlusIcon ref={listPlusRef} size={15} />
                            <span>Add Preference</span>
                        </button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
                        {preferences.map((pref) => {
                            const isExpanded = !!expandedMap[pref.id];
                            return (
                                <PreferenceRow
                                    key={pref.id}
                                    pref={pref}
                                    isExpanded={isExpanded}
                                    toggleExpand={toggleExpand}
                                    onRemove={handleRemovePreference}
                                />
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

function PreferenceRow({ pref, isExpanded, toggleExpand, onRemove }) {
    const trashRef = useRef(null);

    return (
        <div className="sm-pref-card-container">
            <div 
                onClick={() => toggleExpand(pref.id)}
                className={`sm-pref-card-header ${isExpanded ? "expanded" : ""}`}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", overflow: "hidden" }}>
                    <span style={{ color: "#0ea5e9", display: "flex", alignItems: "center" }}>
                        {isExpanded ? <ChevronDownIcon size={20} /> : <ChevronRightIcon size={20} />}
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
                    onClick={(e) => onRemove(pref.id, e)}
                    onMouseEnter={() => trashRef.current?.startAnimation?.()}
                    onMouseLeave={() => trashRef.current?.stopAnimation?.()}
                    className="sm-pref-action-btn clear"
                    title="Remove Preference"
                >
                    <Trash2Icon ref={trashRef} size={15} />
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
                        autoExpand={true}
                    />
                </div>
            )}
        </div>
    );
}
