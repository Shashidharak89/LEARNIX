"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
import { Navbar } from "../../components/Navbar";
import Footer from "../../components/Footer";
import WorkTopicPage from "./WorkTopicPage";

// LocalStorage key for saved topics
const SAVED_TOPICS_KEY = 'learnix_saved_topics';

// Helper functions for localStorage
const getSavedTopics = () => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(SAVED_TOPICS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const getSavedTopicById = (topicId) => {
  const savedTopics = getSavedTopics();
  return savedTopics.find(t => t.topic._id === topicId);
};

const saveTopic = (data) => {
  if (typeof window === 'undefined' || !data) return;
  try {
    const savedTopics = getSavedTopics();
    const existingIndex = savedTopics.findIndex(t => t.topic._id === data.topic._id);
    
    const topicToSave = {
      topic: {
        _id: data.topic._id,
        topic: data.topic.topic,
        content: data.topic.content,
        images: data.topic.images,
        timestamp: data.topic.timestamp,
      },
      subject: {
        _id: data.subject._id,
        subject: data.subject.subject,
      },
      user: {
        _id: data.user._id,
        name: data.user.name,
        usn: data.user.usn,
        profileimg: data.user.profileimg,
      },
      savedAt: new Date().toISOString(),
    };
    
    if (existingIndex !== -1) {
      savedTopics[existingIndex] = topicToSave;
    } else {
      savedTopics.push(topicToSave);
    }
    
    localStorage.setItem(SAVED_TOPICS_KEY, JSON.stringify(savedTopics));
    return true;
  } catch (err) {
    console.error('Error saving topic:', err);
    return false;
  }
};

const removeSavedTopic = (topicId) => {
  if (typeof window === 'undefined') return;
  try {
    const savedTopics = getSavedTopics();
    const filtered = savedTopics.filter(t => t.topic._id !== topicId);
    localStorage.setItem(SAVED_TOPICS_KEY, JSON.stringify(filtered));
    return true;
  } catch (err) {
    console.error('Error removing saved topic:', err);
    return false;
  }
};

const isTopicSaved = (topicId) => {
  const savedTopics = getSavedTopics();
  return savedTopics.some(t => t.topic._id === topicId);
};

const WorkTopicPageWrapper = () => {
  const params = useParams();
  const id = params?.id;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [usingCachedData, setUsingCachedData] = useState(false);

  useEffect(() => {
    if (!id) return;

    // Check if topic is saved and load cached data first
    const cachedData = getSavedTopicById(id);
    if (cachedData) {
      setData(cachedData);
      setIsSaved(true);
      setUsingCachedData(true);
    }

    const fetchData = async () => {
      try {
        // Add a minimum loading time for better UX (only if no cached data)
        const minDelay = cachedData ? 0 : 800;
        const [res] = await Promise.all([
          fetch(`/api/work/getbytopicid/${id}`),
          new Promise(resolve => setTimeout(resolve, minDelay))
        ]);
        
        if (!res.ok) throw new Error("Failed to fetch data");
        const json = await res.json();
        setData(json);
        setUsingCachedData(false);
        
        // Update cached data if topic was saved
        if (isTopicSaved(id)) {
          saveTopic(json);
        }
      } catch (err) {
        // Only set error if we don't have cached data
        if (!cachedData) {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    // Check saved status
    setIsSaved(isTopicSaved(id));

    fetchData();
  }, [id]);

  const handleSaveToggle = () => {
    if (!data) return;
    
    if (isSaved) {
      removeSavedTopic(data.topic._id);
      setIsSaved(false);
    } else {
      saveTopic(data);
      setIsSaved(true);
    }
  };

  const downloadTopicAsPDF = async (data, options = {}) => {
    if (!data?.topic?.images || data.topic.images.length === 0) {
      alert("No images available for this topic");
      return;
    }

    try {
      // Show loading state
      const downloadBtn = document.querySelector('.wtpc-download-btn');
      const originalText = downloadBtn?.querySelector('.wtpc-btn-text')?.textContent;
      if (downloadBtn) {
        downloadBtn.disabled = true;
        const btnText = downloadBtn.querySelector('.wtpc-btn-text');
        if (btnText) btnText.textContent = 'Generating...';
      }

      // Call the API to generate PDF with template
      const response = await fetch('/api/work/download-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topicId: id,
          user: data.user,
          subject: data.subject,
          topic: data.topic,
          startPage: options.startPage,
          endPage: options.endPage,
          allPages: options.allPages,
          selectedPages: options.selectedPages,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Get the PDF blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.topic.topic}_${data.subject.subject}_${data.user.name}`
        .replace(/[^a-zA-Z0-9]/g, "_") + ".pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Restore button state
      if (downloadBtn) {
        downloadBtn.disabled = false;
        const btnText = downloadBtn.querySelector('.wtpc-btn-text');
        if (btnText) btnText.textContent = originalText;
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
      
      // Restore button state
      const downloadBtn = document.querySelector('.wtpc-download-btn');
      if (downloadBtn) {
        downloadBtn.disabled = false;
        const btnText = downloadBtn.querySelector('.wtpc-btn-text');
        if (btnText) btnText.textContent = 'Download';
      }
    }
  };

  const handleShare = (data) => {
    const url = window.location.href;
    const title = `${data.topic.topic} - ${data.subject.subject}`;
    const text = `Check out "${data.topic.topic}" uploaded by ${data.user.name} on Learnix`;

    if (navigator.share) {
      navigator
        .share({
          title: title,
          text: text,
          url: url,
        })
        .catch((err) => console.log("Error sharing:", err));
    } else {
      navigator.clipboard
        .writeText(`${text}\n${url}`)
        .then(() => alert("Link copied to clipboard!"))
        .catch(() => alert("Failed to copy link"));
    }
  };

  return (
    <div className="wtp-page-wrapper">
      <Navbar />
      
      {/* The WorkTopicPage component now handles all states including loading */}
      <WorkTopicPage
        data={data}
        loading={loading && !usingCachedData}
        error={error}
        onDownload={downloadTopicAsPDF}
        onShare={handleShare}
        topicId={id}
        isSaved={isSaved}
        onSaveToggle={handleSaveToggle}
        usingCachedData={usingCachedData}
      />
      

      <style jsx>{`
        .wtp-page-wrapper {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: #ffffff;
        }
      `}</style>
    </div>
  );
};

export default WorkTopicPageWrapper;