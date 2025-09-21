"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link"; // ✅ import Link
import { FaArrowLeft } from "react-icons/fa"; // ✅ import arrow icon
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
        const res = await fetch(`/api/work/getbytopicid/${id}`);
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
      const jsPDF = (await import("jspdf")).default;
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;

      // Add title and metadata
      pdf.setFontSize(20);
      pdf.text(`${data.topic.topic}`, margin, 30);
      pdf.setFontSize(12);
      pdf.text(`Subject: ${data.subject.subject}`, margin, 50);
      pdf.text(`Student: ${data.user.name} (${data.user.usn})`, margin, 65);
      pdf.text(
        `Date: ${new Date(data.topic.timestamp).toLocaleDateString()}`,
        margin,
        80
      );

      // Add content if available
      if (data.topic.content) {
        const splitText = pdf.splitTextToSize(
          `Content: ${data.topic.content}`,
          pageWidth - 2 * margin
        );
        pdf.text(splitText, margin, 95);
      }

      // Process images
      const imagePromises = data.topic.images
        .filter((url) => url && url.trim() !== "")
        .map(
          (imageUrl, imgIndex) =>
            new Promise((resolve, reject) => {
              const img = new Image();
              img.crossOrigin = "anonymous";
              img.onload = () => resolve({ img, imgIndex });
              img.onerror = () => reject(`Failed to load image ${imgIndex + 1}`);
              img.src = imageUrl;
            })
        );

      const loadedImages = await Promise.all(imagePromises);

      for (let i = 0; i < loadedImages.length; i++) {
        const { img } = loadedImages[i];
        if (i > 0) pdf.addPage();

        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;
        const ratio = Math.min(
          (pageWidth - 2 * margin) / imgWidth,
          (pageHeight - 150) / imgHeight
        );

        const width = imgWidth * ratio;
        const height = imgHeight * ratio;
        const x = (pageWidth - width) / 2;
        const y = 120; // Start below the text content

        pdf.addImage(img, "JPEG", x, y, width, height);
      }

      const fileName = `${data.topic.topic}_${data.subject.subject}_${data.user.name}`
        .replace(/[^a-zA-Z0-9]/g, "_") + ".pdf";
      pdf.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
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

  if (loading) {
    return (
      <div className="wtp-page-wrapper">
        <Navbar />
        <div className="wtp-loading-container">
          <div className="wtp-loading-spinner"></div>
          <p className="wtp-loading-text">Loading topic details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="wtp-page-wrapper">
        <Navbar />
        <div className="wtp-error-container">
          <div className="wtp-error-content">
            <h2>Error Loading Topic</h2>
            <p>{error}</p>
            <Link href="/works" className="wtp-back-link">
              <FaArrowLeft /> Back to Topics
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="wtp-page-wrapper">
        <Navbar />
        <div className="wtp-error-container">
          <div className="wtp-error-content">
            <h2>Topic Not Found</h2>
            <p>The requested topic could not be found.</p>
            <Link href="/works" className="wtp-back-link">
              <FaArrowLeft /> Back to Topics
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="wtp-page-wrapper">
      <Navbar />
      <WorkTopicPage
        data={data}
        loading={loading}
        error={error}
        onDownload={downloadTopicAsPDF}
        onShare={handleShare}
      />
      <Footer />
    </div>
  );
};

export default WorkTopicPageWrapper;
