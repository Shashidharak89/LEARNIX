"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { EllipsisVerticalIcon } from "@animateicons/react/lucide";
import "./styles/ActionOverflowMenu.css";

export default function ActionOverflowMenu({ label = "More options", actions = [] }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(220, window.innerWidth - 24);
      const left = Math.max(12, Math.min(rect.right - width, window.innerWidth - width - 12));
      const estimatedHeight = Math.min(220, window.innerHeight - 24);
      const top = rect.bottom + estimatedHeight + 6 <= window.innerHeight
        ? rect.bottom + 6
        : Math.max(12, rect.top - estimatedHeight - 6);
      setPosition({ position: "fixed", top, left, width, maxHeight: estimatedHeight, zIndex: 999 });
    };
    const onPointerDown = (event) => {
      if (!triggerRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    updatePosition();
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="lx-overflow-trigger"
        onClick={() => setOpen((value) => !value)}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <EllipsisVerticalIcon size={19} aria-hidden="true" />
      </button>
      {open && position && typeof document !== "undefined" && createPortal(
        <div ref={menuRef} className="lx-overflow-menu" style={position} role="menu" aria-label={label}>
          {actions.map(({ label: actionLabel, Icon, href, onClick, disabled = false }) => {
            const content = <>{Icon && <Icon size={17} aria-hidden="true" />}<span>{actionLabel}</span></>;
            if (href) {
              return <Link key={actionLabel} href={href} className="lx-overflow-item" role="menuitem" onClick={() => setOpen(false)}>{content}</Link>;
            }
            return (
              <button
                key={actionLabel}
                type="button"
                role="menuitem"
                className="lx-overflow-item"
                disabled={disabled}
                onClick={() => { setOpen(false); onClick?.(); }}
              >
                {content}
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </>
  );
}
