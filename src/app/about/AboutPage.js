import React from "react";
import { Navbar } from "../components/Navbar";
import Footer from "../components/Footer";
import "./styles/AboutPage.css";   

export default function AboutPage() {
  return (
    <div className="lx-page-container">
      <Navbar className="lx-navbar" />
      <main className="lx-main-content">
        <h1 className="lx-title">About Learnix</h1>

        <h2 className="lx-subtitle">What is Learnix?</h2>
        <p className="lx-paragraph">
          Learnix is a collaborative educational platform where students can
          upload, share, and discover study materials, assignments, and
          resources. Our goal is to make learning more accessible by enabling
          students to contribute and benefit from a shared pool of knowledge.
        </p>

        <h2 className="lx-subtitle">Why Learnix Was Created</h2>
        <p className="lx-paragraph">
          Learnix was created to solve a common problem: students often lack a
          central place to find class-specific resources, past assignments and
          curated study guides. By allowing students to upload and organize
          materials by subject and topic, Learnix helps learners find
          high-quality resources quickly.
        </p>

        <h2 className="lx-subtitle">Key Features</h2>
        <ul className="lx-list">
          <li><strong>Upload:</strong> Share homework, notes and study files.</li>
          <li><strong>Study Materials:</strong> Browse organized subjects and topics.</li>
          <li><strong>Tools:</strong> Helpful utilities (converters, viewers) to
            make learning easier.</li>
          <li><strong>Profile:</strong> Build a learning profile and track
            contributions.</li>
        </ul>

        <h2 className="lx-subtitle">Vision &amp; Mission</h2>
        <p className="lx-paragraph">
          Our mission is to create an open, trustworthy and collaborative
          learning environment. We envision a community-driven platform where
          students help each other succeed by sharing high-quality educational
          resources.
        </p>

        <h2 className="lx-subtitle">Founder</h2>
        <p className="lx-paragraph">
          Learnix was founded by Shashidhara K to empower students with a
          centralized platform for study resources. No personal sensitive
          information is shared here.
        </p>

        <h2 className="lx-subtitle">Contact &amp; Links</h2>
        <p className="lx-paragraph">
          For inquiries or partnerships, contact: <a href="mailto:learnixp@gmail.com" className="lx-link">learnixp@gmail.com</a>.
        </p>
      </main>
    </div>
  );
}
