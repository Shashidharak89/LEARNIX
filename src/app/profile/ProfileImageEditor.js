"use client";

import { useState, useRef } from "react";
import { FiCamera, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import axios from "axios";
import "./styles/UserProfile.css";

export default function ProfileImageEditor({ profileImage, setProfileImage, usn }) {
  const [selectedImage, setSelectedImage] = useState(null);
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
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
            setCroppedImage(file);
          }
        };
      };
      reader.readAsDataURL(file);
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

      // ✅ fixed field mapping
      setProfileImage(res.data.user?.profileimg);
      setMessage(res.data.message || "Profile image updated successfully");
      setIsSuccess(true);

      // Reset state
      setSelectedImage(null);
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
      <h3 className="up-image-editor-title">
        <FiCamera /> Change Profile Image
      </h3>
      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="up-image-input"
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
              ? "Use the slider to adjust vertical crop"
              : "Use the slider to adjust horizontal crop"}
          </p>
          <div className="up-crop-controls">
            <input
              type="range"
              min="0"
              max="100"
              value={cropPosition}
              onChange={(e) => {
                setCropPosition(parseInt(e.target.value));
                handleCrop();
              }}
              disabled={isLoading}
              className={isVerticalCrop ? "up-crop-slider-vertical" : "up-crop-slider-horizontal"}
            />
            <button
              className="up-crop-btn"
              onClick={handleCrop}
              disabled={isLoading}
            >
              Crop to Square
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />

      {(croppedImage || (selectedImage && !needsCropping)) && (
        <div className="up-cropped-preview">
          <img
            src={croppedImage ? URL.createObjectURL(croppedImage) : URL.createObjectURL(selectedImage)}
            alt="Cropped"
            className="up-cropped-image"
          />
          <button
            className="up-upload-btn"
            onClick={handleUpload}
            disabled={isLoading}
          >
            {isLoading ? "Uploading..." : "Upload Image"}
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
  );
}
