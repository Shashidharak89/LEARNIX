"use client";

import { useState, useRef } from "react";
import { FiCamera, FiCheckCircle, FiAlertCircle, FiUploadCloud, FiCheck, FiCrop } from "react-icons/fi";
import axios from "axios";
import imageCompression from "browser-image-compression";
import "./styles/UserProfile.css";

export default function ProfileImageEditor({ profileImage, setProfileImage, usn }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [, setCompressedImage] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [needsCropping, setNeedsCropping] = useState(false);
  const [cropPosition, setCropPosition] = useState(0);
  const [isVerticalCrop, setIsVerticalCrop] = useState(false);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageRef = useRef(null);

  const checkImageRatio = (img) => {
    return Math.abs(img.width / img.height - 1) < 0.01;
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsLoading(true);
      setMessage("");

      try {
        const compressionOptions = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: "image/jpeg",
        };

        const compressedFile = await imageCompression(file, compressionOptions);
        setCompressedImage(compressedFile);

        const img = new Image();
        const reader = new FileReader();
        reader.onload = () => {
          img.src = reader.result;
          img.onload = () => {
            const isSquare = checkImageRatio(img);
            setNeedsCropping(!isSquare);
            setCropPosition(0);
            setIsVerticalCrop(img.height > img.width);
            if (isSquare) {
              setCroppedImage(compressedFile);
            }
            setSelectedImage(compressedFile);
          };
        };
        reader.readAsDataURL(compressedFile);
      } catch (err) {
        console.error("Compression error:", err);
        setMessage("Failed to compress image");
        setIsSuccess(false);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCrop = () => {
    if (!selectedImage || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = imageRef.current;

    const size = Math.min(img.naturalWidth, img.naturalHeight);
    canvas.width = size;
    canvas.height = size;

    let offsetX = 0;
    let offsetY = 0;

    if (isVerticalCrop) {
      const maxOffset = img.naturalHeight - size;
      offsetY = (cropPosition / 100) * maxOffset;
    } else {
      const maxOffset = img.naturalWidth - size;
      offsetX = (cropPosition / 100) * maxOffset;
    }

    ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const croppedFile = new File(
        [blob],
        selectedImage.name.replace(/\.[^/.]+$/, ".jpg"),
        { type: "image/jpeg", lastModified: Date.now() }
      );
      setCroppedImage(croppedFile);
    }, "image/jpeg", 0.9);
  };

  const handleUpload = async () => {
    if (!croppedImage && needsCropping) {
      setMessage("Please crop the image first");
      setIsSuccess(false);
      return;
    }

    try {
      setIsLoading(true);
      setMessage("");

      const formData = new FormData();
      formData.append("usn", usn);
      formData.append("file", croppedImage || selectedImage);

      const res = await axios.put("/api/user/change-profileimg", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setProfileImage(res.data.user?.profileimg);
      setMessage(res.data.message || "Profile image updated successfully");
      setIsSuccess(true);

      setSelectedImage(null);
      setCompressedImage(null);
      setCroppedImage(null);
      setNeedsCropping(false);
      setCropPosition(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || "Failed to update profile image");
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="up-image-editor">
      <div className="up-card-header-group">
        <h3 className="up-image-editor-title">
          <span className="up-card-icon-badge"><FiCamera /></span>
          Profile Picture
        </h3>
        <p className="up-card-desc">Upload a photo and adjust framing before saving.</p>
      </div>

      <div className="up-form-body">
        {!selectedImage && profileImage && (
          <div className="up-current-avatar-preview">
            <img src={profileImage} alt="Current avatar" className="up-current-avatar-img" />
            <div className="up-current-avatar-info">
              <span className="up-current-avatar-label">Active Picture</span>
              <span className="up-current-avatar-sub">Click below to replace</span>
            </div>
          </div>
        )}

        <div
          className="up-file-dropzone"
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          <div className="up-dropzone-icon-wrap">
            <FiUploadCloud />
          </div>
          <span className="up-dropzone-title">Choose New Image</span>
          <span className="up-dropzone-hint">PNG, JPG or WebP (auto-optimized)</span>
        </div>

        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="up-image-input-hidden"
          disabled={isLoading}
          ref={fileInputRef}
        />

        {selectedImage && needsCropping && (
          <div className="up-crop-container">
            <div className="up-crop-preview">
              <img
                src={URL.createObjectURL(selectedImage)}
                alt="Selected"
                className="up-crop-image"
                ref={imageRef}
                onLoad={handleCrop}
              />
              <div className="up-crop-square"></div>
            </div>
            <p className="up-crop-instruction">
              {isVerticalCrop
                ? "Adjust vertical position using slider"
                : "Adjust horizontal position using slider"}
            </p>
            <div className="up-crop-controls">
              <input
                type="range"
                min="0"
                max="100"
                value={cropPosition}
                onChange={(e) => {
                  setCropPosition(parseInt(e.target.value, 10));
                  handleCrop();
                }}
                disabled={isLoading}
                className={isVerticalCrop ? "up-crop-slider-vertical" : "up-crop-slider-horizontal"}
              />
              <button
                type="button"
                className="up-crop-btn"
                onClick={handleCrop}
                disabled={isLoading}
              >
                <FiCrop /> Apply Crop
              </button>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} style={{ display: "none" }} />

        {(croppedImage || (selectedImage && !needsCropping)) && (
          <div className="up-cropped-preview">
            <img
              src={croppedImage ? URL.createObjectURL(croppedImage) : URL.createObjectURL(selectedImage)}
              alt="Cropped Preview"
              className="up-cropped-image"
            />
            <button
              type="button"
              className="up-settings-submit-btn"
              onClick={handleUpload}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="up-mini-spinner" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <FiCheck />
                  <span>Save New Photo</span>
                </>
              )}
            </button>
          </div>
        )}

        {message && (
          <div className={`up-message ${isSuccess ? "up-success" : "up-error"}`}>
            {isSuccess ? <FiCheckCircle /> : <FiAlertCircle />}
            <span>{message}</span>
          </div>
        )}
      </div>
    </div>
  );
}