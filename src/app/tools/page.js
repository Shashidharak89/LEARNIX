"use client";

import { Navbar } from "../components/Navbar";

import FileUploadDownload from "./WordToPdf";
import TextShareTool from "./TextShareTool";
import ToolsInfo from "./ToolsInfo";
import "./styles/ToolsPage.css";

export default function Tools() {
  return (
    <div className="tools-page-root">
      <Navbar />
      <div className="tools-container">
        <header className="tools-header-banner">
          <h1 className="tools-main-title">Tools</h1>
          <p className="tools-main-subtitle">
            Simple, fast, and secure file & text sharing utilities.
          </p>
        </header>

        <div className="tools-cards-list">
          <FileUploadDownload />
          <TextShareTool />
          <ToolsInfo />
        </div>
      </div>
    </div>
  );
}
