"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  FileTextIcon,
  EyeIcon,
  DownloadIcon,
  ShareIcon,
  ArrowRightIcon,
} from "@animateicons/react/lucide";
import ImageContainer from "../ImageContainer";
import "./styles/QuestionPapersBanner.css";

const FEATURES = [
  {
    title: "View Online",
    desc: "Browse papers instantly in the reader",
    icon: EyeIcon,
    accent: "blue",
  },
  {
    title: "Download PDF",
    desc: "Save full papers or individual pages",
    icon: DownloadIcon,
    accent: "yellow",
  },
  {
    title: "Share with Peers",
    desc: "Send direct links to batchmates",
    icon: ShareIcon,
    accent: "blue",
  },
];

function QpFeatureCard({ item }) {
  const iconRef = useRef(null);
  const Icon = item.icon;

  return (
    <div
      className={`qpb-feature-card qpb-feature-card--${item.accent}`}
      onMouseEnter={() => iconRef.current?.startAnimation?.()}
      onMouseLeave={() => iconRef.current?.stopAnimation?.()}
    >
      <div className="qpb-feature-squircle">
        <Icon ref={iconRef} size={18} />
      </div>
      <div className="qpb-feature-content">
        <strong>{item.title}</strong>
        <span>{item.desc}</span>
      </div>
    </div>
  );
}

export default function QuestionPapersBanner() {
  const badgeIconRef = useRef(null);
  const ctaArrowRef = useRef(null);

  return (
    <section className="qpb-section" aria-label="Previous Year Question Papers">
      <div className="qpb-card-container">
        {/* Banner Image */}
        <div className="qpb-img-wrapper">
          <ImageContainer
            imageUrl="https://res.cloudinary.com/dsojdpkgh/image/upload/v1770452336/rnxcohbnlco37f0m5hzh.jpg"
            altText="Previous Year Question Papers"
          />
        </div>

        {/* Header Tag / Badge */}
        <div
          className="qpb-badge-pill"
          onMouseEnter={() => badgeIconRef.current?.startAnimation?.()}
          onMouseLeave={() => badgeIconRef.current?.stopAnimation?.()}
        >
          <div className="qpb-badge-icon">
            <FileTextIcon ref={badgeIconRef} size={14} />
          </div>
          <span>Exam Prep Archive</span>
        </div>

        {/* Title */}
        <div className="qpb-header-block">
          <h2 className="qpb-title">
            Previous Year <span className="qpb-brand">QUESTION PAPERS<span className="qpb-underline" /></span>
          </h2>
          <p className="qpb-description">
            Access a comprehensive collection of university and college question papers organized by semester, batch, and exam pattern. Practice with real exam papers to boost your confidence.
          </p>
        </div>

        {/* Apple-style Features Grid */}
        <div className="qpb-features-grid">
          {FEATURES.map((item) => (
            <QpFeatureCard key={item.title} item={item} />
          ))}
        </div>

        {/* Exam Type Badges */}
        <div className="qpb-badges-row">
          <span className="qpb-chip qpb-chip--blue">MSE 1</span>
          <span className="qpb-chip qpb-chip--blue">MSE 2</span>
          <span className="qpb-chip qpb-chip--yellow">Semester End Exam</span>
          <span className="qpb-chip qpb-chip--neutral">All Branches &amp; Semesters</span>
        </div>

        {/* CTA Button */}
        <div className="qpb-cta-wrap">
          <Link
            href="/qp"
            className="qpb-cta-btn"
            onMouseEnter={() => ctaArrowRef.current?.startAnimation?.()}
            onMouseLeave={() => ctaArrowRef.current?.stopAnimation?.()}
          >
            <span>Explore Question Papers</span>
            <ArrowRightIcon ref={ctaArrowRef} size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
