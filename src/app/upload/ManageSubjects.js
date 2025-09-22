"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import imageCompression from 'browser-image-compression';
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
  FiFile,
  FiCheckCircle
} from "react-icons/fi";
import PDFProcessor from "./PDFProcessor";
import DeleteSubjectButton from "./DeleteSubjectButton";
import DeleteTopicButton from "./DeleteTopicButton";
import LoginRequired from "../components/LoginRequired";
import ManageSubjectsSkeleton from './ManageSubjectsSkeleton';
import './styles/ManageSubjects.css';

export default function ManageSubjects() {
  const [usn, setUsn] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState("");
  const [topicName, setTopicName] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingStates, setUploadingStates] = useState({});
  const [compressionStates, setCompressionStates] = useState({});

  // New states for dropdown functionality
  const [allUsers, setAllUsers] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [availableTopics, setAvailableTopics] = useState([]);
  const [isCustomSubject, setIsCustomSubject] = useState(false);

  const { theme } = useTheme();

  // Track file input for each topic individually - Updated for multiple files
  const [filesMap, setFilesMap] = useState({});
  const [filePreviewMap, setFilePreviewMap] = useState({});
  const [expandedImages, setExpandedImages] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, subject: '', topic: '', imageUrl: '' });
  const [showCaptureOptions, setShowCaptureOptions] = useState({});
  
  // PDF processing states
  const [showPDFProcessor, setShowPDFProcessor] = useState({});
  
  // Multiple file upload states
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [uploadComplete, setUploadComplete] = useState({});
  
  // Refs for camera inputs
  const cameraInputRefs = useRef({});

  useEffect(() => {
    const storedUsn = localStorage.getItem("usn");
    if (storedUsn) setUsn(storedUsn);
    fetchSubjects(storedUsn);
    fetchAllUsers();
  }, []);

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

  // Update available topics when subject is selected
  useEffect(() => {
    if (selectedSubject && !isCustomSubject) {
      const topics = getAllTopicsForSubject(selectedSubject);
      setAvailableTopics(topics);
      setSelectedTopic("");
      setTopicName("");
    } else {
      setAvailableTopics([]);
      setSelectedTopic("");
      setTopicName("");
    }
  }, [selectedSubject, isCustomSubject, allUsers]);

  // Show message helper
  const showMessage = (text, type = "", duration = 3000) => {
    setMessage(text);
    setTimeout(() => setMessage(""), duration);
  };

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

  const fetchSubjects = async (usn) => {
    setIsLoading(true);
    try {
      const res = await axios.get("/api/work/get", { params: { usn } });
      setSubjects(res.data.subjects || []);
    } catch (err) {
      console.error(err);
      showMessage("Failed to fetch subjects", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all users data for dropdown population
  const fetchAllUsers = async () => {
    try {
      const res = await axios.get("/api/work/getall");
      setAllUsers(res.data.users || []);
    } catch (err) {
      console.error("Failed to fetch all users data:", err);
    }
  };

  // Get unique subjects from all users
  const getAllSubjects = () => {
    const subjectSet = new Set();
    allUsers.forEach(user => {
      if (user.subjects && Array.isArray(user.subjects)) {
        user.subjects.forEach(subjectObj => {
          if (subjectObj.subject && subjectObj.subject.trim()) {
            subjectSet.add(subjectObj.subject.trim());
          }
        });
      }
    });
    return Array.from(subjectSet).sort();
  };

  // Get all topics for a specific subject
  const getAllTopicsForSubject = (subjectName) => {
    const topicSet = new Set();
    allUsers.forEach(user => {
      if (user.subjects && Array.isArray(user.subjects)) {
        user.subjects.forEach(subjectObj => {
          if (subjectObj.subject === subjectName && subjectObj.topics && Array.isArray(subjectObj.topics)) {
            subjectObj.topics.forEach(topicObj => {
              if (topicObj.topic && topicObj.topic.trim()) {
                topicSet.add(topicObj.topic.trim());
              }
            });
          }
        });
      }
    });
    return Array.from(topicSet).sort();
  };

  // Handle subject selection
  const handleSubjectSelect = (e) => {
    const value = e.target.value;
    if (value === "custom") {
      setIsCustomSubject(true);
      setSelectedSubject("");
      setNewSubject("");
    } else {
      setIsCustomSubject(false);
      setSelectedSubject(value);
      setNewSubject(value);
    }
  };

  // Handle topic selection for adding to current subject
  const handleTopicSelectForSubject = (e, currentSubject) => {
    const value = e.target.value;
    setTopicName(value);
  };

  // Handle successful subject delete
  const handleSubjectDelete = (updatedSubjects) => {
    setSubjects(updatedSubjects);
    showMessage("Subject deleted successfully!", "success");
  };

  // Handle successful topic delete
  const handleTopicDelete = (updatedSubjects) => {
    setSubjects(updatedSubjects);
    showMessage("Topic deleted successfully!", "success");
  };

  // Add Subject
  const handleAddSubject = async () => {
    const subjectToAdd = isCustomSubject ? newSubject : selectedSubject;
    if (!subjectToAdd.trim()) return;
    setIsLoading(true);
    try {
      const res = await axios.post("/api/subject", { usn, subject: subjectToAdd });
      setSubjects(res.data.subjects);
      setNewSubject("");
      setSelectedSubject("");
      setIsCustomSubject(false);
      showMessage("Subject added successfully!", "success");
    } catch (err) {
      console.error(err);
      showMessage(err.response?.data?.error || "Error adding subject", "error");
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
      setSelectedTopic("");
      showMessage("Topic added successfully!", "success");
    } catch (err) {
      console.error(err);
      showMessage(err.response?.data?.error || "Error adding topic", "error");
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

  // Toggle PDF processor
  const togglePDFProcessor = (subject, topic) => {
    const key = `${subject}-${topic}`;
    setShowPDFProcessor(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Trigger camera capture
  const triggerCameraCapture = (subject, topic) => {
    const key = `${subject}-${topic}`;
    if (cameraInputRefs.current[key]) {
      cameraInputRefs.current[key].click();
    }
  };

  // Handle camera capture with compression
  const handleCameraCapture = async (subject, topic, event) => {
    const file = event.target.files[0];
    if (file) {
      await handleSingleFileChange(subject, topic, file);
      setShowCaptureOptions(prev => ({ ...prev, [`${subject}-${topic}`]: false }));
    }
  };

  // Handle single file change (for camera capture)
  const handleSingleFileChange = async (subject, topic, file) => {
    const key = `${subject}-${topic}`;
    
    if (!file) {
      setFilesMap({ ...filesMap, [key]: null });
      
      if (filePreviewMap[key]) {
        URL.revokeObjectURL(filePreviewMap[key]);
        const newPreviewMap = { ...filePreviewMap };
        delete newPreviewMap[key];
        setFilePreviewMap(newPreviewMap);
      }
      return;
    }

    if (!file.type.startsWith('image/')) {
      showMessage("Please select a valid image file.", "error");
      return;
    }

    try {
      setCompressionStates(prev => ({ ...prev, [key]: true }));
      showMessage("Compressing image...", "");

      const compressedFile = await compressImage(file);
      
      const finalFile = new File([compressedFile], file.name, {
        type: compressedFile.type,
        lastModified: Date.now(),
      });

      setFilesMap({ ...filesMap, [key]: finalFile });
      
      const previewUrl = URL.createObjectURL(finalFile);
      setFilePreviewMap({ ...filePreviewMap, [key]: previewUrl });

      const compressionRatio = ((file.size - finalFile.size) / file.size * 100).toFixed(1);
      showMessage(`Image compressed by ${compressionRatio}% (${(file.size / 1024 / 1024).toFixed(2)}MB → ${(finalFile.size / 1024 / 1024).toFixed(2)}MB)`, "success", 5000);

    } catch (error) {
      console.error('Image compression failed:', error);
      showMessage("Image compression failed. Please try again.", "error");
    } finally {
      setCompressionStates(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
    }
  };

  // Handle multiple file selection and processing
  const handleMultipleFileChange = async (subject, topic, event) => {
    const files = Array.from(event.target.files);
    const key = `${subject}-${topic}`;
    
    if (!files.length) {
      // Clear files if no files selected
      setFilesMap(prev => ({ ...prev, [key]: [] }));
      if (filePreviewMap[key]) {
        filePreviewMap[key].forEach(url => URL.revokeObjectURL(url));
        setFilePreviewMap(prev => {
          const newMap = { ...prev };
          delete newMap[key];
          return newMap;
        });
      }
      return;
    }

    // Validate files
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    if (validFiles.length !== files.length) {
      showMessage("Some files were skipped. Only image files are allowed.", "warning");
    }

    if (validFiles.length === 0) {
      showMessage("Please select valid image files.", "error");
      return;
    }

    // Sort files by their lastModified timestamp (oldest first)
    const sortedFiles = validFiles.sort((a, b) => a.lastModified - b.lastModified);

    try {
      setCompressionStates(prev => ({ ...prev, [key]: true }));
      showMessage(`Processing ${sortedFiles.length} images...`, "");

      const processedFiles = [];
      const previewUrls = [];

      for (let i = 0; i < sortedFiles.length; i++) {
        const file = sortedFiles[i];
        showMessage(`Compressing image ${i + 1}/${sortedFiles.length}...`, "");

        const compressedFile = await compressImage(file);
        // Preserve the original lastModified timestamp
        const finalFile = new File([compressedFile], file.name, {
          type: compressedFile.type,
          lastModified: file.lastModified, // Keep original timestamp
        });

        processedFiles.push({
          file: finalFile,
          originalSize: file.size,
          compressedSize: finalFile.size,
          name: file.name,
          lastModified: file.lastModified // Store original timestamp
        });

        const previewUrl = URL.createObjectURL(finalFile);
        previewUrls.push(previewUrl);
      }

      setFilesMap(prev => ({ ...prev, [key]: processedFiles }));
      setFilePreviewMap(prev => ({ ...prev, [key]: previewUrls }));

      const totalOriginalSize = processedFiles.reduce((sum, f) => sum + f.originalSize, 0);
      const totalCompressedSize = processedFiles.reduce((sum, f) => sum + f.compressedSize, 0);
      const overallCompressionRatio = ((totalOriginalSize - totalCompressedSize) / totalOriginalSize * 100).toFixed(1);

      showMessage(`${sortedFiles.length} images processed and sorted by date. Overall compression: ${overallCompressionRatio}% (${(totalOriginalSize / 1024 / 1024).toFixed(2)}MB → ${(totalCompressedSize / 1024 / 1024).toFixed(2)}MB)`, "success", 5000);

    } catch (error) {
      console.error('Image compression failed:', error);
      showMessage("Image compression failed. Please try again.", "error");
    } finally {
      setCompressionStates(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
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

  // Upload single compressed image (for camera capture)
  const handleUploadImage = async (subject, topic) => {
    const file = filesMap[`${subject}-${topic}`];
    if (!file) {
      showMessage("Please select a file first.", "error");
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
      
      const key = `${subject}-${topic}`;
      if (filePreviewMap[key]) {
        URL.revokeObjectURL(filePreviewMap[key]);
        const newPreviewMap = { ...filePreviewMap };
        delete newPreviewMap[key];
        setFilePreviewMap(newPreviewMap);
      }
      
      showMessage("Image uploaded successfully!", "success");
    } catch (err) {
      console.error(err);
      showMessage(err.response?.data?.error || "Upload failed", "error");
    } finally {
      setUploadingStates(prev => {
        const newState = { ...prev };
        delete newState[uploadKey];
        return newState;
      });
    }
  };

  // Upload multiple files sequentially
  const uploadMultipleFilesSequentially = async (subject, topic) => {
    const files = filesMap[`${subject}-${topic}`];
    if (!files || !Array.isArray(files) || files.length === 0) {
      showMessage("Please select files first.", "error");
      return;
    }

    const key = `${subject}-${topic}`;
    setUploadingStates(prev => ({ ...prev, [key]: true }));
    setUploadProgress(prev => ({ ...prev, [key]: 0 }));
    setUploadedFiles(prev => ({ ...prev, [key]: new Set() }));
    setUploadComplete(prev => ({ ...prev, [key]: false }));
    showMessage("Upload started...", "");

    for (let i = 0; i < files.length; i++) {
      const fileData = files[i];
      await uploadSingleFile(subject, topic, fileData, i + 1, files.length);
    }

    setUploadingStates(prev => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
    setUploadComplete(prev => ({ ...prev, [key]: true }));
    showMessage("All images uploaded successfully!", "success");
    
    // Show success for 2 seconds then clear files
    setTimeout(() => {
      // Clear files and previews
      setFilesMap(prev => {
        const newMap = { ...prev };
        delete newMap[key];
        return newMap;
      });
      
      if (filePreviewMap[key]) {
        filePreviewMap[key].forEach(url => URL.revokeObjectURL(url));
        setFilePreviewMap(prev => {
          const newMap = { ...prev };
          delete newMap[key];
          return newMap;
        });
      }
      
      setUploadComplete(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
      
      setMessage("");
    }, 2000);
  };

  // Upload single file in the sequence
  const uploadSingleFile = async (subject, topic, fileData, currentIndex, totalFiles) => {
    const formData = new FormData();
    formData.append("usn", usn);
    formData.append("subject", subject);
    formData.append("topic", topic);
    formData.append("file", fileData.file, fileData.name);

    const key = `${subject}-${topic}`;

    try {
      const res = await axios.post("/api/topic/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      // Update subjects data after successful upload
      setSubjects(res.data.subjects);

      // Mark this file as uploaded
      setUploadedFiles(prev => ({
        ...prev,
        [key]: new Set([...(prev[key] || []), currentIndex])
      }));

      // Update progress
      const percent = Math.round((currentIndex / totalFiles) * 100);
      setUploadProgress(prev => ({ ...prev, [key]: percent }));
      
      showMessage(`Uploaded ${fileData.name} (${percent}% completed)`, "");

    } catch (error) {
      console.error("Upload error:", error);
      showMessage(`Failed to upload ${fileData.name}`, "error");
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
      showMessage("Image deleted successfully!", "success");
    } catch (err) {
      console.error(err);
      showMessage(err.response?.data?.error || "Failed to delete image", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle successful PDF upload from PDFProcessor - Enhanced
  const handlePDFUploadSuccess = (subject, topic) => {
    // Refresh subjects to show new images
    fetchSubjects(usn);
    showMessage("PDF pages uploaded successfully!", "success");
    
    // Close PDF processor
    const key = `${subject}-${topic}`;
    setShowPDFProcessor(prev => ({ ...prev, [key]: false }));
  };

  // Handle PDF upload error
  const handlePDFUploadError = (error) => {
    showMessage(`PDF upload failed: ${error}`, "error");
  };

  // Helper function to get valid images (non-empty) and sort by timestamp (newest first)
  const getValidImages = (images) => {
    if (!images || !Array.isArray(images)) return [];
    return images
      .filter(img => img && img.trim() !== "" && img !== null && img !== undefined)
      .reverse(); // Reverse to show newest first (assuming API returns oldest first)
  };

  const uniqueSubjects = getAllSubjects();

  // Check usn existence in LocalStorage
  const usnl = typeof window !== "undefined" ? localStorage.getItem("usn") : null;
  if (!usnl) {
    return <LoginRequired />;
  }

  if (isLoading && subjects.length === 0) {
    return <ManageSubjectsSkeleton />;
  }

  return (
    <div className="subj-container">
      {/* Message Display */}
      {message && (
        <div className={`subj-message ${message.includes('success') ? 'success' : message.includes('error') || message.includes('Failed') ? 'error' : ''}`}>
          {message.includes('success') && <FiCheckCircle />}
          {(message.includes('error') || message.includes('Failed')) && <FiAlertTriangle />}
          <span>{message}</span>
        </div>
      )}

      {/* Add Subject Section */}
      <div className="subj-section">
        <div className="subj-header">
          <FiPlus />
          <h2>Add New Subject</h2>
        </div>
        <div className="subj-form">
          <select
            value={isCustomSubject ? "custom" : selectedSubject}
            onChange={handleSubjectSelect}
            className="subj-select"
            disabled={isLoading}
          >
            <option value="">Select existing subject</option>
            {uniqueSubjects.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
            <option value="custom">Custom Subject</option>
          </select>
          {isCustomSubject && (
            <input
              type="text"
              placeholder="Enter custom subject name..."
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              className="subj-input"
              disabled={isLoading}
            />
          )}
          <button 
            onClick={handleAddSubject} 
            className="subj-btn primary"
            disabled={isLoading || (!isCustomSubject && !selectedSubject) || (isCustomSubject && !newSubject.trim())}
          >
            <FiPlus />
            Add Subject
          </button>
        </div>
      </div>

      {/* Subjects List */}
      <div className="subj-section">
        <div className="subj-header">
          <FiFolder />
          <h2>Subjects & Topics</h2>
        </div>

        {isLoading && subjects.length === 0 && (
          <div className="subj-loading">
            <div className="spinner"></div>
            <span>Loading...</span>
          </div>
        )}

        {subjects.length === 0 && !isLoading && (
          <div className="subj-empty">
            <FiBook />
            <p>No subjects added yet. Create your first subject above!</p>
          </div>
        )}

        <div className="subj-grid">
          {subjects.map((sub, idx) => {
            const topicsForThisSubject = getAllTopicsForSubject(sub.subject);
            
            return (
              <div key={idx} className="subj-card">
                <div className="subj-card-header">
                  <div className="subj-title">
                    <FiBook />
                    <h3>{sub.subject}</h3>
                    <DeleteSubjectButton 
                      usn={usn} 
                      subject={sub.subject} 
                      onDelete={handleSubjectDelete} 
                    />
                  </div>
                </div>

                {/* Add Topic Input */}
                <div className="topic-form">
                  <select
                    value=""
                    onChange={(e) => handleTopicSelectForSubject(e, sub.subject)}
                    className="subj-select small"
                    disabled={isLoading}
                  >
                    <option value="">Select existing topic</option>
                    {topicsForThisSubject.map(topic => (
                      <option key={topic} value={topic}>{topic}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Or enter new topic name..."
                    value={topicName}
                    onChange={(e) => setTopicName(e.target.value)}
                    className="subj-input small"
                    disabled={isLoading}
                  />
                  <button 
                    onClick={() => handleAddTopic(sub.subject)} 
                    className="subj-btn secondary small"
                    disabled={isLoading || !topicName.trim()}
                  >
                    <FiPlus />
                    Add Topic
                  </button>
                </div>

                {/* Topics List */}
                <div className="topics-container">
                  {!sub.topics || sub.topics.length === 0 ? (
                    <div className="empty-topics">
                      <FiFileText />
                      <span>No topics yet</span>
                    </div>
                  ) : (
                    <div className="topics-list">
                      {sub.topics.map((t, tIdx) => {
                        const validImages = getValidImages(t.images || []);
                        const compressionKey = `${sub.subject}-${t.topic}`;
                        const filesForTopic = filesMap[compressionKey];
                        const isMultipleFiles = Array.isArray(filesForTopic);
                        
                        return (
                          <div key={tIdx} className="topic-card">
                            <div className="topic-header">
                              <div className="topic-title">
                                <FiFileText />
                                <h4>{t.topic}</h4>
                                <DeleteTopicButton 
                                  usn={usn} 
                                  subject={sub.subject} 
                                  topic={t.topic} 
                                  onDelete={handleTopicDelete} 
                                />
                              </div>
                              <div className="topic-date">
                                <FiCalendar />
                                <span>{new Date(t.timestamp).toLocaleDateString()}</span>
                              </div>
                            </div>

                            {/* Images Section */}
                            <div className="images-section">
                              <div className="images-header">
                                <FiImage />
                                <span>Images ({validImages.length})</span>
                              </div>
                              
                              {validImages.length > 0 && (
                                <div className="images-container">
                                  <div className="images-grid">
                                    {validImages.map((img, iIdx) => (
                                      <div key={iIdx} className="image-item">
                                        <img 
                                          src={img} 
                                          alt={`Topic image ${iIdx + 1}`}
                                          loading="lazy"
                                        />
                                        <button
                                          onClick={() => showDeleteConfirmation(sub.subject, t.topic, img)}
                                          className="delete-btn"
                                          disabled={isLoading}
                                        >
                                          <FiTrash2 />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Upload Section */}
                            <div className="upload-section">
                              <button
                                onClick={() => toggleCaptureOptions(sub.subject, t.topic)}
                                className="subj-btn secondary small"
                              >
                                <FiCamera />
                                {showCaptureOptions[`${sub.subject}-${t.topic}`] ? 'Hide Options' : 'Add Content'}
                              </button>
                                
                              {showCaptureOptions[`${sub.subject}-${t.topic}`] && (
                                <div className="capture-options">
                                  <button
                                    onClick={() => triggerCameraCapture(sub.subject, t.topic)}
                                    className="subj-btn yellow small"
                                    disabled={isLoading || compressionStates[compressionKey]}
                                  >
                                    <FiCamera />
                                    Capture Photo
                                  </button>
                                  
                                  <label className={`file-upload-btn ${(isLoading || compressionStates[compressionKey]) ? 'disabled' : ''}`}>
                                    <FiFile />
                                    Browse Images
                                    <input
                                      type="file"
                                      multiple
                                      onChange={(e) => handleMultipleFileChange(sub.subject, t.topic, e)}
                                      className="file-input"
                                      accept="image/*"
                                      disabled={isLoading || compressionStates[compressionKey]}
                                    />
                                  </label>

                                  <button
                                    onClick={() => togglePDFProcessor(sub.subject, t.topic)}
                                    className="subj-btn yellow small"
                                    disabled={isLoading}
                                  >
                                    <FiFileText />
                                    Upload PDF
                                  </button>

                                  {/* Hidden camera input for direct capture */}
                                  <input
                                    ref={el => cameraInputRefs.current[`${sub.subject}-${t.topic}`] = el}
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={(e) => handleCameraCapture(sub.subject, t.topic, e)}
                                    style={{ display: 'none' }}
                                  />
                                </div>
                              )}
                              
                              {/* PDF Processor */}
                              {showPDFProcessor[`${sub.subject}-${t.topic}`] && (
                                <div className="pdf-processor">
                                  <PDFProcessor
                                    usn={usn}
                                    subject={sub.subject}
                                    topic={t.topic}
                                    onClose={() => togglePDFProcessor(sub.subject, t.topic)}
                                    onUploadSuccess={() => handlePDFUploadSuccess(sub.subject, t.topic)}
                                    onUploadError={handlePDFUploadError}
                                  />
                                </div>
                              )}
                              
                              {/* Compression indicator */}
                              {compressionStates[compressionKey] && (
                                <div className="compression-indicator">
                                  <div className="spinner small"></div>
                                  <span>Processing images...</span>
                                </div>
                              )}
                              
                              {/* Upload Complete Animation */}
                              {uploadComplete[compressionKey] && (
                                <div className="upload-success">
                                  <FiCheckCircle />
                                  <div>Upload Completed Successfully!</div>
                                </div>
                              )}
                              
                              {/* Multiple Files Preview and Upload */}
                              {isMultipleFiles && filesForTopic && filesForTopic.length > 0 && !uploadComplete[compressionKey] && (
                                <div className="files-preview-section">
                                  <div className="files-preview-container">
                                    {filesForTopic.map((fileData, fIdx) => {
                                      const isUploaded = uploadedFiles[compressionKey]?.has(fIdx + 1);
                                      const fileDate = new Date(fileData.lastModified);
                                      return (
                                        <div 
                                          key={fIdx} 
                                          className={`file-preview ${isUploaded ? 'uploaded' : ''}`}
                                        >
                                          <div className="file-info">
                                            <FiImage />
                                            <span>{fileData.name}</span>
                                            {isUploaded && <FiCheck />}
                                          </div>
                                          <div className="file-thumb">
                                            <img 
                                              src={filePreviewMap[compressionKey][fIdx]} 
                                              alt={`Preview ${fIdx + 1}`} 
                                            />
                                          </div>
                                          <div className="file-details">
                                            <div className="file-size">
                                              {(fileData.compressedSize / 1024 / 1024).toFixed(2)}MB
                                            </div>
                                            <div className="file-date">
                                              {fileDate.toLocaleDateString()}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  
                                  <div className="upload-info">
                                    <p>Files are sorted by date (oldest first) and will be uploaded in this order.</p>
                                  </div>
                                  
                                  {!uploadingStates[compressionKey] && (
                                    <button 
                                      onClick={() => uploadMultipleFilesSequentially(sub.subject, t.topic)}
                                      className="subj-btn primary"
                                      disabled={isLoading}
                                    >
                                      <FiUpload />
                                      Upload All Files ({filesForTopic.length})
                                    </button>
                                  )}

                                  {uploadingStates[compressionKey] && (
                                    <div className="upload-progress">
                                      <div className="progress-bar">
                                        <div 
                                          className="progress-fill" 
                                          style={{ width: `${uploadProgress[compressionKey] || 0}%` }}
                                        ></div>
                                      </div>
                                      <span>{uploadProgress[compressionKey] || 0}% Completed</span>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Single File Preview (for camera capture) */}
                              {!isMultipleFiles && filePreviewMap[`${sub.subject}-${t.topic}`] && !uploadComplete[compressionKey] && (
                                <div className="single-preview">
                                  <div className="preview-wrapper">
                                    <img 
                                      src={filePreviewMap[`${sub.subject}-${t.topic}`]} 
                                      alt="Preview"
                                    />
                                    <button
                                      onClick={() => handleSingleFileChange(sub.subject, t.topic, null)}
                                      className="remove-btn"
                                      disabled={isLoading || compressionStates[compressionKey]}
                                    >
                                      <FiX />
                                    </button>
                                  </div>
                                  
                                  <button 
                                    onClick={() => handleUploadImage(sub.subject, t.topic)} 
                                    className="subj-btn primary"
                                    disabled={uploadingStates[`${sub.subject}-${t.topic}`] || !filesMap[`${sub.subject}-${t.topic}`] || compressionStates[compressionKey]}
                                  >
                                    {uploadingStates[`${sub.subject}-${t.topic}`] ? (
                                      <>
                                        <div className="spinner small"></div>
                                        Uploading...
                                      </>
                                    ) : (
                                      <>
                                        <FiUpload />
                                        Upload
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <FiAlertTriangle />
              <h3>Confirm Delete</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this image?</p>
              <p className="warning">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button 
                onClick={cancelDelete} 
                className="subj-btn secondary"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete} 
                className="subj-btn danger"
                disabled={isLoading}
              >
                <FiTrash2 />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}