"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaImage } from "react-icons/fa";
import { Navbar } from "../../components/Navbar";
import ImageLoader from "../../components/ImageLoader";
import "../../works/[id]/styles/WorkTopicPage.css"; 

export default function QPCompiledClient() {
    const searchParams = useSearchParams();
    
    const [images, setImages] = useState([]);
    const [title, setTitle] = useState("Compiled Question Papers");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedImages, setExpandedImages] = useState({});

    useEffect(() => {
        const fetchCompiledData = async () => {
            try {
                // Reconstruct query parameters
                const params = new URLSearchParams(searchParams);
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
