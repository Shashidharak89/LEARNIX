"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Download,
  Eye,
  ChevronDown,
  Calendar,
  User,
  BookOpen,
} from "lucide-react";
import "../../search/styles/WorkSearchInterface.css";

const TopicDetail = () => {
  const { id: topicId } = useParams(); // dynamic topic ID
  const [topicData, setTopicData] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!topicId) return;

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/work/${topicId}`);
        const data = await res.json();

        if (data?.success) {
          setTopicData(data);
        } else {
          setTopicData(null);
        }
      } catch (err) {
        console.error("Error fetching topic:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [topicId]);

  const downloadTopicAsPDF = async () => {
    if (!topicData?.topic?.images?.length) {
      alert("No images available for this topic");
      return;
    }

    try {
      const jsPDF = (await import("jspdf")).default;
      const pdf = new jsPDF();
      const margin = 10;

      pdf.setFontSize(18);
      pdf.text(topicData.topic.topic, margin, 30);
      pdf.setFontSize(12);
      pdf.text(`Subject: ${topicData.subject.subject}`, margin, 50);
      pdf.text(
        `Student: ${topicData.user.name} (${topicData.user.usn})`,
        margin,
        65
      );
      pdf.text(
        `Date: ${new Date(topicData.topic.timestamp).toLocaleDateString()}`,
        margin,
        80
      );

      const imagePromises = topicData.topic.images.map(
        (url, i) =>
          new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve({ img, i });
            img.onerror = () => reject(`Failed to load image ${i + 1}`);
            img.src = url;
          })
      );

      const loadedImages = await Promise.all(imagePromises);

      loadedImages.forEach(({ img }, i) => {
        if (i > 0) pdf.addPage();
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const ratio = Math.min(
          (pageWidth - 2 * margin) / img.width,
          (pageHeight - 2 * margin) / img.height
        );
        const width = img.width * ratio;
        const height = img.height * ratio;
        const x = (pageWidth - width) / 2;
        const y = (pageHeight - height) / 2;
        pdf.addImage(img, "JPEG", x, y, width, height);
      });

      pdf.save(
        `${topicData.topic.topic}_${topicData.subject.subject}_${topicData.user.name}.pdf`
      );
    } catch (err) {
      console.error("PDF error:", err);
    }
  };

  if (loading) {
    return (
      <div className="user-detail-loading">
        <p>Loading topic details...</p>
      </div>
    );
  }

  if (!topicData) {
    return (
      <div className="user-detail-error">
        <p>Topic not found</p>
      </div>
    );
  }

  const { user, subject, topic } = topicData;
  const validImages = topic.images?.filter((i) => i.trim() !== "") || [];
  const displayImages = expanded ? validImages : validImages.slice(0, 2);

  return (
    <div className="user-detail-container">
      <div className="user-detail-header">
        <img
          src={user.profileimg}
          alt={user.name}
          className="user-detail-avatar"
        />
        <div>
          <h2>{user.name}</h2>
          <p>{user.usn}</p>
        </div>
      </div>

      <div className="user-subject-card">
        <h3 className="user-subject-title">
          <BookOpen size={16} /> {subject.subject}
        </h3>

        <div className="user-topic-card">
          <div className="user-topic-header">
            <h4>
              <User size={14} /> {topic.topic}
            </h4>
            <span>
              <Calendar size={14} />{" "}
              {new Date(topic.timestamp).toLocaleDateString()}
            </span>
            <button
              onClick={downloadTopicAsPDF}
              className="user-topic-download"
            >
              <Download size={16} />
            </button>
          </div>

          {topic.content && <p>{topic.content}</p>}

          {validImages.length > 0 && (
            <div className="user-topic-images">
              {displayImages.map((imgUrl, i) => (
                <img
                  key={i}
                  src={imgUrl}
                  alt={`Topic ${i + 1}`}
                  className="user-topic-img"
                />
              ))}
              {validImages.length > 2 && (
                <button
                  className="user-topic-view-more"
                  onClick={() => setExpanded(!expanded)}
                >
                  <Eye size={16} />{" "}
                  {expanded
                    ? "Show Less"
                    : `View More (${validImages.length - 2} more)`}{" "}
                  <ChevronDown size={16} className={expanded ? "rotated" : ""} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopicDetail;
