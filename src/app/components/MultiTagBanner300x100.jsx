"use client";
import React, { useEffect, useRef } from "react";

const MultiTagBanner300x100 = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current && !containerRef.current.querySelector('script[data-multitag-banner]')) {
      const script = document.createElement('script');
      script.src = "//reliablerelative.com/bwXeV-s.dtG/lp0/Y/WLcG/OenmW9-urZxUHlfk/PYTSYJ3hNbjhIb0LNfj/A/tBNLjCcA2dMZjxQx2tM/Qv";
      script.async = true;
      script.referrerPolicy = 'no-referrer-when-downgrade';
      script.setAttribute('data-multitag-banner', 'true');
      containerRef.current.appendChild(script);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: 300, height: 100, margin: "24px auto", display: "flex", justifyContent: "center", alignItems: "center" }}
    >
      {/* Banner ad will be injected here */}
    </div>
  );
};

export default MultiTagBanner300x100;
