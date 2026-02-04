import React from 'react';
import { FiShield } from 'react-icons/fi';

export default function ContentControlSection() {
  return (
    <section
      id="content-control"
      className="tp-card"
      aria-labelledby="tp-content-control"
    >
      <div className="tp-section-header">
        <FiShield className="tp-section-icon" />
        <h2 id="tp-content-control" className="tp-subtitle">
          Content Deletion and Access Control
        </h2>
      </div>

      <p className="tp-plain">
        Any content you upload to Learnix is under your control. As the uploader, you have the ability to delete your content at any time through your account interface. Once deleted, the content will no longer be accessible to you or other users.
      </p>

      <p className="tp-plain">
        Access to your uploaded content is restricted. Only you, as the uploader, and authorized administrators have access to manage or view the content. Other users cannot access or delete your content.
      </p>

      <p className="tp-plain">
        Please note that administrative access is limited to necessary support and moderation purposes only.
      </p>
    </section>
  );
}
