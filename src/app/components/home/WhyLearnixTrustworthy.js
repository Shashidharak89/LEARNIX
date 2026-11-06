"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  ShieldCheckIcon,
  ServerIcon,
  LockIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowRightIcon,
} from "@animateicons/react/lucide";
import ImageContainer from "../ImageContainer";
import "./styles/WhyLearnixTrustworthy.css";

const TRUST_POINTS = [
  {
    title: "Secure Cloud Storage",
    desc: "All study materials and media are stored in reliable Cloudinary cloud storage with automated redundancy.",
    icon: ServerIcon,
    accent: "blue",
  },
  {
    title: "Protected User Data",
    desc: "User information is safeguarded in isolated MongoDB databases with role-based access control.",
    icon: ShieldCheckIcon,
    accent: "yellow",
  },
  {
    title: "Hashed Authentication",
    desc: "Passwords are salted and cryptographically hashed using bcrypt, ensuring credentials are never exposed.",
    icon: LockIcon,
    accent: "blue",
  },
];

function TrustPointCard({ item }) {
  const iconRef = useRef(null);
  const Icon = item.icon;

  return (
    <div
      className={`lx-trust-point-card lx-trust-point-card--${item.accent}`}
      onMouseEnter={() => iconRef.current?.startAnimation?.()}
      onMouseLeave={() => iconRef.current?.stopAnimation?.()}
    >
      <div className="lx-trust-icon-squircle">
        <Icon ref={iconRef} size={20} />
      </div>
      <h4>{item.title}</h4>
      <p>{item.desc}</p>
    </div>
  );
}

export default function WhyLearnixTrustworthy() {
  const [expanded, setExpanded] = useState(false);
  const toggleRef = useRef(null);
  const privacyRef = useRef(null);
  const badgeIconRef = useRef(null);

  const handleToggle = () => {
    setExpanded((prev) => !prev);
    toggleRef.current?.startAnimation?.();
  };

  return (
    <section className="lx-trust-section" aria-label="Why Learnix is trustworthy">
      <div className="lx-trust-card-container">
        {/* Banner Image */}
        <div className="lx-trust-img-wrapper">
          <ImageContainer
            imageUrl="https://res.cloudinary.com/dsojdpkgh/image/upload/v1766771791/geqefidmbokppkwd1spk.jpg"
            altText="Why Learnix is Trustworthy"
          />
        </div>

        {/* Header Tag / Badge */}
        <div
          className="lx-trust-badge"
          onMouseEnter={() => badgeIconRef.current?.startAnimation?.()}
          onMouseLeave={() => badgeIconRef.current?.stopAnimation?.()}
        >
          <div className="lx-trust-badge-icon">
            <ShieldCheckIcon ref={badgeIconRef} size={14} />
          </div>
          <span>Security &amp; Privacy First</span>
        </div>

        {/* Header */}
        <div className="lx-trust-header-block">
          <h2 className="lx-trust-title">
            Why <span className="lx-trust-brand">LEARNIX<span className="lx-trust-underline" /></span> is Trustworthy
          </h2>
          <p className="lx-trust-subtitle">
            Built with strict data security, cryptographic authentication, and cloud isolation so students can focus on learning with complete peace of mind.
          </p>
        </div>

        {/* Trust Points - Apple Widgets Grid */}
        <div className="lx-trust-points-grid">
          {TRUST_POINTS.map((item) => (
            <TrustPointCard key={item.title} item={item} />
          ))}
        </div>

        {/* Expandable Section */}
        <div
          className={`lx-trust-extra ${
            expanded ? "lx-trust-open" : "lx-trust-close"
          }`}
        >
          <div className="lx-trust-extra-inner">
            <p>
              Learnix follows responsible data-handling practices to ensure that user sessions, uploaded content, and authentication tokens are managed securely. Sensitive operations are protected with rigorous middleware validations.
            </p>

            <p>
              Uploaded study materials and shared files are isolated per student or temporary access code, preventing unauthorized access. Private notes and assignments remain restricted to their owners.
            </p>

            <p>
              Learnix is strictly designed for educational and learning purposes. We encourage users never to upload personal identification, confidential credentials, or sensitive documents.
            </p>

            {/* Privacy Link */}
            <div className="lx-trust-link-wrap">
              <Link
                href="/privacy-policy"
                className="lx-trust-link"
                onMouseEnter={() => privacyRef.current?.startAnimation?.()}
                onMouseLeave={() => privacyRef.current?.stopAnimation?.()}
              >
                <span>Read complete Privacy Policy</span>
                <ArrowRightIcon ref={privacyRef} size={15} />
              </Link>
            </div>
          </div>
        </div>

        {/* View more / less button */}
        <div className="lx-trust-view-actions">
          <button
            type="button"
            className="lx-trust-view-btn"
            onClick={handleToggle}
            onMouseEnter={() => toggleRef.current?.startAnimation?.()}
            onMouseLeave={() => toggleRef.current?.stopAnimation?.()}
          >
            <span>{expanded ? "Show less" : "Read security details"}</span>
            {expanded ? (
              <ChevronUpIcon ref={toggleRef} size={16} />
            ) : (
              <ChevronDownIcon ref={toggleRef} size={16} />
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
