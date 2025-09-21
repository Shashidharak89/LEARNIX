"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Download, Eye, ChevronDown, Calendar, User, BookOpen } from "lucide-react";
import '../../search/styles/WorkSearchInterface.css';

const UserDetail = () => {
  const { id } = useParams(); // 👈 dynamic param
  const [user, setUser] = useState(null);
  const [expandedImages, setExpandedImages] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/work/getall`);
        const data = await res.json();

        // find user by _id
        const foundUser = data.users.find((u) => u._id === id);
        setUser(foundUser || null);
      } catch (err) {
        console.error("Error fetching user:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const toggleImageExpansion = (topicKey) => {
    setExpandedImages((prev) => ({
      ...prev,
      [topicKey]: !prev[topicKey],
    }));
  };

  const downloadTopicAsPDF = async (topic, subjectName) => {
    if (!topic.images || topic.images.length === 0) {
      alert("No images available for this topic");
      return;
    }

    try {
      const jsPDF = (await import("jspdf")).default;
      const pdf = new jsPDF();
      const margin = 10;

      pdf.setFontSize(18);
      pdf.text(topic.topic, margin, 30);
      pdf.setFontSize(12);
      pdf.text(`Subject: ${subjectName}`, margin, 50);
      pdf.text(`Student: ${user.name} (${user.usn})`, margin, 65);
      pdf.text(`Date: ${new Date(topic.timestamp).toLocaleDateString()}`, margin, 80);

      const imagePromises = topic.images.map(
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

      pdf.save(`${topic.topic}_${subjectName}_${user.name}.pdf`);
    } catch (err) {
      console.error("PDF error:", err);
    }
  };

  if (loading) {
    return (
      <div className="user-detail-loading">
        <p>Loading user details...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="user-detail-error">
        <p>User not found</p>
      </div>
    );
  }

  return (
    <div className="user-detail-container">
      <div className="user-detail-header">
        <img src={user.profileimg} alt={user.name} className="user-detail-avatar" />
        <div>
          <h2>{user.name}</h2>
          <p>{user.usn}</p>
        </div>
      </div>

      {user.subjects && user.subjects.length > 0 ? (
        user.subjects.map((subj, subjIndex) => (
          <div key={subjIndex} className="user-subject-card">
            <h3 className="user-subject-title">
              <BookOpen size={16} /> {subj.subject}
            </h3>

            {subj.topics && subj.topics.length > 0 ? (
              subj.topics.map((topic, tIndex) => {
                const topicKey = `${subj.subject}-${topic.topic}-${tIndex}`;
                const validImages = topic.images?.filter((i) => i.trim() !== "") || [];
                const isExpanded = expandedImages[topicKey];
                const displayImages = isExpanded ? validImages : validImages.slice(0, 2);

                return (
                  <div key={tIndex} className="user-topic-card">
                    <div className="user-topic-header">
                      <h4>
                        <User size={14} /> {topic.topic}
                      </h4>
                      <span>
                        <Calendar size={14} />{" "}
                        {new Date(topic.timestamp).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => downloadTopicAsPDF(topic, subj.subject)}
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
                            onClick={() => toggleImageExpansion(topicKey)}
                          >
                            <Eye size={16} />{" "}
                            {isExpanded
                              ? "Show Less"
                              : `View More (${validImages.length - 2} more)`}{" "}
                            <ChevronDown
                              size={16}
                              className={isExpanded ? "rotated" : ""}
                            />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="user-no-topics">No topics uploaded yet.</p>
            )}
          </div>
        ))
      ) : (
        <p className="user-no-subjects">No subjects available.</p>
      )}
    </div>
  );
};

export default UserDetail;
