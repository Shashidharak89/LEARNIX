"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiCheck, FiChevronDown, FiGlobe, FiLink, FiLock } from "react-icons/fi";
import "./styles/VisibilityPicker.css";

const OPTIONS = [
  { value: "public", label: "Public", description: "Visible to everyone", Icon: FiGlobe },
  { value: "unlisted", label: "Unlisted", description: "Anyone with the link can view", Icon: FiLink },
  { value: "private", label: "Private", description: "Only visible to you", Icon: FiLock },
];

export default function VisibilityPicker({ visibility = "public", onChange, disabled = false, saving = false }) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState(null);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const current = OPTIONS.find((option) => option.value === visibility) || OPTIONS[0];
  const CurrentIcon = current.Icon;

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const menuWidth = Math.min(270, window.innerWidth - 32);
    const menuHeight = menuRef.current?.getBoundingClientRect().height || 190;
    const left = Math.max(16, Math.min(rect.left, window.innerWidth - menuWidth - 16));
    const top = rect.bottom + menuHeight + 8 > window.innerHeight
      ? Math.max(16, rect.top - menuHeight - 8)
      : rect.bottom + 8;
    setMenuPosition({ top, left });
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    updateMenuPosition();
    const frame = window.requestAnimationFrame(updateMenuPosition);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open, updateMenuPosition]);

  const selectVisibility = async (value) => {
    if (value === visibility) {
      setMenuPosition(null);
      setOpen(false);
      return;
    }
    await onChange(value);
    setMenuPosition(null);
    setOpen(false);
  };

  return (
    <div className="upload-visibility" ref={rootRef} onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        ref={triggerRef}
        className={`upload-visibility-trigger is-${current.value}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Visibility: ${current.label}. Change visibility`}
        title="Change visibility"
        disabled={disabled || saving}
        onClick={(event) => {
          event.stopPropagation();
          setMenuPosition(null);
          setOpen((value) => !value);
        }}
      >
        {saving ? <span className="upload-visibility-spinner" aria-hidden="true" /> : <CurrentIcon aria-hidden="true" />}
        <span className="upload-visibility-trigger-label">{saving ? "Saving…" : current.label}</span>
        <FiChevronDown className={`upload-visibility-chevron${open ? " is-open" : ""}`} aria-hidden="true" />
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={menuRef}
          className="upload-visibility-menu is-portal"
          style={menuPosition ? { top: menuPosition.top, left: menuPosition.left } : { visibility: "hidden" }}
          role="listbox"
          aria-label="Choose visibility"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="upload-visibility-menu-heading">Change visibility</div>
          {OPTIONS.map(({ value, label, description, Icon }) => (
            <button
              type="button"
              role="option"
              aria-selected={value === current.value}
              key={value}
              className={`upload-visibility-option${value === current.value ? " is-selected" : ""}`}
              disabled={disabled || saving}
              onClick={(event) => {
                event.stopPropagation();
                selectVisibility(value);
              }}
            >
              <span className={`upload-visibility-option-icon is-${value}`}><Icon aria-hidden="true" /></span>
              <span className="upload-visibility-option-copy">
                <span className="upload-visibility-option-title">{label}</span>
                <span className="upload-visibility-option-description">{description}</span>
              </span>
              {value === current.value && <FiCheck className="upload-visibility-option-check" aria-hidden="true" />}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
