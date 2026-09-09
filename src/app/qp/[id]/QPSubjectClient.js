"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaImage, FaDownload, FaShare } from "react-icons/fa";
import { Navbar } from "../../components/Navbar";
import ImageLoader from "../../components/ImageLoader";
import "../../works/[id]/styles/WorkTopicPage.css"; // Reuse styling from works page

export default function QPSubjectClient() {
    const params = useParams();
    const id = params?.id;
    
    const [images, setImages] = useState([]);
    const [subjectName, setSubjectName] = useState("Question Papers");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedImages, setExpandedImages] = useState({});
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            try {
                // We use limit=100 to get as many QPs as possible for this subject
                const res = await fetch(`/api/qp/v1/images?subjectId=${id}&limit=100`);
                if (!res.ok) throw new Error("Failed to fetch data");
                
                const json = await res.json();
                
                if (json.success && json.data) {
                    // Extract subject name from the first record if available
                    if (json.data.length > 0 && json.data[0].subject) {
                        setSubjectName(json.data[0].subject.name || "Question Papers");
                    }
                    
                    // Combine all image URLs from all records in order
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

        fetchData();
    }, [id]);

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
                    fileName: `${subjectName.replace(/[^a-zA-Z0-9.-]/g, '_')}_Question_Papers`
                })
            });

            if (!res.ok) throw new Error("Failed to generate PDF");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `${subjectName.replace(/[^a-zA-Z0-9.-]/g, '_')}_Question_Papers.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Error generating PDF:", err);
            alert(err.message || "An error occurred while generating the PDF.");
        } finally {
            setDownloading(false);
        }
    };

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${subjectName} | Question Papers`,
                    text: `Check out question papers for ${subjectName} on Learnix`,
                    url: url
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error("Error sharing", err);
                }
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
                    <p style={{ marginTop: "15px", color: "#666" }}>Loading question papers...</p>
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
                        <p>{error || "There are no images available for this subject yet."}</p>
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
                
                {/* Header */}
                <div className="wtpc-topic-section">
                    <div className="wtpc-topic-header">
                        <h2 className="wtpc-topic-title">{subjectName}</h2>
                        <p style={{ color: "#666", fontSize: "14px", marginTop: "5px" }}>Compiled Question Papers</p>
                    </div>
                    
                    <div className="wtpc-action-buttons-container" style={{ margin: "20px 0", borderBottom: "1px solid #eaeaea", paddingBottom: "20px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        <Link href="/qp" className="wtpc-action-btn wtpc-back-btn">
                            <FaArrowLeft />
                            <span className="wtpc-btn-text">Back to Search</span>
                        </Link>
                        <button
                            onClick={handleDownload}
                            disabled={downloading}
                            className="wtpc-action-btn wtpc-download-btn"
                        >
                            <FaDownload />
                            <span className="wtpc-btn-text">{downloading ? "Generating..." : "Download PDF"}</span>
                        </button>
                        <button
                            onClick={handleShare}
                            className="wtpc-action-btn wtpc-share-btn"
                        >
                            <FaShare />
                            <span className="wtpc-btn-text">Share</span>
                        </button>
                    </div>

                    {/* Images Section */}
                    <div className="wtpc-images-section">
                        <div className="wtpc-images-header">
                            <h3>
                                <FaImage className="wtpc-section-icon" />
                                All Pages ({images.length})
                            </h3>
                        </div>
                        
                        <div className="wtpc-images-grid">
                            {images.map((url, index) => (
                                <div key={index} className="wtpc-image-container">
                                    <span className="wtpc-page-badge">{index + 1}</span>
                                    <div className="wtpc-image-wrapper">
                                        <ImageLoader
                                            src={url}
                                            alt={`${subjectName} - Page ${index + 1}`}
                                            className={`wtpc-topic-image ${expandedImages[index] ? 'wtpc-expanded' : ''}`}
                                            onClick={() => toggleImageExpansion(index)}
                                            loading="lazy"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
