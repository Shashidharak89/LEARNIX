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
import { LockIcon } from "@animateicons/react/lucide";

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

const WorkTopicPageWrapper = ({ isAndroid: serverIsAndroid }) => {
  const [isAndroid, setIsAndroid] = useState(serverIsAndroid ?? false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const hasSession = Boolean(localStorage.getItem("token") || localStorage.getItem("usn"));
    setIsLoggedIn(hasSession);
    setAuthReady(true);
  }, []);

  useEffect(() => {
    if (serverIsAndroid !== undefined) {
      setIsAndroid(serverIsAndroid);
    } else if (typeof navigator !== "undefined") {
      setIsAndroid(/android/i.test(navigator.userAgent));
    }
  }, [serverIsAndroid]);

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
    if (isLoggedIn) return;
    const handleLogin = () => {
      setIsLoggedIn(Boolean(localStorage.getItem("token") || localStorage.getItem("usn")));
    };
    window.addEventListener("storage", handleLogin);
    window.addEventListener("learnix-auth-changed", handleLogin);
    return () => {
      window.removeEventListener("storage", handleLogin);
      window.removeEventListener("learnix-auth-changed", handleLogin);
    };
  }, [isLoggedIn]);

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


  const downloadTopicAsPDF = async (data, options = {}) => {
    const customDownloadLink = data?.topic?.downloadlink?.trim();
    const validImagesList = (data?.topic?.images || []).filter((url) => url && url.trim() !== "");
    const totalImagesCount = validImagesList.length;

    let isFullDownload = false;

    if (options.allPages || (!options.selectedPages?.length && !options.startPage && !options.endPage)) {
      isFullDownload = true;
    } else if (Array.isArray(options.selectedPages) && options.selectedPages.length > 0) {
      const uniqueSelected = Array.from(new Set(options.selectedPages.map((n) => parseInt(n, 10))))
        .filter((n) => !Number.isNaN(n) && n >= 1 && n <= totalImagesCount);
      if (uniqueSelected.length >= totalImagesCount && totalImagesCount > 0) {
        isFullDownload = true;
      }
    } else if (options.startPage && options.endPage) {
      const s = Math.max(1, Math.min(totalImagesCount, parseInt(options.startPage, 10) || 1));
      const e = Math.max(s, Math.min(totalImagesCount, parseInt(options.endPage, 10) || totalImagesCount));
      if (s === 1 && e === totalImagesCount && totalImagesCount > 0) {
        isFullDownload = true;
      }
    }

    if (isFullDownload && customDownloadLink) {
      window.open(customDownloadLink, "_blank", "noopener,noreferrer");
      return;
    }

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
      const { PDFDocument, PageSizes } = await import('pdf-lib');

      // Create a brand new PDF document (no template cover page)
      const pdfDoc = await PDFDocument.create();

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

          const imagePage = pdfDoc.addPage(PageSizes.A4);
          const pageWidth = imagePage.getWidth();
          const pageHeight = imagePage.getHeight();

          const imgWidth = image.width;
          const imgHeight = image.height;
          const margin = 10;

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
      const blob = new globalThis.Blob([pdfBytes], { type: 'application/pdf' });
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
      
      <div className={`wtp-resource-shell${!isLoggedIn ? " is-locked" : ""}`}>
        <div className="wtp-resource-content" aria-hidden={!isLoggedIn || undefined}>
          <WorkTopicPage
            data={data}
            loading={loading && !usingCachedData}
            error={error}
            onDownload={downloadTopicAsPDF}
            onShare={handleShare}
            topicId={id}
            usingCachedData={usingCachedData}
            isAndroid={isAndroid}
          />
        </div>

        {!isLoggedIn && authReady && (
          <div className="wtp-login-overlay" role="dialog" aria-modal="true" aria-labelledby="wtp-login-title">
            <section className="wtp-login-card">
              <span className="wtp-login-icon" aria-hidden="true">
                <LockIcon size={23} />
              </span>
              <p className="wtp-login-eyebrow">LEARNIX RESOURCES</p>
              <h1 id="wtp-login-title">Sign in to view this resource</h1>
              <p className="wtp-login-copy">
                Log in to access study resources and downloads shared on Learnix.
              </p>
              <Link href={`/login?redirect=${encodeURIComponent(`/resources/${id}`)}`} className="wtp-login-action">
                Log in or register
              </Link>
              <Link href="/resources" className="wtp-login-back">Back to resources</Link>
            </section>
          </div>
        )}
      </div>

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
        .wtp-resource-shell {
          flex: 1;
          position: relative;
          isolation: isolate;
        }
        .wtp-resource-content {
          min-height: 100%;
          transition: filter 220ms ease, transform 220ms ease;
        }
        .wtp-resource-shell.is-locked .wtp-resource-content {
          filter: blur(7px);
          opacity: .64;
          pointer-events: none;
          user-select: none;
          transform: scale(.995);
        }
        .wtp-login-overlay {
          position: fixed;
          inset: 0;
          z-index: 20000;
          display: grid;
          place-items: center;
          padding: 1rem;
          background: rgba(15, 23, 42, .34);
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
        }
        .wtp-login-card {
          width: min(100%, 410px);
          padding: 2rem;
          text-align: center;
          border: 1px solid rgba(255,255,255,.85);
          border-radius: 28px;
          background: rgba(255,255,255,.96);
          box-shadow: 0 24px 80px rgba(15,23,42,.2), inset 0 1px 0 #fff;
          animation: wtp-login-enter 220ms cubic-bezier(.2,.8,.2,1) both;
        }
        .wtp-login-icon {
          width: 3.25rem;
          height: 3.25rem;
          margin: 0 auto 1rem;
          display: grid;
          place-items: center;
          color: #0369a1;
          background: #e0f2fe;
          border: 1px solid #bae6fd;
          border-radius: 20px;
        }
        .wtp-login-eyebrow {
          margin: 0 0 .55rem;
          color: #0369a1;
          font-size: .7rem;
          font-weight: 750;
          letter-spacing: .1em;
        }
        .wtp-login-card h1 {
          margin: 0;
          color: #0f172a;
          font-size: clamp(1.25rem, 5vw, 1.55rem);
          line-height: 1.25;
          letter-spacing: -.025em;
        }
        .wtp-login-copy {
          margin: .7rem 0 1.35rem;
          color: #475569;
          font-size: .92rem;
          line-height: 1.5;
        }
        .wtp-login-action {
          min-height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: .75rem 1rem;
          border-radius: 16px;
          background: #0284c7;
          color: white;
          font-size: .94rem;
          font-weight: 700;
          text-decoration: none;
          box-shadow: 0 6px 16px rgba(2,132,199,.22);
          transition: background 160ms ease, transform 160ms ease;
        }
        .wtp-login-action:hover { background: #0369a1; transform: translateY(-1px); }
        .wtp-login-back {
          display: inline-block;
          margin-top: 1rem;
          color: #475569;
          font-size: .84rem;
          font-weight: 600;
          text-decoration: none;
        }
        .wtp-login-back:hover { color: #0369a1; }
        @keyframes wtp-login-enter {
          from { opacity: 0; transform: translateY(8px) scale(.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (max-width: 480px) {
          .wtp-login-card { padding: 1.45rem 1.2rem; border-radius: 24px; }
          .wtp-login-copy { font-size: .86rem; }
        }
        @media (prefers-reduced-motion: reduce) {
          .wtp-resource-content, .wtp-login-card, .wtp-login-action { transition: none; animation: none; }
        }
      `}</style>
    </div>
  );
};

export default WorkTopicPageWrapper;
