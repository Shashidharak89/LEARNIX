"use client";
import React, { useEffect, useRef } from "react";

const MultiTagBanner300x250 = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current && !containerRef.current.querySelector('script[data-multitag-banner-300x250]')) {
      const script = document.createElement('script');
      script.src = "//reliablerelative.com/biX.Ves/dPG/ld0AYrW/cj/weomF9-ucZUU-lakSPhT/YV3mNIjJIf0ENkjeMftnNbj/cm2_M/jQQ/2DNEAs";
      script.async = true;
      script.referrerPolicy = 'no-referrer-when-downgrade';
      script.setAttribute('data-multitag-banner-300x250', 'true');
      containerRef.current.appendChild(script);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: 300, height: 250, margin: "24px auto", display: "flex", justifyContent: "center", alignItems: "center" }}
    >
      {/* Banner ad will be injected here */}
    </div>
  );
};

export default MultiTagBanner300x250;
