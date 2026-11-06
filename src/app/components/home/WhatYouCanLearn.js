"use client";

import { useRef, useEffect } from "react";
import {
  LayersIcon,
  ServerIcon,
  CodeIcon,
  CpuIcon,
  GlobeIcon,
  BookOpenIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
} from "@animateicons/react/lucide";
import ImageContainer from "../ImageContainer";
import "./styles/WhatYouCanLearn.css";

const TOPICS = [
  {
    title: "Data Structures",
    desc: "Arrays, linked lists, stacks, queues, trees, and graphs.",
    image: "https://res.cloudinary.com/dsojdpkgh/image/upload/v1766912250/eqqz1sekysipjvre1i4y.jpg",
    icon: LayersIcon,
    accent: "blue",
  },
  {
    title: "Database Management Systems",
    desc: "Normalization, indexing, transactions, and relational DBMS.",
    image: "https://res.cloudinary.com/dsojdpkgh/image/upload/v1766912251/rhdb7wsqf5ne2gzrahth.jpg",
    icon: ServerIcon,
    accent: "yellow",
  },
  {
    title: "SQL & NoSQL",
    desc: "MySQL, MongoDB, queries, relational and non-relational databases.",
    image: null,
    icon: CodeIcon,
    accent: "blue",
  },
  {
    title: "Operating Systems",
    desc: "Processes, threads, memory management, scheduling, and file systems.",
    image: "https://res.cloudinary.com/dsojdpkgh/image/upload/v1766912254/xtaub9hbe3srfpgtjct6.jpg",
    icon: CpuIcon,
    accent: "yellow",
  },
  {
    title: "Computer Networks",
    desc: "OSI model, TCP/IP, routing protocols, flow control, and sockets.",
    image: "https://res.cloudinary.com/dsojdpkgh/image/upload/v1766912253/blprrfchskezyovolvle.jpg",
    icon: GlobeIcon,
    accent: "blue",
  },
  {
    title: "Interview Preparation",
    desc: "Curated technical concepts, cheat sheets, and interview problems.",
    image: "https://res.cloudinary.com/dsojdpkgh/image/upload/v1766912253/kn5vjbiyqtghionzxouf.jpg",
    icon: SparklesIcon,
    accent: "yellow",
  },
];

function LearnTopicCard({ topic }) {
  const iconRef = useRef(null);
  const Icon = topic.icon;

  return (
    <div
      className={`lx-learn-card lx-learn-card--${topic.accent}`}
      onMouseEnter={() => iconRef.current?.startAnimation?.()}
      onMouseLeave={() => iconRef.current?.stopAnimation?.()}
    >
      {topic.image ? (
        <div className="lx-learn-card-img">
          <ImageContainer imageUrl={topic.image} altText={topic.title} />
        </div>
      ) : (
        <div className="lx-learn-card-placeholder">
          <div className="lx-placeholder-glow" />
        </div>
      )}

      <div className="lx-learn-card-content">
        <div className="lx-learn-icon-squircle">
          <Icon ref={iconRef} size={18} />
        </div>
        <h4>{topic.title}</h4>
        <p>{topic.desc}</p>
      </div>
    </div>
  );
}

export default function WhatYouCanLearn() {
  const sliderRef = useRef(null);
  const prevBtnRef = useRef(null);
  const nextBtnRef = useRef(null);
  const badgeIconRef = useRef(null);

  const slideLeft = () => {
    if (!sliderRef.current) return;
    sliderRef.current.scrollBy({ left: -320, behavior: "smooth" });
    prevBtnRef.current?.startAnimation?.();
  };

  const slideRight = () => {
    if (!sliderRef.current) return;
    sliderRef.current.scrollBy({ left: 320, behavior: "smooth" });
    nextBtnRef.current?.startAnimation?.();
  };

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    const handleScroll = () => {
      if (slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 5) {
        slider.scrollTo({ left: 0, behavior: "auto" });
      }
    };

    slider.addEventListener("scroll", handleScroll);
    return () => slider.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="lx-learn-section" aria-label="What you can learn here">
      <div className="lx-learn-card-container">
        {/* Banner Image */}
        <div className="lx-learn-img-wrapper">
          <ImageContainer
            imageUrl="https://res.cloudinary.com/dsojdpkgh/image/upload/v1766771790/ifywt1ln6eh8bdvfutrm.jpg"
            altText="What You Can Learn"
          />
        </div>

        {/* Header Tag / Badge */}
        <div
          className="lx-learn-badge"
          onMouseEnter={() => badgeIconRef.current?.startAnimation?.()}
          onMouseLeave={() => badgeIconRef.current?.stopAnimation?.()}
        >
          <div className="lx-learn-badge-icon">
            <BookOpenIcon ref={badgeIconRef} size={14} />
          </div>
          <span>Curated Curriculum</span>
        </div>

        {/* Title */}
        <div className="lx-learn-header-row">
          <div className="lx-learn-title-block">
            <h2 className="lx-learn-title">
              What you can <span className="lx-learn-brand">LEARN HERE<span className="lx-learn-underline" /></span>
            </h2>
            <p className="lx-learn-subtitle">
              Explore academic and technical topics shared by students and learners across college semesters.
            </p>
          </div>

          {/* Navigation Slider Arrows */}
          <div className="lx-learn-controls">
            <button
              type="button"
              className="lx-learn-nav-btn"
              onClick={slideLeft}
              aria-label="Scroll left"
              onMouseEnter={() => prevBtnRef.current?.startAnimation?.()}
              onMouseLeave={() => prevBtnRef.current?.stopAnimation?.()}
            >
              <ChevronLeftIcon ref={prevBtnRef} size={18} />
            </button>
            <button
              type="button"
              className="lx-learn-nav-btn"
              onClick={slideRight}
              aria-label="Scroll right"
              onMouseEnter={() => nextBtnRef.current?.startAnimation?.()}
              onMouseLeave={() => nextBtnRef.current?.stopAnimation?.()}
            >
              <ChevronRightIcon ref={nextBtnRef} size={18} />
            </button>
          </div>
        </div>

        {/* Carousel Slider */}
        <div className="lx-learn-slider-wrapper">
          <div className="lx-learn-slider" ref={sliderRef}>
            {/* Primary Set */}
            {TOPICS.map((topic, index) => (
              <LearnTopicCard key={`primary-${index}-${topic.title}`} topic={topic} />
            ))}
            {/* Duplicate Set for smooth continuous scroll */}
            {TOPICS.map((topic, index) => (
              <LearnTopicCard key={`dup-${index}-${topic.title}`} topic={topic} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
