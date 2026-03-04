"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";

/**
 * AdminGuard — wraps any admin page child.
 * Reads role from localStorage (client-side) and calls notFound()
 * if the visitor is not an admin or superadmin, which renders
 * the app-level not-found.js (our custom 404 page).
 */
export default function AdminGuard({ children }) {
  const [status, setStatus] = useState("loading"); // "loading" | "ok" | "denied"

  useEffect(() => {
    const role = localStorage.getItem("role") || "";
    if (role === "admin" || role === "superadmin") {
      setStatus("ok");
    } else {
      setStatus("denied");
    }
  }, []);

  if (status === "loading") return null;
  if (status === "denied") return <Denied />;
  return children;
}

// Triggers Next.js not-found boundary → renders our custom 404 page
function Denied() {
  notFound();
  return null;
}
