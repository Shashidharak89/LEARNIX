import React from "react";
import "./styles/DisclaimerPage.css";

export default function DisclaimerPage() {
  return (
    <div className="disclaimer-page-container">

      <main className="main-content">
        <h1 className="title">Disclaimer</h1>

        <h2 className="subtitle">Accuracy of Content</h2>
        <p className="paragraph">
          Learnix is a platform for sharing educational materials provided by
          users. While we aim to make the site useful, we do not guarantee the
          accuracy, completeness, or reliability of user-uploaded materials.
        </p>

        <h2 className="subtitle">Ownership</h2>
        <p className="paragraph">
          Uploaded content remains the property of the users who posted it. We
          do not claim ownership of user materials and are not responsible for
          their content.
        </p>

        <h2 className="subtitle">Educational Purpose Only</h2>
        <p className="paragraph">
          Materials on Learnix are provided for educational purposes only and
          should not be relied on as professional advice. Always verify
          important information from authoritative sources.
        </p>

        <h2 className="subtitle">No Liability</h2>
        <p className="paragraph">
          Learnix is not liable for any losses, damages or harms resulting
          from use or misuse of the platform or its content. Use materials at
          your own risk.
        </p>

        <h2 className="subtitle">Contact</h2>
        <p className="paragraph">
          For concerns about content or this disclaimer, contact{" "}
          <a href="mailto:learnixp@gmail.com" className="link">
            learnixp@gmail.com
          </a>.
        </p>
      </main>
     
    </div>
  );
}
