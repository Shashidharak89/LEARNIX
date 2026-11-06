"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  UsersIcon,
  UserCheckIcon,
  CompassIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowRightIcon,
  SparklesIcon,
} from "@animateicons/react/lucide";
import { GraduationCapIcon } from "../icons/GraduationCapIcon";
import ImageContainer from "../ImageContainer";
import "./styles/WhoIsLearnixFor.css";

const AUDIENCES = [
  {
    title: "College Students",
    desc: "Students who want to share, access, and refer study materials contributed by others.",
    icon: GraduationCapIcon,
    accent: "blue",
  },
  {
    title: "Interview Prep",
    desc: "Learners preparing for technical interviews who need quick access to notes, concepts, and shared resources.",
    icon: UserCheckIcon,
    accent: "yellow",
  },
  {
    title: "Self Learners",
    desc: "Students who prefer learning at their own pace using shared educational resources.",
    icon: CompassIcon,
    accent: "blue",
  },
];

function AudienceCard({ title, desc, icon: Icon, accent }) {
  const iconRef = useRef(null);

  return (
    <div
      className={`lx-for-card lx-for-card--${accent}`}
      onMouseEnter={() => iconRef.current?.startAnimation?.()}
      onMouseLeave={() => iconRef.current?.stopAnimation?.()}
    >
      <div className="lx-for-card-icon-box">
        <Icon ref={iconRef} size={20} />
      </div>
      <h4>{title}</h4>
      <p>{desc}</p>
    </div>
  );
}

export default function WhoIsLearnixFor() {
  const [expanded, setExpanded] = useState(false);
  const toggleRef = useRef(null);
  const joinRef = useRef(null);
  const badgeIconRef = useRef(null);

  const handleToggle = () => {
    setExpanded((prev) => !prev);
    toggleRef.current?.startAnimation?.();
  };

  return (
    <section className="lx-for-section" aria-label="Who is Learnix For">
      <div className="lx-for-card-container">
        {/* Top Image Preview */}
        <div className="lx-for-img-wrapper">
          <ImageContainer
            imageUrl="https://res.cloudinary.com/dsojdpkgh/image/upload/v1766771791/bkt3nqfunv15aj7yyxhi.jpg"
            altText="Who is Learnix For"
          />
        </div>

        {/* Header Tag / Badge */}
        <div
          className="lx-for-badge"
          onMouseEnter={() => badgeIconRef.current?.startAnimation?.()}
          onMouseLeave={() => badgeIconRef.current?.stopAnimation?.()}
        >
          <div className="lx-for-badge-icon">
            <UsersIcon ref={badgeIconRef} size={14} />
          </div>
          <span>Community &amp; Audience</span>
        </div>

        {/* Title */}
        <h2 className="lx-for-title">
          Who is this platform <span className="lx-for-brand">FOR?<span className="lx-for-underline" /></span>
        </h2>

        {/* Short intro */}
        <p className="lx-for-intro">
          Learnix is designed for students who want easy access to study
          materials, simple explanations, and flexible file-sharing tools
          that support academic collaboration.
        </p>

        {/* Audience cards - Apple Rounded Widgets */}
        <div className="lx-for-grid">
          {AUDIENCES.map((item) => (
            <AudienceCard
              key={item.title}
              title={item.title}
              desc={item.desc}
              icon={item.icon}
              accent={item.accent}
            />
          ))}
        </div>

        {/* Expandable content */}
        <div
          className={`lx-for-extra ${
            expanded ? "lx-for-open" : "lx-for-close"
          }`}
        >
          <div className="lx-for-extra-inner">
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
              <Link
                href="/signup"
                className="lx-for-cta-btn"
                onMouseEnter={() => joinRef.current?.startAnimation?.()}
                onMouseLeave={() => joinRef.current?.stopAnimation?.()}
              >
                <span>Want to join? Create an account</span>
                <ArrowRightIcon ref={joinRef} size={16} />
              </Link>
            </div>
          </div>
        </div>

        {/* View more / less button */}
        <div className="lx-for-view-actions">
          <button
            type="button"
            className="lx-for-view-btn"
            onClick={handleToggle}
            onMouseEnter={() => toggleRef.current?.startAnimation?.()}
            onMouseLeave={() => toggleRef.current?.stopAnimation?.()}
          >
            <span>{expanded ? "Show less" : "Read more details"}</span>
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
