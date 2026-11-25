"use client";

import React from "react";
import { FaArrowLeft, FaDownload, FaShare, FaImage } from "react-icons/fa";
import { Navbar } from "../components/Navbar";
import "./[id]/styles/QuestionPaperDetail.css";

export default function QPSkeletonLoader() {
  return (
    <div className="qpd-container">
      <Navbar />
      <div className="qpd-main-content">
        <div className="qpd-header-section qpd-skeleton-container">
          <div className="qpd-header-info">
            <div className="qpd-skeleton-title"></div>
            <div className="qpd-header-meta">
              <div className="qpd-meta-item qpd-skeleton-meta">
                <div className="qpd-skeleton-text"></div>
              </div>
              <div className="qpd-meta-item qpd-skeleton-meta">
                <div className="qpd-skeleton-text"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="qpd-action-buttons-container qpd-skeleton-container">
          <div className="qpd-action-btn qpd-skeleton-btn">
            <FaArrowLeft className="qpd-skeleton-icon" />
            <span className="qpd-btn-text qpd-skeleton-btn-text">Back</span>
          </div>
          <div className="qpd-action-btn qpd-skeleton-btn">
            <FaDownload className="qpd-skeleton-icon" />
            <span className="qpd-btn-text qpd-skeleton-btn-text">Download</span>
          </div>
          <div className="qpd-action-btn qpd-skeleton-btn">
            <FaShare className="qpd-skeleton-icon" />
            <span className="qpd-btn-text qpd-skeleton-btn-text">Share</span>
          </div>
        </div>

        <div className="qpd-content-section qpd-skeleton-container">
          <div className="qpd-images-section">
            <div className="qpd-images-header">
              <h3>
                <FaImage className="qpd-section-icon qpd-skeleton-icon" />
                <span className="qpd-skeleton-images-title"></span>
              </h3>
            </div>
            <div className="qpd-images-grid">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="qpd-image-container qpd-skeleton-image-container">
                  <div className="qpd-image-wrapper">
                    <div className="qpd-skeleton-image"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

