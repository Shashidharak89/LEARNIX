import React, { useState, useEffect } from "react";
import "./QPViewer.css";

export default function QPViewer() {
    const [tree, setTree] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [expandedNodes, setExpandedNodes] = useState({});
    
    // For subject dropdown
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState("");
    const [subjectImages, setSubjectImages] = useState(null);

    useEffect(() => {
        fetchTree();
    }, []);

    const fetchTree = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/qp-tree");
            const json = await res.json();
            if (json.success) {
                setTree(json.tree);
                extractSubjects(json.tree);
            } else {
                setError(json.error || "Failed to load tree");
            }
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    };

    const extractSubjects = (treeData) => {
        const subs = new Set();
        // Traverse tree to get all unique subject names
        Object.values(treeData).forEach(colleges => {
            Object.values(colleges).forEach(courses => {
                Object.values(courses).forEach(semesters => {
                    Object.values(semesters).forEach(subjectsObj => {
                        Object.keys(subjectsObj).forEach(sub => subs.add(sub));
                    });
                });
            });
        });
        setSubjects(Array.from(subs).sort());
    };

    const handleSubjectSelect = (subName) => {
        setSelectedSubject(subName);
        if (!subName || !tree) {
            setSubjectImages(null);
            return;
        }

        const imagesList = [];
        // Extract all images for this subject
        Object.values(tree).forEach(colleges => {
            Object.values(colleges).forEach(courses => {
                Object.values(courses).forEach(semesters => {
                    Object.values(semesters).forEach(subjectsObj => {
                        if (subjectsObj[subName]) {
                            imagesList.push(...subjectsObj[subName]);
                        }
                    });
                });
            });
        });
        setSubjectImages(imagesList);
    };

    const toggleNode = (nodeId) => {
        setExpandedNodes(prev => ({
            ...prev,
            [nodeId]: !prev[nodeId]
        }));
    };

    const renderTree = (data, path = "") => {
        if (Array.isArray(data)) {
            // It's the array of images objects
            return (
                <div className="qp-viewer-images-list">
                    {data.map((item, idx) => (
                        <div key={`${path}-${idx}`} className="qp-viewer-image-item">
                            <div className="qp-viewer-image-meta">
                                <span className="qp-tag">{item.batch}</span>
                                <span className="qp-tag exam">{item.examType}</span>
                            </div>
                            <div className="qp-viewer-image-urls">
                                {item.images.map((url, i) => (
                                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="qp-img-link">
                                        View Image {i + 1}
                                    </a>
                                ))}
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
                <div key={nodeId} className="qp-viewer-node">
                    <div 
                        className="qp-viewer-node-header" 
                        onClick={() => toggleNode(nodeId)}
                    >
                        <span className={`qp-viewer-chevron ${isExpanded ? 'expanded' : ''}`}>▶</span>
                        <span className="qp-viewer-node-title">{key}</span>
                    </div>
                    {isExpanded && (
                        <div className="qp-viewer-node-children">
                            {renderTree(value, nodeId)}
                        </div>
                    )}
                </div>
            );
        });
    };

    if (loading) return <div className="qp-viewer-loading">Loading Question Papers Tree...</div>;
    if (error) return <div className="qp-viewer-error">{error}</div>;
    if (!tree) return null;

    return (
        <div className="qp-viewer-wrapper">
            <div className="qp-viewer-controls">
                <div className="qp-viewer-subject-filter">
                    <label>Filter by Subject:</label>
                    <select 
                        value={selectedSubject} 
                        onChange={(e) => handleSubjectSelect(e.target.value)}
                        className="qp-viewer-select"
                    >
                        <option value="">-- View Tree --</option>
                        {subjects.map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedSubject ? (
                <div className="qp-viewer-subject-results">
                    <h3>Results for: {selectedSubject}</h3>
                    {subjectImages && subjectImages.length > 0 ? (
                        <div className="qp-viewer-images-list">
                            {subjectImages.map((item, idx) => (
                                <div key={idx} className="qp-viewer-image-item">
                                    <div className="qp-viewer-image-meta">
                                        <span className="qp-tag">{item.batch}</span>
                                        <span className="qp-tag exam">{item.examType}</span>
                                    </div>
                                    <div className="qp-viewer-image-urls">
                                        {item.images.map((url, i) => (
                                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="qp-img-link">
                                                View Image {i + 1}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>No images found for this subject.</p>
                    )}
                </div>
            ) : (
                <div className="qp-viewer-tree">
                    {renderTree(tree, "root")}
                </div>
            )}
        </div>
    );
}
