"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import imageCompression from "browser-image-compression";
import { FiUpload, FiX, FiFile, FiImage, FiCheck, FiLoader, FiCheckCircle } from "react-icons/fi";
import "./styles/PDFProcessor.css";

export default function PDFProcessor({ usn, subject, topic, onClose, onUploadSuccess }) {
  const [pdfFile, setPdfFile] = useState(null);
  const [pages, setPages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedPages, setUploadedPages] = useState(new Set());
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'success', 'error', or ''
  const [progress, setProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
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
    if (!file || file.type !== "application/pdf") {
      showMessage("Please select a valid PDF file.", "error");
      return;
    }

    setPdfFile(file);
    setPages([]);
    setUploadedPages(new Set());
    setProgress(0);
    setUploadComplete(false);
    await processPDF(file);
  };

  const processPDF = async (file) => {
    setIsProcessing(true);
    showMessage("Processing PDF...", "");

    try {
      if (!window.pdfjsLib) {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
        script.onload = () => {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          processPDFWithLib(file);
        };
        document.head.appendChild(script);
      } else {
        processPDFWithLib(file);
      }
    } catch (error) {
      console.error("Error loading PDF.js:", error);
      showMessage("Error loading PDF processor. Please refresh and try again.", "error");
      setIsProcessing(false);
    }
  };

  const processPDFWithLib = async (file) => {
    try {
      const fileReader = new FileReader();

      fileReader.onload = async function () {
        try {
          const typedArray = new Uint8Array(this.result);
          const pdf = await window.pdfjsLib.getDocument(typedArray).promise;
          const numPages = pdf.numPages;
          const extractedPages = [];

          for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const scale = 2.0;
            const viewport = page.getViewport({ scale });

            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            
            // Set A4 aspect ratio (210:297 mm ≈ 0.707:1)
            const a4Ratio = 210 / 297;
            const pageRatio = viewport.width / viewport.height;
            
            // Adjust canvas size to maintain A4 proportions
            if (pageRatio > a4Ratio) {
              // Page is wider than A4, fit to width
              canvas.width = Math.min(viewport.width, 600);
              canvas.height = canvas.width / a4Ratio;
            } else {
              // Page is taller than A4, fit to height
              canvas.height = Math.min(viewport.height, 800);
              canvas.width = canvas.height * a4Ratio;
            }

            // Fill with white background
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

            // Convert canvas to blob
            const blob = await new Promise((resolve) => {
              canvas.toBlob(resolve, "image/jpeg", 0.9);
            });

            // Compress the image
            const compressedBlob = await compressImage(blob);

            extractedPages.push({
              pageNumber: pageNum,
              blob: compressedBlob,
              imageUrl: URL.createObjectURL(compressedBlob),
              fileName: `${file.name}_page_${pageNum}.jpg`,
            });

            // Update progress during extraction
            const extractProgress = Math.round((pageNum / numPages) * 50); // 50% for extraction
            showMessage(`Extracting page ${pageNum}/${numPages}...`, "");
          }

          setPages(extractedPages);
          showMessage(`Successfully extracted ${numPages} pages from PDF.`, "success");
        } catch (error) {
          console.error("Error processing PDF:", error);
          showMessage("Error processing PDF. Please try again.", "error");
        } finally {
          setIsProcessing(false);
        }
      };

      fileReader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Error reading file:", error);
      showMessage("Error reading PDF file.", "error");
      setIsProcessing(false);
    }
  };

  const compressImage = async (imageBlob) => {
    try {
      const options = {
        maxSizeMB: 0.5, // Maximum file size in MB
        maxWidthOrHeight: 800, // Maximum width or height
        useWebWorker: true,
        quality: 0.8, // Image quality (0-1)
      };

      const compressedFile = await imageCompression(imageBlob, options);
      return compressedFile;
    } catch (error) {
      console.error("Error compressing image:", error);
      return imageBlob; // Return original if compression fails
    }
  };

  const uploadSequentially = async () => {
    setUploading(true);
    setUploadComplete(false);
    showMessage("Uploading started...", "");
    
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      await uploadPage(page, i + 1, pages.length);
    }
    
    setUploading(false);
    setUploadComplete(true);
    showMessage("All pages uploaded successfully!", "success");
    
    // Show success animation for 2 seconds then call onUploadSuccess
    setTimeout(() => {
      onUploadSuccess();
    }, 2000);
  };

  const uploadPage = async (page, currentIndex, totalPages) => {
    const formData = new FormData();
    formData.append("usn", usn);
    formData.append("subject", subject);
    formData.append("topic", topic);
    formData.append("file", page.blob, page.fileName);

    try {
      await axios.post("/api/topic/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUploadedPages((prev) => new Set([...prev, page.pageNumber]));
      const percent = Math.round((currentIndex / totalPages) * 100);
      setProgress(percent);
      showMessage(`Uploaded page ${page.pageNumber} (${percent}% completed)`, "");
    } catch (error) {
      console.error("Upload error:", error);
      showMessage(`Failed to upload page ${page.pageNumber}`, "error");
    }
  };

  useEffect(() => {
    return () => {
      pages.forEach((page) => {
        URL.revokeObjectURL(page.imageUrl);
      });
    };
  }, [pages]);

  return (
    <div className="pdf-processor-box">
      <div className="pdf-processor-header">
        <h3 className="pdf-processor-title">
          <FiFile />
          Upload PDF
        </h3>
        <button onClick={onClose} className="pdf-processor-close">
          <FiX />
        </button>
      </div>

        <div className="pdf-processor-content">
          {message && (
            <div className={`pdf-processor-message ${messageType}`}>
              {message}
            </div>
          )}

          {uploadComplete ? (
            <div className="pdf-processor-success-animation">
              <FiCheckCircle className="pdf-processor-success-icon" />
              <div className="pdf-processor-success-text">
                Upload Completed Successfully!
              </div>
            </div>
          ) : (
            <>
              <div className="pdf-processor-select">
                <label className="pdf-processor-select-btn">
                  <FiFile />
                  Select PDF File
                  <input 
                    type="file" 
                    accept=".pdf" 
                    onChange={handleFileSelect} 
                    disabled={isProcessing || uploading} 
                    style={{ display: "none" }} 
                  />
                </label>
              </div>

              {pdfFile && (
                <div className="pdf-processor-selected">
                  Selected File: {pdfFile.name}
                </div>
              )}

              {isProcessing && (
                <div className="pdf-processor-loading">
                  <FiLoader className="pdf-processor-spinner" />
                  Processing PDF...
                </div>
              )}

              {pages.length > 0 && (
                <>
                  <div className="pdf-processor-preview-grid">
                    {pages.map((page) => (
                      <div 
                        key={page.pageNumber} 
                        className={`pdf-processor-page ${uploadedPages.has(page.pageNumber) ? "uploaded" : ""}`}
                      >
                        <div className="pdf-processor-page-header">
                          <span>
                            <FiImage /> Page {page.pageNumber}
                          </span>
                          {uploadedPages.has(page.pageNumber) && (
                            <FiCheck />
                          )}
                        </div>
                        <div className="pdf-processor-thumb-container">
                          <img 
                            src={page.imageUrl} 
                            alt={`Page ${page.pageNumber}`} 
                            className="pdf-processor-thumb" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {!uploading && uploadedPages.size < pages.length && (
                    <button 
                      onClick={uploadSequentially} 
                      className="pdf-processor-upload-all"
                    >
                      <FiUpload /> Upload All Pages
                    </button>
                  )}

                  {uploading && (
                    <div className="pdf-processor-progress">
                      <div className="pdf-processor-progress-container">
                        <div 
                          className="pdf-processor-progress-bar" 
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <span className="pdf-processor-progress-text">
                        {progress}% Completed
                      </span>
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