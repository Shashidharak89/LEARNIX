'use client';

import { useEffect, useRef } from 'react';
import './AdsterraNativeBanner.css';

const AdsterraNativeBanner = () => {
  const adContainerRef = useRef(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    // Prevent loading script multiple times
    if (scriptLoaded.current) return;
    
    const container = adContainerRef.current;
    if (!container) return;

    // Create and append the script
    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.src = 'https://pl28357364.effectivegatecpm.com/3f48fa797cccfd84ac5eff6718e9b79d/invoke.js';
    
    container.appendChild(script);
    scriptLoaded.current = true;

    return () => {
      // Cleanup on unmount
      if (container && script.parentNode === container) {
        container.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="adsterra-native-wrapper">
      <div className="adsterra-native-container" ref={adContainerRef}>
        <div id="container-3f48fa797cccfd84ac5eff6718e9b79d"></div>
      </div>
    </div>
  );
};

export default AdsterraNativeBanner;
