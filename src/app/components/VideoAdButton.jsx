import React, { useRef } from "react";

const VideoAdButton = () => {
  const adContainerRef = useRef(null);

  const handleClick = () => {
    if (!adContainerRef.current.querySelector("iframe")) {
      const script = document.createElement("script");
      script.src = "https://strong-training.com/dIm.FKzqdbGmNmvXZ/GEUr/We/m/9TuGZTUillkZPITRY/3DNOjNIK0QMAzdEOttNRjlcw2JMdjcQ/zBM_ge";
      script.async = true;
      adContainerRef.current.appendChild(script);
    }
  };

  return (
    <div style={{ width: "100%", textAlign: "center", margin: "24px 0" }}>
      <button
        onClick={handleClick}
        style={{
          padding: "12px 32px",
          fontSize: "1.1em",
          background: "#0070f3",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          marginBottom: "12px"
        }}
      >
        Click here to watch a video ad
      </button>
      <div ref={adContainerRef}></div>
    </div>
  );
};

export default VideoAdButton;
