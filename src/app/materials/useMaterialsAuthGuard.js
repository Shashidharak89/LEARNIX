"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { verifyTokenAndSyncAuth } from "@/lib/clientAuth";

export function useMaterialsAuthGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const checkAuth = async () => {
      try {
        const user = await verifyTokenAndSyncAuth();
        if (mounted) {
          setIsLoggedIn(Boolean(user));
        }
      } catch {
        if (mounted) {
          setIsLoggedIn(false);
        }
      } finally {
        if (mounted) setAuthReady(true);
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

  const requireAuth = useCallback(
    (e) => {
      if (isLoggedIn) return true;
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      const query = searchParams?.toString();
      const redirectPath = query ? `${pathname}?${query}` : pathname || "/materials";
      router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`);
      return false;
    },
    [isLoggedIn, pathname, searchParams, router]
  );

  return { isLoggedIn, authReady, requireAuth };
}

