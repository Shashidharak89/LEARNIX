import React from "react";
import { FiLock, FiServer, FiUserCheck, FiMail, FiInfo } from "react-icons/fi";
import { BiCookie } from "react-icons/bi";
import { SiGoogleadsense } from "react-icons/si";
import "./styles/PrivacyPolicyPage.css";

export default function PrivacyPolicyPage() {
  return (
    <div className="pp-page-container">
      <header className="pp-header" aria-hidden={true}>
        <FiLock className="pp-header-icon" />
      </header>

      <main className="pp-main" role="main">
        <section className="pp-card pp-intro" aria-labelledby="pp-title">
          <h1 id="pp-title" className="pp-title">Privacy Policy</h1>
          <p className="pp-plain">
            Learnix is committed to protecting the privacy of our users. This Privacy Policy describes what information we collect, how we use it, and the choices you have regarding your information.
          </p>
          <p className="pp-meta">Last updated: February 4, 2026</p>
        </section>

        <section className="pp-card" aria-labelledby="pp-intro-section">
          <div className="pp-section-header">
            <FiInfo className="pp-section-icon" />
            <h2 id="pp-intro-section" className="pp-subtitle">Introduction</h2>
          </div>
          <p className="pp-plain">
            By using Learnix, you agree to the collection and use of information in accordance with this policy. We only collect information necessary to provide and improve our services.
          </p>
        </section>

        <section className="pp-card" aria-labelledby="pp-cookies">
          <div className="pp-section-header">
            <BiCookie className="pp-section-icon" />
            <h2 id="pp-cookies" className="pp-subtitle">How Cookies Are Used</h2>
          </div>
          <p className="pp-plain">
            We use cookies to provide, protect and improve our services. Cookies remember your preferences, support login sessions, and enable analytics.
          </p>
          <p className="pp-plain">
            You can control cookies via your browser settings. Disabling cookies may affect some features of the platform.
          </p>
        </section>

        <section className="pp-card" aria-labelledby="pp-adsense">
          <div className="pp-section-header">
            <SiGoogleadsense className="pp-section-icon" />
            <h2 id="pp-adsense" className="pp-subtitle">Google AdSense &amp; Third-Party Tracking</h2>
          </div>
          <p className="pp-plain">
            Learnix may display ads served by Google AdSense and other ad services. These partners may use cookies to show personalized ads based on your browsing behavior.
          </p>
          <p className="pp-plain">
            Learn more about Google&apos;s advertising practices at{" "}
            <a href="https://policies.google.com/technologies/ads" className="pp-link" target="_blank" rel="noopener noreferrer">
              Google Ads Policies
            </a>.
          </p>
        </section>

        <section className="pp-card" aria-labelledby="pp-storage">
          <div className="pp-section-header">
            <FiServer className="pp-section-icon" />
            <h2 id="pp-storage" className="pp-subtitle">Data Storage and Security</h2>
          </div>
          <p className="pp-plain">
            User-uploaded content is stored securely on cloud providers (Cloudinary). We use reasonable safeguards to protect your data, including encryption and secure access controls.
          </p>
          <p className="pp-plain">
            However, no method of transmission over the Internet is 100% secure. For security concerns, contact{" "}
            <a href="mailto:learnixp@gmail.com" className="pp-link">learnixp@gmail.com</a>.
          </p>
        </section>

        <section className="pp-card" aria-labelledby="pp-rights">
          <div className="pp-section-header">
            <FiUserCheck className="pp-section-icon" />
            <h2 id="pp-rights" className="pp-subtitle">Your Rights</h2>
          </div>
          <p className="pp-plain">
            You have the right to access, correct, or delete your personal data. You can manage most of your data directly through your profile settings.
          </p>
          <p className="pp-plain">
            For data requests that cannot be handled through the platform, email{" "}
            <a href="mailto:learnixp@gmail.com" className="pp-link">learnixp@gmail.com</a>.
          </p>
        </section>

        <section className="pp-card pp-contact" aria-labelledby="pp-contact">
          <div className="pp-section-header">
            <FiMail className="pp-section-icon" />
            <h2 id="pp-contact" className="pp-subtitle">Contact Us</h2>
          </div>
          <p className="pp-plain">
            For any privacy-related questions or concerns, contact us at{" "}
            <a href="mailto:learnixp@gmail.com" className="pp-link">learnixp@gmail.com</a>.
          </p>
        </section>
      </main>
    </div>
  );
}
