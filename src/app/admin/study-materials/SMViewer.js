"use client";

import React, { useState, useEffect } from "react";
import "./SMViewer.css";

export default function SMViewer() {
    const [tree, setTree] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [expandedNodes, setExpandedNodes] = useState({});
    
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState("");
    const [subjectFiles, setSubjectFiles] = useState(null);

    const extractSubjects = (treeData) => {
        const subs = new Set();
        // Traverse tree to get all unique subject names
        Object.values(treeData).forEach(colleges => {
            Object.values(colleges).forEach(courses => {
                Object.values(courses).forEach(semesters => {
                    Object.keys(semesters).forEach(sub => subs.add(sub));
                });
            });
        });
        setSubjects(Array.from(subs).sort());
    };

    const fetchTree = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/sm-tree");
            const json = await res.json();
            if (json.success) {
                setTree(json.tree);
                extractSubjects(json.tree);
            } else {
                setError(json.error || "Failed to load study materials tree");
            }
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTree();
    }, []);

    const handleSubjectSelect = (subName) => {
        setSelectedSubject(subName);
        if (!subName || !tree) {
            setSubjectFiles(null);
            return;
        }

        const filesList = [];
        // Extract all files for this subject
        Object.values(tree).forEach(colleges => {
            Object.values(colleges).forEach(courses => {
                Object.values(courses).forEach(semesters => {
                    if (semesters[subName]) {
                        filesList.push(...semesters[subName]);
                    }
                });
            });
        });
        setSubjectFiles(filesList);
    };

    const toggleNode = (nodeId) => {
        setExpandedNodes(prev => ({
            ...prev,
            [nodeId]: !prev[nodeId]
        }));
    };

    const renderTree = (data, path = "") => {
        if (Array.isArray(data)) {
            // It's the array of files
            return (
                <div className="sm-viewer-files-list">
                    {data.map((item, idx) => (
                        <div key={`${path}-${idx}`} className="sm-viewer-file-item">
                            <div className="sm-viewer-file-meta">
                                <span className="sm-tag batch">{item.batch}</span>
                            </div>
                            <div className="sm-viewer-file-urls">
                                <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="sm-file-btn">
                                    View Resource Link
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        return Object.entries(data).map(([key, value]) => {
            const nodeId = `${path}-${key}`;
            const isExpanded = expandedNodes[nodeId];
            return (
                <div key={nodeId} className="sm-viewer-node">
                    <div 
                        className="sm-viewer-node-header" 
                        onClick={() => toggleNode(nodeId)}
                    >
                        <span className={`sm-viewer-chevron ${isExpanded ? 'expanded' : ''}`}>▶</span>
                        <span className="sm-viewer-node-title">{key}</span>
                    </div>
                    {isExpanded && (
                        <div className="sm-viewer-node-children">
                            {renderTree(value, nodeId)}
                        </div>
                    )}
                </div>
            );
        });
    };

    if (loading) return <div className="sm-viewer-loading">Loading Study Materials Tree...</div>;
    if (error) return <div className="sm-viewer-error">{error}</div>;
    if (!tree) return null;

    return (
        <div className="sm-viewer-wrapper">
            <h2 className="sm-viewer-title">Browse Study Materials Directory</h2>
            <div className="sm-viewer-controls">
                <div className="sm-viewer-subject-filter">
                    <label>Filter by Subject:</label>
                    <select 
                        value={selectedSubject} 
                        onChange={(e) => handleSubjectSelect(e.target.value)}
                        className="sm-viewer-select"
                    >
                        <option value="">-- View Tree --</option>
                        {subjects.map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedSubject ? (
                <div className="sm-viewer-subject-results">
                    <h3>Results for: {selectedSubject}</h3>
                    {subjectFiles && subjectFiles.length > 0 ? (
                        <div className="sm-viewer-files-list">
                            {subjectFiles.map((item, idx) => (
                                <div key={idx} className="sm-viewer-file-item">
                                    <div className="sm-viewer-file-meta">
                                        <span className="sm-tag batch">{item.batch}</span>
                                    </div>
                                    <div className="sm-viewer-file-urls">
                                        <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="sm-file-btn">
                                            View Resource Link
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>No study files found for this subject.</p>
                    )}
                </div>
            ) : (
                <div className="sm-viewer-tree">
                    {renderTree(tree, "root")}
                </div>
            )}
        </div>
    );
}
