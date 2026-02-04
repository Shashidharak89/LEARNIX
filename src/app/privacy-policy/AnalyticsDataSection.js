import React from 'react';
import { FiBarChart2 } from 'react-icons/fi';

export default function AnalyticsDataSection() {
  return (
    <section
      id="analytics-data"
      className="tp-card"
      aria-labelledby="tp-analytics"
    >
      <div className="tp-section-header">
        <FiBarChart2 className="tp-section-icon" />
        <h2 id="tp-analytics" className="tp-subtitle">
          Analytics and Usage Data
        </h2>
      </div>

      <p className="tp-plain">
        We use Google Analytics to track website traffic and user interactions in order to understand usage patterns and improve our services. Google Analytics collects information such as your IP address, browser type, pages visited, and time spent on pages.
      </p>

      <p className="tp-plain">
        This data is aggregated and does not personally identify you. For more details on how Google handles collected data, please refer to{" "}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="tp-link">
          Google&apos;s Privacy Policy
        </a>.
      </p>

      <p className="tp-plain">
        If you wish to opt out of Google Analytics tracking, you can use the{" "}
        <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="tp-link">
          Google Analytics Opt-out Browser Add-on
        </a>.
      </p>
    </section>
  );
}
