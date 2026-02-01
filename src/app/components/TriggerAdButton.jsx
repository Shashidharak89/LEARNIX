"use client";
import React from "react";

const TriggerAdButton = () => {
  const handleClick = () => {
    if (!document.querySelector('script[data-trigger-ad]')) {
      const script = document.createElement('script');
      script.src = "//reliablerelative.com/bYXeVcs.dyGEl_0rYqW/cj/Be/mw9XuTZcUxlWkdPpT-Yj3SNfj/IP0eMGzRM/tFNojicw2/MEjYQizUNAAR";
      script.async = true;
      script.referrerPolicy = 'no-referrer-when-downgrade';
      script.setAttribute('data-trigger-ad', 'true');
      document.body.appendChild(script);
    }
  };

  return (
    <div style={{ textAlign: "center", margin: "32px 0" }}>
      <button
        onClick={handleClick}
        style={{
          padding: "12px 32px",
          fontSize: "1.1em",
          background: "#0070f3",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer"
        }}
      >
        Trigger Ad
      </button>
    </div>
  );
};

export default TriggerAdButton;
