// app/components/Footer.jsx
"use client";

import Link from "next/link";
import { MdEmail } from "react-icons/md";
import { FaInstagram, FaHeart } from "react-icons/fa";
import "./styles/Footer.css";

export default function Footer() {
  return (
    <footer className="learnix-main-footer">
      <div className="learnix-footer-container">
        {/* About Section */}
        <div className="learnix-footer-section">
          <h3 className="learnix-footer-title">About LEARNIX</h3>
          <p className="learnix-footer-description">
            A collaborative platform designed for students to 
            share learning resources among Students. Built to make 
            academic collaboration easier and more accessible.
          </p>
          <div className="learnix-footer-website">
            <span className="learnix-website-label">Visit:</span>
            <a 
              href="https://learnix.dev" 
              target="_blank" 
              rel="noopener noreferrer"
              className="learnix-website-link"
            >
              learnix.dev
            </a>
          </div>
        </div>

        {/* Contact & Links Section */}
        <div className="learnix-footer-section">
          <h3 className="learnix-footer-title">Get in Touch</h3>
          <div className="learnix-contact-info">
            <div className="learnix-contact-item">
              <MdEmail className="learnix-contact-icon" />
              <a 
                href="mailto:learnixp@gmail.com" 
                className="learnix-contact-link"
              >
                learnixp@gmail.com
              </a>
            </div>
            <div className="learnix-contact-item">
              <FaInstagram className="learnix-contact-icon" />
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

        {/* Quick Links Section */}
        <div className="learnix-footer-section">
          <h3 className="learnix-footer-title">Quick Links</h3>
          <ul className="learnix-footer-links">
            <li><Link href="/about">About</Link></li>
            <li><Link href="/articles">Articles</Link></li>
            <li><Link href="/privacy-policy">Privacy Policy</Link></li>
            <li><Link href="/terms">Terms &amp; Conditions</Link></li>
            <li><Link href="/disclaimer">Disclaimer</Link></li>
            <li><Link href="/help">Help / FAQ</Link></li>
            <li><Link href="/report-content">Report Content</Link></li>
            <li><a href="mailto:learnixp@gmail.com">Contact</a></li>
          </ul>
        </div>


      </div>

      {/* Bottom Bar */}
      <div className="learnix-footer-bottom">
        <div className="learnix-footer-bottom-container">
          <div className="learnix-copyright">
            © {new Date().getFullYear()} LEARNIX. Crafted for curious minds.
          </div>
          <div className="learnix-creator">
            Made with <FaHeart className="learnix-heart-icon" /> by{" "}
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