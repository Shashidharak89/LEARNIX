"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useTheme } from "@/context/ThemeContext";
import { 
  FiPlus, 
  FiBook, 
  FiFileText, 
  FiUpload, 
  FiTrash2, 
  FiImage,
  FiCalendar,
  FiFolder,
  FiCheck,
  FiEye,
  FiChevronDown,
  FiChevronUp,
  FiX,
  FiAlertTriangle,
  FiCamera,
  FiFile
} from "react-icons/fi";
import "./styles/ManageSubjects.css";

export default function ManageSubjects() {
  const [usn, setUsn] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState("");
  const [topicName, setTopicName] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingStates, setUploadingStates] = useState({});

  const { theme } = useTheme();

  // Track file input for each topic individually
  const [filesMap, setFilesMap] = useState({});
  const [filePreviewMap, setFilePreviewMap] = useState({});
  const [expandedImages, setExpandedImages] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, subject: '', topic: '', imageUrl: '' });
  const [showCaptureOptions, setShowCaptureOptions] = useState({});
  
  // Camera refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState({});

  useEffect(() => {
    const storedUsn = localStorage.getItem("usn");
    if (storedUsn) setUsn(storedUsn);
    fetchSubjects(storedUsn);
  }, []);

  // Clean up preview URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(filePreviewMap).forEach(url => {
        URL.revokeObjectURL(url);
      });
      // Stop all active camera streams
      Object.keys(isCameraActive).forEach(key => {
        if (isCameraActive[key]) {
          stopCamera(key);
        }
      });
    };
  }, [filePreviewMap]);

  const fetchSubjects = async (usn) => {
    setIsLoading(true);
    try {
      const res = await axios.get("/api/work/get", { params: { usn } });
      setSubjects(res.data.subjects || []);
    } catch (err) {
      console.error(err);
      setMessage("Failed to fetch subjects");
    } finally {
      setIsLoading(false);
    }
  };

  // Add Subject
  const handleAddSubject = async () => {
    if (!newSubject.trim()) return;
    setIsLoading(true);
    try {
      const res = await axios.post("/api/subject", { usn, subject: newSubject });
      setSubjects(res.data.subjects);
      setNewSubject("");
      setMessage("Subject added successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || "Error adding subject");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // Add Topic
  const handleAddTopic = async (subject) => {
    if (!subject || !topicName.trim()) return;
    setIsLoading(true);
    try {
      const res = await axios.post("/api/topic", {
        usn,
        subject,
        topic: topicName,
        images: []
      });
      setSubjects(res.data.subjects);
      setTopicName("");
      setMessage("Topic added successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || "Error adding topic");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle capture options
  const toggleCaptureOptions = (subject, topic) => {
    const key = `${subject}-${topic}`;
    setShowCaptureOptions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Start camera
  const startCamera = async (subject, topic) => {
    const key = `${subject}-${topic}`;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera if available
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(prev => ({ ...prev, [key]: stream }));
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      setMessage('Camera access denied. Please use file upload instead.');
      setTimeout(() => setMessage(""), 3000);
    }
  };

  // Stop camera
  const stopCamera = (key) => {
    if (isCameraActive[key]) {
      const tracks = isCameraActive[key].getTracks();
      tracks.forEach(track => track.stop());
      setIsCameraActive(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
    }
  };

  // Capture photo from camera
  const capturePhoto = (subject, topic) => {
    const key = `${subject}-${topic}`;
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      handleFileChange(subject, topic, file);
      stopCamera(key);
      setShowCaptureOptions(prev => ({ ...prev, [key]: false }));
    }, 'image/jpeg', 0.8);
  };

  // Handle file selection per topic
  const handleFileChange = (subject, topic, file) => {
    const key = `${subject}-${topic}`;
    setFilesMap({ ...filesMap, [key]: file });
    
    // Create preview URL if file is selected
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setFilePreviewMap({ ...filePreviewMap, [key]: previewUrl });
    } else {
      // Clean up preview URL
      if (filePreviewMap[key]) {
        URL.revokeObjectURL(filePreviewMap[key]);
        const newPreviewMap = { ...filePreviewMap };
        delete newPreviewMap[key];
        setFilePreviewMap(newPreviewMap);
      }
    }
  };

  // Toggle expanded images view
  const toggleImageExpansion = (subject, topic) => {
    const key = `${subject}-${topic}`;
    setExpandedImages(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Show delete confirmation
  const showDeleteConfirmation = (subject, topic, imageUrl) => {
    setDeleteConfirm({
      show: true,
      subject,
      topic,
      imageUrl
    });
  };

  // Cancel delete
  const cancelDelete = () => {
    setDeleteConfirm({ show: false, subject: '', topic: '', imageUrl: '' });
  };

  // Confirm delete
  const confirmDelete = async () => {
    await handleDeleteImage(deleteConfirm.subject, deleteConfirm.topic, deleteConfirm.imageUrl);
    setDeleteConfirm({ show: false, subject: '', topic: '', imageUrl: '' });
  };

  // Upload image for a specific topic
  const handleUploadImage = async (subject, topic) => {
    const file = filesMap[`${subject}-${topic}`];
    if (!file) {
      setMessage("Please select a file first.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    const uploadKey = `${subject}-${topic}`;
    setUploadingStates(prev => ({ ...prev, [uploadKey]: true }));

    const formData = new FormData();
    formData.append("usn", usn);
    formData.append("subject", subject);
    formData.append("topic", topic);
    formData.append("file", file);

    try {
      const res = await axios.post("/api/topic/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setSubjects(res.data.subjects);
      setFilesMap({ ...filesMap, [`${subject}-${topic}`]: null });
      // Clean up preview
      const key = `${subject}-${topic}`;
      if (filePreviewMap[key]) {
        URL.revokeObjectURL(filePreviewMap[key]);
        const newPreviewMap = { ...filePreviewMap };
        delete newPreviewMap[key];
        setFilePreviewMap(newPreviewMap);
      }
      setMessage("Image uploaded successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || "Upload failed");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setUploadingStates(prev => {
        const newState = { ...prev };
        delete newState[uploadKey];
        return newState;
      });
    }
  };

  // Delete image from topic
  const handleDeleteImage = async (subject, topic, imageUrl) => {
    setIsLoading(true);
    try {
      const res = await axios.put("/api/topic/deleteimage", {
        usn,
        subject,
        topic,
        imageUrl
      });
      setSubjects(res.data.subjects);
      setMessage("Image deleted successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || "Failed to delete image");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`mse-container ${theme}`}>
      <div className="mse-header">
        <div className="mse-title">
          <FiBook className="mse-title-icon" />
          <h1>Manage Subjects & Topics</h1>
        </div>
        {message && (
          <div className={`mse-message ${message.includes('Error') || message.includes('Failed') ? 'error' : 'success'}`}>
            <FiCheck className="mse-message-icon" />
            <span>{message}</span>
          </div>
        )}
      </div>

      {/* Add Subject Section */}
      <div className="mse-section">
        <div className="mse-section-header">
          <FiPlus className="mse-section-icon" />
          <h2>Add New Subject</h2>
        </div>
        <div className="mse-input-group">
          <input
            type="text"
            placeholder="Enter subject name..."
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            className="mse-input"
            disabled={isLoading}
          />
          <button 
            onClick={handleAddSubject} 
            className="mse-btn mse-btn-primary"
            disabled={isLoading || !newSubject.trim()}
          >
            <FiPlus className="mse-btn-icon" />
            Add Subject
          </button>
        </div>
      </div>

      {/* Subjects List */}
      <div className="mse-section">
        <div className="mse-section-header">
          <FiFolder className="mse-section-icon" />
          <h2>Subjects & Topics</h2>
        </div>

        {isLoading && (
          <div className="mse-loading">
            <div className="mse-spinner"></div>
            <span>Loading...</span>
          </div>
        )}

        {subjects.length === 0 && !isLoading && (
          <div className="mse-empty-state">
            <FiBook className="mse-empty-icon" />
            <p>No subjects added yet. Create your first subject above!</p>
          </div>
        )}

        <div className="mse-subjects-grid">
          {subjects.map((sub, idx) => (
            <div key={idx} className="mse-subject-card">
              <div className="mse-subject-header">
                <FiBook className="mse-subject-icon" />
                <h3>{sub.subject}</h3>
              </div>

              {/* Add Topic Input */}
              <div className="mse-topic-input-section">
                <div className="mse-input-group">
                  <input
                    type="text"
                    placeholder="New topic name..."
                    value={topicName}
                    onChange={(e) => setTopicName(e.target.value)}
                    className="mse-input mse-input-sm"
                    disabled={isLoading}
                  />
                  <button 
                    onClick={() => handleAddTopic(sub.subject)} 
                    className="mse-btn mse-btn-secondary mse-btn-sm"
                    disabled={isLoading || !topicName.trim()}
                  >
                    <FiPlus className="mse-btn-icon" />
                    Add Topic
                  </button>
                </div>
              </div>

              {/* Topics List */}
              <div className="mse-topics-container">
                {sub.topics.length === 0 ? (
                  <div className="mse-empty-topics">
                    <FiFileText className="mse-empty-icon-sm" />
                    <span>No topics yet</span>
                  </div>
                ) : (
                  <div className="mse-topics-list">
                    {sub.topics.map((t, tIdx) => (
                      <div key={tIdx} className="mse-topic-card">
                        <div className="mse-topic-header">
                          <div className="mse-topic-title">
                            <FiFileText className="mse-topic-icon" />
                            <h4>{t.topic}</h4>
                          </div>
                          <div className="mse-topic-timestamp">
                            <FiCalendar className="mse-timestamp-icon" />
                            <span>{new Date(t.timestamp).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Images Section */}
                        <div className="mse-images-section">
                          <div className="mse-images-header">
                            <FiImage className="mse-images-icon" />
                            <span>Images ({t.images.length})</span>
                          </div>
                          
                          {t.images.length > 0 && (
                            <div className="mse-images-container">
                              <div className="mse-images-grid">
                                {t.images.slice(0, expandedImages[`${sub.subject}-${t.topic}`] ? t.images.length : 3).map((img, iIdx) => (
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
                                          onClick={() => showDeleteConfirmation(sub.subject, t.topic, img)}
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
                              
                              {t.images.length > 3 && (
                                <button
                                  onClick={() => toggleImageExpansion(sub.subject, t.topic)}
                                  className="mse-btn mse-btn-secondary mse-btn-sm mse-view-more-btn"
                                >
                                  {expandedImages[`${sub.subject}-${t.topic}`] ? (
                                    <>
                                      <FiChevronUp className="mse-btn-icon" />
                                      Show Less
                                    </>
                                  ) : (
                                    <>
                                      <FiChevronDown className="mse-btn-icon" />
                                      View More ({t.images.length - 3})
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
                              onClick={() => toggleCaptureOptions(sub.subject, t.topic)}
                              className="mse-btn mse-btn-secondary mse-btn-sm mse-capture-toggle"
                            >
                              <FiCamera className="mse-btn-icon" />
                              {showCaptureOptions[`${sub.subject}-${t.topic}`] ? 'Hide Options' : 'Add Image'}
                            </button>
                            
                            {showCaptureOptions[`${sub.subject}-${t.topic}`] && (
                              <div className="mse-capture-methods">
                                <button
                                  onClick={() => startCamera(sub.subject, t.topic)}
                                  className="mse-btn mse-btn-accent mse-btn-sm"
                                  disabled={isCameraActive[`${sub.subject}-${t.topic}`]}
                                >
                                  <FiCamera className="mse-btn-icon" />
                                  Capture Photo
                                </button>
                                
                                <label className="mse-file-browse-btn mse-btn mse-btn-accent mse-btn-sm">
                                  <FiFile className="mse-btn-icon" />
                                  Browse Files
                                  <input
                                    type="file"
                                    onChange={(e) => handleFileChange(sub.subject, t.topic, e.target.files[0])}
                                    className="mse-file-input-hidden"
                                    accept="image/*"
                                    disabled={isLoading}
                                  />
                                </label>
                              </div>
                            )}
                          </div>

                          {/* Camera View */}
                          {isCameraActive[`${sub.subject}-${t.topic}`] && (
                            <div className="mse-camera-container">
                              <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                className="mse-camera-view"
                              />
                              <div className="mse-camera-controls">
                                <button
                                  onClick={() => capturePhoto(sub.subject, t.topic)}
                                  className="mse-btn mse-btn-primary mse-btn-sm"
                                >
                                  <FiCamera className="mse-btn-icon" />
                                  Take Photo
                                </button>
                                <button
                                  onClick={() => {
                                    stopCamera(`${sub.subject}-${t.topic}`);
                                    setShowCaptureOptions(prev => ({ ...prev, [`${sub.subject}-${t.topic}`]: false }));
                                  }}
                                  className="mse-btn mse-btn-secondary mse-btn-sm"
                                >
                                  <FiX className="mse-btn-icon" />
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {/* File Preview */}
                          {filePreviewMap[`${sub.subject}-${t.topic}`] && (
                            <div className="mse-preview-section">
                              <div className="mse-preview-wrapper">
                                <img 
                                  src={filePreviewMap[`${sub.subject}-${t.topic}`]} 
                                  alt="Preview"
                                  className="mse-preview-image"
                                />
                                <button
                                  onClick={() => handleFileChange(sub.subject, t.topic, null)}
                                  className="mse-preview-remove"
                                  disabled={isLoading}
                                >
                                  <FiX />
                                </button>
                              </div>
                              
                              <button 
                                onClick={() => handleUploadImage(sub.subject, t.topic)} 
                                className="mse-btn mse-btn-primary mse-btn-sm mse-upload-btn"
                                disabled={uploadingStates[`${sub.subject}-${t.topic}`] || !filesMap[`${sub.subject}-${t.topic}`]}
                              >
                                {uploadingStates[`${sub.subject}-${t.topic}`] ? (
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
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

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