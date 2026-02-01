"use client";
import React, { useEffect, useRef } from "react";

const VideoSliderMultiTag = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current && !containerRef.current.querySelector('script[data-videoslider-multitag]')) {
      const script = document.createElement('script');
      script.src = "//reliablerelative.com/b.XxVKsXdHGUlF0aYJWEct/be/m_9NuUZ/UXlqkrPVTAY-3SN/jIIF0jMoztMltSNJjWc/2uMijqQAzQN-Ar";
      script.async = true;
      script.referrerPolicy = 'no-referrer-when-downgrade';
      script.setAttribute('data-videoslider-multitag', 'true');
      containerRef.current.appendChild(script);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", maxWidth: 400, margin: "24px auto", minHeight: 200, display: "flex", justifyContent: "center", alignItems: "center" }}
    >
      {/* Video ad will be injected here */}
    </div>
  );
};

export default VideoSliderMultiTag;
