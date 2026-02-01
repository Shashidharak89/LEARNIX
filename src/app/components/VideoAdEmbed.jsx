import React, { useEffect, useRef } from "react";

const VideoAdEmbed = () => {
  const adContainerRef = useRef(null);

  useEffect(() => {
    // Prevent duplicate script injection
    if (!adContainerRef.current.querySelector("script[src^='https://strong-training.com']")) {
      const script = document.createElement("script");
      script.src = "https://strong-training.com/dIm.FKzqdbGmNmvXZ/GEUr/We/m/9TuGZTUillkZPITRY/3DNOjNIK0QMAzdEOttNRjlcw2JMdjcQ/zBM_ge";
      script.async = true;
      adContainerRef.current.appendChild(script);
    }
  }, []);

  return (
    <div
      ref={adContainerRef}
      style={{
        width: "100%",
        maxWidth: 600,
        margin: "24px auto",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "none",
        borderRadius: 8,
        overflow: "hidden"
      }}
    >
      {/* Video ad will be injected here. If no ad, this remains empty. */}
    </div>
  );
};

export default VideoAdEmbed;
