"use client";

import { useRef } from "react";

export function useKeepIcon() {
  const ref = useRef(null);
  const start = () => {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      ref.current?.startAnimation?.();
    }
  };
  const stop = () => ref.current?.stopAnimation?.();
  return { ref, events: { onMouseEnter: start, onMouseLeave: stop, onFocus: start, onBlur: stop } };
}

export function KeepButton({ icon: Icon, children, ...props }) {
  const { ref, events } = useKeepIcon();
  return (
    <button type="button" {...events} {...props}>
      <Icon ref={ref} size={17} aria-hidden="true" />
      {children}
    </button>
  );
}
