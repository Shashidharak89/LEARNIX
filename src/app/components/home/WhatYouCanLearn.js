"use client";
import "./styles/WhatYouCanLearn.css";
import { useRef, useEffect } from "react";

export default function WhatYouCanLearn() {
  const sliderRef = useRef(null);

  const slideRight = () => {
    if (!sliderRef.current) return;

    const slider = sliderRef.current;
    const cardWidth = 340;

    slider.scrollBy({
      left: cardWidth,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    const handleScroll = () => {
      // If reached near end → jump to start
      if (
        slider.scrollLeft + slider.clientWidth >=
        slider.scrollWidth - 5
      ) {
        slider.scrollTo({
          left: 0,
          behavior: "auto", // instant jump (no flicker)
        });
      }
    };

    slider.addEventListener("scroll", handleScroll);
    return () => slider.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="lx-learn-section">
      <div className="lx-learn-header">
        <h2 className="lx-learn-title">What you can learn here</h2>
        <p className="lx-learn-subtitle">
          Explore academic and technical topics shared by students and learners.
        </p>
      </div>

      <div className="lx-learn-slider-wrapper">
        <div className="lx-learn-slider" ref={sliderRef}>
          {/* ORIGINAL SET */}
          <div className="lx-learn-card">
            <h4>Data Structures</h4>
            <p>Arrays, linked lists, stacks, queues, trees, and graphs.</p>
          </div>

          <div className="lx-learn-card">
            <h4>Database Management Systems</h4>
            <p>Normalization, indexing, transactions, and DBMS concepts.</p>
          </div>

          <div className="lx-learn-card">
            <h4>SQL & NoSQL</h4>
            <p>MySQL, MongoDB, relational and non-relational databases.</p>
          </div>

          <div className="lx-learn-card">
            <h4>Operating Systems</h4>
            <p>Processes, memory management, scheduling, file systems.</p>
          </div>

          <div className="lx-learn-card">
            <h4>Computer Networks</h4>
            <p>OSI model, TCP/IP, protocols, congestion control.</p>
          </div>

          <div className="lx-learn-card">
            <h4>Interview Preparation</h4>
            <p>Technical concepts, notes, and interview resources.</p>
          </div>

          {/* DUPLICATE SET (for infinite loop) */}
          <div className="lx-learn-card">
            <h4>Data Structures</h4>
            <p>Arrays, linked lists, stacks, queues, trees, and graphs.</p>
          </div>

          <div className="lx-learn-card">
            <h4>Database Management Systems</h4>
            <p>Normalization, indexing, transactions, and DBMS concepts.</p>
          </div>
        </div>

        {/* Circular button */}
        <button
          className="lx-learn-slide-btn"
          onClick={slideRight}
          aria-label="Slide"
        >
          →
        </button>
      </div>
    </section>
  );
}
