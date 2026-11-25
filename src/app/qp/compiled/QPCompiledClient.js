"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaImage, FaDownload, FaShare, FaBookmark } from "react-icons/fa";
import { Navbar } from "../../components/Navbar";
import ImageLoader from "../../components/ImageLoader";
import ImageSlideshowModal from "../../components/ImageSlideshowModal";
import {
    toggleLearnLaterClient,
    checkLearnLaterStatusClient,
    isItemInLearnLaterStorage,
} from "@/lib/clientLearnLater";
import "../../resources/[id]/styles/WorkTopicPage.css"; 

export default function QPCompiledClient() {
    const searchParams = useSearchParams();
    const qpTargetId = searchParams.toString() || "compiled-qp";
    const [isSavedInLearnLater, setIsSavedInLearnLater] = useState(() => isItemInLearnLaterStorage("question-paper", qpTargetId));
    const [isLearnLaterLoading, setIsLearnLaterLoading] = useState(false);
    
    const [images, setImages] = useState([]);
    const [title, setTitle] = useState("Compiled Question Papers");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedImages, setExpandedImages] = useState({});
    const [lightboxIndex, setLightboxIndex] = useState(null);
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
        const fetchCompiledData = async () => {
            try {
                // Reconstruct query parameters
                const params = new window.URLSearchParams(searchParams);
                params.set("limit", "100"); // Fetch maximum possible images for the grouping
                
                const res = await fetch(`/api/qp/v1/images?${params.toString()}`);
                if (!res.ok) throw new Error("Failed to fetch compiled data");
                
                const json = await res.json();
                
                if (json.success && json.data) {
                    if (json.data.length > 0) {
                        const first = json.data[0];
                        const batchName = first.batch ? `${first.batch.startYear}-${first.batch.endYear}` : "General";
                        const examName = first.examtype ? first.examtype.name : "Exam";
                        setTitle(`${batchName} | ${examName}`);
                    }
                    
                    // Combine all image URLs in sequence
                    let allImages = [];
                    json.data.forEach(record => {
                        if (record.imageUrls && Array.isArray(record.imageUrls)) {
                            allImages = [...allImages, ...record.imageUrls];
                        }
                    });
                    
                    setImages(allImages);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCompiledData();
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
                    text: `Check out these compiled Question Papers for ${title}`,
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
                    <p style={{ marginTop: "15px", color: "#666" }}>Compiling question papers...</p>
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
                        <p>{error || "No compiled images available for the selected filters."}</p>
                        <Link href="/qp" className="wtpc-back-link">
                            <FaArrowLeft /> Back to Search
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
                        <p style={{ color: "#666", fontSize: "14px", marginTop: "5px" }}>Automatically compiled based on your filter selections</p>
                    </div>
                    
                    <div className="wtpc-action-buttons-container" style={{ margin: "20px 0", borderBottom: "1px solid #eaeaea", paddingBottom: "20px" }}>
                        <Link href="/qp" className="wtpc-action-btn wtpc-back-btn">
                            <FaArrowLeft />
                            <span className="wtpc-btn-text">Back to Search</span>
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
                                        subtitle: "Compiled Question Papers",
                                        description: `Compiled question paper containing ${images.length} pages`,
                                        url: `/qp/compiled?${searchParams.toString()}`,
                                        metadata: {
                                            pageCount: images.length,
                                        }
                                    });
                                    if (res && res.success) {
                                        setIsSavedInLearnLater(res.isSaved);
                                    }
                                } finally {
                                    setIsLearnLaterLoading(false);
                                }
                            }}
                        >
                            <FaBookmark style={isSavedInLearnLater ? { fill: "#8b5cf6", color: "#8b5cf6" } : {}} />
                            <span className="wtpc-btn-text">{isSavedInLearnLater ? 'Saved' : 'Learn Later'}</span>
                        </button>
                    </div>

                    <div className="wtpc-images-section">
                        <div className="wtpc-images-header">
                            <h3>
                                <FaImage className="wtpc-section-icon" />
                                Compiled Pages ({images.length})
                            </h3>
                        </div>
                        
                        <div className="wtpc-images-grid">
                            {images.map((url, index) => (
                                <div key={index} className="wtpc-image-container">
                                    <span className="wtpc-page-badge">{index + 1}</span>
                                    <div className="wtpc-image-wrapper">
                                        <ImageLoader
                                            src={url}
                                            alt={`Compiled Page ${index + 1}`}
                                            className={`wtpc-topic-image ${expandedImages[index] ? 'wtpc-expanded' : ''}`}
                                            onClick={() => setLightboxIndex(index)}
                                            loading="lazy"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            {lightboxIndex !== null && (
                <ImageSlideshowModal
                    images={images}
                    startIndex={lightboxIndex}
                    title={title}
                    onClose={() => setLightboxIndex(null)}
                />
            )}
        </div>
    );
}
