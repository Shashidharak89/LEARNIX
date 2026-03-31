// Portal.jsx
// Renders children directly into document.body, escaping any
// parent overflow / transform / stacking-context restrictions.

"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function Portal({ children }) {
  const [el] = useState(() => {
    if (typeof document === "undefined") return null;
    return document.createElement("div");
  });

  useEffect(() => {
    if (!el || typeof document === "undefined") return;
    document.body.appendChild(el);
    return () => {
      document.body.removeChild(el);
    };
  }, [el]);

  if (!el) return null;
  return createPortal(children, el);
}