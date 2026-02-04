// components/legal/SavedContentLocalStorageSection.js

import React from "react";
import { FiBookmark } from "react-icons/fi";

export default function SavedContentLocalStorageSection() {
  return (
    <section
      id="saved-content-local-storage"
      className="tp-card"
      aria-labelledby="tp-saved"
    >
      <div className="tp-section-header">
        <FiBookmark className="tp-section-icon" />
        <h2 id="tp-saved" className="tp-subtitle">
          Saved Content and Local Storage
        </h2>
      </div>

      <p className="tp-plain">
        Learnix allows users to save uploaded subjects, topics, or
        files for easier access at a later time. This saved content
        feature is handled locally within your browser.
      </p>

      <p className="tp-plain">
        When you save content, information related to that content is
        stored in your browser&apos;s local storage. This data remains on
        your device and is not transmitted to or stored on our
        servers.
      </p>

      <p className="tp-plain">
        Saved content stored in local storage will remain available
        unless you manually choose to unsave the content, clear your
        browser data, or uninstall the browser or application.
      </p>

      <p className="tp-plain">
        You have full control over locally saved content and may
        remove it at any time through the platform&apos;s interface or
        your browser settings.
      </p>
    </section>
  );
}
