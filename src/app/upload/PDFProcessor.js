"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FiUpload, FiX, FiFile, FiImage, FiCheck, FiLoader, FiCheckCircle, FiAlertTriangle } from "react-icons/fi";
import "./styles/PDFProcessor.css";

export default function PDFProcessor({ usn, subject, topic, onClose, onUploadSuccess, onUploadError }) {
  const [pdfFile, setPdfFile] = useState(null);
  const [pages, setPages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedPages, setUploadedPages] = useState(new Set());
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'success', 'error', or ''
  const [progress, setProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadStarted, setUploadStarted] = useState(false);
  const canvasRefs = useRef([]);

  const showMessage = (text, type = "") => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 3000);
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }
    
    if (file.type !== "application/pdf") {
      showMessage("Please select a valid PDF file.", "error");
      return;
    }

    // Reset states when new file is selected
    setPdfFile(file);
    setPages([]);
    setUploadedPages(new Set());
    setProgress(0);
    setUploadComplete(false);
    setUploadStarted(false);
    setMessage("");
    setMessageType("");
    
    await processPDF(file);
  };

  const processPDF = async (file) => {
    setIsProcessing(true);
    showMessage("Processing PDF...", "");

    try {
      if (!window.pdfjsLib) {
        await loadPDFJS();
      }
      await processPDFWithLib(file);
    } catch (error) {
      console.error("Error processing PDF:", error);
      showMessage("Error processing PDF. Please try again.", "error");
      setIsProcessing(false);
    }
  };

  const loadPDFJS = () => {
    return new Promise((resolve, reject) => {
      if (window.pdfjsLib) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const processPDFWithLib = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const typedArray = new Uint8Array(arrayBuffer);
      const pdf = await window.pdfjsLib.getDocument(typedArray).promise;
      const numPages = pdf.numPages;
      const extractedPages = [];

      showMessage(`Extracting ${numPages} pages from PDF...`, "");

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const scale = 2.0;
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          
          // Set A4 aspect ratio (210:297 mm ≈ 0.707:1) for consistent dimensions
          const a4Ratio = 210 / 297;
          const pageRatio = viewport.width / viewport.height;
          
          // Adjust canvas size to maintain A4 proportions while ensuring readability
          if (pageRatio > a4Ratio) {
            // Page is wider than A4, fit to width
            canvas.width = Math.min(viewport.width, 800);
            canvas.height = canvas.width / a4Ratio;
          } else {
            // Page is taller than A4, fit to height
            canvas.height = Math.min(viewport.height, 1000);
            canvas.width = canvas.height * a4Ratio;
          }

          // Fill with white background for better readability
          context.fillStyle = 'white';
          context.fillRect(0, 0, canvas.width, canvas.height);

          // Calculate scaling and positioning to center the page content
          const scaleX = canvas.width / viewport.width;
          const scaleY = canvas.height / viewport.height;
          const scale_final = Math.min(scaleX, scaleY);
          
          const scaledWidth = viewport.width * scale_final;
          const scaledHeight = viewport.height * scale_final;
          const offsetX = (canvas.width - scaledWidth) / 2;
          const offsetY = (canvas.height - scaledHeight) / 2;

          // Create a scaled viewport
          const scaledViewport = page.getViewport({ scale: scale * scale_final });
          
          // Save context state
          context.save();
          context.translate(offsetX, offsetY);

          const renderContext = { 
            canvasContext: context, 
            viewport: scaledViewport 
          };
          
          await page.render(renderContext).promise;

          // Restore context state
          context.restore();

          // Convert canvas to blob with high quality
          const blob = await new Promise((resolve) => {
            canvas.toBlob(resolve, "image/jpeg", 0.95);
          });

          if (blob) {
            extractedPages.push({
              pageNumber: pageNum,
              blob: blob,
              imageUrl: URL.createObjectURL(blob),
              fileName: `${file.name.replace('.pdf', '')}_page_${pageNum}.jpg`,
              size: blob.size
            });
          }

          // Update progress during extraction
          const extractProgress = Math.round((pageNum / numPages) * 100);
          showMessage(`Extracting page ${pageNum}/${numPages} (${extractProgress}%)...`, "");
          
        } catch (pageError) {
          console.error(`Error processing page ${pageNum}:`, pageError);
          showMessage(`Error processing page ${pageNum}, skipping...`, "error");
        }
      }

      if (extractedPages.length === 0) {
        showMessage("No pages could be extracted from the PDF.", "error");
        setIsProcessing(false);
        return;
      }

      setPages(extractedPages);
      const totalSize = extractedPages.reduce((sum, page) => sum + page.size, 0);
      showMessage(`Successfully extracted ${extractedPages.length} pages from PDF (${(totalSize / 1024 / 1024).toFixed(2)}MB total)`, "success");
      
    } catch (error) {
      console.error("Error processing PDF:", error);
      if (error.name === 'InvalidPDFException') {
        showMessage("Invalid PDF file. Please try a different PDF.", "error");
      } else if (error.name === 'MissingPDFException') {
        showMessage("PDF file appears to be corrupted. Please try a different file.", "error");
      } else {
        showMessage("Error processing PDF. Please try again.", "error");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const uploadSequentially = async () => {
    if (pages.length === 0) {
      showMessage("No pages to upload.", "error");
      return;
    }

    setUploading(true);
    setUploadComplete(false);
    setUploadStarted(true);
    setUploadedPages(new Set());
    setProgress(0);
    showMessage("Starting upload...", "");
    
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      try {
        await uploadPage(page, i + 1, pages.length);
        successCount++;
        setUploadedPages(prev => new Set([...prev, page.pageNumber]));
        
        const percent = Math.round(((i + 1) / pages.length) * 100);
        setProgress(percent);
        showMessage(`Uploaded page ${page.pageNumber} (${i + 1}/${pages.length} - ${percent}%)`, "");
        
      } catch (error) {
        failCount++;
        console.error(`Failed to upload page ${page.pageNumber}:`, error);
        showMessage(`Failed to upload page ${page.pageNumber}`, "error");
      }
    }
    
    setUploading(false);
    
    if (successCount === pages.length) {
      setUploadComplete(true);
      showMessage(`All ${pages.length} pages uploaded successfully!`, "success");
      
      // Notify parent component of successful upload
      setTimeout(() => {
        onUploadSuccess?.(subject, topic);
      }, 2000);
      
    } else if (successCount > 0) {
      showMessage(`${successCount}/${pages.length} pages uploaded successfully. ${failCount} failed.`, "warning");
      // Still call onUploadSuccess if at least some pages were uploaded
      setTimeout(() => {
        onUploadSuccess?.(subject, topic);
      }, 2000);
    } else {
      showMessage("All uploads failed. Please try again.", "error");
      onUploadError?.("All uploads failed");
    }
  };

  const uploadPage = async (page, currentIndex, totalPages) => {
    const formData = new FormData();
    formData.append("usn", usn);
    formData.append("subject", subject);
    formData.append("topic", topic);
    formData.append("file", page.blob, page.fileName);

    try {
      const response = await axios.post("/api/topic/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000, // 30 second timeout per upload
      });

      if (!response.data) {
        throw new Error("No response data received");
      }

      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error("Upload timeout");
      } else if (error.response?.status === 413) {
        throw new Error("File too large");
      } else if (error.response?.status >= 500) {
        throw new Error("Server error");
      } else {
        throw new Error(error.response?.data?.error || "Upload failed");
      }
    }
  };

  // Cleanup function to revoke object URLs
  useEffect(() => {
    return () => {
      pages.forEach((page) => {
        if (page.imageUrl) {
          URL.revokeObjectURL(page.imageUrl);
        }
      });
    };
  }, [pages]);

  // Handle component unmount
  useEffect(() => {
    const currentPages = pages;
    return () => {
      currentPages.forEach((page) => {
        if (page.imageUrl) {
          URL.revokeObjectURL(page.imageUrl);
        }
      });
    };
  }, []);

  return (
    <div className="pdf-processor-container">
      <div className="pdf-processor-header">
        <div className="pdf-processor-title">
          <FiFile className="pdf-processor-icon" />
          <h3>Upload PDF Document</h3>
        </div>
        <button onClick={onClose} className="pdf-processor-close" disabled={uploading}>
          <FiX />
        </button>
      </div>

      <div className="pdf-processor-content">
        {message && (
          <div className={`pdf-processor-message ${messageType}`}>
            {messageType === 'success' && <FiCheckCircle className="pdf-message-icon" />}
            {messageType === 'error' && <FiAlertTriangle className="pdf-message-icon" />}
            <span>{message}</span>
          </div>
        )}

        {uploadComplete ? (
          <div className="pdf-processor-success-animation">
            <FiCheckCircle className="pdf-processor-success-icon" />
            <div className="pdf-processor-success-text">
              PDF Upload Completed Successfully!
            </div>
            <div className="pdf-processor-success-details">
              {pages.length} pages uploaded to {subject} → {topic}
            </div>
          </div>
        ) : (
          <>
            <div className="pdf-processor-file-select">
              <label className="pdf-processor-select-btn">
                <FiFile className="pdf-select-icon" />
                {pdfFile ? 'Change PDF File' : 'Select PDF File'}
                <input 
                  type="file" 
                  accept=".pdf,application/pdf" 
                  onChange={handleFileSelect} 
                  disabled={isProcessing || uploading} 
                  className="pdf-processor-file-input"
                />
              </label>
            </div>

            {pdfFile && (
              <div className="pdf-processor-file-info">
                <div className="pdf-file-details">
                  <FiFile className="pdf-file-icon" />
                  <div className="pdf-file-text">
                    <div className="pdf-file-name">{pdfFile.name}</div>
                    <div className="pdf-file-size">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                </div>
              </div>
            )}

            {isProcessing && (
              <div className="pdf-processor-loading">
                <FiLoader className="pdf-processor-spinner" />
                <span>Processing PDF pages...</span>
              </div>
            )}

            {pages.length > 0 && !uploadComplete && (
              <>
                <div className="pdf-processor-pages-header">
                  <h4>Extracted Pages ({pages.length})</h4>
                  <span className="pdf-pages-size">
                    Total size: {(pages.reduce((sum, p) => sum + p.size, 0) / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                
                <div className="pdf-processor-preview-grid">
                  {pages.map((page) => (
                    <div 
                      key={page.pageNumber} 
                      className={`pdf-processor-page ${uploadedPages.has(page.pageNumber) ? "uploaded" : ""}`}
                    >
                      <div className="pdf-processor-page-header">
                        <span className="pdf-page-title">
                          <FiImage /> Page {page.pageNumber}
                        </span>
                        {uploadedPages.has(page.pageNumber) && (
                          <FiCheck className="pdf-page-check" />
                        )}
                      </div>
                      <div className="pdf-processor-thumb-container">
                        <img 
                          src={page.imageUrl} 
                          alt={`Page ${page.pageNumber}`} 
                          className="pdf-processor-thumb" 
                          loading="lazy"
                        />
                        <div className="pdf-page-size">
                          {(page.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {!uploading && uploadedPages.size < pages.length && !uploadStarted && (
                  <button 
                    onClick={uploadSequentially} 
                    className="pdf-processor-upload-all"
                    disabled={isProcessing}
                  >
                    <FiUpload /> Upload All Pages to {topic}
                  </button>
                )}

                {uploading && (
                  <div className="pdf-processor-upload-section">
                    <div className="pdf-processor-progress">
                      <div className="pdf-processor-progress-container">
                        <div 
                          className="pdf-processor-progress-bar" 
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <span className="pdf-processor-progress-text">
                        {progress}% Completed ({uploadedPages.size}/{pages.length} pages)
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}