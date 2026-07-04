"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/app/components/Navbar";

export default function QPApiTester() {
    const [endpoint, setEndpoint] = useState("/api/qp/v1/universities");
    const [method, setMethod] = useState("GET");
    const [queryParams, setQueryParams] = useState([{ key: "page", value: "1" }, { key: "limit", value: "20" }]);
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const [referenceData, setReferenceData] = useState({
        universityId: [],
        collegeId: [],
        semesterId: [],
        courseId: []
    });

    useEffect(() => {
        const fetchRefs = async () => {
            try {
                const [uni, col, sem, crs] = await Promise.all([
                    fetch("/api/qp/v1/universities?limit=50").then(r => r.json()),
                    fetch("/api/qp/v1/colleges?limit=50").then(r => r.json()),
                    fetch("/api/qp/v1/semesters?limit=50").then(r => r.json()),
                    fetch("/api/qp/v1/courses?limit=50").then(r => r.json()),
                ]);
                setReferenceData({
                    universityId: uni.data || [],
                    collegeId: col.data || [],
                    semesterId: sem.data || [],
                    courseId: crs.data || []
                });
            } catch (err) {
                console.error("Failed to fetch references", err);
            }
        };
        fetchRefs();
    }, []);

    const getRefLabel = (type, item) => {
        if (type === 'semesterId') return `Semester ${item.semesterNumber}`;
        return item.name;
    };

    const presetEndpoints = [
        { label: "Universities (Latest 20)", path: "/api/qp/v1/universities" },
        { label: "Colleges (Latest 20)", path: "/api/qp/v1/colleges" },
        { label: "Colleges under University", path: "/api/qp/v1/colleges", params: [{ key: "universityId", value: "" }] },
        { label: "Semesters (Latest 20)", path: "/api/qp/v1/semesters" },
        { label: "Courses (Latest 20)", path: "/api/qp/v1/courses" },
        { label: "Subjects (Overall)", path: "/api/qp/v1/subjects" },
        { label: "Subjects under College", path: "/api/qp/v1/subjects", params: [{ key: "collegeId", value: "" }] },
        { label: "Search All QP Models", path: "/api/qp/v1/search/all", params: [{ key: "q", value: "test" }] },
        { label: "Search Subjects Only", path: "/api/qp/v1/search/subjects", params: [{ key: "q", value: "math" }] }
    ];

    const loadPreset = (preset) => {
        setEndpoint(preset.path);
        const newParams = [{ key: "page", value: "1" }, { key: "limit", value: "20" }];
        if (preset.params) {
            preset.params.forEach(p => newParams.push({ ...p }));
        }
        setQueryParams(newParams);
    };

    const addParam = () => setQueryParams([...queryParams, { key: "", value: "" }]);
    const removeParam = (index) => setQueryParams(queryParams.filter((_, i) => i !== index));
    const updateParam = (index, field, val) => {
        const newParams = [...queryParams];
        newParams[index][field] = val;
        setQueryParams(newParams);
    };

    const handleTest = async () => {
        setLoading(true);
        try {
            const url = new URL(window.location.origin + endpoint);
            queryParams.forEach(p => {
                if (p.key && p.value) url.searchParams.append(p.key, p.value);
            });

            const res = await fetch(url.toString(), { method });
            const json = await res.json();
            setResponse({
                status: res.status,
                url: url.toString(),
                data: json
            });
        } catch (error) {
            setResponse({ error: error.message });
        }
        setLoading(false);
    };

    return (
        <div style={{ backgroundColor: "#f9fafb", minHeight: "100vh", color: "#111" }}>
            <Navbar />
            <div style={{ maxWidth: "1200px", margin: "40px auto", padding: "20px", display: "grid", gridTemplateColumns: "300px 1fr", gap: "30px" }}>
                
                {/* Presets Sidebar */}
                <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
                    <h2 style={{ fontSize: "1.2rem", marginBottom: "15px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>Presets</h2>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                        {presetEndpoints.map((preset, idx) => (
                            <li key={idx}>
                                <button 
                                    onClick={() => loadPreset(preset)}
                                    style={{ width: "100%", textAlign: "left", padding: "10px", backgroundColor: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: "6px", cursor: "pointer" }}
                                >
                                    {preset.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Tester Main Area */}
                <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
                    <h1 style={{ fontSize: "1.5rem", marginBottom: "20px" }}>QP REST API Tester</h1>
                    
                    <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                        <select value={method} onChange={e => setMethod(e.target.value)} style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc", fontWeight: "bold" }}>
                            <option>GET</option>
                        </select>
                        <input 
                            type="text" 
                            value={endpoint} 
                            onChange={e => setEndpoint(e.target.value)} 
                            style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #ccc", fontFamily: "monospace" }} 
                        />
                        <button onClick={handleTest} disabled={loading} style={{ padding: "10px 20px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
                            {loading ? "Sending..." : "Send Request"}
                        </button>
                    </div>

                    <div style={{ marginBottom: "20px" }}>
                        <h3 style={{ fontSize: "1.1rem", marginBottom: "10px" }}>Query Parameters</h3>
                        {queryParams.map((param, idx) => (
                            <div key={idx} style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                                <input type="text" placeholder="Key" value={param.key} onChange={e => updateParam(idx, "key", e.target.value)} style={{ flex: 1, padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }} list="query-keys" />
                                <datalist id="query-keys">
                                    <option value="universityId" />
                                    <option value="collegeId" />
                                    <option value="courseId" />
                                    <option value="semesterId" />
                                    <option value="q" />
                                    <option value="page" />
                                    <option value="limit" />
                                </datalist>
                                
                                {["universityId", "collegeId", "semesterId", "courseId"].includes(param.key) ? (
                                    <select 
                                        value={param.value} 
                                        onChange={e => updateParam(idx, "value", e.target.value)}
                                        style={{ flex: 2, padding: "8px", border: "1px solid #ccc", borderRadius: "4px", backgroundColor: "#f8faff" }}
                                    >
                                        <option value="">-- Select {param.key.replace("Id", "")} --</option>
                                        {referenceData[param.key].map(item => (
                                            <option key={item._id} value={item._id}>
                                                {getRefLabel(param.key, item)}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <input type="text" placeholder="Value" value={param.value} onChange={e => updateParam(idx, "value", e.target.value)} style={{ flex: 2, padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }} />
                                )}
                                <button onClick={() => removeParam(idx)} style={{ padding: "8px 12px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>X</button>
                            </div>
                        ))}
                        <button onClick={addParam} style={{ padding: "8px 16px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.9rem" }}>+ Add Param</button>
                    </div>

                    <div style={{ marginTop: "30px" }}>
                        <h3 style={{ fontSize: "1.1rem", marginBottom: "10px" }}>Response</h3>
                        {response ? (
                            <div style={{ backgroundColor: "#1e1e1e", color: "#d4d4d4", padding: "15px", borderRadius: "8px", overflowX: "auto", fontFamily: "monospace", fontSize: "0.9rem" }}>
                                <div style={{ marginBottom: "10px", color: response.status === 200 ? "#4ade80" : "#f87171" }}>
                                    Status: {response.status} | URL: {response.url}
                                </div>
                                <pre style={{ margin: 0 }}>
                                    {JSON.stringify(response.data || response.error, null, 2)}
                                </pre>
                            </div>
                        ) : (
                            <div style={{ padding: "20px", border: "1px dashed #ccc", textAlign: "center", color: "#666", borderRadius: "8px" }}>
                                No request sent yet.
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
