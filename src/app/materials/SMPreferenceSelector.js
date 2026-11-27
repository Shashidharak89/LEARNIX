"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FiChevronDown, FiX } from "react-icons/fi";
import { PinIcon } from "@animateicons/react/lucide";
import "../qp/styles/QPFilterSearch.css";

function SearchableDropdown({ label, placeholder, options, value, onChange, loading, getOptionLabel }) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [menuPosition, setMenuPosition] = useState(null);
    const dropdownRef = useRef(null);
    const menuRef = useRef(null);
    const searchRef = useRef(null);
    const selectedLabel = value ? getOptionLabel(value) : "";
    const filteredOptions = options.filter((option) => getOptionLabel(option).toLowerCase().includes(query.trim().toLowerCase()));

    useEffect(() => {
        const onPointerDown = (event) => {
            if (
                dropdownRef.current && !dropdownRef.current.contains(event.target) &&
                menuRef.current && !menuRef.current.contains(event.target)
            ) setIsOpen(false);
        };
        document.addEventListener("mousedown", onPointerDown);
        return () => document.removeEventListener("mousedown", onPointerDown);
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        const updateMenuPosition = () => {
            const trigger = dropdownRef.current?.querySelector(".qp-dropdown-trigger");
            if (!trigger) return;

            const rect = trigger.getBoundingClientRect();
            const viewportMargin = 12;
            const gap = 6;
            const desiredHeight = Math.min(290, window.innerHeight - viewportMargin * 2);
            const spaceBelow = window.innerHeight - rect.bottom - viewportMargin;
            const spaceAbove = rect.top - viewportMargin;
            const openAbove = spaceBelow < Math.min(220, desiredHeight) && spaceAbove > spaceBelow;
            const availableHeight = Math.max(120, Math.min(desiredHeight, openAbove ? spaceAbove - gap : spaceBelow - gap));
            const width = Math.min(rect.width, window.innerWidth - viewportMargin * 2);
            const left = Math.max(viewportMargin, Math.min(rect.left, window.innerWidth - width - viewportMargin));
            setMenuPosition({
                position: "fixed",
                top: openAbove ? Math.max(viewportMargin, rect.top - availableHeight - gap) : rect.bottom + gap,
                left,
                width,
                maxHeight: availableHeight,
                zIndex: 10001,
            });
        };

        updateMenuPosition();
        window.addEventListener("resize", updateMenuPosition);
        window.addEventListener("scroll", updateMenuPosition, true);
        const timer = window.setTimeout(() => searchRef.current?.focus(), 50);
        return () => {
            window.clearTimeout(timer);
            window.removeEventListener("resize", updateMenuPosition);
            window.removeEventListener("scroll", updateMenuPosition, true);
        };
    }, [isOpen]);

    const choose = (option) => {
        onChange(option);
        setIsOpen(false);
        setQuery("");
    };

    return (
        <div className="sm-pref-search-dropdown qp-custom-dropdown" ref={dropdownRef}>
            <label className="qp-dropdown-label">{label}</label>
            <div
                className={`qp-dropdown-trigger ${isOpen ? "is-open" : ""}`}
                onClick={() => !loading && setIsOpen((open) => !open)}
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        if (!loading) setIsOpen((open) => !open);
                    }
                }}
                role="button"
                tabIndex={loading ? -1 : 0}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-disabled={loading}
            >
                <span className={`qp-dropdown-trigger__text ${!selectedLabel ? "is-placeholder" : ""}`} title={selectedLabel || placeholder}>
                    {loading ? "Loading…" : selectedLabel || placeholder}
                </span>
                <span className="qp-dropdown-trigger__actions">
                    {value && (
                        <button
                            type="button"
                            className="qp-dropdown-clear-btn"
                            title="Clear selection"
                            aria-label={`Clear ${label.toLowerCase()} selection`}
                            onClick={(event) => { event.stopPropagation(); choose(null); }}
                        >
                            <FiX size={16} />
                        </button>
                    )}
                    <FiChevronDown size={17} className="qp-dropdown-chevron" />
                </span>
            </div>

            {isOpen && menuPosition && typeof document !== "undefined" && createPortal(
                <div ref={menuRef} className="qp-dropdown-menu sm-pref-portal-menu" style={menuPosition} role="listbox" aria-label={label}>
                    <div className="qp-dropdown-search-wrap">
                        <input
                            ref={searchRef}
                            className="qp-dropdown-search-input"
                            type="search"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            onKeyDown={(event) => event.stopPropagation()}
                            placeholder={`Search ${label.toLowerCase()}…`}
                            aria-label={`Search ${label.toLowerCase()}`}
                        />
                        {query && (
                            <button type="button" className="qp-dropdown-search-clear" onClick={() => setQuery("")} aria-label="Clear search">
                                <FiX size={14} />
                            </button>
                        )}
                    </div>
                    <button type="button" className="qp-dropdown-item is-placeholder" onClick={() => choose(null)}>
                        {placeholder}
                    </button>
                    {filteredOptions.length === 0 ? (
                        <div className="qp-dropdown-empty">No matches found</div>
                    ) : filteredOptions.map((option) => {
                        const optionLabel = getOptionLabel(option);
                        return (
                            <button
                                type="button"
                                key={option._id}
                                role="option"
                                aria-selected={value?._id === option._id}
                                className={`qp-dropdown-item ${value?._id === option._id ? "is-selected" : ""}`}
                                onClick={() => choose(option)}
                            >
                                {optionLabel}
                            </button>
                        );
                    })}
                </div>,
                document.body,
            )}
        </div>
    );
}

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

        onSave(pref);
    };

    const isComplete = selectedUni && selectedCollege && selectedCourse && selectedSem && selectedBatch;

    const modalBookmarkRef = useRef(null);
    const saveCheckRef = useRef(null);

    return (
        <div className="sm-pref-modal-overlay">
            <div className="sm-pref-modal">
                <div 
                    className="sm-pref-modal-header"
                    onMouseEnter={() => modalBookmarkRef.current?.startAnimation?.()}
                    onMouseLeave={() => modalBookmarkRef.current?.stopAnimation?.()}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <PinIcon ref={modalBookmarkRef} size={22} color="#0ea5e9" className="sm-pref-icon" />
                        <div>
                            <h3 className="sm-pref-modal-title">Pin a folder</h3>
                            <p className="sm-pref-modal-subtitle">Choose a batch to pin above the directory.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="sm-pref-close-btn" aria-label="Close modal">
                        <FiX size={20} />
                    </button>
                </div>

                <div className="sm-pref-modal-body">
                    <SearchableDropdown
                        label="1. Select University"
                        placeholder="Choose university"
                        options={universities}
                        value={selectedUni}
                        loading={loadingUnis}
                        getOptionLabel={(option) => option.name}
                        onChange={(option) => {
                            setSelectedUni(option);
                            setSelectedCollege(null);
                            setSelectedCourse(null);
                            setSelectedSem(null);
                            setSelectedBatch(null);
                        }}
                    />

                    {/* Step 2: College */}
                    {selectedUni && (
                        <SearchableDropdown
                            label="2. Select College"
                            placeholder="Choose college"
                            options={colleges}
                            value={selectedCollege}
                            loading={loadingColleges}
                            getOptionLabel={(option) => option.name}
                            onChange={(option) => {
                                setSelectedCollege(option);
                                setSelectedCourse(null);
                                setSelectedSem(null);
                                setSelectedBatch(null);
                            }}
                        />
                    )}

                    {/* Step 3: Course */}
                    {selectedCollege && (
                        <SearchableDropdown
                            label="3. Select Course"
                            placeholder="Choose course"
                            options={courses}
                            value={selectedCourse}
                            loading={loadingCourses}
                            getOptionLabel={(option) => option.name}
                            onChange={(option) => {
                                setSelectedCourse(option);
                                setSelectedSem(null);
                                setSelectedBatch(null);
                            }}
                        />
                    )}

                    {/* Step 4: Semester */}
                    {selectedCourse && (
                        <SearchableDropdown
                            label="4. Select Semester"
                            placeholder="Choose semester"
                            options={semesters}
                            value={selectedSem}
                            loading={loadingSemesters}
                            getOptionLabel={(option) => `Semester ${option.sem}`}
                            onChange={(option) => {
                                setSelectedSem(option);
                                setSelectedBatch(null);
                            }}
                        />
                    )}

                    {/* Step 5: Batch */}
                    {selectedSem && (
                        <SearchableDropdown
                            label="5. Select Batch"
                            placeholder="Choose batch"
                            options={batches}
                            value={selectedBatch}
                            loading={loadingBatches}
                            getOptionLabel={(option) => `Batch ${option.startyear}-${option.endyear}`}
                            onChange={setSelectedBatch}
                        />
                    )}

                    {/* Summary Preview */}
                    {isComplete && (
                        <div className="sm-pref-preview">
                            <span className="sm-pref-preview-tag">Selected folder</span>
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
                        onMouseEnter={() => saveCheckRef.current?.startAnimation?.()}
                        onMouseLeave={() => saveCheckRef.current?.stopAnimation?.()}
                        className={`sm-pref-save-btn ${isComplete ? "active" : ""}`}
                    >
                        <PinIcon ref={saveCheckRef} size={16} />
                        Pin to top
                    </button>
                </div>
            </div>
        </div>
    );
}
