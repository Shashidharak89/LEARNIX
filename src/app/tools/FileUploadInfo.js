// app/tools/FileUploadInfo.jsx
"use client";
import { FiFile, FiInfo, FiUpload, FiDownload, FiShare2, FiClock, FiShield, FiAlertCircle } from "react-icons/fi";
import "./styles/FileUploadInfo.css";

export default function FileUploadInfo() {
  return (
    <div className="fui-page-container">
      <header className="fui-header" aria-hidden={true}>
        <FiInfo className="fui-header-icon" />
      </header>

      <main className="fui-main" role="main">
        {/* Intro Card */}
        <section className="fui-card fui-intro" aria-labelledby="fui-title">
          <div className="fui-tool-number">1.</div>
          <h1 id="fui-title" className="fui-title">File Upload & Download Tool</h1>
          <p className="fui-plain">
            A simple and secure way to upload files to the cloud and share them with anyone using a unique File ID.
          </p>
          <p className="fui-meta">Tool #1 • Free to use • No signup required</p>
        </section>

        {/* How It Works */}
        <section className="fui-card" aria-labelledby="fui-how">
          <div className="fui-section-header">
            <FiInfo className="fui-section-icon" />
            <h2 id="fui-how" className="fui-subtitle">How It Works</h2>
          </div>
          <div className="fui-steps">
            <div className="fui-step">
              <div className="fui-step-number">1</div>
              <div className="fui-step-content">
                <strong>Upload Your File</strong>
                <p>Select any file from your device (up to 100MB) and click upload.</p>
              </div>
            </div>
            <div className="fui-step">
              <div className="fui-step-number">2</div>
              <div className="fui-step-content">
                <strong>Get Your File ID</strong>
                <p>After upload, you'll receive a unique File ID for your file.</p>
              </div>
            </div>
            <div className="fui-step">
              <div className="fui-step-number">3</div>
              <div className="fui-step-content">
                <strong>Share & Download</strong>
                <p>Share the File ID with anyone. They can download the file using this ID.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="fui-card" aria-labelledby="fui-features">
          <div className="fui-section-header">
            <FiFile className="fui-section-icon" />
            <h2 id="fui-features" className="fui-subtitle">Features</h2>
          </div>
          <div className="fui-features-grid">
            <div className="fui-feature">
              <FiUpload className="fui-feature-icon" />
              <div>
                <strong>Easy Upload</strong>
                <span>Upload any file type up to 100MB</span>
              </div>
            </div>
            <div className="fui-feature">
              <FiDownload className="fui-feature-icon" />
              <div>
                <strong>Quick Download</strong>
                <span>Download files instantly using File ID</span>
              </div>
            </div>
            <div className="fui-feature">
              <FiShare2 className="fui-feature-icon" />
              <div>
                <strong>Easy Sharing</strong>
                <span>Share File ID with friends to let them download</span>
              </div>
            </div>
            <div className="fui-feature">
              <FiShield className="fui-feature-icon" />
              <div>
                <strong>Secure Storage</strong>
                <span>Files are stored securely in Cloudinary</span>
              </div>
            </div>
          </div>
        </section>

        {/* Important Notice */}
        <section className="fui-card fui-warning-card" aria-labelledby="fui-notice">
          <div className="fui-section-header">
            <FiAlertCircle className="fui-section-icon fui-warning-icon" />
            <h2 id="fui-notice" className="fui-subtitle">Important Notice</h2>
          </div>
          <div className="fui-notice-content">
            <div className="fui-notice-item">
              <FiClock className="fui-notice-icon" />
              <div>
                <strong>24-Hour Storage</strong>
                <p>Files are automatically deleted after 24 hours from upload. Make sure to download your files before they expire.</p>
              </div>
            </div>
            <div className="fui-notice-item">
              <FiShield className="fui-notice-icon" />
              <div>
                <strong>Privacy</strong>
                <p>Only people with the File ID can access your files. We recommend not uploading sensitive personal information.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Supported Files */}
        <section className="fui-card" aria-labelledby="fui-supported">
          <div className="fui-section-header">
            <FiFile className="fui-section-icon" />
            <h2 id="fui-supported" className="fui-subtitle">Supported Files</h2>
          </div>
          <p className="fui-plain">
            This tool supports all file types including:
          </p>
          <div className="fui-badges">
            <span className="fui-badge">Documents (PDF, DOC, TXT)</span>
            <span className="fui-badge">Images (JPG, PNG, GIF)</span>
            <span className="fui-badge">Videos (MP4, AVI, MOV)</span>
            <span className="fui-badge">Archives (ZIP, RAR)</span>
            <span className="fui-badge">And more...</span>
          </div>
          <p className="fui-meta">Maximum file size: 100MB per file</p>
        </section>

        {/* Security */}
        <section className="fui-card" aria-labelledby="fui-security">
          <div className="fui-section-header">
            <FiShield className="fui-section-icon" />
            <h2 id="fui-security" className="fui-subtitle">Security & Privacy</h2>
          </div>
          <p className="fui-plain">
            Your files are uploaded securely to Cloudinary's cloud storage. The File ID acts as a unique key to access your file - only those with the ID can download it.
          </p>
          <p className="fui-plain">
            Files are automatically deleted after 24 hours to ensure privacy and manage storage. If you need permanent storage, please use other cloud storage services.
          </p>
          <p className="fui-meta">* Files are stored in Cloudinary and deleted automatically after 24 hours</p>
        </section>
      </main>
    </div>
  );
}
