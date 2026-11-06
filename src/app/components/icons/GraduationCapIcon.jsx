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

export const GraduationCapIcon = forwardRef(
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
    const tasselControls = useAnimation();
    const reduced = useReducedMotion();
    const isControlled = useRef(false);

    useImperativeHandle(ref, () => {
      isControlled.current = true;
      return {
        startAnimation: () => {
          if (reduced) {
            controls.start("normal");
            tasselControls.start("normal");
          } else {
            controls.start("animate");
            tasselControls.start("animate");
          }
        },
        stopAnimation: () => {
          controls.start("normal");
          tasselControls.start("normal");
        },
      };
    });

    const handleEnter = useCallback(
      (e) => {
        if (!isAnimated || reduced) return;
        if (!isControlled.current) {
          controls.start("animate");
          tasselControls.start("animate");
        } else {
          onMouseEnter?.(e);
        }
      },
      [controls, tasselControls, reduced, isAnimated, onMouseEnter],
    );

    const handleLeave = useCallback(
      (e) => {
        if (!isControlled.current) {
          controls.start("normal");
          tasselControls.start("normal");
        } else {
          onMouseLeave?.(e);
        }
      },
      [controls, tasselControls, onMouseLeave],
    );

    const capVariants = {
      normal: { y: 0, rotate: 0 },
      animate: {
        y: [0, -3, 0],
        rotate: [0, -6, 5, -2, 0],
        transition: { duration: 0.7 * duration, ease: "easeInOut" },
      },
    };

    const tasselVariants = {
      normal: { rotate: 0 },
      animate: {
        rotate: [0, 22, -18, 12, -6, 0],
        transition: { duration: 0.8 * duration, ease: "easeInOut" },
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
            variants={capVariants}
            style={{ transformOrigin: "12px 12px" }}
          >
            {/* Cap Top Rhombus */}
            <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
            
            {/* Skullcap Underneath */}
            <path d="M6 12.5V16a6 6 0 0 0 12 0v-3.5" />

            {/* Hanging Tassel */}
            <m.path
              d="M22 10v6"
              animate={tasselControls}
              initial="normal"
              variants={tasselVariants}
              style={{ transformOrigin: "22px 10px" }}
            />
          </m.svg>
        </m.div>
      </LazyMotion>
    );
  },
);

GraduationCapIcon.displayName = "GraduationCapIcon";
export default GraduationCapIcon;

