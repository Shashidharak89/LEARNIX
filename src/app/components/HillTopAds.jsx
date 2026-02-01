"use client";
import React, { useEffect } from "react";

const HillTopAds = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://wellmade-combine.com/bx3PV-0RP.3mpVvLbMmkVqJMZ_Du0x2SN-ziYbwCNfjocj0/LxTbYD3WNrjAAH2cN/zHUo";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div style={{ width: "100%", textAlign: "center", margin: "24px 0" }}>
      {/* HilltopAds Popunder will be triggered by script */}
      <span style={{ fontSize: "0.9em", color: "#888" }}>Advertisement</span>
    </div>
  );
};

export default HillTopAds;
