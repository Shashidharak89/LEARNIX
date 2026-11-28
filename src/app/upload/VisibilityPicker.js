"use client";

import { useEffect, useRef, useState } from "react";
import { FiCheck, FiChevronDown, FiGlobe, FiLink, FiLock } from "react-icons/fi";
import "./styles/VisibilityPicker.css";

const OPTIONS = [
  { value: "public", label: "Public", description: "Visible to everyone", Icon: FiGlobe },
  { value: "unlisted", label: "Unlisted", description: "Anyone with the link can view", Icon: FiLink },
  { value: "private", label: "Private", description: "Only visible to you", Icon: FiLock },
];

export default function VisibilityPicker({ visibility = "public", onChange, disabled = false, saving = false }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const current = OPTIONS.find((option) => option.value === visibility) || OPTIONS[0];
  const CurrentIcon = current.Icon;

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
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

  const selectVisibility = async (value) => {
    if (value === visibility) {
      setOpen(false);
      return;
    }
    await onChange(value);
    setOpen(false);
  };

  return (
    <div className="upload-visibility" ref={rootRef} onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        className={`upload-visibility-trigger is-${current.value}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Visibility: ${current.label}. Change visibility`}
        title="Change visibility"
        disabled={disabled || saving}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        {saving ? <span className="upload-visibility-spinner" aria-hidden="true" /> : <CurrentIcon aria-hidden="true" />}
        <span className="upload-visibility-trigger-label">{saving ? "Saving…" : current.label}</span>
        <FiChevronDown className={`upload-visibility-chevron${open ? " is-open" : ""}`} aria-hidden="true" />
      </button>

      {open && (
        <div className="upload-visibility-menu" role="listbox" aria-label="Choose visibility">
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
        </div>
      )}
    </div>
  );
}
