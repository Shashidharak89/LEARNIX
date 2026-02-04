// components/legal/UserCredentialsDataSection.js

import React from "react";
import { FiUser } from "react-icons/fi";

export default function UserCredentialsDataSection() {
  return (
    <section
      id="user-credentials-data"
      className="tp-card"
      aria-labelledby="tp-credentials"
    >
      <div className="tp-section-header">
        <FiUser className="tp-section-icon" />
        <h2 id="tp-credentials" className="tp-subtitle">
          User Credentials Information
        </h2>
      </div>

      <p className="tp-plain">
        When registering on Learnix, we collect only the information
        necessary to create and manage your user account. This data
        is used strictly for authentication and internal account
        management purposes.
      </p>

      <ul className="tp-list">
        <li>University Seat Number</li>
        <li>User Name</li>
        <li>Password (securely hashed before storage)</li>
        <li>Account registration date</li>
        <li>Last account update timestamp</li>
      </ul>

      <p className="tp-plain">
        Your password is never stored in plain text. It is securely
        hashed using industry-standard methods before being saved
        in our database.
      </p>

      <p className="tp-plain">
        We do not sell, trade, or share your personal or credential
        data with any third parties. All collected information is
        stored internally and used solely to provide access to
        Learnix services.
      </p>
    </section>
  );
}
