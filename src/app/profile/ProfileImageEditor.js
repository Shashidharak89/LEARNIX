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
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setSelectedImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleCrop = () => {
    if (!selectedImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.src = selectedImage;

    img.onload = () => {
      const size = Math.min(img.width, img.height);
      canvas.width = 200;
      canvas.height = 200;

      ctx.beginPath();
      ctx.arc(100, 100, 100, 0, 2 * Math.PI);
      ctx.clip();

      const scale = size / (200 / zoom);
      const offsetX = (img.width - scale) / 2 + crop.x;
      const offsetY = (img.height - scale) / 2 + crop.y;

      ctx.drawImage(img, offsetX, offsetY, scale, scale, 0, 0, 200, 200);
      const cropped = canvas.toDataURL("image/jpeg");
      setCroppedImage(cropped);
    };
  };

  const handleUpload = async () => {
    if (!croppedImage) {
      setMessage("Please crop an image first");
      setIsSuccess(false);
      return;
    }

    try {
      setIsLoading(true);
      const res = await axios.put("/api/xyz/update-profile-image", {
        usn,
        image: croppedImage,
      });

      setProfileImage(croppedImage);
      setMessage(res.data.message);
      setIsSuccess(true);
      setSelectedImage(null);
      setCroppedImage(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
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
      {selectedImage && (
        <div className="up-crop-container">
          <div className="up-crop-preview">
            <img
              src={selectedImage}
              alt="Selected"
              className="up-crop-image"
              style={{
                transform: `translate(${crop.x}px, ${crop.y}px) scale(${zoom})`,
              }}
            />
            <div className="up-crop-circle"></div>
          </div>
          <div className="up-crop-controls">
            <label>
              Zoom:
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                disabled={isLoading}
              />
            </label>
            <label>
              X:
              <input
                type="range"
                min="-100"
                max="100"
                value={crop.x}
                onChange={(e) => setCrop({ ...crop, x: parseInt(e.target.value) })}
                disabled={isLoading}
              />
            </label>
            <label>
              Y:
              <input
                type="range"
                min="-100"
                max="100"
                value={crop.y}
                onChange={(e) => setCrop({ ...crop, y: parseInt(e.target.value) })}
                disabled={isLoading}
              />
            </label>
            <button
              className="up-crop-btn"
              onClick={handleCrop}
              disabled={isLoading}
            >
              Crop Image
            </button>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} style={{ display: "none" }} />
      {croppedImage && (
        <div className="up-cropped-preview">
          <img src={croppedImage} alt="Cropped" className="up-cropped-image" />
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