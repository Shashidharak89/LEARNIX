"use client";
import "./styles/WhoIsLearnixFor.css";
import { useState } from "react";
import Link from "next/link";
import ImageContainer from "../ImageContainer";

export default function WhoIsLearnixFor() {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="lx-for-section">
      <div className="lx-for-container">
        <ImageContainer imageUrl="https://res.cloudinary.com/dsojdpkgh/image/upload/v1766771791/bkt3nqfunv15aj7yyxhi.jpg" altText="Who is Learnix For" />
        {/* Title */}
        <h2 className="lx-for-title">
          Who is this platform <span>for?</span>
        </h2>

        {/* Short intro */}
        <p className="lx-for-intro">
          Learnix is designed for students who want easy access to study
          materials, simple explanations, and flexible file-sharing tools
          that support academic collaboration.
        </p>

        {/* Audience cards */}
        <div className="lx-for-grid">
          <div className="lx-for-card">
            <h4>Students</h4>
            <p>
              Students who want to share, access, and refer study materials
              contributed by others.
            </p>
          </div>

          <div className="lx-for-card">
            <h4>Interview Preparation</h4>
            <p>
              Learners preparing for technical interviews who need quick
              access to notes, concepts, and shared resources.
            </p>
          </div>

          <div className="lx-for-card">
            <h4>Self Learners</h4>
            <p>
              Students who prefer learning at their own pace using shared
              educational resources.
            </p>
          </div>
        </div>

        {/* Expandable content */}
        <div
          className={`lx-for-extra ${
            expanded ? "lx-for-open" : "lx-for-close"
          }`}
        >
          <p>
            Learnix is especially useful for students who need easy access
            to semester-wise study materials in PDF or image format. It helps
            learners revise concepts, prepare notes, and strengthen their
            understanding using peer-shared content.
          </p>

          <p>
            The platform also supports interview preparation by allowing
            learners to collect and review shared resources across different
            topics, all in one place.
          </p>

          <p>
            To upload study materials or use file-sharing tools, users must
            create an account. Accessing shared materials, however, can be
            done without login in many cases.
          </p>

          {/* Join CTA */}
          <div className="lx-for-cta">
            <Link href="/signup" className="lx-for-cta-btn">
              Want to join? Click here →
            </Link>
          </div>
        </div>

        {/* View more button */}
        <button
          className="lx-for-view-btn"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "View less" : "View more"}
        </button>
      </div>
    </section>
  );
}
