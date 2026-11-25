"use client";

import React, { useEffect } from "react";
import { FiAlertCircle, FiInfo } from "react-icons/fi";
import { CheckIcon, XIcon } from "@animateicons/react/lucide";
import "./AdminUI.css";

/**
 * Small bottom-right light-themed toast notification (matching Learn Later style).
 * toast: { message: string, type?: 'success' | 'error' | 'info' } | null
 */
export default function AdminToast({ toast, onClose, duration = 3500 }) {
    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => {
            if (onClose) onClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [toast, duration, onClose]);

    if (!toast || !toast.message) return null;

    const type = toast.type || "success";

    return (
        <div className={`adm-toast adm-toast--${type}`} role="status" aria-live="polite">
            <span className="adm-toast-icon">
                {type === "success" && <CheckIcon size={18} />}
                {type === "error" && <FiAlertCircle size={18} />}
                {type === "info" && <FiInfo size={18} />}
            </span>
            <span className="adm-toast-message">{toast.message}</span>
            <button
                type="button"
                className="adm-toast-close"
                onClick={onClose}
                aria-label="Dismiss notification"
            >
                <XIcon size={15} />
            </button>
        </div>
    );
}

