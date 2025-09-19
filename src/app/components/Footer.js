// app/components/Footer.jsx
"use client";

import Link from "next/link";
import "./styles/Footer.css";

export default function Footer() {
  return (
    <footer className="learnix-main-footer">
      <div className="learnix-footer-container">
        {/* About Section */}
        <div className="learnix-footer-section">
          <h3 className="learnix-footer-title">About LEARNIX</h3>
          <p className="learnix-footer-description">
            A collaborative platform designed for students to share homework, 
            assignments, and learning resources among classmates. Built to make 
            academic collaboration easier and more accessible.
          </p>
          <div className="learnix-footer-website">
            <span className="learnix-website-label">Visit:</span>
            <a 
              href="https://learnix.shashi-k.in" 
              target="_blank" 
              rel="noopener noreferrer"
              className="learnix-website-link"
            >
              learnix.shashi-k.in
            </a>
          </div>
        </div>

        {/* Contact Section */}
        <div className="learnix-footer-section">
          <h3 className="learnix-footer-title">Get in Touch</h3>
          <div className="learnix-contact-info">
            <div className="learnix-contact-item">
              <span className="learnix-contact-icon">📧</span>
              <a 
                href="mailto:learnixp@gmail.com" 
                className="learnix-contact-link"
              >
                learnixp@gmail.com
              </a>
            </div>
            <div className="learnix-contact-item">
              <span className="learnix-contact-icon">📱</span>
              <a 
                href="https://instagram.com/luminous_alpha_" 
                target="_blank" 
                rel="noopener noreferrer"
                className="learnix-contact-link"
              >
                @luminous_alpha_
              </a>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        {/* <div className="learnix-footer-section">
          <h3 className="learnix-footer-title">Quick Links</h3>
          <div className="learnix-footer-links">
            <Link href="/" className="learnix-footer-nav-link">
              Home
            </Link>
            <Link href="/about" className="learnix-footer-nav-link">
              About
            </Link>
            <Link href="/contact" className="learnix-footer-nav-link">
              Contact
            </Link>
          </div> */}
        {/* </div> */}
      </div>

      {/* Bottom Bar */}
      <div className="learnix-footer-bottom">
        <div className="learnix-footer-bottom-container">
          <div className="learnix-copyright">
            © {new Date().getFullYear()} LEARNIX. Crafted for curious minds.
          </div>
          <div className="learnix-creator">
            Made with ❤️ by{" "}
            <a 
              href="https://shashi-k.in" 
              target="_blank" 
              rel="noopener noreferrer"
              className="learnix-creator-link"
            >
              Shashidhara K
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}