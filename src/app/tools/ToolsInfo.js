// app/tools/ToolsInfo.jsx
"use client";
import { FiFile, FiInfo, FiUpload, FiDownload, FiShare2, FiClock, FiShield, FiAlertCircle, FiTool } from "react-icons/fi";
import "./styles/ToolsInfo.css";

export default function ToolsInfo() {
  return (
    <div className="ti-page-container">
      <header className="ti-header" aria-hidden={true}>
        <FiTool className="ti-header-icon" />
      </header>

      <main className="ti-main" role="main">
        {/* Main Title */}
        <section className="ti-card ti-main-intro" aria-labelledby="ti-main-title">
          <h1 id="ti-main-title" className="ti-main-title">Tools Information</h1>
          <p className="ti-plain">
            Detailed information about all the tools available on this page. Learn how each tool works and make the most of them.
          </p>
        </section>

        {/* ========== TOOL 1: File Upload & Download ========== */}
        <div className="ti-tool-container">
          <div className="ti-tool-header">
            <span className="ti-tool-badge">Tool 1</span>
            <h2 className="ti-tool-title">File Upload & Download</h2>
          </div>

          {/* Intro Card */}
          <section className="ti-card ti-intro" aria-labelledby="ti-title-1">
            <div className="ti-section-header">
              <FiInfo className="ti-section-icon" />
              <h3 id="ti-title-1" className="ti-subtitle">About This Tool</h3>
            </div>
            <p className="ti-plain">
              A simple and secure way to upload files to the cloud and share them with anyone using a unique File ID.
            </p>
            <p className="ti-meta">Free to use • No signup required • Up to 100MB per file</p>
          </section>

          {/* How It Works */}
          <section className="ti-card" aria-labelledby="ti-how-1">
            <div className="ti-section-header">
              <FiInfo className="ti-section-icon" />
              <h3 id="ti-how-1" className="ti-subtitle">How It Works</h3>
            </div>
            <div className="ti-steps">
              <div className="ti-step">
                <div className="ti-step-number">1</div>
                <div className="ti-step-content">
                  <strong>Upload Your File</strong>
                  <p>Select any file from your device (up to 100MB) and click upload.</p>
                </div>
              </div>
              <div className="ti-step">
                <div className="ti-step-number">2</div>
                <div className="ti-step-content">
                  <strong>Get Your File ID</strong>
                  <p>After upload, you'll receive a unique File ID for your file.</p>
                </div>
              </div>
              <div className="ti-step">
                <div className="ti-step-number">3</div>
                <div className="ti-step-content">
                  <strong>Share & Download</strong>
                  <p>Share the File ID with anyone. They can download the file using this ID.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="ti-card" aria-labelledby="ti-features-1">
            <div className="ti-section-header">
              <FiFile className="ti-section-icon" />
              <h3 id="ti-features-1" className="ti-subtitle">Features</h3>
            </div>
            <div className="ti-features-grid">
              <div className="ti-feature">
                <FiUpload className="ti-feature-icon" />
                <div>
                  <strong>Easy Upload</strong>
                  <span>Upload any file type up to 100MB</span>
                </div>
              </div>
              <div className="ti-feature">
                <FiDownload className="ti-feature-icon" />
                <div>
                  <strong>Quick Download</strong>
                  <span>Download files instantly using File ID</span>
                </div>
              </div>
              <div className="ti-feature">
                <FiShare2 className="ti-feature-icon" />
                <div>
                  <strong>Easy Sharing</strong>
                  <span>Share File ID with friends to let them download</span>
                </div>
              </div>
              <div className="ti-feature">
                <FiShield className="ti-feature-icon" />
                <div>
                  <strong>Secure Storage</strong>
                  <span>Files are stored securely in Cloudinary</span>
                </div>
              </div>
            </div>
          </section>

          {/* Important Notice */}
          <section className="ti-card ti-warning-card" aria-labelledby="ti-notice-1">
            <div className="ti-section-header">
              <FiAlertCircle className="ti-section-icon ti-warning-icon" />
              <h3 id="ti-notice-1" className="ti-subtitle">Important Notice</h3>
            </div>
            <div className="ti-notice-content">
              <div className="ti-notice-item">
                <FiClock className="ti-notice-icon" />
                <div>
                  <strong>24-Hour Storage</strong>
                  <p>Files are automatically deleted after 24 hours from upload. Make sure to download your files before they expire.</p>
                </div>
              </div>
              <div className="ti-notice-item">
                <FiShield className="ti-notice-icon" />
                <div>
                  <strong>Privacy</strong>
                  <p>Only people with the File ID can access your files. We recommend not uploading sensitive personal information.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Supported Files */}
          <section className="ti-card" aria-labelledby="ti-supported-1">
            <div className="ti-section-header">
              <FiFile className="ti-section-icon" />
              <h3 id="ti-supported-1" className="ti-subtitle">Supported Files</h3>
            </div>
            <p className="ti-plain">
              This tool supports all file types including:
            </p>
            <div className="ti-badges">
              <span className="ti-badge">Documents (PDF, DOC, TXT)</span>
              <span className="ti-badge">Images (JPG, PNG, GIF)</span>
              <span className="ti-badge">Videos (MP4, AVI, MOV)</span>
              <span className="ti-badge">Archives (ZIP, RAR)</span>
              <span className="ti-badge">And more...</span>
            </div>
            <p className="ti-meta">Maximum file size: 100MB per file</p>
          </section>

          {/* Security */}
          <section className="ti-card" aria-labelledby="ti-security-1">
            <div className="ti-section-header">
              <FiShield className="ti-section-icon" />
              <h3 id="ti-security-1" className="ti-subtitle">Security & Privacy</h3>
            </div>
            <p className="ti-plain">
              Your files are uploaded securely to Cloudinary's cloud storage. The File ID acts as a unique key to access your file - only those with the ID can download it.
            </p>
            <p className="ti-plain">
              Files are automatically deleted after 24 hours to ensure privacy and manage storage. If you need permanent storage, please use other cloud storage services.
            </p>
            <p className="ti-meta">* Files are stored in Cloudinary and deleted automatically after 24 hours</p>
          </section>
        </div>

        {/* ========== MORE TOOLS CAN BE ADDED HERE ========== */}
        {/* 
        <div className="ti-tool-container">
          <div className="ti-tool-header">
            <span className="ti-tool-badge">Tool 2</span>
            <h2 className="ti-tool-title">Next Tool Name</h2>
          </div>
          ... tool sections here ...
        </div>
        */}

      </main>
    </div>
  );
}
   