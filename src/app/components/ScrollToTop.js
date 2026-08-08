'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { FiArrowUp } from 'react-icons/fi';
import './styles/ScrollToTop.css';

export default function ScrollToTop() {
  const pathname = usePathname();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const isHomePage = pathname === '/';

  useEffect(() => {
    if (!isHomePage) {
      setIsVisible(false);
      return;
    }

    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;

      if (scrollHeight > 0) {
        const progress = Math.min(1, Math.max(0, scrollTop / scrollHeight));
        setScrollProgress(progress);

        // Appears after 50% of home screen scroll
        if (progress >= 0.5) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isHomePage]);

  if (!isHomePage) return null;

  const scrollToTop = () => {
    if (typeof window !== 'undefined' && window.lenis) {
      window.lenis.scrollTo(0, {
        duration: 2.0,
        easing: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
      });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - scrollProgress * circumference;

  return (
    <button
      type="button"
      className={`learnix-scroll-to-top ${isVisible ? 'is-visible' : ''}`}
      onClick={scrollToTop}
      aria-label="Scroll to top"
    >
      <svg className="lnx-scroll-ring" width="48" height="48" viewBox="0 0 48 48">
        <circle
          className="lnx-scroll-ring-bg"
          cx="24"
          cy="24"
          r={radius}
        />
        <circle
          className="lnx-scroll-ring-indicator"
          cx="24"
          cy="24"
          r={radius}
          style={{
            strokeDasharray: `${circumference} ${circumference}`,
            strokeDashoffset: strokeDashoffset,
          }}
        />
      </svg>
      <FiArrowUp className="lnx-scroll-top-icon" />
    </button>
  );
}
