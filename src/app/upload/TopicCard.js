"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
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
  FiShare2
} from "react-icons/fi";
import PDFProcessor from "./PDFProcessor";
import DeleteTopicButton from "./DeleteTopicButton";
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
  
  const cameraInputRefs = useRef({});

  const topicKey = `${subject}-${topic.topic}`;

  // Helper functions to manage uploaded files in localStorage keyed by usn
  const getUploadedFilesFromLocalStorage = () => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(`uploadedFiles_${usn}`);
    return data ? JSON.parse(data) : [];
  };

  const addUploadedFileToLocalStorage = (fileRecord) => {
    if (typeof window === 'undefined') return;
    const existing = getUploadedFilesFromLocalStorage();
    existing.push(fileRecord);
    localStorage.setItem(`uploadedFiles_${usn}`, JSON.stringify(existing));
  };

  const removeUploadedFileFromLocalStorage = (imageUrl) => {
    if (typeof window === 'undefined') return;
    const existing = getUploadedFilesFromLocalStorage();
    const filtered = existing.filter(file => file.imageUrl !== imageUrl);
    localStorage.setItem(`uploadedFiles_${usn}`, JSON.stringify(filtered));
  };

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

      // Calculate overall compression stats
      const totalOriginal = processedFiles.reduce((sum, f) => sum + f.originalSize, 0);
      const totalCompressed = processedFiles.reduce((sum, f) => sum + f.compressedSize, 0);
      const overallRatio = ((totalOriginal - totalCompressed) / totalOriginal * 100).toFixed(1);
      showMessage(`All images processed! Overall compression: ${overallRatio}% (${(totalOriginal / 1024 / 1024).toFixed(2)}MB → ${(totalCompressed / 1024 / 1024).toFixed(2)}MB)`, "success", 5000);

    } catch (error) {
      console.error('Image processing failed:', error);
      showMessage("Image processing failed. Please try again.", "error");
      // Clean up any preview URLs created so far
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    } finally {
      setCompressionStates(prev => {
        const newState = { ...prev };
        delete newState[topicKey];
        return newState;
      });
    }
  };

  // Handle file upload
  const handleFileUpload = async () => {
    const files = filesMap[topicKey];
    if (!files || files.length === 0) {
      showMessage("No files selected for upload.", "error");
      return;
    }

    setUploadingStates(prev => ({ ...prev, [topicKey]: true }));
    setUploadProgress(prev => ({ ...prev, [topicKey]: 0 }));

    const formData = new FormData();
    files.forEach((fileObj, index) => {
      formData.append('files', fileObj.file);
    });
    formData.append('subject', subject);
    formData.append('topic', topic.topic);
    formData.append('usn', usn);

    try {
      const response = await axios.post('/api/topic/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(prev => ({ ...prev, [topicKey]: percentCompleted }));
        },
      });

      if (response.data.success) {
        // Add uploaded files to localStorage
        response.data.uploadedFiles.forEach(fileRecord => {
          addUploadedFileToLocalStorage(fileRecord);
        });

        setUploadedFiles(prev => ({
          ...prev,
          [topicKey]: [...(prev[topicKey] || []), ...response.data.uploadedFiles]
        }));

        setUploadComplete(prev => ({ ...prev, [topicKey]: true }));

        // Clear uploaded files map and preview after 5 seconds
        setTimeout(() => {
          setFilesMap(prev => {
            const newMap = { ...prev };
            delete newMap[topicKey];
            return newMap;
          });
          setFilePreviewMap(prev => {
            const newMap = { ...prev };
            if (newMap[topicKey]) {
              newMap[topicKey].forEach(url => URL.revokeObjectURL(url));
            }
            delete newMap[topicKey];
            return newMap;
          });
          setUploadComplete(prev => {
            const newState = { ...prev };
            delete newState[topicKey];
            return newState;
          });
        }, 5000);

        showMessage(`${files.length} files uploaded successfully!`, "success", 5000);
      } else {
        showMessage(response.data.error || "Upload failed", "error");
      }
    } catch (error) {
      console.error('Upload error:', error);
      showMessage("Upload failed. Please try again.", "error");
    } finally {
      setUploadingStates(prev => {
        const newState = { ...prev };
        delete newState[topicKey];
        return newState;
      });
    }
  };

  // Delete uploaded image
  const handleDeleteImage = async (imageUrl) => {
    setDeleteConfirm({ show: true, subject, topic: topic.topic, imageUrl });
  };

  // Confirm delete
  const confirmDelete = async () => {
    try {
      const response = await axios.delete('/api/topic/deleteimage', {
        data: {
          subject: deleteConfirm.subject,
          topic: deleteConfirm.topic,
          imageUrl: deleteConfirm.imageUrl
        }
      });

      if (response.data.success) {
        // Remove from localStorage
        removeUploadedFileFromLocalStorage(deleteConfirm.imageUrl);

        setUploadedFiles(prev => ({
          ...prev,
          [topicKey]: (prev[topicKey] || []).filter(file => file.imageUrl !== deleteConfirm.imageUrl)
        }));
        showMessage("Image deleted successfully!", "success");
      } else {
        showMessage(response.data.error || "Failed to delete image", "error");
      }
    } catch (error) {
      console.error('Delete error:', error);
      showMessage("Failed to delete image. Please try again.", "error");
    } finally {
      setDeleteConfirm({ show: false, subject: '', topic: '', imageUrl: '' });
    }
  };

  // Toggle public/private
  const togglePublic = async () => {
    setIsTogglingPublic(true);
    try {
      const newPublicState = !topic.public;
      const response = await axios.patch('/api/topic/update', {
        subject,
        topicName: topic.topic,
        isPublic: newPublicState
      });

      if (response.data.success) {
        onRefreshSubjects();
        showMessage(`Topic is now ${newPublicState ? 'public' : 'private'}`, "success");
      } else {
        showMessage(response.data.error || "Failed to update topic visibility", "error");
      }
    } catch (error) {
      console.error('Toggle public error:', error);
      showMessage("Failed to update topic visibility. Please try again.", "error");
    } finally {
      setIsTogglingPublic(false);
    }
  };

  // Get uploaded files from topic (this could be from props or API)
  const displayUploadedFiles = topic.images || uploadedFiles[topicKey] || [];

  return (
    <div className="topic-card">
      <div className="topic-header">
        <div className="topic-info">
          <h3 className="topic-title">{topic.topic}</h3>
          <div className="topic-meta">
            <span className="topic-date">
              <FiCalendar size={14} />
              {new Date(topic.createdAt).toLocaleDateString()}
            </span>
            <span className={`topic-visibility ${topic.public ? 'public' : 'private'}`}>
              <FiShare2 size={14} />
              {topic.public ? 'Public' : 'Private'}
            </span>
            <span className="topic-images-count">
              <FiImage size={14} />
              {displayUploadedFiles.length} images
            </span>
          </div>
        </div>

        <div className="topic-actions">
          <button
            onClick={togglePublic}
            disabled={isTogglingPublic}
            className={`btn-visibility ${topic.public ? 'btn-private' : 'btn-public'}`}
          >
            {isTogglingPublic ? <FiLoader className="spinner" size={14} /> : <FiShare2 size={14} />}
            {topic.public ? 'Make Private' : 'Make Public'}
          </button>

          <DeleteTopicButton
            subject={subject}
            topicName={topic.topic}
            onDelete={onTopicDelete}
          />
        </div>
      </div>

      {/* File Selection Area */}
      <div className="file-selection">
        <div className="file-input-section">
          <label className="file-input-label">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleMultipleFileChange}
              disabled={compressionStates[topicKey] || uploadingStates[topicKey]}
              className="hidden-file-input"
            />
            <div className={`file-input-area ${compressionStates[topicKey] ? 'compressing' : ''} ${uploadingStates[topicKey] ? 'uploading' : ''}`}>
              <FiUpload size={20} />
              <span>{compressionStates[topicKey] ? 'Compressing...' : uploadingStates[topicKey] ? 'Uploading...' : 'Select Images'}</span>
              {compressionStates[topicKey] && <FiLoader className="spinner" size={16} />}
            </div>
          </label>

          <div className="capture-options">
            <button
              type="button"
              onClick={toggleCaptureOptions}
              className="btn-capture-toggle"
            >
              <FiCamera size={16} />
              Camera
              {showCaptureOptions[topicKey] ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
            </button>

            {showCaptureOptions[topicKey] && (
              <div className="capture-menu">
                <button
                  type="button"
                  onClick={triggerCameraCapture}
                  className="btn-capture"
                >
                  <FiCamera size={14} />
                  Take Photo
                </button>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={el => cameraInputRefs.current[topicKey] = el}
                  onChange={handleCameraCapture}
                  className="hidden-camera-input"
                />
              </div>
            )}
          </div>

          <div className="pdf-options">
            <button
              type="button"
              onClick={togglePDFProcessor}
              className="btn-pdf-toggle"
            >
              <FiFile size={16} />
              PDF Tools
              {showPDFProcessor[topicKey] ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
            </button>

            {showPDFProcessor[topicKey] && (
              <div className="pdf-processor-container">
                <PDFProcessor
                  subject={subject}
                  topic={topic.topic}
                  usn={usn}
                  showMessage={showMessage}
                  onFilesUploaded={(files) => {
                    setUploadedFiles(prev => ({
                      ...prev,
                      [topicKey]: [...(prev[topicKey] || []), ...files]
                    }));
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* File Preview */}
      {filesMap[topicKey] && filesMap[topicKey].length > 0 && (
        <div className="file-preview">
          <div className="preview-header">
            <h4>Ready to Upload ({filesMap[topicKey].length} files)</h4>
            <div className="preview-actions">
              <button
                onClick={() => setFilesMap(prev => {
                  const newMap = { ...prev };
                  if (newMap[topicKey]) {
                    newMap[topicKey].forEach(fileObj => URL.revokeObjectURL(URL.createObjectURL(fileObj.file)));
                  }
                  delete newMap[topicKey];
                  return newMap;
                })}
                className="btn-clear"
                disabled={uploadingStates[topicKey]}
              >
                <FiX size={14} />
                Clear All
              </button>
              <button
                onClick={handleFileUpload}
                disabled={uploadingStates[topicKey]}
                className="btn-upload"
              >
                {uploadingStates[topicKey] ? (
                  <>
                    <FiLoader className="spinner" size={14} />
                    {uploadProgress[topicKey] ? `${uploadProgress[topicKey]}%` : 'Uploading...'}
                  </>
                ) : (
                  <>
                    <FiUpload size={14} />
                    Upload {filesMap[topicKey].length} Files
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="preview-grid">
            {filesMap[topicKey].map((fileObj, index) => (
              <div key={index} className="preview-item">
                <img
                  src={filePreviewMap[topicKey][index]}
                  alt={`Preview ${index + 1}`}
                  className="preview-image"
                />
                <div className="preview-info">
                  <span className="file-name">{fileObj.name}</span>
                  <span className="file-size">
                    {fileObj.compressedSize ? `${(fileObj.compressedSize / 1024 / 1024).toFixed(2)}MB` : `${(fileObj.file.size / 1024 / 1024).toFixed(2)}MB`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Complete Message */}
      {uploadComplete[topicKey] && (
        <div className="upload-complete">
          <FiCheckCircle size={20} />
          <span>Upload complete! Files will be cleared shortly.</span>
        </div>
      )}

      {/* Uploaded Images */}
      {displayUploadedFiles.length > 0 && (
        <div className="uploaded-images">
          <h4>Uploaded Images</h4>
          <div className="images-grid">
            {displayUploadedFiles.map((image, index) => (
              <div key={index} className="image-item">
                <div className="image-container">
                  <img
                    src={image.imageUrl}
                    alt={`Uploaded ${index + 1}`}
                    className="uploaded-image"
                    onClick={() => setExpandedImages(prev => ({
                      ...prev,
                      [topicKey]: { ...prev[topicKey], [image.imageUrl]: true }
                    }))}
                  />
                  <button
                    className="btn-delete-image"
                    onClick={() => handleDeleteImage(image.imageUrl)}
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
                <div className="image-info">
                  <span className="image-date">
                    {new Date(image.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expanded Image */}
      {expandedImages[topicKey] && Object.entries(expandedImages[topicKey]).some(([url, isExpanded]) => isExpanded) && (
        <div className="expanded-image-overlay" onClick={() => setExpandedImages(prev => ({
          ...prev,
          [topicKey]: {}
        }))}>
          <div className="expanded-image-container">
            <img
              src={Object.keys(expandedImages[topicKey]).find(url => expandedImages[topicKey][url])}
              alt="Expanded"
              className="expanded-image"
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm.show && deleteConfirm.subject === subject && deleteConfirm.topic === topic.topic && (
        <div className="delete-confirm-overlay">
          <div className="delete-confirm-modal">
            <FiAlertTriangle size={24} />
            <h3>Delete Image</h3>
            <p>Are you sure you want to delete this image? This action cannot be undone.</p>
            <div className="delete-confirm-actions">
              <button
                onClick={() => setDeleteConfirm({ show: false, subject: '', topic: '', imageUrl: '' })}
                className="btn-cancel"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="btn-delete"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
