"use client";

import Link from "next/link";
import ImageContainer from "./ImageContainer";
import { HELP_QUICK_LINKS } from "./helpData";
import "./styles/FeatureGrid.css";
import "./styles/HelpLinks.css";

export default function HelpQuickLinks() {
  return (
    <div className="feature-grid">
      {HELP_QUICK_LINKS.map((link) => (
        <Link key={link.href} href={link.href} className="feature-card help-links-card">
          <ImageContainer
            src={link.image}
            alt={link.title}
            containerClass="feature-image-container"
            className="feature-image"
            sizes="(max-width: 768px) 90vw, 300px"
          />
          <h4>{link.title}</h4>
          <p>{link.description}</p>
          <span className="help-links-more">View more →</span>
        </Link>
      ))}
    </div>
  );
}
