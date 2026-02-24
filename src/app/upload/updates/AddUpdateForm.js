"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiEdit3, FiSend, FiX, FiUser, FiLink, FiAlertCircle, FiCheckCircle, FiImage, FiTrash2, FiUpload } from "react-icons/fi";
import './styles/AddUpdateForm.css';

export default function AddUpdateForm() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [linksText, setLinksText] = useState("");
  const [userId, setUserId] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const usn = typeof window !== 'undefined' ? localStorage.getItem('usn') : null;
    if (!usn) return;

    (async () => {
      try {
        const res = await fetch(`/api/user/id?usn=${encodeURIComponent(usn)}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.userId) setUserId(data.userId);
        }
      } catch (err) {
        console.error('Failed to resolve user id', err);
      }
    })();
  }, []);

  const showToast = (msg, type = 'info') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const parseLinks = (text) => {
    if (!text) return [];
    return text
      .split(/[,\n]+/)
      .map(s => s.trim())
      .filter(Boolean);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showToast('Please enter title and content', 'error');
      return;
    }

    setLoading(true);
    const links = parseLinks(linksText);

    try {
      const res = await fetch('/api/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), content: content.trim(), links, userId, files: uploadedFiles }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Update created successfully', 'success');
        setTitle('');
        setContent('');
        setLinksText('');
        setUploadedFiles([]);
        // Optionally navigate to updates list
        // router.push('/updates');
      } else {
        showToast(data?.error || 'Failed to create update', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setIsUploadingFiles(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const fd = new FormData();
        fd.append('file', f);
        if (userId) fd.append('userId', userId);
        const res = await fetch('/api/updates/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (res.ok && data?.file) {
          setUploadedFiles((p) => [...p, data.file]);
        } else {
          showToast(data?.error || `Failed to upload ${f.name}`, 'error');
        }
      }
    } catch (err) {
      console.error('File upload error', err);
      showToast('File upload failed', 'error');
    } finally {
      setIsUploadingFiles(false);
      // clear file input
      e.target.value = null;
    }
  };

  const removeUploadedFile = (idx) => {
    setUploadedFiles((p) => p.filter((_, i) => i !== idx));
  };

  const handleClear = () => {
    setTitle('');
    setContent('');
    setLinksText('');
  };

  return (
    <div className="auf-container">
      {/* Header */}
      <div className="auf-header">
        <div className="auf-header-icon">
          <FiEdit3 />
        </div>
        <h3 className="auf-header-title">Create Update</h3>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`auf-toast auf-toast-${toast.type}`}>
          {toast.type === 'success' ? (
            <FiCheckCircle className="auf-toast-icon" />
          ) : (
            <FiAlertCircle className="auf-toast-icon" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Form Card */}
      <div className="auf-card">
        <form onSubmit={handleSubmit} className="auf-form">
          {/* Title Field */}
          <div className="auf-field">
            <label className="auf-label">
              <FiEdit3 className="auf-label-icon" />
              <span>Title</span>
              <span className="auf-required">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter update title..."
              className="auf-input"
              required
            />
          </div>

          {/* Files / Raw Upload Field */}
            <label className="auf-label">
              <FiImage className="auf-label-icon" />
              <span>Files (optional)</span>
            </label>
            <div className="auf-file-row">
              <label className="auf-file-btn">
                <FiUpload />
                <span>Upload files</span>
                <input type="file" multiple onChange={handleFilesSelected} className="auf-hidden-input" />
              </label>
              {isUploadingFiles && <span className="auf-file-uploading">Uploading…</span>}
            </div>

            {uploadedFiles.length > 0 && (
              <div className="auf-uploaded-files">
                {uploadedFiles.map((f, i) => (
                  <div key={i} className="auf-uploaded-file">
                    <a href={f.url} target="_blank" rel="noreferrer noopener" className="auf-uploaded-link">
                      <span className="auf-file-name">{f.name || f.url}</span>
                    </a>
                    <button type="button" className="auf-file-remove" onClick={() => removeUploadedFile(i)}>
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>
              )}


          {/* Content Field */}
          <div className="auf-field">
            <label className="auf-label">
              <FiEdit3 className="auf-label-icon" />
              <span>Content</span>
              <span className="auf-required">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your update content here..."
              rows={6}
              className="auf-textarea"
              required
            />
            <div className="auf-hint">
              Share information, announcements, or resources with the community
            </div>
          </div>

          {/* Links Field */}
          <div className="auf-field">
            <label className="auf-label">
              <FiLink className="auf-label-icon" />
              <span>Links (optional)</span>
            </label>
            <textarea
              value={linksText}
              onChange={(e) => setLinksText(e.target.value)}
              placeholder="/internal/path or https://external-link.com&#10;Separate multiple links with commas or new lines"
              rows={3}
              className="auf-textarea auf-textarea-links"
            />
            <div className="auf-hint">
              Add internal paths (starting with /) or external URLs
            </div>
          </div>

          {/* Action Bar */}
          <div className="auf-actions">
            <div className="auf-user-status">
              <FiUser className="auf-status-icon" />
              <span className={userId ? 'auf-status-active' : 'auf-status-inactive'}>
                {userId ? 'Signed in' : 'Not signed in'}
              </span>
            </div>

            <div className="auf-buttons">
              <button 
                type="button" 
                onClick={handleClear}
                className="auf-btn auf-btn-clear"
                disabled={loading}
              >
                <FiX />
                <span>Clear</span>
              </button>
              <button 
                type="submit" 
                className="auf-btn auf-btn-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="auf-spinner"></span>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <FiSend />
                    <span>Create Update</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}