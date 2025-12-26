"use client";
import "./styles/WhyLearnixTrustworthy.css";
import { useState } from "react";
import Link from "next/link";
import ImageContainer from "../ImageContainer";

export default function WhyLearnixTrustworthy() {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="lx-trust-section">
      <div className="lx-trust-container">
        <ImageContainer imageUrl="https://res.cloudinary.com/dsojdpkgh/image/upload/v1766771791/geqefidmbokppkwd1spk.jpg" altText="Why Learnix is Trustworthy" />
        {/* Header */}
        <h2 className="lx-trust-title">Why Learnix is trustworthy</h2>
        <p className="lx-trust-subtitle">
          Learnix is built with a strong focus on security, privacy, and data
          protection to ensure a safe learning experience for students.
        </p>

        {/* Key trust points (always visible) */}
        <div className="lx-trust-points">
          <div className="lx-trust-point">
            <h4>Secure file storage</h4>
            <p>
              All uploaded images and study materials are stored securely in
              Cloudinary cloud storage, ensuring reliability and protection
              against data loss.
            </p>
          </div>

          <div className="lx-trust-point">
            <h4>Protected user data</h4>
            <p>
              User-related information is stored safely in MongoDB databases
              with controlled access and proper data handling practices.
            </p>
          </div>

          <div className="lx-trust-point">
            <h4>Strong password security</h4>
            <p>
              User passwords are never stored in plain text. They are securely
              hashed using bcrypt, making unauthorized access extremely
              difficult.
            </p>
          </div>
        </div>

        {/* Expandable content */}
        <div
          className={`lx-trust-extra ${
            expanded ? "lx-trust-open" : "lx-trust-close"
          }`}
        >
          <p>
            Learnix follows responsible data handling practices to ensure that
            user activity, uploaded content, and authentication details are
            managed securely. Sensitive operations are protected, and only
            necessary information is collected to provide platform features.
          </p>

          <p>
            Uploaded study materials and shared files are isolated per user or
            access code, preventing unauthorized access. Private uploads remain
            accessible only to intended users.
          </p>

          <p>
            Learnix is transparent about how data is handled and encourages
            users not to upload personal or confidential documents. The platform
            is designed strictly for educational and learning purposes.
          </p>

          {/* Privacy link */}
          <div className="lx-trust-link-wrap">
            <Link href="/privacy-policy" className="lx-trust-link">
              View privacy policy →
            </Link>
          </div>
        </div>

        {/* View more button */}
        <button
          className="lx-trust-view-btn"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "View less" : "View more"}
        </button>
      </div>
    </section>
  );
}
