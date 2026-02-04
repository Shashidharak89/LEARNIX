// components/legal/SavedContentLocalStorageSection.js

import React from "react";

export default function SavedContentLocalStorageSection() {
  return (
    <section
      id="saved-content-local-storage"
      className="space-y-4"
    >
      <h2 className="text-xl font-semibold">
        Saved Content and Local Storage
      </h2>

      <p className="text-gray-700">
        Learnix allows users to save uploaded subjects, topics, or
        files for easier access at a later time. This saved content
        feature is handled locally within your browser.
      </p>

      <p className="text-gray-700">
        When you save content, information related to that content is
        stored in your browser’s local storage. This data remains on
        your device and is not transmitted to or stored on our
        servers.
      </p>

      <p className="text-gray-700">
        Saved content stored in local storage will remain available
        unless you manually choose to unsave the content, clear your
        browser data, or uninstall the browser or application.
      </p>

      <p className="text-gray-700">
        You have full control over locally saved content and may
        remove it at any time through the platform’s interface or
        your browser settings.
      </p>
    </section>
  );
}
