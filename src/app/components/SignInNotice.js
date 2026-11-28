import Link from "next/link";
import { FiAlertTriangle, FiLogIn } from "react-icons/fi";
import "./styles/SignInNotice.css";

export default function SignInNotice({ message, redirectTo = "/workspace", className = "" }) {
  const safeRedirect = redirectTo.startsWith("/") ? redirectTo : "/workspace";

  return (
    <aside className={`learnix-signin-notice ${className}`.trim()} aria-label="Sign-in required notice">
      <span className="learnix-signin-notice-icon" aria-hidden="true">
        <FiAlertTriangle size={19} />
      </span>
      <p>
        <strong>Sign-in required.</strong> {message}
      </p>
      <Link
        href={`/login?redirect=${encodeURIComponent(safeRedirect)}`}
        className="learnix-signin-notice-link"
        aria-label="Sign in to Learnix"
        title="Sign in"
      >
        <FiLogIn size={17} aria-hidden="true" />
        <span>Sign in</span>
      </Link>
    </aside>
  );
}
