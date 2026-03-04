import Link from "next/link";
import { Navbar } from "./components/Navbar";
import "./not-found.css";

export const metadata = {
  title: "404 – Page Not Found | Learnix",
  description: "The page you're looking for doesn't exist.",
};

export default function NotFound() {
  return (
    <>
      <Navbar />
      <div className="nf-wrapper">
        {/* Floating blobs */}
        <div className="nf-blob nf-blob-1" />
        <div className="nf-blob nf-blob-2" />
        <div className="nf-blob nf-blob-3" />

        <div className="nf-card">
          {/* Big 404 number */}
          <div className="nf-code-wrap">
            <span className="nf-digit nf-digit-4a">4</span>
            <div className="nf-zero-wrap">
              <div className="nf-zero-ring" />
              <span className="nf-digit nf-digit-0">0</span>
            </div>
            <span className="nf-digit nf-digit-4b">4</span>
          </div>

          {/* Icon */}
          <div className="nf-icon-wrap">
            <svg className="nf-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
              <path d="M11 8v3M11 14h.01" />
            </svg>
          </div>

          <h1 className="nf-title">Page Not Found</h1>
          <p className="nf-desc">
            Oops! The page you're looking for doesn't exist or has been moved.<br />
            Let's get you back on track.
          </p>

          {/* Actions */}
          <div className="nf-actions">
            <Link href="/" className="nf-btn nf-btn-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
                <path d="M3 12L12 3l9 9" /><path d="M9 21V12h6v9" /><path d="M3 12v9h18v-9" />
              </svg>
              Go to Home
            </Link>
            <Link href="/learn" className="nf-btn nf-btn-secondary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
              Browse Learn
            </Link>
          </div>

          {/* Divider hint */}
          <p className="nf-hint">
            Error code <span className="nf-hint-code">404</span> · Page not found
          </p>
        </div>
      </div>
    </>
  );
}
