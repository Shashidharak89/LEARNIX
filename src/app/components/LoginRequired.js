"use client";

import Link from "next/link";
import { FiLogIn } from "react-icons/fi";
import "./styles/LoginRequired.css";

export default function LoginRequired() {
  return (
    <div className="learnix-login-required">
      <h1 className="learnix-login-required-title">Login Required</h1>
      <p className="learnix-login-required-subtitle">
        Please login to access the upload section.
      </p>
      <Link href="/login" className="learnix-login-required-btn">
        <FiLogIn size={18} />
        <span>Login</span>
      </Link>
    </div>
  );
}
