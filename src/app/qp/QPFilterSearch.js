"use client";

import { useState, useEffect, useRef } from "react";
import { FiChevronDown, FiFileText, FiX, FiBookmark, FiSliders, FiInbox } from "react-icons/fi";
import {
    toggleLearnLaterClient,
    checkLearnLaterStatusClient,
    isItemInLearnLaterStorage,
} from "@/lib/clientLearnLater";
import "./styles/QPFilterSearch.css";

function QPFilterBookmarkButton({ payload }) {
    const targetId = payload.targetId;
    const [isSaved, setIsSaved] = useState(() => isItemInLearnLaterStorage(payload.type, targetId));
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let mounted = true;
        if (targetId) {
            if (isItemInLearnLaterStorage(payload.type, targetId)) {
                setIsSaved(true);
            }
            checkLearnLaterStatusClient([{ type: payload.type, targetId }])
                .then((res) => {
                    if (mounted && res) {
                        if (res[`${payload.type}#${targetId}`] || res[`${payload.type}:${targetId}`] || res[targetId]) {
                            setIsSaved(true);
                        } else if (res[`${payload.type}#${targetId}`] === false || res[`${payload.type}:${targetId}`] === false) {
                            setIsSaved(false);
                        }
                    }
                })
                .catch(() => {});
        }
        return () => {
            mounted = false;
        };
    }, [payload.type, targetId]);

    useEffect(() => {
        const handleUpdate = (e) => {
            const eTargetId = e.detail?.item?.targetId || e.detail?.targetId;
            const eItemId = e.detail?.itemId;
            if (
                eTargetId === targetId ||
                eItemId === `${payload.type}#${targetId}` ||
                eItemId === `${payload.type}:${targetId}`
            ) {
                if (e.detail?.isSaved !== undefined) {
                    setIsSaved(e.detail.isSaved);
                }
            }
        };
        window.addEventListener("learnix:learn-later-updated", handleUpdate);
        return () => window.removeEventListener("learnix:learn-later-updated", handleUpdate);
    }, [payload.type, targetId]);

    const handleClick = async (e) => {
        e.stopPropagation();
        if (loading) return;
        setLoading(true);
        try {
            const res = await toggleLearnLaterClient(payload);
            if (res && res.success) {
                setIsSaved(res.isSaved);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            type="button"
            title={isSaved ? "Saved in Learn Later" : "Add to Learn Later"}
            aria-label={isSaved ? "Saved in Learn Later" : "Add to Learn Later"}
            onClick={handleClick}
            className={`qp-filter-bookmark-btn ${isSaved ? "is-bookmarked" : ""}`}
            disabled={loading}
        >
            <FiBookmark size={18} style={isSaved ? { fill: "#8b5cf6", color: "#8b5cf6" } : {}} />
        </button>
    );
}

// Custom Dropdown Component with keyword search support
const CustomDropdown = ({ 
    label, 
    options, 
    value, 
    onChange, 
    onLoadMore, 
    hasMore, 
    loading, 
    placeholder,
    searchKeyword = "",
    onSearchChange = null,
    searchPlaceholder = "Type to search..."
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Focus search input when opened
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 50);
        }
    }, [isOpen]);

    const selectedOption = options.find(opt => opt._id === value);
    const selectedText = selectedOption
        ? (selectedOption.name || (selectedOption.semesterNumber ? `Semester ${selectedOption.semesterNumber}` : "") || (selectedOption.startYear ? `${selectedOption.startYear}-${selectedOption.endYear}` : ""))
        : null;

    // Local filter if server-side search is not provided or in addition
    const filteredOptions = onSearchChange 
        ? options 
        : (searchKeyword 
            ? options.filter(opt => {
                const text = (opt.name || (opt.semesterNumber ? `Semester ${opt.semesterNumber}` : "") || (opt.startYear ? `${opt.startYear}-${opt.endYear}` : "")).toLowerCase();
                return text.includes(searchKeyword.toLowerCase());
            })
            : options);

    return (
        <div className="qp-custom-dropdown" ref={dropdownRef}>
            <label className="qp-dropdown-label">{label}</label>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className={`qp-dropdown-trigger ${isOpen ? "is-open" : ""}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setIsOpen(!isOpen); } }}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span 
                    className={`qp-dropdown-trigger__text ${!selectedText ? "is-placeholder" : ""}`}
                    title={selectedText || placeholder}
                >
                    {selectedText || placeholder}
                </span>
                <div className="qp-dropdown-trigger__actions">
                    {value && (
                        <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onChange(""); setIsOpen(false); }}
                            className="qp-dropdown-clear-btn"
                            title="Clear selection"
                            aria-label="Clear selection"
                        >
                            <FiX size={16} />
                        </button>
                    )}
                    <FiChevronDown size={17} className="qp-dropdown-chevron" />
                </div>
            </div>

            {isOpen && (
                <div className="qp-dropdown-menu" role="listbox">
                    <div className="qp-dropdown-search-wrap" onClick={(e) => e.stopPropagation()}>
                        <input
                            ref={searchInputRef}
                            type="text"
                            className="qp-dropdown-search-input"
                            placeholder={searchPlaceholder}
                            value={searchKeyword}
                            onChange={(e) => {
                                if (onSearchChange) onSearchChange(e.target.value);
                            }}
                            onKeyDown={(e) => e.stopPropagation()}
                        />
                        {searchKeyword && (
                            <button
                                type="button"
                                className="qp-dropdown-search-clear"
                                onClick={() => {
                                    if (onSearchChange) onSearchChange("");
                                }}
                            >
                                <FiX size={14} />
                            </button>
                        )}
                    </div>

                    <div 
                        onClick={() => { onChange(""); setIsOpen(false); }}
                        className="qp-dropdown-item is-placeholder"
                        role="option"
                        aria-selected={!value}
                    >
                        {placeholder}
                    </div>

                    {filteredOptions.length === 0 && !loading && (
                        <div className="qp-dropdown-empty">
                            No matches found
                        </div>
                    )}

                    {filteredOptions.map(opt => {
                        const displayName = opt.name || (opt.semesterNumber ? `Semester ${opt.semesterNumber}` : "") || `${opt.startYear}-${opt.endYear}`;
                        const isSelected = value === opt._id;
                        return (
                            <div 
                                key={opt._id}
                                onClick={() => { onChange(opt._id); setIsOpen(false); }}
                                className={`qp-dropdown-item ${isSelected ? "is-selected" : ""}`}
                                role="option"
                                aria-selected={isSelected}
                            >
                                {displayName}
                            </div>
                        );
                    })}
                    
                    {loading && (
                        <div className="qp-dropdown-loading">
                            Loading options...
                        </div>
                    )}
                    
                    {!loading && hasMore && (
                        <div 
                            onClick={(e) => { e.stopPropagation(); onLoadMore(); }}
                            className="qp-dropdown-loadmore"
                            role="button"
                            tabIndex={0}
                        >
                            View More...
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default function QPFilterSearch() {
    // Search Keywords for Dropdowns
    const [searchTerms, setSearchTerms] = useState({
        universities: "", colleges: "", courses: "", semesters: "", batches: "", subjects: ""
    });

    // Dropdown Data States
    const [data, setData] = useState({
        universities: [], colleges: [], courses: [], semesters: [], batches: [], subjects: []
    });
    
    // Pagination States for Dropdowns
    const [pages, setPages] = useState({
        universities: { current: 1, total: 1 }, colleges: { current: 1, total: 1 }, 
        courses: { current: 1, total: 1 }, semesters: { current: 1, total: 1 }, 
        batches: { current: 1, total: 1 }, subjects: { current: 1, total: 1 }
    });

    const [loadingDropdown, setLoadingDropdown] = useState({
        universities: false, colleges: false, courses: false, semesters: false, batches: false, subjects: false
    });

    // Selected Values
    const [filters, setFilters] = useState({
        university: "", college: "", course: "", semester: "", batch: "", subject: ""
    });

    // Results State
    const [results, setResults] = useState([]);
    const [resultsPage, setResultsPage] = useState(1);
    const [resultsTotalPages, setResultsTotalPages] = useState(1);
    const [loadingResults, setLoadingResults] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const fetchDropdownData = async (type, endpoint, append = false) => {
        setLoadingDropdown(prev => ({ ...prev, [type]: true }));
        try {
            const res = await fetch(endpoint);
            const json = await res.json();
            if (json.success) {
                setData(prev => ({
                    ...prev,
                    [type]: append ? [...prev[type], ...json.data] : json.data
                }));
                setPages(prev => ({
                    ...prev,
                    [type]: { current: json.pagination?.page || 1, total: json.pagination?.totalPages || 1 }
                }));
            }
        } catch (err) {
            console.error(`Error fetching ${type}:`, err);
        } finally {
            setLoadingDropdown(prev => ({ ...prev, [type]: false }));
        }
    };

    // Helper to build dropdown endpoints
    const getDropdownEndpoint = (type, page = 1, query = "") => {
        const qParam = query ? `&q=${encodeURIComponent(query)}` : "";
        if (type === "universities") {
            return `/api/qp/v1/universities?page=${page}&limit=20${qParam}`;
        }
        if (type === "batches") {
            return `/api/qp/v1/batches?page=${page}&limit=20${qParam}`;
        }
        if (type === "colleges") {
            if (filters.university) {
                return `/api/qp/v1/colleges/by-university?universityId=${filters.university}&page=${page}&limit=20${qParam}`;
            }
            return `/api/qp/v1/colleges?page=${page}&limit=20${qParam}`;
        }
        if (type === "courses") {
            if (filters.college) {
                return `/api/qp/v1/courses/by-college?collegeId=${filters.college}&page=${page}&limit=20${qParam}`;
            } else if (filters.university) {
                return `/api/qp/v1/courses/by-college?universityId=${filters.university}&page=${page}&limit=20${qParam}`;
            }
            return `/api/qp/v1/courses?page=${page}&limit=20${qParam}`;
        }
        if (type === "semesters") {
            let ep = `/api/qp/v1/semesters/by-course?page=${page}&limit=20${qParam}`;
            if (filters.college) ep += `&collegeId=${filters.college}`;
            if (filters.course) ep += `&courseId=${filters.course}`;
            if (filters.university) ep += `&universityId=${filters.university}`;
            return ep;
        }
        if (type === "subjects") {
            let ep = `/api/qp/v1/subjects/by-semester?page=${page}&limit=20${qParam}`;
            if (filters.college) ep += `&collegeId=${filters.college}`;
            if (filters.course) ep += `&courseId=${filters.course}`;
            if (filters.semester) ep += `&semesterId=${filters.semester}`;
            if (filters.university) ep += `&universityId=${filters.university}`;
            return ep;
        }
        return "";
    };

    // Initial Fetch for Top-Level Dropdowns
    useEffect(() => {
        fetchDropdownData("universities", getDropdownEndpoint("universities", 1, searchTerms.universities));
        fetchDropdownData("batches", getDropdownEndpoint("batches", 1, searchTerms.batches));
    }, []);

    // Debounced search for universities
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchDropdownData("universities", getDropdownEndpoint("universities", 1, searchTerms.universities));
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerms.universities]);

    // Debounced search for batches
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchDropdownData("batches", getDropdownEndpoint("batches", 1, searchTerms.batches));
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerms.batches]);

    // Fetch Cascading Data on Filter / Search Change for Colleges
    useEffect(() => {
        const timer = setTimeout(() => {
            if (filters.university) {
                fetchDropdownData("colleges", getDropdownEndpoint("colleges", 1, searchTerms.colleges));
            } else {
                setData(prev => ({ ...prev, colleges: [] }));
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [filters.university, searchTerms.colleges]);

    // Fetch Cascading Data on Filter / Search Change for Courses
    useEffect(() => {
        const timer = setTimeout(() => {
            if (filters.college || filters.university) {
                fetchDropdownData("courses", getDropdownEndpoint("courses", 1, searchTerms.courses));
            } else {
                setData(prev => ({ ...prev, courses: [] }));
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [filters.college, filters.university, searchTerms.courses]);

    // Fetch Cascading Data on Filter / Search Change for Semesters
    useEffect(() => {
        const timer = setTimeout(() => {
            if (filters.course || filters.college || filters.university) {
                fetchDropdownData("semesters", getDropdownEndpoint("semesters", 1, searchTerms.semesters));
            } else {
                setData(prev => ({ ...prev, semesters: [] }));
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [filters.course, filters.college, filters.university, searchTerms.semesters]);

    // Fetch Cascading Data on Filter / Search Change for Subjects
    useEffect(() => {
        const timer = setTimeout(() => {
            if (filters.semester || filters.course || filters.college || filters.university) {
                fetchDropdownData("subjects", getDropdownEndpoint("subjects", 1, searchTerms.subjects));
            } else {
                setData(prev => ({ ...prev, subjects: [] }));
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [filters.semester, filters.course, filters.college, filters.university, searchTerms.subjects]);

    // Manual Fetch Results Trigger
    const handleSearch = () => {
        setResultsPage(1);
        setHasSearched(true);
        fetchResults(1, true);
    };

    const handleDropdownLoadMore = (type) => {
        const p = pages[type];
        if (p.current < p.total) {
            const nextPage = p.current + 1;
            const endpoint = getDropdownEndpoint(type, nextPage, searchTerms[type]);
            if (endpoint) fetchDropdownData(type, endpoint, true);
        }
    };

    const fetchResults = async (pageNum, isNewSearch = false) => {
        setLoadingResults(true);
        try {
            let endpoint = `/api/qp/v1/compiled/groups?page=${pageNum}&limit=20`;
            
            // Build query params based on selected filters
            if (filters.subject) endpoint += `&subjectId=${filters.subject}`;
            if (filters.college) endpoint += `&collegeId=${filters.college}`;
            if (filters.batch) endpoint += `&batchId=${filters.batch}`;
            if (filters.course) endpoint += `&courseId=${filters.course}`;
            if (filters.semester) endpoint += `&semesterId=${filters.semester}`;

            const res = await fetch(endpoint);
            const json = await res.json();
            
            if (json.success) {
                if (isNewSearch) {
                    setResults(json.data || []);
                } else {
                    setResults(prev => [...prev, ...(json.data || [])]);
                }
                setResultsTotalPages(json.pagination?.totalPages || 1);
            }
        } catch (err) {
            console.error("Error fetching results:", err);
        }
        setLoadingResults(false);
    };

    const handleLoadMoreResults = () => {
        if (resultsPage < resultsTotalPages && !loadingResults) {
            const nextPage = resultsPage + 1;
            setResultsPage(nextPage);
            fetchResults(nextPage, false);
        }
    };

    return (
        <section className="qp-filter-search-wrap" aria-labelledby="qp-filter-heading">
            {/* Title Card */}
            <header className="qp-filter-title-card">
                <div className="qp-filter-title-badge" aria-hidden="true">
                    <FiSliders size={26} />
                </div>
                <div className="qp-filter-title-content">
                    <h2 id="qp-filter-heading" className="qp-filter-title">
                        Advanced Filter Search
                    </h2>
                    <p className="qp-filter-subtitle">
                        Narrow down question papers by selecting specific criteria.
                    </p>
                </div>
            </header>

            {/* Filter Selection Card */}
            <div className="qp-filter-card">
                <div className="qp-filter-grid">
                    <CustomDropdown 
                        label="University" 
                        placeholder="All Universities"
                        options={data.universities} 
                        value={filters.university} 
                        onChange={(val) => setFilters(prev => ({ ...prev, university: val, college: "", course: "", semester: "", subject: "" }))} 
                        hasMore={pages.universities.current < pages.universities.total}
                        onLoadMore={() => handleDropdownLoadMore("universities")}
                        loading={loadingDropdown.universities}
                        searchKeyword={searchTerms.universities}
                        onSearchChange={(val) => setSearchTerms(prev => ({ ...prev, universities: val }))}
                        searchPlaceholder="Search University..."
                    />
                    
                    <CustomDropdown 
                        label="College" 
                        placeholder={filters.university ? "All Colleges" : "Select University First"}
                        options={data.colleges} 
                        value={filters.college} 
                        onChange={(val) => setFilters(prev => ({ ...prev, college: val, course: "", semester: "", subject: "" }))} 
                        hasMore={pages.colleges.current < pages.colleges.total}
                        onLoadMore={() => handleDropdownLoadMore("colleges")}
                        loading={loadingDropdown.colleges}
                        searchKeyword={searchTerms.colleges}
                        onSearchChange={(val) => setSearchTerms(prev => ({ ...prev, colleges: val }))}
                        searchPlaceholder="Search College..."
                    />

                    <CustomDropdown 
                        label="Course" 
                        placeholder={filters.college || filters.university ? "All Courses" : "Select University/College First"}
                        options={data.courses} 
                        value={filters.course} 
                        onChange={(val) => setFilters(prev => ({ ...prev, course: val, semester: "", subject: "" }))} 
                        hasMore={pages.courses.current < pages.courses.total}
                        onLoadMore={() => handleDropdownLoadMore("courses")}
                        loading={loadingDropdown.courses}
                        searchKeyword={searchTerms.courses}
                        onSearchChange={(val) => setSearchTerms(prev => ({ ...prev, courses: val }))}
                        searchPlaceholder="Search Course..."
                    />

                    <CustomDropdown 
                        label="Semester" 
                        placeholder={filters.course || filters.college || filters.university ? "All Semesters" : "Select Course First"}
                        options={data.semesters} 
                        value={filters.semester} 
                        onChange={(val) => setFilters(prev => ({ ...prev, semester: val, subject: "" }))} 
                        hasMore={pages.semesters.current < pages.semesters.total}
                        onLoadMore={() => handleDropdownLoadMore("semesters")}
                        loading={loadingDropdown.semesters}
                        searchKeyword={searchTerms.semesters}
                        onSearchChange={(val) => setSearchTerms(prev => ({ ...prev, semesters: val }))}
                        searchPlaceholder="Search Semester..."
                    />

                    <CustomDropdown 
                        label="Batch" 
                        placeholder="All Batches"
                        options={data.batches.map(b => ({ ...b, name: `${b.startYear}-${b.endYear}` }))} 
                        value={filters.batch} 
                        onChange={(val) => setFilters(prev => ({ ...prev, batch: val }))} 
                        hasMore={pages.batches.current < pages.batches.total}
                        onLoadMore={() => handleDropdownLoadMore("batches")}
                        loading={loadingDropdown.batches}
                        searchKeyword={searchTerms.batches}
                        onSearchChange={(val) => setSearchTerms(prev => ({ ...prev, batches: val }))}
                        searchPlaceholder="Search Batch..."
                    />

                    <CustomDropdown 
                        label="Subject" 
                        placeholder={filters.semester || filters.course || filters.college || filters.university ? "All Subjects" : "Select Semester First"}
                        options={data.subjects} 
                        value={filters.subject} 
                        onChange={(val) => setFilters(prev => ({ ...prev, subject: val }))} 
                        hasMore={pages.subjects.current < pages.subjects.total}
                        onLoadMore={() => handleDropdownLoadMore("subjects")}
                        loading={loadingDropdown.subjects}
                        searchKeyword={searchTerms.subjects}
                        onSearchChange={(val) => setSearchTerms(prev => ({ ...prev, subjects: val }))}
                        searchPlaceholder="Search Subject..."
                    />
                </div>
                
                <div className="qp-filter-action-wrap">
                    <button 
                        type="button"
                        onClick={handleSearch}
                        disabled={loadingResults}
                        className="qp-filter-search-btn"
                        aria-label="Search Question Papers"
                    >
                        {loadingResults ? (
                            <span className="qp-dots-loader" aria-hidden="true">
                                <span className="qp-dot" />
                                <span className="qp-dot" />
                                <span className="qp-dot" />
                            </span>
                        ) : (
                            <span>Search Question Papers</span>
                        )}
                    </button>
                </div>
            </div>

            {/* Results Section */}
            {(hasSearched || results.length > 0) && (
                <div className="qp-filter-results">
                    <div className="qp-filter-results-head">
                        <h3 className="qp-filter-results-title">Filtered Question Papers</h3>
                        {results.length > 0 && (
                            <span className="qp-filter-results-badge">
                                {results.length} result{results.length === 1 ? "" : "s"}
                            </span>
                        )}
                    </div>
                    
                    {loadingResults && results.length === 0 ? (
                        <div className="qp-filter-state-card">
                            <span className="qp-spinner-sm" aria-hidden="true" />
                            <p className="qp-filter-state-title">Loading Question Papers...</p>
                            <p className="qp-filter-state-desc">Searching records matching your selected filter criteria.</p>
                        </div>
                    ) : results.length === 0 ? (
                        <div className="qp-filter-state-card">
                            <div className="qp-filter-state-icon" aria-hidden="true">
                                <FiInbox />
                            </div>
                            <h4 className="qp-filter-state-title">No question papers found</h4>
                            <p className="qp-filter-state-desc">
                                No question papers found for the selected filters. Try adjusting or clearing some filters above.
                            </p>
                        </div>
                    ) : (
                        <div>
                            <div className="qp-filter-results-grid">
                                {results.map((group, i) => {
                                    if (group.type === "subject") {
                                        const subName = group.subject ? group.subject.name : "Unknown Subject";
                                        return (
                                            <div key={i} className="qp-filter-res-card">
                                                <div className="qp-filter-res-top">
                                                    <span className="qp-filter-res-tag qp-filter-res-tag--blue">
                                                        Subject Match
                                                    </span>
                                                    <h4 className="qp-filter-res-name">
                                                        {subName}
                                                    </h4>
                                                    <p className="qp-filter-res-desc">
                                                        Contains compiled papers ({group.recordCount || 0} records) for this subject.
                                                    </p>
                                                </div>
                                                <div className="qp-filter-res-actions">
                                                    <a 
                                                        href={group.subject ? `/qp/subject/${group.subject._id}` : "#"} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="qp-filter-view-btn"
                                                    >
                                                        <FiFileText size={17} /> View Question Papers
                                                    </a>
                                                    <QPFilterBookmarkButton
                                                        payload={{
                                                            type: "question-paper",
                                                            targetId: group.subject?._id || `subj-${i}`,
                                                            title: `${group.subject?.name || 'Subject'} - Question Papers`,
                                                            subtitle: "Question Papers",
                                                            description: `Compiled question papers for ${group.subject?.name || 'Subject'}`,
                                                            url: `/qp/subject/${group.subject?._id || ''}`,
                                                            metadata: {
                                                                subjectName: group.subject?.name,
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        const batchName = group.batch ? `${group.batch.startYear}-${group.batch.endYear}` : "General";
                                        const examName = group.examtype ? group.examtype.name : "Exam";
                                        
                                        // Build query parameters for compiled view
                                        const queryParams = new window.URLSearchParams();
                                        if (group.batch) queryParams.set("batchId", group.batch._id);
                                        if (group.examtype) queryParams.set("examTypeId", group.examtype._id);
                                        if (filters.college) queryParams.set("collegeId", filters.college);
                                        if (filters.course) queryParams.set("courseId", filters.course);
                                        if (filters.semester) queryParams.set("semesterId", filters.semester);

                                        return (
                                            <div key={i} className="qp-filter-res-card">
                                                <div className="qp-filter-res-top">
                                                    <span className="qp-filter-res-tag qp-filter-res-tag--yellow">
                                                        Batch: {batchName}
                                                    </span>
                                                    <h4 className="qp-filter-res-name">
                                                        {examName}
                                                    </h4>
                                                    <p className="qp-filter-res-desc">
                                                        Contains compiled papers ({group.recordCount || 0} records) for all selected filters.
                                                    </p>
                                                </div>
                                                <div className="qp-filter-res-actions">
                                                    <a 
                                                        href={`/qp/compiled?${queryParams.toString()}`} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="qp-filter-view-btn"
                                                    >
                                                        <FiFileText size={17} /> View Compiled Papers
                                                    </a>
                                                    <QPFilterBookmarkButton
                                                        payload={{
                                                            type: "question-paper",
                                                            targetId: group.batch?._id ? `${group.batch._id}-${group.examtype?._id || 'exam'}` : `qp-${i}`,
                                                            title: `${examName} - Batch ${batchName}`,
                                                            subtitle: "Question Papers",
                                                            description: `Contains compiled papers (${group.recordCount} records)`,
                                                            url: `/qp/compiled?${queryParams.toString()}`,
                                                            metadata: {
                                                                batchName,
                                                                examName,
                                                                recordCount: group.recordCount,
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    }
                                })}
                            </div>
                            
                            {resultsPage < resultsTotalPages && (
                                <div className="qp-filter-loadmore-wrap">
                                    <button 
                                        type="button"
                                        onClick={handleLoadMoreResults}
                                        disabled={loadingResults}
                                        className="qp-filter-loadmore-btn"
                                        aria-label="Load More Groups"
                                    >
                                        {loadingResults ? "Loading..." : "Load More Groups"}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
