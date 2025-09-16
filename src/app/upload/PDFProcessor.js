"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FiUpload, FiX, FiFile, FiImage, FiCheck, FiLoader } from "react-icons/fi";

export default function PDFProcessor({ usn, subject, topic, onClose, onUploadSuccess }) {
  const [pdfFile, setPdfFile] = useState(null);
  const [pages, setPages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadingStates, setUploadingStates] = useState({});
  const [uploadedPages, setUploadedPages] = useState(new Set());
  const [message, setMessage] = useState("");
  const canvasRefs = useRef([]);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file || file.type !== "application/pdf") {
      setMessage("Please select a valid PDF file.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setPdfFile(file);
    setPages([]);
    setUploadedPages(new Set());
    await processPDF(file);
  };

  const processPDF = async (file) => {
    setIsProcessing(true);
    setMessage("Processing PDF...");

    try {
      // Use PDF.js from CDN
      if (!window.pdfjsLib) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = () => {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          processPDFWithLib(file);
        };
        document.head.appendChild(script);
      } else {
        processPDFWithLib(file);
      }
    } catch (error) {
      console.error("Error loading PDF.js:", error);
      setMessage("Error loading PDF processor. Please refresh and try again.");
      setTimeout(() => setMessage(""), 3000);
      setIsProcessing(false);
    }
  };

  const processPDFWithLib = async (file) => {
    try {
      const fileReader = new FileReader();
      
      fileReader.onload = async function() {
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
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
              canvasContext: context,
              viewport: viewport
            };

            await page.render(renderContext).promise;
            
            const blob = await new Promise(resolve => {
              canvas.toBlob(resolve, "image/jpeg", 0.8);
            });

            extractedPages.push({
              pageNumber: pageNum,
              blob: blob,
              imageUrl: URL.createObjectURL(blob),
              fileName: `${file.name}_page_${pageNum}.jpg`
            });
          }

          setPages(extractedPages);
          setMessage(`Successfully extracted ${numPages} pages from PDF.`);
          setTimeout(() => setMessage(""), 3000);
        } catch (error) {
          console.error("Error processing PDF:", error);
          setMessage("Error processing PDF. Please try again.");
          setTimeout(() => setMessage(""), 3000);
        } finally {
          setIsProcessing(false);
        }
      };

      fileReader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Error reading file:", error);
      setMessage("Error reading PDF file.");
      setTimeout(() => setMessage(""), 3000);
      setIsProcessing(false);
    }
  };

  const uploadPage = async (page) => {
    const pageId = `page-${page.pageNumber}`;
    setUploadingStates(prev => ({ ...prev, [pageId]: true }));

    const formData = new FormData();
    formData.append("usn", usn);
    formData.append("subject", subject);
    formData.append("topic", topic);
    formData.append("file", page.blob, page.fileName);

    try {
      const res = await axios.post("/api/topic/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setUploadedPages(prev => new Set([...prev, page.pageNumber]));
      setMessage(`Page ${page.pageNumber} uploaded successfully!`);
      setTimeout(() => setMessage(""), 3000);

      if (uploadedPages.size + 1 === pages.length) {
        onUploadSuccess();
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage(`Failed to upload page ${page.pageNumber}`);
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setUploadingStates(prev => {
        const newState = { ...prev };
        delete newState[pageId];
        return newState;
      });
    }
  };

  const uploadAllPages = async () => {
    const unuploadedPages = pages.filter(page => !uploadedPages.has(page.pageNumber));
    
    for (const page of unuploadedPages) {
      await uploadPage(page);
    }
  };

  useEffect(() => {
    return () => {
      pages.forEach(page => {
        URL.revokeObjectURL(page.imageUrl);
      });
    };
  }, [pages]);

  return (
    <div style={{ 
      border: "1px solid #ddd", 
      borderRadius: "8px", 
      padding: "20px", 
      margin: "10px 0",
      backgroundColor: "#f9f9f9"
    }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "15px" 
      }}>
        <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
          <FiFile />
          PDF Processor
        </h3>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            fontSize: "18px",
            cursor: "pointer",
            padding: "4px"
          }}
        >
          <FiX />
        </button>
      </div>

      {message && (
        <div style={{
          padding: "10px",
          marginBottom: "15px",
          borderRadius: "4px",
          backgroundColor: message.includes("Error") || message.includes("Failed") ? "#fee" : "#efe",
          color: message.includes("Error") || message.includes("Failed") ? "#c33" : "#363",
          border: `1px solid ${message.includes("Error") || message.includes("Failed") ? "#fcc" : "#cfc"}`
        }}>
          {message}
        </div>
      )}

      <div style={{ marginBottom: "20px" }}>
        <label style={{
          display: "inline-block",
          padding: "10px 16px",
          backgroundColor: "#007bff",
          color: "white",
          borderRadius: "4px",
          cursor: "pointer",
          border: "none"
        }}>
          <FiFile style={{ marginRight: "8px" }} />
          Select PDF File
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            style={{ display: "none" }}
            disabled={isProcessing}
          />
        </label>
      </div>

      {pdfFile && (
        <div style={{ marginBottom: "15px", padding: "10px", backgroundColor: "#f0f0f0", borderRadius: "4px" }}>
          <strong>Selected File:</strong> {pdfFile.name}
        </div>
      )}

      {isProcessing && (
        <div style={{ 
          textAlign: "center", 
          padding: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px"
        }}>
          <FiLoader style={{ animation: "spin 1s linear infinite" }} />
          <span>Processing PDF...</span>
        </div>
      )}

      {pages.length > 0 && (
        <>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            marginBottom: "15px" 
          }}>
            <h4 style={{ margin: 0 }}>
              Extracted Pages ({pages.length})
            </h4>
            {pages.length > 1 && uploadedPages.size < pages.length && (
              <button
                onClick={uploadAllPages}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px"
                }}
              >
                <FiUpload />
                Upload All Remaining
              </button>
            )}
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: "15px",
            maxHeight: "400px",
            overflowY: "auto"
          }}>
            {pages.map((page) => {
              const pageId = `page-${page.pageNumber}`;
              const isUploaded = uploadedPages.has(page.pageNumber);
              const isUploading = uploadingStates[pageId];

              return (
                <div
                  key={page.pageNumber}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    padding: "10px",
                    backgroundColor: isUploaded ? "#f0fff0" : "white"
                  }}
                >
                  <div style={{ 
                    marginBottom: "10px", 
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px"
                  }}>
                    <FiImage />
                    Page {page.pageNumber}
                    {isUploaded && <FiCheck style={{ color: "#28a745" }} />}
                  </div>
                  
                  <img
                    src={page.imageUrl}
                    alt={`Page ${page.pageNumber}`}
                    style={{
                      width: "100%",
                      height: "150px",
                      objectFit: "cover",
                      border: "1px solid #eee",
                      borderRadius: "4px",
                      marginBottom: "10px"
                    }}
                  />
                  
                  <button
                    onClick={() => uploadPage(page)}
                    disabled={isUploading || isUploaded}
                    style={{
                      width: "100%",
                      padding: "8px",
                      backgroundColor: isUploaded ? "#28a745" : (isUploading ? "#6c757d" : "#007bff"),
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: isUploading || isUploaded ? "default" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "5px"
                    }}
                  >
                    {isUploading ? (
                      <>
                        <FiLoader style={{ animation: "spin 1s linear infinite" }} />
                        Uploading...
                      </>
                    ) : isUploaded ? (
                      <>
                        <FiCheck />
                        Uploaded
                      </>
                    ) : (
                      <>
                        <FiUpload />
                        Upload
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}