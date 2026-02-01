"use client";
import React, { useRef, useEffect } from "react";

// VAST tag URL for zone #6762458
const VAST_TAG_URL = "https://strong-training.com/d/mJFjz.dAGiNOvTZ/GeUw/YefmQ9LuXZxUslJkuPbTpYr3oNsjxI/0/NLTeggt/N/jvcL2MMkj/Q/1/OrS/ZzsUaIW-1/padNDw0dxu";

const VastVideoPlayer = () => {
  const videoRef = useRef(null);

  useEffect(() => {
    // Dynamically load the videojs and contrib-ads/vast plugins
    const loadPlayer = async () => {
      if (typeof window !== "undefined") {
        await import("video.js/dist/video-js.css");
        const videojs = (await import("video.js")).default;
        await import("videojs-contrib-ads");
        await import("videojs-ima");
        const player = videojs(videoRef.current, {
          controls: true,
          preload: "auto",
          width: 640,
          height: 360,
          autoplay: true,
          muted: true,
        });
        player.ima({
          adTagUrl: VAST_TAG_URL,
          debug: true,
        });
        player.src({
          src: "https://www.w3schools.com/html/mov_bbb.mp4",
          type: "video/mp4",
        });
        player.ready(() => {
          player.ima.initializeAdDisplayContainer();
          // Try to autoplay
          player.muted(true);
          player.play().catch(() => {});
        });
      }
    };
    loadPlayer();
    // Cleanup
    return () => {
      if (window.videojs && videoRef.current) {
        try {
          window.videojs(videoRef.current).dispose();
        } catch {}
      }
    };
  }, []);

  return (
    <div style={{ width: "100%", maxWidth: 640, margin: "24px auto" }}>
      <video
        ref={videoRef}
        className="video-js vjs-default-skin"
        controls
        preload="auto"
        width="640"
        height="360"
        autoPlay
        muted
      />
    </div>
  );
};

export default VastVideoPlayer;
