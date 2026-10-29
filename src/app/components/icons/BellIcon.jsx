"use client";

import { cn } from "@/lib/utils";
import {
  LazyMotion,
  domMin,
  m,
  useAnimation,
  useReducedMotion,
} from "motion/react";
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
} from "react";

const BellIcon = forwardRef(
  (
    {
      onMouseEnter,
      onMouseLeave,
      className,
      size = 24,
      duration = 1,
      isAnimated = true,
      color,
      ...props
    },
    ref,
  ) => {
    const controls = useAnimation();
    const reduced = useReducedMotion();
    const isControlled = useRef(false);

    useImperativeHandle(ref, () => {
      isControlled.current = true;
      return {
        startAnimation: () =>
          reduced ? controls.start("normal") : controls.start("animate"),
        stopAnimation: () => controls.start("normal"),
      };
    });

    const handleEnter = useCallback(
      (e) => {
        if (!isAnimated || reduced) return;
        if (!isControlled.current) controls.start("animate");
        else onMouseEnter?.(e);
      },
      [controls, reduced, isAnimated, onMouseEnter],
    );

    const handleLeave = useCallback(
      (e) => {
        if (!isControlled.current) {
          controls.start("normal");
        } else {
          onMouseLeave?.(e);
        }
      },
      [controls, onMouseLeave],
    );

    const bellVariants = {
      normal: { rotate: 0 },
      animate: {
        rotate: [0, -12, 10.2, -6, 3, 0],
        transition: { duration: 1.1 * duration, ease: "easeInOut" },
      },
    };

    const clapperVariants = {
      normal: { x: 0 },
      animate: {
        x: [0, 1.7, -1.4, 0.8, -0.4, 0],
        transition: { duration: 1.1 * duration, ease: "easeInOut" },
      },
    };

    return (
      <LazyMotion features={domMin} strict>
        <m.div
          className={cn("relative inline-flex items-center justify-center", className)}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          {...props}
          style={{ color, ...props.style }}
        >
          <m.svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={controls}
            initial="normal"
            variants={bellVariants}
            style={{ transformOrigin: "top center" }}
          >
            <m.path d="M10.268 21a2 2 0 0 0 3.464 0" variants={clapperVariants} />
            <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
          </m.svg>
        </m.div>
      </LazyMotion>
    );
  },
);

BellIcon.displayName = "BellIcon";
export { BellIcon };
