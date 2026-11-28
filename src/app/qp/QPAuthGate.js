"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LockIcon } from "@animateicons/react/lucide";
import { verifyTokenAndSyncAuth } from "@/lib/clientAuth";
import QPSkeletonLoader from "./QPSkeletonLoader";
import "../resources/[id]/styles/WorkTopicPage.css";

export default function QPAuthGate({ children }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [authReady, setAuthReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let mounted = true;
    const checkAuth = async () => {
      try {
        const user = await verifyTokenAndSyncAuth();
        if (mounted) {
          setIsLoggedIn(Boolean(user));
          setAuthReady(true);
        }
      } catch {
        if (mounted) {
          setIsLoggedIn(false);
          setAuthReady(true);
        }
      }
    };

    checkAuth();
    window.addEventListener("storage", checkAuth);
    window.addEventListener("learnix:auth-synced", checkAuth);
    return () => {
      mounted = false;
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("learnix:auth-synced", checkAuth);
    };
  }, []);

  if (!authReady) {
    return <QPSkeletonLoader />;
  }

  if (!isLoggedIn) {
    const query = searchParams?.toString();
    const redirectPath = query ? `${pathname}?${query}` : pathname || "/qp";

    return (
      <div className="wtp-locked-shell">
        <QPSkeletonLoader />
        <div className="wtp-locked-overlay" role="dialog" aria-labelledby="qp-login-title">
          <section className="wtp-access-card wtp-access-card--apple">
            <span className="wtp-access-icon" aria-hidden="true">
              <LockIcon size={23} />
            </span>
            <p className="wtp-access-eyebrow">QUESTION PAPER ACCESS</p>
            <h1 id="qp-login-title">Login required</h1>
            <p className="wtp-access-copy">
              Please log in to view and download this question paper.
            </p>
            <Link
              href={`/login?redirect=${encodeURIComponent(redirectPath)}`}
              className="wtp-access-action"
            >
              Log in or register
            </Link>
          </section>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

