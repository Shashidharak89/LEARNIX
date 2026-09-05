"use client";

import React, { useState, useEffect } from "react";
import { FiX, FiCheck, FiBookmark, FiChevronRight } from "react-icons/fi";

export default function SMPreferenceSelector({ currentPreference, onSave, onClose }) {
    const [universities, setUniversities] = useState([]);
    const [colleges, setColleges] = useState([]);
    const [courses, setCourses] = useState([]);
    const [semesters, setSemesters] = useState([]);
    const [batches, setBatches] = useState([]);

    const [selectedUni, setSelectedUni] = useState(null);
    const [selectedCollege, setSelectedCollege] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedSem, setSelectedSem] = useState(null);
    const [selectedBatch, setSelectedBatch] = useState(null);

    const [loadingUnis, setLoadingUnis] = useState(false);
    const [loadingColleges, setLoadingColleges] = useState(false);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [loadingSemesters, setLoadingSemesters] = useState(false);
    const [loadingBatches, setLoadingBatches] = useState(false);

    // Fetch Universities on mount
    useEffect(() => {
        const fetchUnis = async () => {
            setLoadingUnis(true);
            try {
                const res = await fetch("/api/sm/v1/universities?page=1&limit=100");
                const json = await res.json();
                if (json.success) {
                    setUniversities(json.data || []);
                }
            } catch (err) {
                console.error("Failed to load universities", err);
            }
            setLoadingUnis(false);
        };
        fetchUnis();
    }, []);

    // Fetch Colleges when University changes
    useEffect(() => {
        if (!selectedUni) {
            setColleges([]);
            setSelectedCollege(null);
            return;
        }
        const fetchColleges = async () => {
            setLoadingColleges(true);
            try {
                const res = await fetch(`/api/sm/v1/colleges/by-university?universityId=${selectedUni._id}&limit=100`);
                const json = await res.json();
                if (json.success) {
                    setColleges(json.data || []);
                }
            } catch (err) {
                console.error("Failed to load colleges", err);
            }
            setLoadingColleges(false);
        };
        fetchColleges();
    }, [selectedUni]);

    // Fetch Courses when College changes
    useEffect(() => {
        if (!selectedCollege) {
            setCourses([]);
            setSelectedCourse(null);
            return;
        }
        const fetchCourses = async () => {
            setLoadingCourses(true);
            try {
                const res = await fetch(`/api/sm/v1/courses/by-college?collegeId=${selectedCollege._id}&limit=100`);
                const json = await res.json();
                if (json.success) {
                    setCourses(json.data || []);
                }
            } catch (err) {
                console.error("Failed to load courses", err);
            }
            setLoadingCourses(false);
        };
        fetchCourses();
    }, [selectedCollege]);

    // Fetch Semesters when Course changes
    useEffect(() => {
        if (!selectedCourse || !selectedCollege) {
            setSemesters([]);
            setSelectedSem(null);
            return;
        }
        const fetchSemesters = async () => {
            setLoadingSemesters(true);
            try {
                const res = await fetch(`/api/sm/v1/semesters/by-course?collegeId=${selectedCollege._id}&courseId=${selectedCourse._id}&limit=100`);
                const json = await res.json();
                if (json.success) {
                    setSemesters(json.data || []);
                }
            } catch (err) {
                console.error("Failed to load semesters", err);
            }
            setLoadingSemesters(false);
        };
        fetchSemesters();
    }, [selectedCourse, selectedCollege]);

    // Fetch Batches when Semester changes
    useEffect(() => {
        if (!selectedSem || !selectedCourse || !selectedCollege) {
            setBatches([]);
            setSelectedBatch(null);
            return;
        }
        const fetchBatches = async () => {
            setLoadingBatches(true);
            try {
                const res = await fetch(`/api/sm/v1/batches/by-semester?collegeId=${selectedCollege._id}&courseId=${selectedCourse._id}&semesterId=${selectedSem._id}&limit=100`);
                const json = await res.json();
                if (json.success) {
                    setBatches(json.data || []);
                }
            } catch (err) {
                console.error("Failed to load batches", err);
            }
            setLoadingBatches(false);
        };
        fetchBatches();
    }, [selectedSem, selectedCourse, selectedCollege]);

    const handleSave = () => {
        if (!selectedUni || !selectedCollege || !selectedCourse || !selectedSem || !selectedBatch) return;

        const pref = {
            universityId: selectedUni._id,
            universityName: selectedUni.name,
            collegeId: selectedCollege._id,
            collegeName: selectedCollege.name,
            courseId: selectedCourse._id,
            courseName: selectedCourse.name,
            semesterId: selectedSem._id,
            sem: selectedSem.sem,
            batchId: selectedBatch._id,
            startyear: selectedBatch.startyear,
            endyear: selectedBatch.endyear
        };

        if (typeof window !== "undefined") {
            localStorage.setItem("sm_user_preference", JSON.stringify(pref));
        }
        onSave(pref);
    };

    const isComplete = selectedUni && selectedCollege && selectedCourse && selectedSem && selectedBatch;

    return (
        <div className="sm-pref-modal-overlay">
            <div className="sm-pref-modal">
                <div className="sm-pref-modal-header">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <FiBookmark className="sm-pref-icon" />
                        <div>
                            <h3 className="sm-pref-modal-title">Set Your Preference</h3>
                            <p className="sm-pref-modal-subtitle">Quickly jump directly to your course & subjects</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="sm-pref-close-btn" aria-label="Close modal">
                        <FiX size={20} />
                    </button>
                </div>

                <div className="sm-pref-modal-body">
                    {/* Step 1: University */}
                    <div className="sm-pref-field">
                        <label className="sm-pref-label">1. Select University</label>
                        <select
                            className="sm-pref-select"
                            value={selectedUni ? selectedUni._id : ""}
                            onChange={(e) => {
                                const found = universities.find(u => u._id === e.target.value);
                                setSelectedUni(found || null);
                                setSelectedCollege(null);
                                setSelectedCourse(null);
                                setSelectedSem(null);
                                setSelectedBatch(null);
                            }}
                            disabled={loadingUnis}
                        >
                            <option value="">{loadingUnis ? "Loading Universities..." : "-- Choose University --"}</option>
                            {universities.map(u => (
                                <option key={u._id} value={u._id}>{u.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Step 2: College */}
                    {selectedUni && (
                        <div className="sm-pref-field">
                            <label className="sm-pref-label">2. Select College</label>
                            <select
                                className="sm-pref-select"
                                value={selectedCollege ? selectedCollege._id : ""}
                                onChange={(e) => {
                                    const found = colleges.find(c => c._id === e.target.value);
                                    setSelectedCollege(found || null);
                                    setSelectedCourse(null);
                                    setSelectedSem(null);
                                    setSelectedBatch(null);
                                }}
                                disabled={loadingColleges}
                            >
                                <option value="">{loadingColleges ? "Loading Colleges..." : "-- Choose College --"}</option>
                                {colleges.map(c => (
                                    <option key={c._id} value={c._id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Step 3: Course */}
                    {selectedCollege && (
                        <div className="sm-pref-field">
                            <label className="sm-pref-label">3. Select Course</label>
                            <select
                                className="sm-pref-select"
                                value={selectedCourse ? selectedCourse._id : ""}
                                onChange={(e) => {
                                    const found = courses.find(cr => cr._id === e.target.value);
                                    setSelectedCourse(found || null);
                                    setSelectedSem(null);
                                    setSelectedBatch(null);
                                }}
                                disabled={loadingCourses}
                            >
                                <option value="">{loadingCourses ? "Loading Courses..." : "-- Choose Course --"}</option>
                                {courses.map(cr => (
                                    <option key={cr._id} value={cr._id}>{cr.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Step 4: Semester */}
                    {selectedCourse && (
                        <div className="sm-pref-field">
                            <label className="sm-pref-label">4. Select Semester</label>
                            <select
                                className="sm-pref-select"
                                value={selectedSem ? selectedSem._id : ""}
                                onChange={(e) => {
                                    const found = semesters.find(s => s._id === e.target.value);
                                    setSelectedSem(found || null);
                                    setSelectedBatch(null);
                                }}
                                disabled={loadingSemesters}
                            >
                                <option value="">{loadingSemesters ? "Loading Semesters..." : "-- Choose Semester --"}</option>
                                {semesters.map(s => (
                                    <option key={s._id} value={s._id}>Semester {s.sem}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Step 5: Batch */}
                    {selectedSem && (
                        <div className="sm-pref-field">
                            <label className="sm-pref-label">5. Select Batch</label>
                            <select
                                className="sm-pref-select"
                                value={selectedBatch ? selectedBatch._id : ""}
                                onChange={(e) => {
                                    const found = batches.find(b => b._id === e.target.value);
                                    setSelectedBatch(found || null);
                                }}
                                disabled={loadingBatches}
                            >
                                <option value="">{loadingBatches ? "Loading Batches..." : "-- Choose Batch --"}</option>
                                {batches.map(b => (
                                    <option key={b._id} value={b._id}>Batch {b.startyear}-{b.endyear}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Summary Preview */}
                    {isComplete && (
                        <div className="sm-pref-preview">
                            <span className="sm-pref-preview-tag">Preference Selected:</span>
                            <div className="sm-pref-preview-title">
                                {selectedCourse.name} / Semester {selectedSem.sem} / {selectedBatch.startyear}-{selectedBatch.endyear}
                            </div>
                            <div className="sm-pref-preview-sub">
                                {selectedCollege.name} • {selectedUni.name}
                            </div>
                        </div>
                    )}
                </div>

                <div className="sm-pref-modal-footer">
                    <button type="button" onClick={onClose} className="sm-pref-cancel-btn">
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={!isComplete}
                        className={`sm-pref-save-btn ${isComplete ? "active" : ""}`}
                    >
                        <FiCheck size={16} />
                        Save Preference
                    </button>
                </div>
            </div>
        </div>
    );
}
