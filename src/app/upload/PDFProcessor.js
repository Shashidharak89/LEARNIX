"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FiUpload, FiX, FiFile, FiImage, FiCheck, FiLoader } from "react-icons/fi";
import "./styles/PDFProcessor.css";

export default function PDFProcessor({ usn, subject, topic, onClose, onUploadSuccess }) {
  const [pdfFile, setPdfFile] = useState(null);
  const [pages, setPages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedPages, setUploadedPages] = useState(new Set());
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
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
    setProgress(0);
    await processPDF(file);
  };

  const processPDF = async (file) => {
    setIsProcessing(true);
    setMessage("Processing PDF...");

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
      setMessage("Error loading PDF processor. Please refresh and try again.");
      setTimeout(() => setMessage(""), 3000);
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
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = { canvasContext: context, viewport: viewport };
            await page.render(renderContext).promise;

            const blob = await new Promise((resolve) => {
              canvas.toBlob(resolve, "image/jpeg", 0.8);
            });

            extractedPages.push({
              pageNumber: pageNum,
              blob: blob,
              imageUrl: URL.createObjectURL(blob),
              fileName: `${file.name}_page_${pageNum}.jpg`,
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

  const uploadSequentially = async () => {
    setUploading(true);
    setMessage("Uploading started...");
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      await uploadPage(page, i + 1, pages.length);
    }
    setUploading(false);
    onUploadSuccess();
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
      setMessage(`Uploaded page ${page.pageNumber} (${percent}% completed)`);
    } catch (error) {
      console.error("Upload error:", error);
      setMessage(`Failed to upload page ${page.pageNumber}`);
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
    <div className="pdf-box">
      <div className="pdf-header">
        <h3 className="pdf-title">
          <FiFile /> PDF Processor
        </h3>
        <button onClick={onClose} className="pdf-close">
          <FiX />
        </button>
      </div>

      {message && <div className="pdf-message">{message}</div>}

      <div className="pdf-select">
        <label className="pdf-select-btn">
          <FiFile style={{ marginRight: "8px" }} />
          Select PDF File
          <input type="file" accept=".pdf" onChange={handleFileSelect} disabled={isProcessing} style={{ display: "none" }} />
        </label>
      </div>

      {pdfFile && <div className="pdf-selected">Selected File: {pdfFile.name}</div>}

      {isProcessing && (
        <div className="pdf-loading">
          <FiLoader className="spin" /> Processing PDF...
        </div>
      )}

      {pages.length > 0 && (
        <>
          <div className="pdf-preview-grid">
            {pages.map((page) => (
              <div key={page.pageNumber} className={`pdf-page ${uploadedPages.has(page.pageNumber) ? "uploaded" : ""}`}>
                <div className="pdf-page-header">
                  <FiImage /> Page {page.pageNumber}
                  {uploadedPages.has(page.pageNumber) && <FiCheck style={{ color: "#28a745" }} />}
                </div>
                <img src={page.imageUrl} alt={`Page ${page.pageNumber}`} className="pdf-thumb" />
              </div>
            ))}
          </div>

          {!uploading && uploadedPages.size < pages.length && (
            <button onClick={uploadSequentially} className="pdf-upload-all">
              <FiUpload /> Upload All Pages
            </button>
          )}

          {uploading && (
            <div className="pdf-progress">
              <div className="pdf-progress-bar" style={{ width: `${progress}%` }}></div>
              <span>{progress}% Completed</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
