import React from "react";
import { FiShield } from "react-icons/fi"; // example icon from react-icons
import "./styles/TermsPage.css";

export default function TermsPage() {
  return (
    <div className="tp-page-container">
      <header className="tp-header" aria-hidden>
        <FiShield className="tp-header-icon" />
      </header>

      <main className="tp-main" role="main">
        <section className="tp-card tp-intro" aria-labelledby="tp-title">
          <h1 id="tp-title" className="tp-title">Terms &amp; Conditions</h1>
          <p className="tp-plain">
            By using Learnix you agree to these Terms &amp; Conditions. Please read them carefully.
          </p>
        </section>

        <section className="tp-card" aria-labelledby="tp-accept">
          <h2 id="tp-accept" className="tp-subtitle">Acceptance of Terms</h2>
          <p className="tp-plain">
            By using Learnix, you agree to these Terms &amp; Conditions. If you do not agree, please do not use the site.
          </p>
        </section>

        <section className="tp-card" aria-labelledby="tp-use">
          <h2 id="tp-use" className="tp-subtitle">Use of the Platform</h2>
          <p className="tp-plain">
            Learnix provides a platform for sharing study materials and learning resources. You agree to use the platform lawfully and respectfully.
          </p>
        </section>

        <section className="tp-card" aria-labelledby="tp-upload">
          <h2 id="tp-upload" className="tp-subtitle">Uploading Materials</h2>
          <p className="tp-plain">
            When you upload materials you are responsible for ensuring you have the rights to share them. Do not upload copyrighted content unless you have permission.
          </p>
        </section>

        <section className="tp-card" aria-labelledby="tp-copyright">
          <h2 id="tp-copyright" className="tp-subtitle">Copyright Responsibility</h2>
          <p className="tp-plain">
            Users retain ownership of their uploads. By uploading you grant Learnix a license to host and display the material. If you believe content infringes your rights, follow the Report Content process.
          </p>
        </section>

        <section className="tp-card" aria-labelledby="tp-forbidden">
          <h2 id="tp-forbidden" className="tp-subtitle">Forbidden Content</h2>
          <p className="tp-plain">
            The following content is prohibited: pirated materials, adult content, hate speech, abusive content, content facilitating illegal activity, or any material that violates local law.
          </p>
        </section>

        <section className="tp-card" aria-labelledby="tp-suspend">
          <h2 id="tp-suspend" className="tp-subtitle">Account Suspension</h2>
          <p className="tp-plain">
            Accounts that violate these terms may be suspended or terminated. Suspensions may occur with or without prior notice depending on severity.
          </p>
        </section>

        <section className="tp-card" aria-labelledby="tp-disclaimer">
          <h2 id="tp-disclaimer" className="tp-subtitle">Disclaimer of Liability</h2>
          <p className="tp-plain">
            Learnix is provided "as is". We are not responsible for user-uploaded content, its accuracy, or for losses arising from use of the platform. See our Disclaimer page for details.
          </p>
        </section>

        <section className="tp-card" aria-labelledby="tp-law">
          <h2 id="tp-law" className="tp-subtitle">Governing Law</h2>
          <p className="tp-plain">
            These Terms are governed by applicable laws of the jurisdiction where Learnix operates. Disputes will be handled according to local law.
          </p>
        </section>

        <section className="tp-card tp-contact" aria-labelledby="tp-contact">
          <h2 id="tp-contact" className="tp-subtitle">Contact</h2>
          <p className="tp-plain">
            For questions about these Terms, contact{" "}
            <a className="tp-link" href="mailto:learnixp@gmail.com">learnixp@gmail.com</a>.
          </p>
        </section>
      </main>

      <footer className="tp-footer" aria-hidden>
        <small className="tp-footnote">© Learnix — Terms last updated: December 3, 2025</small>
      </footer>
    </div>
  );
}
