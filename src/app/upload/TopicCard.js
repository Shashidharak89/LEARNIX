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
