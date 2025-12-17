"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import imageCompression from 'browser-image-compression';
import { 
  FiFileText, 
  FiUpload, 
  FiTrash2, 
  FiImage,
  FiCalendar,
  FiCheck,
  FiChevronDown,
  FiChevronUp,
  FiX,
  FiAlertTriangle,
  FiCamera,
  FiFile,
  FiCheckCircle,
  FiLoader,
  FiShare2,
  FiMessageSquare,
  FiMoreVertical,
  FiEdit2,
  FiLock,
  FiUnlock
} from "react-icons/fi";
import PDFProcessor from "./PDFProcessor";
import "./styles/TopicCard.css";

export default function TopicCard({ 
  subject, 
  topic, 
  usn, 
  isLoading, 
  onTopicDelete, 
  onRefreshSubjects,
  showMessage 
}) {
  const router = useRouter();
  const [uploadingStates, setUploadingStates] = useState({});
  const [compressionStates, setCompressionStates] = useState({});
  const [filesMap, setFilesMap] = useState({});
  const [filePreviewMap, setFilePreviewMap] = useState({});
  const [expandedImages, setExpandedImages] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, subject: '', topic: '', imageUrl: '' });
  const [showCaptureOptions, setShowCaptureOptions] = useState({});
  const [showPDFProcessor, setShowPDFProcessor] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [uploadComplete, setUploadComplete] = useState({});
  const [isTogglingPublic, setIsTogglingPublic] = useState(false);

  const [openMenu, setOpenMenu] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [isDeletingTopic, setIsDeletingTopic] = useState(false);
  const [renameModal, setRenameModal] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [isRenamingTopic, setIsRenamingTopic] = useState(false);
  const menuRef = useRef(null);
  
  const cameraInputRefs = useRef({});

  const topicKey = `${subject}-${topic.topic}`;

  // Clean up preview URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(filePreviewMap).forEach(urls => {
        if (Array.isArray(urls)) {
          urls.forEach(url => URL.revokeObjectURL(url));
        } else if (urls) {
          URL.revokeObjectURL(urls);
        }
      });
    };
  }, [filePreviewMap]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenu(false);
      }
    };

    if (openMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenu]);

  // Image compression function
  const compressImage = async (file) => {
    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      quality: 0.8,
      initialQuality: 0.8,
      alwaysKeepResolution: false,
      fileType: 'image/jpeg',
    };

    try {
      const compressedFile = await imageCompression(file, options);
      
      const compressionRatio = ((file.size - compressedFile.size) / file.size * 100).toFixed(1);
      console.log(`Image compressed by ${compressionRatio}%`);
      console.log(`Original size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      console.log(`Compressed size: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
      
      return compressedFile;
    } catch (error) {
      console.error('Image compression failed:', error);
      throw error;
    }
  };

  // Toggle capture options
  const toggleCaptureOptions = () => {
    setShowCaptureOptions(prev => ({
      ...prev,
      [topicKey]: !prev[topicKey]
    }));
  };

  // Toggle PDF processor
  const togglePDFProcessor = () => {
    setShowPDFProcessor(prev => ({
      ...prev,
      [topicKey]: !prev[topicKey]
    }));
  };

  // Trigger camera capture
  const triggerCameraCapture = () => {
    if (cameraInputRefs.current[topicKey]) {
      cameraInputRefs.current[topicKey].click();
    }
  };

  // Handle camera capture with compression
  const handleCameraCapture = async (event) => {
    const file = event.target.files[0];
    if (file) {
      await handleSingleFileChange(file);
      setShowCaptureOptions(prev => ({ ...prev, [topicKey]: false }));
    }
  };

  // Handle single file change (for camera capture)
  const handleSingleFileChange = async (file) => {
    if (!file) {
      setFilesMap({ ...filesMap, [topicKey]: null });
      
      if (filePreviewMap[topicKey]) {
        URL.revokeObjectURL(filePreviewMap[topicKey]);
        const newPreviewMap = { ...filePreviewMap };
        delete newPreviewMap[topicKey];
        setFilePreviewMap(newPreviewMap);
      }
      return;
    }

    if (!file.type.startsWith('image/')) {
      showMessage("Please select a valid image file.", "error");
      return;
    }

    try {
      setCompressionStates(prev => ({ ...prev, [topicKey]: true }));
      showMessage("Compressing image...", "");

      const compressedFile = await compressImage(file);
      
      const finalFile = new File([compressedFile], file.name, {
        type: compressedFile.type,
        lastModified: Date.now(),
      });

      setFilesMap({ ...filesMap, [topicKey]: finalFile });
      
      const previewUrl = URL.createObjectURL(finalFile);
      setFilePreviewMap({ ...filePreviewMap, [topicKey]: previewUrl });

      const compressionRatio = ((file.size - finalFile.size) / file.size * 100).toFixed(1);
      showMessage(`Image compressed by ${compressionRatio}% (${(file.size / 1024 / 1024).toFixed(2)}MB → ${(finalFile.size / 1024 / 1024).toFixed(2)}MB)`, "success", 5000);

    } catch (error) {
      console.error('Image compression failed:', error);
      showMessage("Image compression failed. Please try again.", "error");
    } finally {
      setCompressionStates(prev => {
        const newState = { ...prev };
        delete newState[topicKey];
        return newState;
      });
    }
  };

  // Handle multiple file selection and processing
  const handleMultipleFileChange = async (event) => {
    const files = Array.from(event.target.files);
    
    if (!files.length) {
      setFilesMap(prev => ({ ...prev, [topicKey]: [] }));
      if (filePreviewMap[topicKey]) {
        filePreviewMap[topicKey].forEach(url => URL.revokeObjectURL(url));
        setFilePreviewMap(prev => {
          const newMap = { ...prev };
          delete newMap[topicKey];
          return newMap;
        });
      }
      return;
    }

    const validFiles = files.filter(file => file.type.startsWith('image/'));
    if (validFiles.length !== files.length) {
      showMessage("Some files were skipped. Only image files are allowed.", "warning");
    }

    if (validFiles.length === 0) {
      showMessage("Please select valid image files.", "error");
      return;
    }

    // Sort valid files by lastModified date ascending
    validFiles.sort((a, b) => a.lastModified - b.lastModified);

    try {
      setCompressionStates(prev => ({ ...prev, [topicKey]: true }));
      showMessage(`Processing ${validFiles.length} images...`, "");

      const processedFiles = [];
      const previewUrls = [];

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        showMessage(`Compressing image ${i + 1}/${validFiles.length}...`, "");

        const compressedFile = await compressImage(file);
        const finalFile = new File([compressedFile], file.name, {
          type: compressedFile.type,
          lastModified: Date.now(),
        });

        processedFiles.push({
          file: finalFile,
          originalSize: file.size,
          compressedSize: finalFile.size,
          name: file.name
        });

        const previewUrl = URL.createObjectURL(finalFile);
        previewUrls.push(previewUrl);
      }

      setFilesMap(prev => ({ ...prev, [topicKey]: processedFiles }));
      setFilePreviewMap(prev => ({ ...prev, [topicKey]: previewUrls }));

      const totalOriginalSize = processedFiles.reduce((sum, f) => sum + f.originalSize, 0);
      const totalCompressedSize = processedFiles.reduce((sum, f) => sum + f.compressedSize, 0);
      const overallCompressionRatio = ((totalOriginalSize - totalCompressedSize) / totalOriginalSize * 100).toFixed(1);

      showMessage(`${validFiles.length} images processed. Overall compression: ${overallCompressionRatio}% (${(totalOriginalSize / 1024 / 1024).toFixed(2)}MB → ${(totalCompressedSize / 1024 / 1024).toFixed(2)}MB)`, "success", 5000);

    } catch (error) {
      console.error('Image compression failed:', error);
      showMessage("Image compression failed. Please try again.", "error");
    } finally {
      setCompressionStates(prev => {
        const newState = { ...prev };
        delete newState[topicKey];
        return newState;
      });
    }
  };

  // Toggle expanded images view
  const toggleImageExpansion = () => {
    setExpandedImages(prev => ({
      ...prev,
      [topicKey]: !prev[topicKey]
    }));
  };

  // Show delete confirmation
  const showDeleteConfirmation = (imageUrl) => {
    setDeleteConfirm({
      show: true,
      subject,
      topic: topic.topic,
      imageUrl
    });
  };

  // Cancel delete
  const cancelDelete = () => {
    setDeleteConfirm({ show: false, subject: '', topic: '', imageUrl: '' });
  };

  // Confirm delete
  const confirmDelete = async () => {
    await handleDeleteImage(deleteConfirm.imageUrl);
    setDeleteConfirm({ show: false, subject: '', topic: '', imageUrl: '' });
  };

  // Upload single compressed image (for camera capture)
  const handleUploadImage = async () => {
    const file = filesMap[topicKey];
    if (!file) {
      showMessage("Please select a file first.", "error");
      return;
    }

    setUploadingStates(prev => ({ ...prev, [topicKey]: true }));

    const formData = new FormData();
    formData.append("usn", usn);
    formData.append("subject", subject);
    formData.append("topic", topic.topic);
    formData.append("file", file);

    try {
      const res = await axios.post("/api/topic/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      onRefreshSubjects();
      setFilesMap({ ...filesMap, [topicKey]: null });
      
      if (filePreviewMap[topicKey]) {
        URL.revokeObjectURL(filePreviewMap[topicKey]);
        const newPreviewMap = { ...filePreviewMap };
        delete newPreviewMap[topicKey];
        setFilePreviewMap(newPreviewMap);
      }
      
      showMessage("Image uploaded successfully!", "success");
    } catch (err) {
      console.error(err);
      showMessage(err.response?.data?.error || "Upload failed", "error");
    } finally {
      setUploadingStates(prev => {
        const newState = { ...prev };
        delete newState[topicKey];
        return newState;
      });
    }
  };

  // Upload multiple files sequentially
  const uploadMultipleFilesSequentially = async () => {
    const files = filesMap[topicKey];
    if (!files || !Array.isArray(files) || files.length === 0) {
      showMessage("Please select files first.", "error");
      return;
    }

    setUploadingStates(prev => ({ ...prev, [topicKey]: true }));
    setUploadProgress(prev => ({ ...prev, [topicKey]: 0 }));
    setUploadedFiles(prev => ({ ...prev, [topicKey]: new Set() }));
    setUploadComplete(prev => ({ ...prev, [topicKey]: false }));
    showMessage("Upload started...", "");

    for (let i = 0; i < files.length; i++) {
      const fileData = files[i];
      await uploadSingleFile(fileData, i + 1, files.length);
    }

    setUploadingStates(prev => {
      const newState = { ...prev };
      delete newState[topicKey];
      return newState;
    });
    setUploadComplete(prev => ({ ...prev, [topicKey]: true }));
    showMessage("All images uploaded successfully!", "success");
    
    // Show success for 2 seconds then clear files
    setTimeout(() => {
      setFilesMap(prev => {
        const newMap = { ...prev };
        delete newMap[topicKey];
        return newMap;
      });
      
      if (filePreviewMap[topicKey]) {
        filePreviewMap[topicKey].forEach(url => URL.revokeObjectURL(url));
        setFilePreviewMap(prev => {
          const newMap = { ...prev };
          delete newMap[topicKey];
          return newMap;
        });
      }
      
      setUploadComplete(prev => {
        const newState = { ...prev };
        delete newState[topicKey];
        return newState;
      });
    }, 2000);
  };

  // Upload single file in the sequence
  const uploadSingleFile = async (fileData, currentIndex, totalFiles) => {
    const formData = new FormData();
    formData.append("usn", usn);
    formData.append("subject", subject);
    formData.append("topic", topic.topic);
    formData.append("file", fileData.file, fileData.name);

    try {
      const res = await axios.post("/api/topic/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      onRefreshSubjects();

      setUploadedFiles(prev => ({
        ...prev,
        [topicKey]: new Set([...(prev[topicKey] || []), currentIndex])
      }));

      const percent = Math.round((currentIndex / totalFiles) * 100);
      setUploadProgress(prev => ({ ...prev, [topicKey]: percent }));
      
      showMessage(`Uploaded ${fileData.name} (${percent}% completed)`, "");

    } catch (error) {
      console.error("Upload error:", error);
      showMessage(`Failed to upload ${fileData.name}`, "error");
    }
  };

  // Delete image from topic
  const handleDeleteImage = async (imageUrl) => {
    try {
      const res = await axios.put("/api/topic/deleteimage", {
        usn,
        subject,
        topic: topic.topic,
        imageUrl
      });
      onRefreshSubjects();
      showMessage("Image deleted successfully!", "success");
    } catch (err) {
      console.error(err);
      showMessage(err.response?.data?.error || "Failed to delete image", "error");
    }
  };

  // Handle public/private toggle
  const handlePublicToggle = async () => {
    if (isLoading || isTogglingPublic) return;
    
    const newPublic = !topic.public;
    setIsTogglingPublic(true);
    
    try {
      await axios.put("/api/topic/public", {
        usn,
        subject,
        topic: topic.topic,
        public: newPublic
      });
      onRefreshSubjects();
      showMessage(
        `Topic is now ${newPublic ? 'public' : 'private'}`, 
        "success"
      );
    } catch (err) {
      console.error(err);
      showMessage(err.response?.data?.error || "Failed to update visibility", "error");
    } finally {
      setIsTogglingPublic(false);
    }
  };

  // Handle successful PDF upload from PDFProcessor
  const handlePDFUploadSuccess = () => {
    onRefreshSubjects();
    showMessage("PDF pages uploaded successfully!", "success");
    setShowPDFProcessor(prev => ({ ...prev, [topicKey]: false }));
  };

  // Handle PDF upload error
  const handlePDFUploadError = (error) => {
    showMessage(`PDF upload failed: ${error}`, "error");
  };

  // Helper function to get valid images (non-empty)
  const getValidImages = (images) => {
    return images.filter(img => img && img.trim() !== "" && img !== null && img !== undefined);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/works/${topic._id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: topic.topic, url });
        return;
      } catch (err) {
        // fallback to copy
      }
    }
    navigator.clipboard.writeText(url).then(() => {
      showMessage("Link copied to clipboard!", "success");
    }).catch(() => {
      showMessage("Failed to copy link", "error");
    });
  };

  const handleOpenTopic = () => {
    setOpenMenu(false);
    router.push(`/works/${topic._id}`);
  };

  const handleOpenReviews = () => {
    setOpenMenu(false);
    router.push(`/reviews/${topic._id}`);
  };

  const requestRenameTopic = () => {
    setOpenMenu(false);
    setRenameValue(topic.topic || "");
    setRenameModal(true);
  };

  const cancelRenameTopic = () => {
    if (isRenamingTopic) return;
    setRenameModal(false);
    setRenameValue("");
  };

  const confirmRenameTopic = async () => {
    const nextName = String(renameValue || "").trim();
    if (!nextName) {
      showMessage("Please enter a topic name", "error");
      return;
    }
    if (nextName.toLowerCase() === String(topic.topic || "").trim().toLowerCase()) {
      cancelRenameTopic();
      return;
    }

    setIsRenamingTopic(true);
    try {
      const res = await fetch("/api/topic/rename", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usn, topicId: topic._id, newTopic: nextName }),
      });
      const data = await res.json();

      if (!res.ok) {
        showMessage(data.error || "Failed to rename topic", "error");
        return;
      }

      await onRefreshSubjects();
      showMessage("Topic renamed successfully!", "success");
      cancelRenameTopic();
    } catch (err) {
      console.error(err);
      showMessage("Error renaming topic", "error");
    } finally {
      setIsRenamingTopic(false);
    }
  };

  const requestDeleteTopic = () => {
    setOpenMenu(false);
    setDeleteModal(true);
  };

  const cancelDeleteTopic = () => {
    if (isDeletingTopic) return;
    setDeleteModal(false);
  };

  const confirmDeleteTopic = async () => {
    if (!usn) return;
    setIsDeletingTopic(true);
    try {
      const res = await fetch("/api/topic/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usn, subject, topic: topic.topic }),
      });
      const data = await res.json();

      if (!res.ok) {
        showMessage(data.error || "Failed to delete topic", "error");
        return;
      }

      if (onTopicDelete) onTopicDelete(data.subjects);
      showMessage("Topic deleted successfully!", "success");
      setDeleteModal(false);
    } catch (err) {
      console.error(err);
      showMessage("Error deleting topic", "error");
    } finally {
      setIsDeletingTopic(false);
    }
  };

  const validImages = getValidImages(topic.images || []);
  const filesForTopic = filesMap[topicKey];
  const isMultipleFiles = Array.isArray(filesForTopic);

  return (
    <div className="mse-topic-card">
      {renameModal && (
        <div className="mse-options-modal-overlay" onClick={cancelRenameTopic}>
          <div className="mse-options-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mse-options-modal-icon mse-options-modal-icon-edit">
              <FiEdit2 />
            </div>
            <h4>Rename topic</h4>
            <p>Enter a new name for <strong>{topic.topic}</strong>.</p>

            <div className="mse-options-input-wrap">
              <input
                className="mse-options-input"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="New topic name"
                autoFocus
                disabled={!!isRenamingTopic}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmRenameTopic();
                  if (e.key === "Escape") cancelRenameTopic();
                }}
              />
            </div>

            <div className="mse-options-modal-actions">
              <button className="mse-options-cancel" onClick={cancelRenameTopic} disabled={!!isRenamingTopic}>
                Cancel
              </button>
              <button className="mse-options-save" onClick={confirmRenameTopic} disabled={!!isRenamingTopic}>
                {isRenamingTopic ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModal && (
        <div className="mse-options-modal-overlay" onClick={cancelDeleteTopic}>
          <div className="mse-options-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mse-options-modal-icon">
              <FiTrash2 />
            </div>
            <h4>Delete topic?</h4>
            <p>
              Are you sure you want to delete <strong>{topic.topic}</strong>? This can’t be undone.
            </p>
            <div className="mse-options-modal-actions">
              <button className="mse-options-cancel" onClick={cancelDeleteTopic} disabled={!!isDeletingTopic}>
                Cancel
              </button>
              <button className="mse-options-delete" onClick={confirmDeleteTopic} disabled={!!isDeletingTopic}>
                {isDeletingTopic ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mse-topic-header">
        <div className="mse-topic-title">
          <FiFileText className="mse-topic-icon" />
          <Link href={`/works/${topic._id}`} className="mse-topic-open-link">
            <h4>{topic.topic}</h4>
          </Link>
        </div>

        <div className="mse-topic-right">
          <div className="mse-topic-timestamp" title="Created date">
            <FiCalendar className="mse-timestamp-icon" />
            <span>{new Date(topic.timestamp).toLocaleDateString()}</span>
          </div>

          <span
            className={`mse-visibility-status ${topic.public ? 'public' : 'private'}`}
            aria-label="Topic visibility"
          >
            {topic.public ? 'Public' : 'Private'}
          </span>

          <div className="mse-topic-options" ref={menuRef}>
            <button
              type="button"
              className="mse-options-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpenMenu((prev) => !prev);
              }}
              aria-label="More options"
              aria-expanded={openMenu}
            >
              <FiMoreVertical />
            </button>

            {openMenu && (
              <div className="mse-options-menu" onClick={(e) => e.stopPropagation()}>
                <button className="mse-options-item" type="button" onClick={handleOpenTopic}>
                  <FiFileText className="mse-options-icon" />
                  <span>Open</span>
                </button>

                <button className="mse-options-item" type="button" onClick={handleOpenReviews}>
                  <FiMessageSquare className="mse-options-icon" />
                  <span>Reviews</span>
                </button>

                <button className="mse-options-item" type="button" onClick={requestRenameTopic}>
                  <FiEdit2 className="mse-options-icon" />
                  <span>Edit (Rename)</span>
                </button>

                <button className="mse-options-item" type="button" onClick={handleShare}>
                  <FiShare2 className="mse-options-icon" />
                  <span>Share</span>
                </button>

                <button
                  className="mse-options-item"
                  type="button"
                  onClick={handlePublicToggle}
                  disabled={isLoading || isTogglingPublic}
                >
                  {topic.public ? <FiLock className="mse-options-icon" /> : <FiUnlock className="mse-options-icon" />}
                  <span>
                    {isTogglingPublic
                      ? "Processing..."
                      : topic.public
                        ? "Public → Private"
                        : "Private → Public"}
                  </span>
                </button>

                <button className="mse-options-item mse-options-danger" type="button" onClick={requestDeleteTopic}>
                  <FiTrash2 className="mse-options-icon" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Images Section */}
      <div className="mse-images-section">
        <div className="mse-images-header">
          <FiImage className="mse-images-icon" />
          <span>Images ({validImages.length})</span>
        </div>
        
        {validImages.length > 0 && (
          <div className="mse-images-container">
            <div className="mse-images-grid">
              {validImages
                .slice(0, expandedImages[topicKey] ? validImages.length : 3)
                .map((img, iIdx) => (
                <div key={iIdx} className="mse-image-card">
                  <div className="mse-image-wrapper">
                    <img 
                      src={img} 
                      alt={`Topic image ${iIdx + 1}`}
                      className="mse-image"
                      loading="lazy"
                    />
                    <div className="mse-image-overlay">
                      <button
                        onClick={() => showDeleteConfirmation(img)}
                        className="mse-btn mse-btn-danger mse-btn-xs mse-image-delete"
                        disabled={isLoading}
                      >
                        <FiTrash2 className="mse-btn-icon" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {validImages.length > 3 && (
              <button
                onClick={toggleImageExpansion}
                className="mse-btn mse-btn-secondary mse-btn-sm mse-view-more-btn"
              >
                {expandedImages[topicKey] ? (
                  <>
                    <FiChevronUp className="mse-btn-icon" />
                    Show Less
                  </>
                ) : (
                  <>
                    <FiChevronDown className="mse-btn-icon" />
                    View More ({validImages.length - 3})
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Upload Section */}
      <div className="mse-upload-section">
        <div className="mse-capture-options">
          <button
            onClick={toggleCaptureOptions}
            className="mse-btn mse-btn-secondary mse-btn-sm mse-capture-toggle"
          >
            <FiCamera className="mse-btn-icon" />
            {showCaptureOptions[topicKey] ? 'Hide Options' : 'Add Content'}
          </button>
          
          {showCaptureOptions[topicKey] && (
            <div className="mse-capture-methods">
              <button
                onClick={triggerCameraCapture}
                className="mse-btn mse-btn-accent mse-btn-sm"
                disabled={isLoading || compressionStates[topicKey]}
              >
                <FiCamera className="mse-btn-icon" />
                Capture Photo
              </button>
              
              <label className={`mse-file-browse-btn mse-btn mse-btn-accent mse-btn-sm ${(isLoading || compressionStates[topicKey]) ? 'disabled' : ''}`}>
                <FiFile className="mse-btn-icon" />
                Browse Images
                <input
                  type="file"
                  multiple
                  onChange={handleMultipleFileChange}
                  className="mse-file-input-hidden"
                  accept="image/*"
                  disabled={isLoading || compressionStates[topicKey]}
                />
              </label>

              <button
                onClick={togglePDFProcessor}
                className="mse-btn mse-btn-accent mse-btn-sm"
                disabled={isLoading}
              >
                <FiFileText className="mse-btn-icon" />
                Upload PDF/DOCX
              </button>

              {/* Hidden camera input for direct capture */}
              <input
                ref={el => cameraInputRefs.current[topicKey] = el}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCameraCapture}
                style={{ display: 'none' }}
              />
            </div>
          )}
        </div>
        
        {/* PDF Processor */}
        {showPDFProcessor[topicKey] && (
          <div className="mse-pdf-processor-container">
            <PDFProcessor
              usn={usn}
              subject={subject}
              topic={topic.topic}
              onClose={togglePDFProcessor}
              onUploadSuccess={handlePDFUploadSuccess}
              onUploadError={handlePDFUploadError}
            />
          </div>
        )}
        
        {/* Compression indicator */}
        {compressionStates[topicKey] && (
          <div className="mse-compression-indicator">
            <div className="mse-upload-spinner"></div>
            <span>Processing images...</span>
          </div>
        )}
        
        {/* Upload Complete Animation */}
        {uploadComplete[topicKey] && (
          <div className="mse-upload-complete-animation">
            <FiCheckCircle className="mse-upload-success-icon" />
            <div className="mse-upload-success-text">
              Upload Completed Successfully!
            </div>
          </div>
        )}
        
        {/* Multiple Files Preview and Upload */}
        {isMultipleFiles && filesForTopic && filesForTopic.length > 0 && !uploadComplete[topicKey] && (
          <div className="mse-multiple-files-section">
            <div className="mse-files-preview-grid">
              {filesForTopic.map((fileData, fIdx) => {
                const isUploaded = uploadedFiles[topicKey]?.has(fIdx + 1);
                return (
                  <div 
                    key={fIdx} 
                    className={`mse-file-preview-card ${isUploaded ? 'uploaded' : ''}`}
                  >
                    <div className="mse-file-preview-header">
                      <span className="mse-file-preview-name">
                        <FiImage /> {fileData.name}
                      </span>
                      {isUploaded && <FiCheck className="mse-file-uploaded-icon" />}
                    </div>
                    <div className="mse-file-preview-thumb-container">
                      <img 
                        src={filePreviewMap[topicKey][fIdx]} 
                        alt={`Preview ${fIdx + 1}`} 
                        className="mse-file-preview-thumb"
                      />
                    </div>
                    <div className="mse-file-preview-info">
                      <span className="mse-file-size">
                        {(fileData.compressedSize / 1024 / 1024).toFixed(2)}MB
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {!uploadingStates[topicKey] && (
              <button 
                onClick={uploadMultipleFilesSequentially}
                className="mse-btn mse-btn-primary mse-btn-sm mse-upload-all-btn"
                disabled={isLoading}
              >
                <FiUpload className="mse-btn-icon" />
                Upload All Files ({filesForTopic.length})
              </button>
            )}

            {uploadingStates[topicKey] && (
              <div className="mse-upload-progress-section">
                <div className="mse-upload-progress-container">
                  <div 
                    className="mse-upload-progress-bar" 
                    style={{ width: `${uploadProgress[topicKey] || 0}%` }}
                  ></div>
                </div>
                <span className="mse-upload-progress-text">
                  {uploadProgress[topicKey] || 0}% Completed
                </span>
              </div>
            )}
          </div>
        )}
        
        {/* Single File Preview (for camera capture) */}
        {!isMultipleFiles && filePreviewMap[topicKey] && !uploadComplete[topicKey] && (
          <div className="mse-preview-section">
            <div className="mse-preview-wrapper">
              <img 
                src={filePreviewMap[topicKey]} 
                alt="Preview"
                className="mse-preview-image"
              />
              <button
                onClick={() => handleSingleFileChange(null)}
                className="mse-preview-remove"
                disabled={isLoading || compressionStates[topicKey]}
              >
                <FiX />
              </button>
            </div>
            <button 
              onClick={handleUploadImage} 
              className="mse-btn mse-btn-primary mse-btn-sm mse-upload-btn"
              disabled={uploadingStates[topicKey] || !filesMap[topicKey] || compressionStates[topicKey]}
            >
              {uploadingStates[topicKey] ? (
                <>
                  <div className="mse-upload-spinner"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <FiUpload className="mse-btn-icon" />
                  Upload
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="mse-modal-overlay">
          <div className="mse-modal">
            <div className="mse-modal-header">
              <FiAlertTriangle className="mse-modal-icon" />
              <h3>Confirm Delete</h3>
            </div>
            <div className="mse-modal-body">
              <p>Are you sure you want to delete this image?</p>
              <p className="mse-modal-warning">This action cannot be undone.</p>
            </div>
            <div className="mse-modal-footer">
              <button 
                onClick={cancelDelete} 
                className="mse-btn mse-btn-secondary mse-btn-sm"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete} 
                className="mse-btn mse-btn-danger mse-btn-sm"
                disabled={isLoading}
              >
                <FiTrash2 className="mse-btn-icon" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}