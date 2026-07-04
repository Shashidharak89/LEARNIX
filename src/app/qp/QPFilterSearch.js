"use client";

import { useState, useEffect, useRef } from "react";
import { FiChevronDown, FiFileText, FiExternalLink, FiX } from "react-icons/fi";
import "./styles/QuestionPapers.css";

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

    return (
        <div className="qp-custom-dropdown" ref={dropdownRef} style={{ position: "relative", width: "100%", marginBottom: "15px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#444", marginBottom: "6px" }}>{label}</label>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    padding: "12px 16px",
                    background: "#fff",
                    border: "2px solid #e1e4e8",
                    borderRadius: "10px",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    boxShadow: isOpen ? "0 4px 12px rgba(11, 116, 255, 0.1)" : "none",
                    borderColor: isOpen ? "#0b74ff" : "#e1e4e8",
                    transition: "all 0.2s"
                }}
            >
                <span style={{ color: selectedOption ? "#111" : "#888", fontWeight: "500", fontSize: "15px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {selectedOption ? (selectedOption.name || `Semester ${selectedOption.semesterNumber}` || `${selectedOption.startYear}-${selectedOption.endYear}`) : placeholder}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {value && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onChange(""); setIsOpen(false); }}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#888", display: "flex", alignItems: "center" }}
                            title="Clear selection"
                        >
                            <FiX size={18} />
                        </button>
                    )}
                    <FiChevronDown style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "0.3s", color: "#888" }} />
                </div>
            </div>

            {isOpen && (
                <div style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    marginTop: "6px",
                    background: "#fff",
                    border: "1px solid #e1e4e8",
                    borderRadius: "10px",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                    maxHeight: "300px",
                    overflowY: "auto",
                    zIndex: 100
                }}>
                    <div 
                        onClick={() => { onChange(""); setIsOpen(false); }}
                        style={{ padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid #f0f0f0", color: "#888", fontSize: "15px" }}
                        onMouseOver={(e) => e.target.style.background = "#f8f9fa"}
                        onMouseOut={(e) => e.target.style.background = "#fff"}
                    >
                        {placeholder}
                    </div>
                    {options.map(opt => {
                        const displayName = opt.name || `Semester ${opt.semesterNumber}` || `${opt.startYear}-${opt.endYear}`;
                        const isSelected = value === opt._id;
                        return (
                            <div 
                                key={opt._id}
                                onClick={() => { onChange(opt._id); setIsOpen(false); }}
                                style={{
                                    padding: "12px 16px",
                                    cursor: "pointer",
                                    borderBottom: "1px solid #f0f0f0",
                                    background: isSelected ? "#f0f7ff" : "#fff",
                                    color: isSelected ? "#0b74ff" : "#333",
                                    fontWeight: isSelected ? "600" : "500",
                                    fontSize: "15px"
                                }}
                                onMouseOver={(e) => { if (!isSelected) e.target.style.background = "#f8f9fa"; }}
                                onMouseOut={(e) => { if (!isSelected) e.target.style.background = "#fff"; }}
                            >
                                {displayName}
                            </div>
                        );
                    })}
                    
                    {loading && <div style={{ padding: "12px 16px", textAlign: "center", color: "#888", fontSize: "14px" }}>Loading...</div>}
                    
                    {!loading && hasMore && (
                        <div 
                            onClick={(e) => { e.stopPropagation(); onLoadMore(); }}
                            style={{
                                padding: "12px 16px",
                                textAlign: "center",
                                cursor: "pointer",
                                color: "#0b74ff",
                                fontWeight: "600",
                                fontSize: "14px",
                                background: "#f8faff"
                            }}
                            onMouseOver={(e) => e.target.style.background = "#e6f0ff"}
                            onMouseOut={(e) => e.target.style.background = "#f8faff"}
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

    // Fetch Results based on Filters
    useEffect(() => {
        setResultsPage(1);
        fetchResults(1, true);
    }, [filters]);

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
            let endpoint = `/api/qp/v1/images?page=${pageNum}&limit=20`;
            
            // Build query params based on selected filters
            if (filters.subject) endpoint += `&subjectId=${filters.subject}`;
            if (filters.college) endpoint += `&collegeId=${filters.college}`;
            if (filters.batch) endpoint += `&batchId=${filters.batch}`;

            const res = await fetch(endpoint);
            const json = await res.json();
            
            if (json.success) {
                if (isNewSearch) {
                    setResults(json.data);
                } else {
                    setResults(prev => [...prev, ...json.data]);
                }
                setResultsTotalPages(json.pagination.totalPages);
            }
        } catch (err) {
            console.error("Error fetching results:", err);
        }
        setLoadingResults(false);
    };

    const handleLoadMoreResults = () => {
        if (resultsPage < resultsTotalPages) {
            const nextPage = resultsPage + 1;
            setResultsPage(nextPage);
            fetchResults(nextPage, false);
        }
    };

    return (
        <div className="qp-page-container" style={{ paddingBottom: "30px", marginTop: "30px" }}>
            <section className="qp-card">
                <div className="qp-section-header" style={{ marginBottom: "25px" }}>
                    <h2 style={{ fontSize: "24px", color: "#111", marginBottom: "8px" }}>Advanced Filter Search</h2>
                    <p style={{ color: "#666", fontSize: "15px", margin: 0 }}>Narrow down question papers by selecting specific criteria.</p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "15px", marginBottom: "30px", padding: "20px", background: "#f8f9fa", borderRadius: "12px", border: "1px solid #eaeaea" }}>
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

                <div className="qp-results-container">
                    <h3 style={{ fontSize: "20px", color: "#111", borderBottom: "2px solid #eaeaea", paddingBottom: "15px", marginBottom: "20px" }}>Filtered Question Papers</h3>
                    
                    {loadingResults && results.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "#888", fontSize: "16px" }}>
                            Loading records...
                        </div>
                    ) : results.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "#888", fontSize: "16px", background: "#f8f9fa", borderRadius: "12px", border: "1px dashed #ddd" }}>
                            No question papers found for the selected filters.
                        </div>
                    ) : (
                        <div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                                {results.map((record) => (
                                    <div key={record._id} style={{ border: "1px solid #eaeaea", borderRadius: "12px", overflow: "hidden", background: "#fff", padding: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.03)" }}>
                                        <div style={{ display: "inline-block", background: "#f2c200", color: "#111", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", marginBottom: "10px" }}>
                                            {record.batch ? `${record.batch.startYear}-${record.batch.endYear}` : "Unknown Batch"}
                                        </div>
                                        <div style={{ display: "inline-block", background: "#0b74ff", color: "#fff", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold", marginBottom: "10px", marginLeft: "10px" }}>
                                            {record.examtype ? record.examtype.name : "Exam"}
                                        </div>
                                        
                                        <h4 style={{ fontSize: "16px", color: "#333", margin: "0 0 15px 0" }}>
                                            {record.subject ? record.subject.name : "Unknown Subject"}
                                        </h4>
                                        
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                            {record.imageUrls && record.imageUrls.map((url, i) => (
                                                <a 
                                                    key={i} href={url} target="_blank" rel="noopener noreferrer"
                                                    style={{ display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none", color: "#0b74ff", border: "1px solid #0b74ff", padding: "6px 12px", borderRadius: "8px", fontSize: "13px", background: "#f8faff", fontWeight: "500" }}
                                                >
                                                    <FiFileText size={14} /> Part {i + 1}
                                                </a>
                                            ))}
                                            {record.visitLink && record.visitLink.map((link, i) => (
                                                <a 
                                                    key={`link-${i}`} href={`/works/${link}`} target="_blank" rel="noopener noreferrer"
                                                    style={{ display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none", color: "#ff6b00", border: "1px solid #ff6b00", padding: "6px 12px", borderRadius: "8px", fontSize: "13px", background: "#fff5f0", fontWeight: "500" }}
                                                >
                                                    <FiExternalLink size={14} /> Visit
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {resultsPage < resultsTotalPages && (
                                <div style={{ textAlign: "center", marginTop: "30px" }}>
                                    <button 
                                        onClick={handleLoadMoreResults}
                                        disabled={loadingResults}
                                        style={{
                                            background: loadingResults ? "#e9ecef" : "#f8f9fa",
                                            color: loadingResults ? "#888" : "#0b74ff",
                                            border: "1px solid #0b74ff",
                                            padding: "12px 30px",
                                            borderRadius: "8px",
                                            cursor: loadingResults ? "default" : "pointer",
                                            fontWeight: "600",
                                            fontSize: "15px",
                                            transition: "all 0.2s ease"
                                        }}
                                    >
                                        {loadingResults ? "Loading..." : "Load More Records"}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
