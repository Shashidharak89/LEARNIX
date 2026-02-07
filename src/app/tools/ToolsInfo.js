// app/tools/ToolsInfo.jsx
"use client";
import { FiFile, FiInfo, FiUpload, FiDownload, FiShare2, FiClock, FiShield, FiAlertCircle, FiTool, FiMessageSquare, FiEdit3, FiCode, FiLock, FiUnlock, FiRefreshCw, FiCopy, FiKey } from "react-icons/fi";
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

        {/* ========== TOOL 2: Text Sharing Tool ========== */}
        <div className="ti-tool-container ti-tool-textshare">
          <div className="ti-tool-header ti-tool-header-textshare">
            <span className="ti-tool-badge ti-badge-textshare">Tool 2</span>
            <h2 className="ti-tool-title ti-title-textshare">Text Sharing Tool</h2>
          </div>

          {/* Intro Card */}
          <section className="ti-card ti-intro ti-intro-textshare" aria-labelledby="ti-title-2">
            <div className="ti-section-header">
              <FiMessageSquare className="ti-section-icon ti-icon-textshare" />
              <h3 id="ti-title-2" className="ti-subtitle">About This Tool</h3>
            </div>
            <p className="ti-plain">
              Instantly share text with anyone using a simple code. Perfect for sharing notes, code snippets, links, or any text content.
            </p>
            <p className="ti-meta">Free to use • No signup required • Texts expire after 24 hours</p>
          </section>

          {/* How It Works */}
          <section className="ti-card" aria-labelledby="ti-how-2">
            <div className="ti-section-header">
              <FiInfo className="ti-section-icon ti-icon-textshare" />
              <h3 id="ti-how-2" className="ti-subtitle">How It Works</h3>
            </div>
            <div className="ti-steps ti-steps-textshare">
              <div className="ti-step">
                <div className="ti-step-number ti-step-textshare">1</div>
                <div className="ti-step-content">
                  <strong>Enter Your Text</strong>
                  <p>Type or paste any text you want to share in the text area.</p>
                </div>
              </div>
              <div className="ti-step">
                <div className="ti-step-number ti-step-textshare">2</div>
                <div className="ti-step-content">
                  <strong>Generate or Custom Code</strong>
                  <p>Click "Generate Code" for a random code, or "Custom Code" to create your own memorable code.</p>
                </div>
              </div>
              <div className="ti-step">
                <div className="ti-step-number ti-step-textshare">3</div>
                <div className="ti-step-content">
                  <strong>Share the Code</strong>
                  <p>Share the code with anyone. They can retrieve your text by entering the code.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="ti-card" aria-labelledby="ti-features-2">
            <div className="ti-section-header">
              <FiEdit3 className="ti-section-icon ti-icon-textshare" />
              <h3 id="ti-features-2" className="ti-subtitle">Features</h3>
            </div>
            <div className="ti-features-grid">
              <div className="ti-feature ti-feature-textshare">
                <FiCode className="ti-feature-icon ti-ficon-textshare" />
                <div>
                  <strong>Custom Codes</strong>
                  <span>Create your own memorable codes like "shashi" or "mycode"</span>
                </div>
              </div>
              <div className="ti-feature ti-feature-textshare">
                <FiUnlock className="ti-feature-icon ti-ficon-textshare" />
                <div>
                  <strong>Edit Access Control</strong>
                  <span>Choose if others can edit your text or only view it</span>
                </div>
              </div>
              <div className="ti-feature ti-feature-textshare">
                <FiRefreshCw className="ti-feature-icon ti-ficon-textshare" />
                <div>
                  <strong>Real-time Refresh</strong>
                  <span>Refresh to get the latest version of shared text</span>
                </div>
              </div>
              <div className="ti-feature ti-feature-textshare">
                <FiCopy className="ti-feature-icon ti-ficon-textshare" />
                <div>
                  <strong>One-Click Copy</strong>
                  <span>Easily copy codes or text to clipboard</span>
                </div>
              </div>
            </div>
          </section>

          {/* Edit Access Explained */}
          <section className="ti-card" aria-labelledby="ti-access-2">
            <div className="ti-section-header">
              <FiLock className="ti-section-icon ti-icon-textshare" />
              <h3 id="ti-access-2" className="ti-subtitle">Edit Access Options</h3>
            </div>
            <div className="ti-access-options">
              <div className="ti-access-option">
                <div className="ti-access-icon ti-access-readonly">
                  <FiLock />
                </div>
                <div>
                  <strong>Read-Only (Default)</strong>
                  <p>Others can only view the text. They cannot make any changes.</p>
                </div>
              </div>
              <div className="ti-access-option">
                <div className="ti-access-icon ti-access-editable">
                  <FiUnlock />
                </div>
                <div>
                  <strong>Editable</strong>
                  <p>Anyone with the code can edit the text. Great for collaborative notes.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Custom Code Feature */}
          <section className="ti-card ti-highlight-textshare" aria-labelledby="ti-custom-2">
            <div className="ti-section-header">
              <FiCode className="ti-section-icon ti-icon-textshare" />
              <h3 id="ti-custom-2" className="ti-subtitle">Custom Code Feature</h3>
            </div>
            <p className="ti-plain">
              Create memorable codes instead of random ones! Click "Custom Code" to:
            </p>
            <ul className="ti-list">
              <li>Enter your preferred code (3-20 characters)</li>
              <li>Check if it's available</li>
              <li>Publish your text with your custom code</li>
            </ul>
            <p className="ti-meta">Example: Use "shashi" instead of "abc123" - easier to remember and share!</p>
          </section>

          {/* Keyboard Shortcuts (Fullscreen) */}
          <section className="ti-card" aria-labelledby="ti-shortcuts-2">
            <div className="ti-section-header">
              <FiKey className="ti-section-icon ti-icon-textshare" />
              <h3 id="ti-shortcuts-2" className="ti-subtitle">Keyboard Shortcuts (Fullscreen)</h3>
            </div>
            <p className="ti-plain">
              When you open the retrieved text in Full Screen, the following keyboard shortcuts are available to speed up editing and navigation:
            </p>
            <ul className="ti-list">
              <li><strong>Ctrl + S</strong>: Save changes (Changes will be saved in the server)</li>
              <li><strong>Ctrl + Shift + C</strong>: Copy all text from the text area to clipboard</li>
              <li><strong>Ctrl + B</strong>: Exit edit mode (cancel editing / close editor)</li>
              <li><strong>Ctrl + R</strong>: Refresh the record (fetch latest text)</li>
            </ul>
            <p className="ti-meta">Shortcuts work while the Full Screen overlay is active and the textarea has focus. Toast messages remain visible in Full Screen.</p>
          </section>

          {/* Important Notice */}
          <section className="ti-card ti-warning-card ti-warning-textshare" aria-labelledby="ti-notice-2">
            <div className="ti-section-header">
              <FiAlertCircle className="ti-section-icon ti-warning-icon" />
              <h3 id="ti-notice-2" className="ti-subtitle">Important Notice</h3>
            </div>
            <div className="ti-notice-content">
              <div className="ti-notice-item">
                <FiClock className="ti-notice-icon ti-notice-icon-textshare" />
                <div>
                  <strong>24-Hour Expiry</strong>
                  <p>All shared texts are automatically deleted after 24 hours. Save important text before it expires.</p>
                </div>
              </div>
              <div className="ti-notice-item">
                <FiShield className="ti-notice-icon ti-notice-icon-textshare" />
                <div>
                  <strong>Privacy</strong>
                  <p>Only people with the code can access your text. Avoid sharing sensitive personal information.</p>
                </div>
              </div>
            </div>
          </section>

          {/* My Codes Feature */}
          <section className="ti-card" aria-labelledby="ti-mycodes-2">
            <div className="ti-section-header">
              <FiShare2 className="ti-section-icon ti-icon-textshare" />
              <h3 id="ti-mycodes-2" className="ti-subtitle">My Codes (Admin Features)</h3>
            </div>
            <p className="ti-plain">
              Codes you create are saved locally. You can manage them from the "My Codes" section:
            </p>
            <div className="ti-badges ti-badges-textshare">
              <span className="ti-badge ti-badge-textshare">Toggle Edit Access</span>
              <span className="ti-badge ti-badge-textshare">Delete Your Codes</span>
              <span className="ti-badge ti-badge-textshare">Copy Code to Clipboard</span>
              <span className="ti-badge ti-badge-textshare">View Creation Time</span>
            </div>
          </section>
        </div>

      </main>
    </div>
  );
}
   