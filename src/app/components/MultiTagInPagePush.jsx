"use client";
import { useEffect, useRef } from "react";

export default function MultiTagInPagePush() {
  const adRef = useRef(null);

  useEffect(() => {
    if (!adRef.current) return;
    const script = document.createElement("script");
    script.src = "//reliablerelative.com/b-X/VOs.dVGZlz0/YWWScl/aeAmg9/u_ZbUll/k_PnTcY/3ONBjyIB0kNbj/cgtFNxjJcQ2/Mrj/QX2OOvAe";
    script.async = true;
    script.referrerPolicy = "no-referrer-when-downgrade";
    // Optional: add settings if needed
    script.settings = {};
    adRef.current.appendChild(script);
  }, []);

  return (
    <div style={{ width: "100%", minHeight: 100 }}>
      <div ref={adRef} />
    </div>
  );
}
