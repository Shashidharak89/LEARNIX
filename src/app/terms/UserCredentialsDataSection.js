// components/legal/UserCredentialsDataSection.js

import React from "react";

export default function UserCredentialsDataSection() {
  return (
    <section
      id="user-credentials-data"
      className="space-y-4"
    >
      <h2 className="text-xl font-semibold">
        User Credentials Information
      </h2>

      <p className="text-gray-700">
        When registering on Learnix, we collect only the information
        necessary to create and manage your user account. This data
        is used strictly for authentication and internal account
        management purposes.
      </p>

      <ul className="list-disc pl-6 text-gray-700 space-y-1">
        <li>University Seat Number</li>
        <li>User Name</li>
        <li>Password (securely hashed before storage)</li>
        <li>Account registration date</li>
        <li>Last account update timestamp</li>
      </ul>

      <p className="text-gray-700">
        Your password is never stored in plain text. It is securely
        hashed using industry-standard methods before being saved
        in our database.
      </p>

      <p className="text-gray-700">
        We do not sell, trade, or share your personal or credential
        data with any third parties. All collected information is
        stored internally and used solely to provide access to
        Learnix services.
      </p>
    </section>
  );
}
