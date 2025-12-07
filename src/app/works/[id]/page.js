"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
import { Navbar } from "../../components/Navbar";
import Footer from "../../components/Footer";
import WorkTopicPage from "./WorkTopicPage";

const WorkTopicPageWrapper = () => {
  const params = useParams();
  const id = params?.id;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        // Add a minimum loading time for better UX
        const [res] = await Promise.all([
          fetch(`/api/work/getbytopicid/${id}`),
          new Promise(resolve => setTimeout(resolve, 800)) // Minimum 800ms loading
        ]);
        
        if (!res.ok) throw new Error("Failed to fetch data");
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const downloadTopicAsPDF = async (data) => {
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

    if (navigator.share) {
      navigator
        .share({
          title: title,
          text: `Check out this topic by ${data.user.name}`,
          url: url,
        })
        .catch((err) => console.log("Error sharing:", err));
    } else {
      navigator.clipboard
        .writeText(url)
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
        loading={loading}
        error={error}
        onDownload={downloadTopicAsPDF}
        onShare={handleShare}
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