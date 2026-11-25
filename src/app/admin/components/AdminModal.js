"use client";

import React, { useEffect } from "react";
import { FiAlertTriangle, FiInfo, FiX } from "react-icons/fi";
import "./AdminUI.css";

/**
 * Custom Apple-themed Modal / Confirmation Popup (replaces SweetAlert).
 */
export default function AdminModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirm Action",
    message = "",
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "danger", // "danger" | "primary" | "info"
    loading = false,
    children,
}) {
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e) => {
            if (e.key === "Escape" && !loading) onClose();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [isOpen, loading, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="adm-modal-backdrop"
            role="dialog"
            aria-modal="true"
            onClick={() => !loading && onClose()}
        >
            <div className="adm-modal-card" onClick={(e) => e.stopPropagation()}>
                <button
                    type="button"
                    className="adm-modal-close"
                    onClick={onClose}
                    disabled={loading}
                    aria-label="Close"
                >
                    <FiX size={18} />
                </button>

                <div className={`adm-modal-icon-wrap adm-modal-icon--${variant}`}>
                    {variant === "danger" ? <FiAlertTriangle size={24} /> : <FiInfo size={24} />}
                </div>

                <h3 className="adm-modal-title">{title}</h3>
                {message && <p className="adm-modal-message">{message}</p>}
                {children}

                <div className="adm-modal-actions">
                    <button
                        type="button"
                        className="adm-modal-btn adm-modal-btn--cancel"
                        onClick={onClose}
                        disabled={loading}
                    >
                        {cancelText}
                    </button>
                    {onConfirm && (
                        <button
                            type="button"
                            className={`adm-modal-btn adm-modal-btn--${variant}`}
                            onClick={onConfirm}
                            disabled={loading}
                        >
                            {loading ? "Processing..." : confirmText}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

