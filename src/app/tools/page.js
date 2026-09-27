"use client";

import { useState, useCallback, useRef } from "react";
import { Navbar } from "../components/Navbar";
import FileUploadDownload from "./WordToPdf";
import TextShareTool from "./TextShareTool";
import ToolsInfo from "./ToolsInfo";
import "./styles/ToolsPage.css";

export default function Tools() {
  const [globalIsDragging, setGlobalIsDragging] = useState(false);
  const [droppedFile, setDroppedFile] = useState(null);
  const dragCounterRef = useRef(0);

  const handlePageDragEnter = useCallback((e) => {
    e.preventDefault();
    dragCounterRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setGlobalIsDragging(true);
    }
  }, []);

  const handlePageDragLeave = useCallback((e) => {
    e.preventDefault();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      setGlobalIsDragging(false);
    }
  }, []);

  const handlePageDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handlePageDrop = useCallback((e) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setGlobalIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dropped = e.dataTransfer.files[0];
      setDroppedFile(dropped);
    }
  }, []);

  return (
    <div
      className="tools-page-root"
      onDragEnter={handlePageDragEnter}
      onDragLeave={handlePageDragLeave}
      onDragOver={handlePageDragOver}
      onDrop={handlePageDrop}
    >
      <Navbar />

      {/* Full-page drag hint overlay */}
      {globalIsDragging && (
        <div className="tool-card-drag-overlay" style={{ position: "fixed", zIndex: 50, inset: 0, pointerEvents: "none" }}>
          <div className="tool-drag-drop-hint">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" />
              <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
            </svg>
            <p className="tool-drag-drop-hint-text">Drop file to upload</p>
            <p className="tool-drag-drop-hint-sub">File Upload will open automatically</p>
          </div>
        </div>
      )}

      <div className="tools-container">
        <header className="tools-header-banner">
          <div className="tools-title-row">
            <h1 className="tools-main-title">Tools</h1>
            <span className="tools-title-badge">Workspace</span>
          </div>
          <p className="tools-main-subtitle">
            Welcome to Learnix Tools — your clean, fast, and privacy-focused workspace for managing files and text snippets. Here you can easily upload documents to get shareable download codes, retrieve files using a code, or temporarily store and collaborate on text snippets with custom access permissions. Everything is designed to work seamlessly in your browser with zero setup required.
          </p>
        </header>

        <div className="tools-cards-list">
          <FileUploadDownload globalIsDragging={globalIsDragging} droppedFile={droppedFile} />
          <TextShareTool />
          <ToolsInfo />
        </div>
      </div>
    </div>
  );
}
