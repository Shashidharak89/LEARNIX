"use client";

import Link from "next/link";
import { FiClipboard, FiArrowRight, FiDownload, FiEye, FiShare2 } from "react-icons/fi";
import ImageContainer from "../ImageContainer";
import "./styles/QuestionPapersBanner.css";

export default function QuestionPapersBanner() {
  return (
    <section className="qpb-section">
      <div className="qpb-container">
        {/* Image */}
        <ImageContainer 
          imageUrl="https://res.cloudinary.com/dsojdpkgh/image/upload/v1770452336/rnxcohbnlco37f0m5hzh.jpg" 
          altText="Previous Year Question Papers" 
        />

        {/* Header */}
        <div className="qpb-header">
          <FiClipboard className="qpb-header-icon" />
          <h2 className="qpb-title">Previous Year Question Papers</h2>
        </div>

        {/* Description */}
        <p className="qpb-description">
          Access a comprehensive collection of previous year question papers organized by semester, batch, and exam type. Prepare better for your exams with real question papers from past years.
        </p>

        {/* Features */}
        <div className="qpb-features">
          <div className="qpb-feature">
            <FiEye className="qpb-feature-icon" />
            <div className="qpb-feature-content">
              <strong>View Online</strong>
              <span>Browse papers directly in the viewer</span>
            </div>
          </div>
          <div className="qpb-feature">
            <FiDownload className="qpb-feature-icon" />
            <div className="qpb-feature-content">
              <strong>Download PDF</strong>
              <span>Download entire papers or select pages</span>
            </div>
          </div>
          <div className="qpb-feature">
            <FiShare2 className="qpb-feature-icon" />
            <div className="qpb-feature-content">
              <strong>Share</strong>
              <span>Share papers with friends</span>
            </div>
          </div>
        </div>

        {/* Highlight badges */}
        <div className="qpb-badges">
          <span className="qpb-badge qpb-badge-blue">MSE 1</span>
          <span className="qpb-badge qpb-badge-blue">MSE 2</span>
          <span className="qpb-badge qpb-badge-yellow">Final Exam</span>
          <span className="qpb-badge qpb-badge-gray">All Semesters</span>
        </div>

        {/* CTA Button */}
        <Link href="/qp" className="qpb-cta-btn">
          Visit Question Papers
          <FiArrowRight className="qpb-cta-icon" />
        </Link>
      </div>
    </section>
  );
}
