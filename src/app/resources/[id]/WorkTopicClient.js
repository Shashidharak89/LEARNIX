"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "../../components/Navbar";
import WorkTopicPage, { FullPageSkeleton } from "./WorkTopicPage";
import ShareToUsersModal from "./ShareToUsersModal";
import { authFetch, verifyTokenAndSyncAuth } from "@/lib/clientAuth";
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
    let active = true;
    verifyTokenAndSyncAuth().then((user) => {
      if (!active) return;
      setIsLoggedIn(Boolean(user));
      setAuthReady(true);
    });
    return () => { active = false; };
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
    const handleLogin = async () => {
      const user = await verifyTokenAndSyncAuth();
      setIsLoggedIn(Boolean(user));
      setAuthReady(true);
    };
    window.addEventListener("storage", handleLogin);
    window.addEventListener("learnix:auth-synced", handleLogin);
    return () => {
      window.removeEventListener("storage", handleLogin);
      window.removeEventListener("learnix:auth-synced", handleLogin);
    };
  }, []);

  useEffect(() => {
    if (!id) return;
    if (!authReady) return;
    if (!isLoggedIn) {
      setData(null);
      setLoading(false);
      setError(null);
      setUsingCachedData(false);
      return;
    }

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
        
        if (res.status === 401) {
          setIsLoggedIn(false);
          setData(null);
          setUsingCachedData(false);
          throw new Error("Please log in to view this resource.");
        }
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
  }, [id, authReady, isLoggedIn]);


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
      {!authReady ? (
        <FullPageSkeleton />
      ) : !isLoggedIn ? (
        <div className="wtp-locked-shell">
          <FullPageSkeleton />
          <div className="wtp-locked-overlay" role="dialog" aria-labelledby="wtp-login-title">
            <section className="wtp-access-card wtp-access-card--apple">
              <span className="wtp-access-icon" aria-hidden="true">
                <LockIcon size={23} />
              </span>
              <p className="wtp-access-eyebrow">RESOURCE ACCESS</p>
              <h1 id="wtp-login-title">Login required</h1>
              <p className="wtp-access-copy">
                Please log in to access this resource.
              </p>
              <Link href={`/login?redirect=${encodeURIComponent(`/resources/${id}`)}`} className="wtp-access-action">
                Log in or register
              </Link>
            </section>
          </div>
        </div>
      ) : (
        <>
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

          <ShareToUsersModal
            open={shareModalOpen}
            onClose={() => setShareModalOpen(false)}
            shareUrl={sharePayload.url}
            shareText={sharePayload.text}
          />
        </>
      )}

      <style jsx>{`
        .wtp-page-wrapper {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: #ffffff;
        }
        .wtp-access-area {
          min-height: 60vh;
          width: 100%;
          display: grid;
          place-items: center;
          padding: 2rem 1rem;
          background: #ffffff;
        }
        .wtp-access-card {
          width: min(100%, 390px);
          padding: 1.75rem 1.8rem;
          text-align: center;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          background: #ffffff;
          box-shadow: 0 10px 30px rgba(15,23,42,.07), inset 0 1px 0 #ffffff;
        }
        .wtp-access-loading {
          color: #475569;
          font-size: .9rem;
        }
        .wtp-access-icon {
          width: 3.1rem;
          height: 3.1rem;
          margin: 0 auto .9rem;
          display: grid;
          place-items: center;
          color: #0369a1;
          background: #e0f2fe;
          border: 1px solid #bae6fd;
          border-radius: 17px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.8), 0 5px 12px rgba(2,132,199,.08);
        }
        .wtp-access-eyebrow {
          margin: 0 0 .55rem;
          color: #0369a1;
          font-size: .7rem;
          font-weight: 750;
          letter-spacing: .1em;
        }
        .wtp-access-card h1 {
          margin: 0;
          color: #0f172a;
          font-size: clamp(1.25rem, 5vw, 1.55rem);
          line-height: 1.25;
          letter-spacing: -.025em;
        }
        .wtp-access-copy {
          max-width: 31ch;
          margin: .7rem auto 1.25rem;
          color: #475569;
          font-size: .92rem;
          line-height: 1.5;
        }
        .wtp-access-action {
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
          transition: background 160ms ease, transform 160ms ease, box-shadow 160ms ease;
        }
        .wtp-access-action:hover { background: #0369a1; transform: translateY(-1px); box-shadow: 0 8px 18px rgba(2,132,199,.25); }
        .wtp-access-action:focus-visible { outline: 3px solid #7dd3fc; outline-offset: 3px; }
        @media (max-width: 480px) {
          .wtp-access-area { min-height: 55vh; padding: 1.5rem 1rem; }
          .wtp-access-card { padding: 1.4rem 1.1rem; border-radius: 21px; }
          .wtp-access-copy { font-size: .86rem; }
        }
        @media (prefers-reduced-motion: reduce) {
          .wtp-access-action { transition: none; }
        }
      `}</style>
    </div>
  );
};

export default WorkTopicPageWrapper;
