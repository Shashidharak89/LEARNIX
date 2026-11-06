"use client";

import { useRef } from "react";
import {
  SearchIcon,
  ShareIcon,
  KeyIcon,
  LogInIcon,
  SparklesIcon,
  RouteIcon,
} from "@animateicons/react/lucide";
import ImageContainer from "../ImageContainer";
import "./styles/HowLearnixWorks.css";

const STEPS = [
  {
    num: "1",
    title: "Explore study materials",
    desc: "Anyone can explore and download shared study materials without logging in. This helps students quickly access useful academic resources.",
    icon: SearchIcon,
    accent: "blue",
  },
  {
    num: "2",
    title: "Use file-sharing tools without login",
    desc: "Learnix provides device-to-device file-sharing tools that can be used without creating an account. Users can upload files and share them instantly using an access code.",
    icon: ShareIcon,
    accent: "yellow",
  },
  {
    num: "3",
    title: "Upload files and get an access code",
    desc: "For file sharing, users can upload any type of file such as ZIP, PDF, images, or documents. After uploading, a unique access code is generated to download the file from any device.",
    icon: KeyIcon,
    accent: "blue",
  },
  {
    num: "4",
    title: "Login only for study material uploads",
    desc: "To upload study materials such as PDFs and images to the learning section, users must log in. This helps maintain content quality and organization.",
    icon: LogInIcon,
    accent: "yellow",
  },
  {
    num: "5",
    title: "Learn and contribute",
    desc: "Students can learn from shared materials and optionally contribute study resources after logging in, helping others in the learning community.",
    icon: SparklesIcon,
    accent: "blue",
  },
];

function StepWidget({ step }) {
  const iconRef = useRef(null);
  const Icon = step.icon;

  return (
    <div
      className={`lx-work-step-card lx-work-step-card--${step.accent}`}
      onMouseEnter={() => iconRef.current?.startAnimation?.()}
      onMouseLeave={() => iconRef.current?.stopAnimation?.()}
    >
      <div className="lx-work-step-top">
        <div className="lx-work-step-num-badge">
          <span>Step {step.num}</span>
        </div>
        <div className="lx-work-icon-squircle">
          <Icon ref={iconRef} size={18} />
        </div>
      </div>

      <div className="lx-work-step-body">
        <h4>{step.title}</h4>
        <p>{step.desc}</p>
      </div>
    </div>
  );
}

export default function HowLearnixWorks() {
  const badgeIconRef = useRef(null);

  return (
    <section className="lx-work-section" aria-label="How Learnix works">
      <div className="lx-work-card-container">
        {/* Banner Image */}
        <div className="lx-work-img-wrapper">
          <ImageContainer
            imageUrl="https://res.cloudinary.com/dsojdpkgh/image/upload/v1766771791/lioov75raprzyxraof3w.jpg"
            altText="How Learnix Works"
          />
        </div>

        {/* Header Tag / Badge */}
        <div
          className="lx-work-badge"
          onMouseEnter={() => badgeIconRef.current?.startAnimation?.()}
          onMouseLeave={() => badgeIconRef.current?.stopAnimation?.()}
        >
          <div className="lx-work-badge-icon">
            <RouteIcon ref={badgeIconRef} size={14} />
          </div>
          <span>Simple 5-Step Process</span>
        </div>

        {/* Header */}
        <div className="lx-work-header-block">
          <h2 className="lx-work-title">
            How <span className="lx-work-brand">LEARNIX<span className="lx-work-underline" /></span> Works
          </h2>
          <p className="lx-work-subtitle">
            Learnix follows a simple, transparent process that allows students to access verified learning resources and collaborate easily.
          </p>
        </div>

        {/* Apple Widget Steps Grid */}
        <div className="lx-work-steps-grid">
          {STEPS.map((step) => (
            <StepWidget key={step.num} step={step} />
          ))}
        </div>
      </div>
    </section>
  );
}
