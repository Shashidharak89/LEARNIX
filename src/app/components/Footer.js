// app/components/Footer.jsx
"use client";

import Link from "next/link";
import "./styles/Footer.css"; // import the CSS file

export default function Footer() {
  return (
    <footer className="learnix-footer">
      <div className="footer-container">
        <p className="footer-text">
          © {new Date().getFullYear()} Learnix. All rights reserved.
        </p>
        <p className="footer-text">
          Made by{" "}
          <Link
            href="https://shashi-k.in"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            Shashidhara K
          </Link>
        </p>
      </div>
    </footer>
  );
}
