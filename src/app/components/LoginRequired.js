"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiLogIn } from "react-icons/fi";
import "./styles/LoginRequired.css";

export default function LoginRequired() {
  const pathname = usePathname();
  const loginHref = pathname && pathname !== "/login" ? `/login?redirect=${encodeURIComponent(pathname)}` : "/login";

  return (
    <div className="learnix-login-required">
      <h1 className="learnix-login-required-title">Login Required</h1>
      <p className="learnix-login-required-subtitle">
        Please login to access this section.
      </p>
      <Link href={loginHref} className="learnix-login-required-btn">
        <FiLogIn size={18} />
        <span>Login</span>
      </Link>
    </div>
  );
}
