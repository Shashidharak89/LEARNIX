import Footer from "../components/Footer";
import { Navbar } from "../components/Navbar";

export default function PrivacyPolicyPage() {
  return (
    <div>
      <Navbar />
      <main style={{ maxWidth: 980, margin: "24px auto", padding: "0 16px" }}>
        <h1>Privacy Policy</h1>
        <p>Last updated: December 3, 2025</p>

        <h2>1. Introduction</h2>
        <p>
          Learnix ("we", "us", "our") is committed to protecting the privacy of
          our users. This Privacy Policy describes what information we collect,
          how we use it, and the choices you have regarding your information.
        </p>

        <h2>2. Data We Collect</h2>
        <p>We collect the following types of information:</p>
        <ul>
          <li>
            <strong>Account Information:</strong> Email, name and any profile
            fields provided during registration.
          </li>
          <li>
            <strong>Uploads &amp; Profile Data:</strong> Files, study materials,
            profile images and other content you upload to the platform.
          </li>
          <li>
            <strong>Usage Data:</strong> Logs, IP addresses, device and browser
            information, pages visited, and analytics data.
          </li>
        </ul>

        <h2>3. How Cookies Are Used</h2>
        <p>
          We use cookies and similar technologies to provide, protect and
          improve our services. Cookies can remember preferences, support
          login sessions, and enable analytics. You can control cookies via
          your browser settings, though some features may be impacted if
          cookies are disabled.
        </p>

        <h2>4. Google AdSense &amp; Third-Party Tracking</h2>
        <p>
          Learnix may display ads served by Google AdSense and other ad
          networks. These services and their partners may use cookies to show
          ads tailored to your interests. Third-party services may collect
          information about your visits to this site and other websites to
          provide advertising about goods and services that may interest you.
          For information about Google Ads privacy practices, visit
          <a href="https://policies.google.com/technologies/ads">Google Ads</a>.
        </p>

        <h2>5. Data Storage and Security</h2>
        <p>
          User-uploaded files and profile data are stored on cloud storage
          providers. We use reasonable administrative, technical and physical
          safeguards to protect your data. However, no internet transmission
          or storage is completely secure. If you discover a security issue,
          please contact us at <a href="mailto:learnixp@gmail.com">learnixp@gmail.com</a>.
        </p>

        <h2>6. User Rights</h2>
        <p>
          You may request access to, correction of, or deletion of your
          personal data. To request account data export or deletion, email
          <a href="mailto:learnixp@gmail.com">learnixp@gmail.com</a> and include
          the email address associated with your account. We will respond in
          a timely manner and in accordance with applicable law.
        </p>

        <h2>7. Contact</h2>
        <p>
          If you have questions about this Privacy Policy or our data
          practices, please contact us at <a href="mailto:learnixp@gmail.com">learnixp@gmail.com</a>.
        </p>
      </main>
      <Footer />
    </div>
  );
}
