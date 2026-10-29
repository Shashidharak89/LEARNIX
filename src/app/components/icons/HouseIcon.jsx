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

const HouseIcon = forwardRef(
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
        if (!isControlled.current) controls.start("normal");
        else onMouseLeave?.(e);
      },
      [controls, onMouseLeave],
    );

    const houseVariants = {
      normal: { scale: 1 },
      animate: {
        scale: [1, 0.8, 1.06, 1],
        transition: {
          duration: 0.7 * duration,
          ease: "easeInOut",
          times: [0, 0.35, 0.75, 1],
        },
      },
    };

    const doorVariants = {
      normal: { strokeDashoffset: 0, opacity: 1 },
      animate: {
        strokeDashoffset: [25, 0],
        opacity: [0, 1],
        transition: {
          strokeDashoffset: {
            duration: 0.45 * duration,
            ease: "easeOut",
            delay: 0.35 * duration,
          },
          opacity: { duration: 0.25 * duration, delay: 0.35 * duration },
        },
      },
    };

    return (
      <LazyMotion features={domMin} strict>
        <m.div
          className={cn("inline-flex items-center justify-center", className)}
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
          >
            <m.g
              variants={houseVariants}
              style={{ transformBox: "view-box", originX: "12px", originY: "21px" }}
            >
              <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <m.path
                d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"
                strokeDasharray="25"
                strokeDashoffset="0"
                variants={doorVariants}
              />
            </m.g>
          </m.svg>
        </m.div>
      </LazyMotion>
    );
  },
);

HouseIcon.displayName = "HouseIcon";
export { HouseIcon };
