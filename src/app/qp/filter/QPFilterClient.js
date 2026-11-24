"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaImage, FaDownload, FaShare, FaBookmark } from "react-icons/fa";
import { Navbar } from "../../components/Navbar";
import ImageLoader from "../../components/ImageLoader";
import {
    toggleLearnLaterClient,
    checkLearnLaterStatusClient,
    isItemInLearnLaterStorage,
} from "@/lib/clientLearnLater";
import "../../resources/[id]/styles/WorkTopicPage.css"; 

export default function QPFilterClient() {
    const searchParams = useSearchParams();
    const qpTargetId = searchParams.toString() || "filtered-qp";
    const [isSavedInLearnLater, setIsSavedInLearnLater] = useState(() => isItemInLearnLaterStorage("question-paper", qpTargetId));
    const [isLearnLaterLoading, setIsLearnLaterLoading] = useState(false);
    
    const [images, setImages] = useState([]);
    const [title, setTitle] = useState("Filtered Question Papers");
    const [filterBadges, setFilterBadges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedImages, setExpandedImages] = useState({});
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        let mounted = true;
        if (qpTargetId) {
            if (isItemInLearnLaterStorage("question-paper", qpTargetId)) {
                setIsSavedInLearnLater(true);
            }
            checkLearnLaterStatusClient([{ type: "question-paper", targetId: qpTargetId }])
                .then((res) => {
                    if (mounted && res) {
                        if (res[`question-paper#${qpTargetId}`] || res[`question-paper:${qpTargetId}`] || res[qpTargetId]) {
                            setIsSavedInLearnLater(true);
                        } else if (res[`question-paper#${qpTargetId}`] === false || res[`question-paper:${qpTargetId}`] === false) {
                            setIsSavedInLearnLater(false);
                        }
                    }
                })
                .catch(() => {});
        }
        return () => {
            mounted = false;
        };
    }, [qpTargetId]);

    useEffect(() => {
        const handleUpdate = (e) => {
            const eTargetId = e.detail?.item?.targetId || e.detail?.targetId;
            const eItemId = e.detail?.itemId;
            if (
                eTargetId === qpTargetId ||
                eItemId === `question-paper#${qpTargetId}` ||
                eItemId === `question-paper:${qpTargetId}`
            ) {
                if (e.detail?.isSaved !== undefined) {
                    setIsSavedInLearnLater(e.detail.isSaved);
                }
            }
        };
        window.addEventListener("learnix:learn-later-updated", handleUpdate);
        return () => window.removeEventListener("learnix:learn-later-updated", handleUpdate);
    }, [qpTargetId]);

    useEffect(() => {
        const fetchFilteredData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Forward all query parameters (universityId, collegeId, courseId, semesterId, batchId, examTypeId, subjectId)
                const params = new window.URLSearchParams(searchParams);
                params.set("limit", "100");
                
                const res = await fetch(`/api/qp/v1/images?${params.toString()}`);
                if (!res.ok) throw new Error("Failed to fetch filtered question papers");
                
                const json = await res.json();
                
                if (json.success && json.data) {
                    if (json.data.length > 0) {
                        const first = json.data[0];
                        const subName = first.subject?.name || "";
                        const batchName = first.batch ? `${first.batch.startYear}-${first.batch.endYear}` : "";
                        const examName = first.examtype?.name || "";
                        const collegeName = first.college?.name || "";

                        let computedTitle = subName || "Filtered Question Papers";
                        if (subName && (batchName || examName)) {
                            computedTitle = `${subName} (${[batchName, examName].filter(Boolean).join(" - ")})`;
                        } else if (!subName && (batchName || examName)) {
                            computedTitle = `${batchName} | ${examName}`;
                        }
                        setTitle(computedTitle);

                        const badges = [];
                        if (subName) badges.push({ label: "Subject", value: subName });
                        if (collegeName) badges.push({ label: "College", value: collegeName });
                        if (batchName) badges.push({ label: "Batch", value: batchName });
                        if (examName) badges.push({ label: "Exam", value: examName });
                        setFilterBadges(badges);
                    }
                    
                    // Combine all image URLs in sequence
                    let allImages = [];
                    json.data.forEach(record => {
                        if (record.imageUrls && Array.isArray(record.imageUrls)) {
                            allImages = [...allImages, ...record.imageUrls];
                        }
                    });
                    
                    setImages(allImages);
                } else {
                    setImages([]);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchFilteredData();
    }, [searchParams]);

    const toggleImageExpansion = (index) => {
        setExpandedImages(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const handleDownload = async () => {
        if (!images || images.length === 0) return;
        setDownloading(true);
        try {
            const res = await fetch('/api/work/download-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    images, 
                    fileName: `${title.replace(/[^a-zA-Z0-9.-]/g, '_')}_Question_Papers` 
                })
            });
            
            if (!res.ok) throw new Error("Failed to generate PDF");
            
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `${title.replace(/[^a-zA-Z0-9.-]/g, '_')}_Question_Papers.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert(err.message || "An error occurred during download.");
        } finally {
            setDownloading(false);
        }
    };

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${title} | Question Papers`,
                    text: `Check out these filtered Question Papers for ${title}`,
                    url: url
                });
            } catch (err) {
                console.error("Error sharing", err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(url);
                alert("Link copied to clipboard!");
            } catch (err) {
                alert("Failed to copy link.");
            }
        }
    };

    if (loading) {
        return (
            <div className="wtpc-container">
                <Navbar />
                <div className="wtpc-main-content" style={{ marginTop: "80px", textAlign: "center", padding: "50px" }}>
                    <div className="loading-spinner" style={{ display: "inline-block", width: "40px", height: "40px", border: "4px solid #f3f3f3", borderTop: "4px solid #0b74ff", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
                    <p style={{ marginTop: "15px", color: "#666" }}>Filtering question papers...</p>
                </div>
            </div>
        );
    }

    if (error || images.length === 0) {
        return (
            <div className="wtpc-container">
                <Navbar />
                <div className="wtpc-error-container" style={{ marginTop: "80px" }}>
                    <div className="wtpc-error-content">
                        <h2>No Question Papers Found</h2>
                        <p>{error || "No question papers matched all your selected filter criteria."}</p>
                        <Link href="/qp" className="wtpc-back-link">
                            <FaArrowLeft /> Back to Search & Filters
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="wtpc-container">
            <Navbar />
            
            <div className="wtpc-main-content" style={{ marginTop: "20px" }}>
                
                <div className="wtpc-topic-section">
                    <div className="wtpc-topic-header">
                        <h2 className="wtpc-topic-title">{title}</h2>
                        <p style={{ color: "#666", fontSize: "14px", marginTop: "5px" }}>
                            Displaying only question papers matching all your selected criteria
                        </p>
                        {filterBadges.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" }}>
                                {filterBadges.map((badge, idx) => (
                                    <span 
                                        key={idx}
                                        style={{
                                            background: "#f1f5f9",
                                            border: "1px solid #e2e8f0",
                                            borderRadius: "12px",
                                            padding: "4px 10px",
                                            fontSize: "12px",
                                            color: "#334155",
                                            fontWeight: 600
                                        }}
                                    >
                                        <span style={{ color: "#64748b" }}>{badge.label}:</span> {badge.value}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <div className="wtpc-action-buttons-container" style={{ margin: "20px 0", borderBottom: "1px solid #eaeaea", paddingBottom: "20px" }}>
                        <Link href="/qp" className="wtpc-action-btn wtpc-back-btn">
                            <FaArrowLeft />
                            <span className="wtpc-btn-text">Back to Filters</span>
                        </Link>
                        
                        <button 
                            className="wtpc-action-btn wtpc-download-btn" 
                            onClick={handleDownload}
                            disabled={downloading}
                        >
                            <FaDownload />
                            <span className="wtpc-btn-text">{downloading ? "Generating..." : "Download PDF"}</span>
                        </button>
                        
                        <button 
                            className="wtpc-action-btn wtpc-share-btn" 
                            onClick={handleShare}
                        >
                            <FaShare />
                            <span className="wtpc-btn-text">Share</span>
                        </button>
                        
                        <button 
                            className={`wtpc-action-btn wtpc-learn-later-btn ${isSavedInLearnLater ? 'wtpc-saved' : ''}`} 
                            title={isSavedInLearnLater ? "Remove from Learn Later" : "Save to Learn Later"}
                            disabled={isLearnLaterLoading}
                            onClick={async () => {
                                if (isLearnLaterLoading) return;
                                setIsLearnLaterLoading(true);
                                try {
                                    const res = await toggleLearnLaterClient({
                                        type: "question-paper",
                                        targetId: qpTargetId,
                                        title,
                                        subtitle: "Filtered Question Papers",
                                        description: `Filtered question papers containing ${images.length} pages`,
                                        url: `/qp/filter?${searchParams.toString()}`,
                                        metadata: {
                                            pageCount: images.length,
                                            title
                                        }
                                    });
                                    if (res && res.success) {
                                        setIsSavedInLearnLater(res.isSaved);
                                    }
                                } catch (err) {
                                    console.error("Learn Later error:", err);
                                } finally {
                                    setIsLearnLaterLoading(false);
                                }
                            }}
                        >
                            <FaBookmark />
                            <span className="wtpc-btn-text">{isSavedInLearnLater ? 'Saved' : 'Learn Later'}</span>
                        </button>
                    </div>

                    <div className="wtpc-image-gallery-container">
                        <div className="wtpc-gallery-header">
                            <span className="wtpc-gallery-title">
                                <FaImage /> Filtered Pages ({images.length})
                            </span>
                        </div>
                        
                        <div className="wtpc-image-list">
                            {images.map((img, index) => {
                                const isExpanded = !!expandedImages[index];
                                return (
                                    <div 
                                        key={index} 
                                        className={`wtpc-image-item ${isExpanded ? "expanded" : ""}`}
                                        onClick={() => toggleImageExpansion(index)}
                                    >
                                        <ImageLoader
                                            src={img}
                                            alt={`${title} - Page ${index + 1}`}
                                            className="wtpc-responsive-image"
                                        />
                                        <div className="wtpc-image-overlay">
                                            <span>Page {index + 1} • Click to {isExpanded ? "collapse" : "expand"}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

