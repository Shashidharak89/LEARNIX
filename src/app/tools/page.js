"use client";

import { useState, useCallback, useRef } from "react";
import { Navbar } from "../components/Navbar";
import FileUploadDownload from "./WordToPdf";
import FileUploadPlus from "./FileUploadPlus";
import TextShareTool from "./TextShareTool";
import ToolsInfo from "./ToolsInfo";
import "./styles/ToolsPage.css";

export default function Tools() {
  const [globalIsDragging, setGlobalIsDragging] = useState(false);
  const [droppedFile, setDroppedFile] = useState(null);
  const [uploadExpandTrigger, setUploadExpandTrigger] = useState(0);
  const [uploadPlusExpandTrigger, setUploadPlusExpandTrigger] = useState(0);
  const [textShareExpandTrigger, setTextShareExpandTrigger] = useState(0);
  const dragCounterRef = useRef(0);

  const handleUploadClick = useCallback(() => {
    setUploadExpandTrigger(prev => prev + 1);
    setTimeout(() => {
      const el = document.querySelector('.tool-card-blue');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 40);
  }, []);

  const handleUploadPlusClick = useCallback(() => {
    setUploadPlusExpandTrigger(prev => prev + 1);
    setTimeout(() => {
      const el = document.querySelector('.tool-card-plus');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 40);
  }, []);

  const handleTextShareClick = useCallback(() => {
    setTextShareExpandTrigger(prev => prev + 1);
    setTimeout(() => {
      const el = document.querySelector('.tool-card-tst');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 40);
  }, []);

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

      <div className="tools-container">
        {/* Intro / Header Card — Centered design */}
        <div className="tools-intro-card">
          <h1 className="tools-title">
            <svg className="tools-title-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
            TOOLS
          </h1>
          <p className="tools-subtitle">
            Quickly share files and text with anyone, anywhere.
          </p>
          <div className="tools-action-buttons">
            <button
              type="button"
              className="tools-action-btn tools-action-btn-primary"
              onClick={handleUploadClick}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Upload File
            </button>
            <button
              type="button"
              className="tools-action-btn tools-action-btn-plus"
              onClick={handleUploadPlusClick}
              style={{
                background: "rgba(16, 185, 129, 0.1)",
                color: "#059669",
                border: "1.5px solid rgba(16, 185, 129, 0.3)"
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              File Upload +
            </button>
            <button
              type="button"
              className="tools-action-btn tools-action-btn-secondary"
              onClick={handleTextShareClick}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              Share Text
            </button>
          </div>
        </div>

        <div className="tools-cards-list">
          <FileUploadDownload globalIsDragging={globalIsDragging} droppedFile={droppedFile} forceExpandTrigger={uploadExpandTrigger} />
          <FileUploadPlus forceExpandTrigger={uploadPlusExpandTrigger} />
          <TextShareTool forceExpandTrigger={textShareExpandTrigger} />
          <ToolsInfo />
        </div>
      </div>
    </div>
  );
}
