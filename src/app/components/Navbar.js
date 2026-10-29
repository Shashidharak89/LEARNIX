"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import axios from "axios";
import { FiMenu, FiX } from "react-icons/fi";
import "./styles/Navbar.css";
import { verifyTokenAndSyncAuth, signOutFromBrowser } from "@/lib/clientAuth";

import NavbarSearch from "./NavbarSearch";
import AppSidebar from "./AppSidebar";

function NavbarSearchParamsWrapper({ children }) {
  const searchParams = useSearchParams();
  return children(searchParams);
}

const NavbarContent = ({ searchParams }) => {
  const pathname = usePathname();

  const getLoginHref = () => {
    if (!pathname || pathname === "/login" || pathname === "/signup") return "/login";
    const queryString = searchParams?.toString();
    const full = pathname + (queryString ? `?${queryString}` : "");
    return `/login?redirect=${encodeURIComponent(full)}`;
  };

  useEffect(() => {
    if (typeof window !== "undefined" && pathname && pathname !== "/login" && pathname !== "/signup") {
      const queryString = searchParams?.toString();
      const full = pathname + (queryString ? `?${queryString}` : "");
      window.sessionStorage.setItem("learnix_last_page", full);
    }
  }, [pathname, searchParams]);

  const [isOpen, setIsOpen] = useState(false);
  const [hasUSN, setHasUSN] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [navHidden, setNavHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    // verify token and sync local auth state on page load/refresh
    verifyTokenAndSyncAuth({ redirectOnFailure: false }).finally(() => {
      const storedUsn = localStorage.getItem("usn");
      setHasUSN(!!storedUsn);
      setUserRole(localStorage.getItem("role") || "");
    });

    // keep hasUSN in sync if localStorage changes in other tabs
    const onStorage = (e) => {
      if (e.key === "usn") {
        setHasUSN(!!e.newValue);
      }
      if (e.key === "role") {
        setUserRole(e.newValue || "");
      }
    };

    const onAuthSynced = (e) => {
      const syncedUsn = e?.detail?.user?.usn || localStorage.getItem("usn");
      const syncedRole = e?.detail?.user?.role || localStorage.getItem("role") || "";
      setHasUSN(!!syncedUsn);
      setUserRole(syncedRole);
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("learnix:auth-synced", onAuthSynced);

    // ---------- aligned interval logic ----------
    let intervalId = null;
    let timeoutId = null;
    let stopped = false;

    const sendActive = async () => {
      try {
        const currentUsn = localStorage.getItem("usn");
        if (!currentUsn) return; // don't call if not logged in
        await axios.post("/api/user/active", { usn: currentUsn });
      } catch (error) {
        console.error("Failed to update active time:", error);
      }
    };

    const startAligned = () => {
      // clear previous timers if any
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);

      // calculate ms until next full minute (:00)
      const now = new Date();
      const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

      // wait until the next minute boundary, then send and schedule every 60s
      timeoutId = setTimeout(async () => {
        if (stopped) return;
        await sendActive(); // fire exactly at :00
        intervalId = setInterval(sendActive, 60000); // thereafter every 60s
      }, msUntilNextMinute);
    };

    // visibility handling: pause when hidden to avoid wasted calls
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        stopped = true;
        if (timeoutId) clearTimeout(timeoutId);
        if (intervalId) clearInterval(intervalId);
        timeoutId = null;
        intervalId = null;
      } else {
        stopped = false;
        startAligned();
      }
    };

    // start aligned interval only if user exists now OR start anyway (it will early-return if no usn)
    startAligned();
    document.addEventListener("visibilitychange", handleVisibility);

    // cleanup on unmount
    return () => {
      stopped = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("learnix:auth-synced", onAuthSynced);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      if (currentY <= 0) {
        // at the very top — always show
        setNavHidden(false);
      } else if (currentY > lastScrollY.current + 4) {
        // scrolling down by more than 4px — hide
        setNavHidden(true);
        if (isOpen) setIsOpen(false);
      } else if (currentY < lastScrollY.current - 4) {
        // scrolling up by more than 4px — show
        setNavHidden(false);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isOpen]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  const handleSignout = () => {
    signOutFromBrowser("You have been signed out.");
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && isOpen) {
        closeSidebar();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (pathname?.startsWith("/learnix-code") || pathname?.startsWith("/test")) {
    return null;
  }

  return (
    <>
      {/* Main Navbar */}
      <nav className={`learnix-navbar-container${navHidden ? " navbar--hidden" : ""}`}>
        {/* Logo */}
        <div className="learnix-navbar-brand">
          <Link href="/" className="learnix-logo-link">
            <Image
              src="https://res.cloudinary.com/ddycnd409/image/upload/v1758341529/Picsart_25-09-18_21-28-57-720-removebg-preview_hjouiw.png"
              alt="Learnix Logo"
              width={500}
              height={171}
              className="learnix-logo-image"
              priority
            />
          </Link>
        </div>

        {/* Right Section - Search & Menu Toggle */}
        <div className="learnix-navbar-right">
          {/* Always-Available Navbar Search */}
          <NavbarSearch />

          {/* Menu Toggle Button */}
          <button
            className="learnix-menu-toggle-btn"
            onClick={toggleSidebar}
            aria-label="Toggle navigation menu"
            aria-expanded={isOpen}
          >
            <span className="learnix-menu-icon">
              {isOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </span>
          </button>
        </div>
      </nav>

      {/* App Sidebar */}
      <AppSidebar
        isOpen={isOpen}
        onClose={closeSidebar}
        hasUSN={hasUSN}
        userRole={userRole}
        getLoginHref={getLoginHref}
        handleSignout={handleSignout}
      />
    </>
  );
};

export const Navbar = () => {
  return (
    <Suspense fallback={<NavbarContent searchParams={null} />}>
      <NavbarSearchParamsWrapper>
        {(searchParams) => <NavbarContent searchParams={searchParams} />}
      </NavbarSearchParamsWrapper>
    </Suspense>
  );
};
