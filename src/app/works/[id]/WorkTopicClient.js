"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
import { Navbar } from "../../components/Navbar";
import Footer from "../../components/Footer";
import WorkTopicPage from "./WorkTopicPage";
import ShareToUsersModal from "./ShareToUsersModal";
import { authFetch } from "@/lib/clientAuth";

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
      viewer: data.viewer
        ? {
            _id: data.viewer._id,
            usn: data.viewer.usn,
            role: data.viewer.role,
            plan: data.viewer.plan,
          }
        : null,
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
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [sharePayload, setSharePayload] = useState({ url: "", text: "" });

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
          authFetch(`/api/work/getbytopicid/${id}`),
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

      // Dynamically import pdf-lib to reduce initial bundle size
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');

      // 1. Fetch the template PDF from public folder
      const templateRes = await fetch('/download-resource-template.pdf');
      if (!templateRes.ok) {
        throw new Error("Could not fetch PDF template. Make sure download-resource-template.pdf is in the public folder.");
      }
      const templateBytes = await templateRes.arrayBuffer();

      // Create a new PDF document to work with
      const pdfDoc = await PDFDocument.load(templateBytes);

      // Get the first page (template page)
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { height } = firstPage.getSize();

      // Embed fonts - using standard fonts
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Prepare replacement values
      const replacements = {
        '[name]': { value: data.user.name, size: 14, bold: true, color: rgb(0, 0, 0) },
        '[usn]': { value: data.user.usn, size: 12, bold: false, color: rgb(0, 0, 0) },
        '[date]': { 
          value: new Date(data.topic.timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }), 
          size: 12, 
          bold: false, 
          color: rgb(0, 0, 0) 
        },
        '[subjectname]': { value: data.subject.subject, size: 14, bold: true, color: rgb(0, 0, 0) },
        '[topicname]': { value: data.topic.topic, size: 16, bold: true, color: rgb(0.1, 0.3, 0.6) },
        '[topicid]': { value: id, size: 10, bold: false, color: rgb(0.4, 0.4, 0.4) },
      };

      // Common positions for the standard template
      const placeholderPositions = {
        '[name]': { x: 180, y: 285, width: 350 },
        '[usn]': { x: 180, y: 315, width: 350 },
        '[subjectname]': { x: 180, y: 385, width: 350 },
        '[topicname]': { x: 180, y: 455, width: 350 },
        '[date]': { x: 180, y: 515, width: 350 },
        '[topicid]': { x: 180, y: 675, width: 350 },
      };

      // For each placeholder, draw a white rectangle to cover it and add the replacement text
      Object.keys(replacements).forEach((placeholder) => {
        const position = placeholderPositions[placeholder];
        const replacement = replacements[placeholder];
        
        if (position && replacement) {
          // Calculate text height based on font size
          const textHeight = replacement.size + 4;
          
          // Draw white rectangle to cover the placeholder
          firstPage.drawRectangle({
            x: position.x - 5,
            y: height - position.y - textHeight,
            width: position.width,
            height: textHeight + 2,
            color: rgb(1, 1, 1),
            borderColor: rgb(1, 1, 1),
            borderWidth: 0,
          });

          // Draw the replacement text
          firstPage.drawText(replacement.value || "N/A", {
            x: position.x,
            y: height - position.y,
            size: replacement.size,
            font: replacement.bold ? fontBold : font,
            color: replacement.color,
          });
        }
      });

      // Process and add images starting from page 2
      const validImages = data.topic.images.filter((url) => url && url.trim() !== "");
      const total = validImages.length;
      let rangedImages = validImages;

      if (Array.isArray(options.selectedPages) && options.selectedPages.length > 0) {
        const uniqueSelection = Array.from(new Set(options.selectedPages.map((n) => parseInt(n, 10))))
          .filter((n) => !Number.isNaN(n) && n >= 1 && n <= total).sort((a, b) => a - b);
        rangedImages = uniqueSelection.map((n) => validImages[n - 1]).filter(Boolean);
      } else if (!options.allPages) {
        let sliceStart = 1;
        let sliceEnd = total;
        const s = Math.max(1, Math.min(total, parseInt(options.startPage, 10) || 1));
        const e = Math.max(s, Math.min(total, parseInt(options.endPage, 10) || total));
        sliceStart = s;
        sliceEnd = e;
        rangedImages = validImages.slice(sliceStart - 1, sliceEnd);
      }

      for (let i = 0; i < rangedImages.length; i++) {
        const imageUrl = rangedImages[i];
        
        try {
          let fetchUrl = imageUrl;
          // Optimizing cloudinary URLs to request jpg to ensure stability
          if (fetchUrl.includes('cloudinary.com') && !fetchUrl.includes('/f_jpg/')) {
            fetchUrl = fetchUrl.replace('/upload/', '/upload/f_jpg/');
          }

          const imageResponse = await fetch(fetchUrl);
          if (!imageResponse.ok) continue;
          
          const imageBuffer = await imageResponse.arrayBuffer();
          const contentType = imageResponse.headers.get("content-type") || "";
          
          let image;
          if (contentType.includes("png") || fetchUrl.toLowerCase().includes(".png")) {
            try {
              image = await pdfDoc.embedPng(imageBuffer);
            } catch (e) {
              image = await pdfDoc.embedJpg(imageBuffer);
            }
          } else {
            try {
              image = await pdfDoc.embedJpg(imageBuffer);
            } catch (e) {
              image = await pdfDoc.embedPng(imageBuffer);
            }
          }

          const imagePage = pdfDoc.addPage();
          const pageWidth = imagePage.getWidth();
          const pageHeight = imagePage.getHeight();

          const imgWidth = image.width;
          const imgHeight = image.height;
          const margin = 20;

          const maxWidth = pageWidth - (2 * margin);
          const maxHeight = pageHeight - (2 * margin);
          
          const scaleX = maxWidth / imgWidth;
          const scaleY = maxHeight / imgHeight;
          const scale = Math.min(scaleX, scaleY);

          const scaledWidth = imgWidth * scale;
          const scaledHeight = imgHeight * scale;

          const x = (pageWidth - scaledWidth) / 2;
          const y = (pageHeight - scaledHeight) / 2;

          imagePage.drawImage(image, {
            x,
            y,
            width: scaledWidth,
            height: scaledHeight,
          });
        } catch (imgError) {
          console.error(`Error processing image ${i + 1}:`, imgError);
        }
      }

      // Serialize the PDF to bytes (a Uint8Array)
      const pdfBytes = await pdfDoc.save();

      // Create filename
      const fileName = `${data.topic.topic}_${data.subject.subject}_${data.user.name}`
        .replace(/[^a-zA-Z0-9]/g, "_") + ".pdf";

      // Download it
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
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

    setSharePayload({
      url,
      text: `${title}\n${text}`,
    });
    setShareModalOpen(true);
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

      <ShareToUsersModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        shareUrl={sharePayload.url}
        shareText={sharePayload.text}
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