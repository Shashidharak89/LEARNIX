"use client";

import { useState, useEffect, useRef } from "react";
import { FiChevronDown, FiFileText, FiX, FiBookmark, FiSliders, FiInbox } from "react-icons/fi";
import { toggleLearnLaterClient } from "@/lib/clientLearnLater";
import "./styles/QPFilterSearch.css";

// Custom Dropdown Component
const CustomDropdown = ({ label, options, value, onChange, onLoadMore, hasMore, loading, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

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

    const selectedOption = options.find(opt => opt._id === value);
    const selectedText = selectedOption
        ? (selectedOption.name || (selectedOption.semesterNumber ? `Semester ${selectedOption.semesterNumber}` : "") || (selectedOption.startYear ? `${selectedOption.startYear}-${selectedOption.endYear}` : ""))
        : null;

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
                    <div 
                        onClick={() => { onChange(""); setIsOpen(false); }}
                        className="qp-dropdown-item is-placeholder"
                        role="option"
                        aria-selected={!value}
                    >
                        {placeholder}
                    </div>
                    {options.map(opt => {
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
                    [type]: { current: json.pagination.page, total: json.pagination.totalPages }
                }));
            }
        } catch (err) {
            console.error(`Error fetching ${type}:`, err);
        }
    };

    // Initial Fetch for Top-Level Dropdowns
    useEffect(() => {
        fetchDropdownData("universities", `/api/qp/v1/universities?page=1&limit=20`);
        fetchDropdownData("batches", `/api/qp/v1/batches?page=1&limit=20`);
    }, []);

    // Fetch Cascading Data on Filter Change
    useEffect(() => {
        if (filters.university) {
            fetchDropdownData("colleges", `/api/qp/v1/colleges/by-university?universityId=${filters.university}&page=1&limit=20`);
        } else {
            setData(prev => ({ ...prev, colleges: [], courses: [], semesters: [], subjects: [] }));
        }
    }, [filters.university]);

    useEffect(() => {
        if (filters.college) {
            fetchDropdownData("courses", `/api/qp/v1/courses/by-college?collegeId=${filters.college}&page=1&limit=20`);
        } else {
            setData(prev => ({ ...prev, courses: [], semesters: [], subjects: [] }));
        }
    }, [filters.college]);

    useEffect(() => {
        if (filters.college && filters.course) {
            fetchDropdownData("semesters", `/api/qp/v1/semesters/by-course?collegeId=${filters.college}&courseId=${filters.course}&page=1&limit=20`);
        } else {
            setData(prev => ({ ...prev, semesters: [], subjects: [] }));
        }
    }, [filters.course, filters.college]);

    useEffect(() => {
        if (filters.college && filters.course && filters.semester) {
            fetchDropdownData("subjects", `/api/qp/v1/subjects/by-semester?collegeId=${filters.college}&courseId=${filters.course}&semesterId=${filters.semester}&page=1&limit=20`);
        } else {
            setData(prev => ({ ...prev, subjects: [] }));
        }
    }, [filters.semester, filters.course, filters.college]);

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
            let endpoint = "";
            
            // Reconstruct endpoint logic
            if (type === "universities") endpoint = `/api/qp/v1/universities?page=${nextPage}&limit=20`;
            if (type === "batches") endpoint = `/api/qp/v1/batches?page=${nextPage}&limit=20`;
            if (type === "colleges") endpoint = `/api/qp/v1/colleges/by-university?universityId=${filters.university}&page=${nextPage}&limit=20`;
            if (type === "courses") endpoint = `/api/qp/v1/courses/by-college?collegeId=${filters.college}&page=${nextPage}&limit=20`;
            if (type === "semesters") endpoint = `/api/qp/v1/semesters/by-course?collegeId=${filters.college}&courseId=${filters.course}&page=${nextPage}&limit=20`;
            if (type === "subjects") endpoint = `/api/qp/v1/subjects/by-semester?collegeId=${filters.college}&courseId=${filters.course}&semesterId=${filters.semester}&page=${nextPage}&limit=20`;

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
                    />
                    
                    <CustomDropdown 
                        label="College" 
                        placeholder={filters.university ? "All Colleges" : "Select University First"}
                        options={data.colleges} 
                        value={filters.college} 
                        onChange={(val) => setFilters(prev => ({ ...prev, college: val, course: "", semester: "", subject: "" }))} 
                        hasMore={pages.colleges.current < pages.colleges.total}
                        onLoadMore={() => handleDropdownLoadMore("colleges")}
                    />

                    <CustomDropdown 
                        label="Course" 
                        placeholder={filters.college ? "All Courses" : "Select College First"}
                        options={data.courses} 
                        value={filters.course} 
                        onChange={(val) => setFilters(prev => ({ ...prev, course: val, semester: "", subject: "" }))} 
                        hasMore={pages.courses.current < pages.courses.total}
                        onLoadMore={() => handleDropdownLoadMore("courses")}
                    />

                    <CustomDropdown 
                        label="Semester" 
                        placeholder={filters.course ? "All Semesters" : "Select Course First"}
                        options={data.semesters} 
                        value={filters.semester} 
                        onChange={(val) => setFilters(prev => ({ ...prev, semester: val, subject: "" }))} 
                        hasMore={pages.semesters.current < pages.semesters.total}
                        onLoadMore={() => handleDropdownLoadMore("semesters")}
                    />

                    <CustomDropdown 
                        label="Batch" 
                        placeholder="All Batches"
                        options={data.batches.map(b => ({ ...b, name: `${b.startYear}-${b.endYear}` }))} 
                        value={filters.batch} 
                        onChange={(val) => setFilters(prev => ({ ...prev, batch: val }))} 
                        hasMore={pages.batches.current < pages.batches.total}
                        onLoadMore={() => handleDropdownLoadMore("batches")}
                    />

                    <CustomDropdown 
                        label="Subject" 
                        placeholder={filters.semester ? "All Subjects" : "Select Semester First"}
                        options={data.subjects} 
                        value={filters.subject} 
                        onChange={(val) => setFilters(prev => ({ ...prev, subject: val }))} 
                        hasMore={pages.subjects.current < pages.subjects.total}
                        onLoadMore={() => handleDropdownLoadMore("subjects")}
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
                                                        href={group.subject ? `/qp/${group.subject._id}` : "#"} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="qp-filter-view-btn"
                                                    >
                                                        <FiFileText size={17} /> View Compiled Papers
                                                    </a>
                                                    <button
                                                        type="button"
                                                        title="Add to Learn Later"
                                                        aria-label="Add to Learn Later"
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            await toggleLearnLaterClient({
                                                                type: "question-paper",
                                                                targetId: group.subject?._id || `subj-${i}`,
                                                                title: `${group.subject?.name || 'Subject'} - Question Papers`,
                                                                subtitle: "Question Papers",
                                                                description: `Compiled question papers for ${group.subject?.name || 'Subject'}`,
                                                                url: `/qp/${group.subject?._id || ''}`,
                                                                metadata: {
                                                                    subjectName: group.subject?.name,
                                                                }
                                                            });
                                                        }}
                                                        className="qp-filter-bookmark-btn"
                                                    >
                                                        <FiBookmark size={18} />
                                                    </button>
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
                                                    <button
                                                        type="button"
                                                        title="Add to Learn Later"
                                                        aria-label="Add to Learn Later"
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            await toggleLearnLaterClient({
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
                                                            });
                                                        }}
                                                        className="qp-filter-bookmark-btn"
                                                    >
                                                        <FiBookmark size={18} />
                                                    </button>
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
