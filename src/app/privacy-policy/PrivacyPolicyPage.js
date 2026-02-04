import "./styles/PrivacyPolicyPage.css";

export default function PrivacyPolicyPage() {
  return (
    <div className="privacy-page-container">
      <main className="privacy-main">
        <h1 className="privacy-title">Privacy Policy</h1>
        <p className="privacy-paragraph">Last updated: February 4, 2026</p>

        <h2 className="privacy-subtitle">1. Introduction</h2>
        <p className="privacy-paragraph">
          Learnix (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting the
          privacy of our users. This Privacy Policy describes what information we collect,
          how we use it, and the choices you have regarding your information.
        </p>

        <h2 className="privacy-subtitle">2. Data We Collect</h2>
        <p className="privacy-paragraph">We collect the following types of information:</p>
        <ul className="privacy-list">
          <li>
            <strong>Account Information:</strong> Email, name and any profile
            fields provided during registration.
          </li>
          <li>
            <strong>Uploads &amp; Profile Data:</strong> Files, study materials,
            profile images and other content you upload.
          </li>
          <li>
            <strong>Usage Data:</strong> Logs, IP addresses, device and browser
            information, pages visited, and analytics.
          </li>
        </ul>

        <h2 className="privacy-subtitle">3. How Cookies Are Used</h2>
        <p className="privacy-paragraph">
          We use cookies to provide, protect and improve our services. Cookies
          remember preferences, support login sessions, and enable analytics.
          You can control cookies via browser settings.
        </p>

        <h2 className="privacy-subtitle">4. Google AdSense &amp; Third-Party Tracking</h2>
        <p className="privacy-paragraph">
          Learnix may display ads served by Google AdSense and other ad services.
          These partners may use cookies to show personalized ads. Learn more at{" "}
          <a
            href="https://policies.google.com/technologies/ads"
            className="privacy-link"
          >
            Google Ads
          </a>.
        </p>

        <h2 className="privacy-subtitle">5. Data Storage and Security</h2>
        <p className="privacy-paragraph">
          User-uploaded content is stored on cloud providers. We use reasonable
          safeguards to protect your data, but no method is fully secure. For
          security concerns, contact{" "}
          <a href="mailto:learnixp@gmail.com" className="privacy-link">
            learnixp@gmail.com
          </a>.
        </p>

        <h2 className="privacy-subtitle">6. User Rights</h2>
        <p className="privacy-paragraph">
          You may request access to, correction of, or deletion of your data by
          emailing{" "}
          <a href="mailto:learnixp@gmail.com" className="privacy-link">
            learnixp@gmail.com
          </a>.
        </p>

        <h2 className="privacy-subtitle">7. Contact</h2>
        <p className="privacy-paragraph">
          For any privacy-related questions, contact{" "}
          <a href="mailto:learnixp@gmail.com" className="privacy-link">
            learnixp@gmail.com
          </a>.
        </p>
      </main>
    </div>
  );
}
