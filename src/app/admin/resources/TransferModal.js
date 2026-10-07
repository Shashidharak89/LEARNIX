"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { authFetch } from "@/lib/clientAuth";
import {
  FiRepeat,
  FiX,
  FiAlertTriangle,
  FiCheckCircle,
  FiLoader,
  FiUserCheck,
  FiArrowRight,
} from "react-icons/fi";

export default function TransferModal({ subject, onClose, onTransferSuccess }) {
  const [targetUsn, setTargetUsn] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [targetUser, setTargetUser] = useState(null);
  const [verifyError, setVerifyError] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [error, setError] = useState("");

  const currentUsn = subject?.user?.usn || "";

  // Auto-verify debounce when typing target USN
  useEffect(() => {
    const cleanUsn = targetUsn.trim().toUpperCase();
    if (!cleanUsn || cleanUsn.length < 3) {
      setTargetUser(null);
      setVerifyError("");
      return;
    }

    const timer = setTimeout(async () => {
      if (cleanUsn === currentUsn.toUpperCase()) {
        setTargetUser(null);
        setVerifyError("Subject is already owned by this user.");
        return;
      }

      setVerifying(true);
      setVerifyError("");
      try {
        const res = await authFetch(`/api/admin/resources/verify-user?usn=${encodeURIComponent(cleanUsn)}`);
        const data = await res.json();
        if (res.ok && data.exists && data.user) {
          setTargetUser(data.user);
          setVerifyError("");
        } else {
          setTargetUser(null);
          setVerifyError(data.message || `No user found with USN "${cleanUsn}".`);
        }
      } catch {
        setTargetUser(null);
        setVerifyError("Failed to verify user USN.");
      } finally {
        setVerifying(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [targetUsn, currentUsn]);

  const handleManualVerify = async () => {
    const cleanUsn = targetUsn.trim().toUpperCase();
    if (!cleanUsn) {
      setVerifyError("Please enter a valid USN.");
      return;
    }

    if (cleanUsn === currentUsn.toUpperCase()) {
      setTargetUser(null);
      setVerifyError("Subject is already owned by this user.");
      return;
    }

    setVerifying(true);
    setVerifyError("");
    setError("");

    try {
      const res = await authFetch(`/api/admin/resources/verify-user?usn=${encodeURIComponent(cleanUsn)}`);
      const data = await res.json();
      if (res.ok && data.exists && data.user) {
        setTargetUser(data.user);
        setVerifyError("");
      } else {
        setTargetUser(null);
        setVerifyError(data.message || `No user found with USN "${cleanUsn}".`);
      }
    } catch {
      setTargetUser(null);
      setVerifyError("Failed to verify user.");
    } finally {
      setVerifying(false);
    }
  };

  const handleTransfer = async () => {
    const cleanUsn = targetUsn.trim().toUpperCase();
    if (!cleanUsn) {
      setError("Please provide a target USN.");
      return;
    }

    if (cleanUsn === currentUsn.toUpperCase()) {
      setError("Cannot transfer subject to the existing owner.");
      return;
    }

    setTransferring(true);
    setError("");

    try {
      const res = await authFetch("/api/admin/resources/subjects/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: subject._id,
          targetUsn: cleanUsn,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to transfer subject.");
      }

      onTransferSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setTransferring(false);
    }
  };

  return (
    <div className="ar-modal-overlay" onClick={onClose}>
      <div className="ar-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ar-modal-header">
          <h3 className="ar-modal-title">
            <FiRepeat color="#6366f1" />
            Transfer Subject Ownership
          </h3>
          <button className="ar-modal-close" onClick={onClose} aria-label="Close modal">
            <FiX />
          </button>
        </div>

        {/* Body */}
        <div className="ar-modal-body">
          {/* Coupling Notice */}
          <div className="ar-modal-alert">
            <FiAlertTriangle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong>Cascading Transfer Notice:</strong> Transferring this subject will automatically reassign <strong>all {subject?.topicsCount || 0} topic(s)</strong> inside it to the new user, ensuring full coupling integrity.
            </div>
          </div>

          {/* Subject Preview */}
          <div className="ar-subject-preview-box">
            <div className="ar-preview-row">
              <span className="ar-preview-label">Subject Name:</span>
              <span className="ar-preview-val">{subject?.subject}</span>
            </div>
            <div className="ar-preview-row">
              <span className="ar-preview-label">Current Owner:</span>
              <span className="ar-preview-val">
                {subject?.user?.name || "Unknown"} ({subject?.user?.usn || "N/A"})
              </span>
            </div>
            <div className="ar-preview-row">
              <span className="ar-preview-label">Coupled Topics:</span>
              <span className="ar-badge-count">{subject?.topicsCount || 0} Topics</span>
            </div>
          </div>

          {/* Target USN Form */}
          <div className="ar-form-group">
            <label className="ar-label" htmlFor="targetUsnInput">
              Recipient User USN:
            </label>
            <div className="ar-input-verify-wrap">
              <input
                id="targetUsnInput"
                type="text"
                className="ar-input"
                placeholder="e.g. 1BI21CS001"
                value={targetUsn}
                onChange={(e) => setTargetUsn(e.target.value.toUpperCase())}
                autoFocus
                disabled={transferring}
              />
              <button
                type="button"
                className="ar-btn-verify"
                onClick={handleManualVerify}
                disabled={verifying || transferring || !targetUsn.trim()}
              >
                {verifying ? <FiLoader className="spin" /> : "Verify"}
              </button>
            </div>
          </div>

          {/* Verification feedback */}
          {targetUser && (
            <div className="ar-target-card found">
              {targetUser.profileimg ? (
                <Image
                  src={targetUser.profileimg}
                  alt={targetUser.name}
                  width={36}
                  height={36}
                  unoptimized
                  className="ar-target-avatar"
                />
              ) : (
                <div className="ar-target-avatar" style={{ display: 'grid', placeItems: 'center', background: '#dcfce7', color: '#166534' }}>
                  <FiUserCheck size={18} />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div className="ar-target-name">{targetUser.name}</div>
                <div className="ar-target-usn">USN: {targetUser.usn} • Role: {targetUser.role || "user"}</div>
              </div>
              <FiCheckCircle size={20} color="#16a34a" />
            </div>
          )}

          {verifyError && (
            <div className="ar-target-card not-found">
              <span>{verifyError}</span>
            </div>
          )}

          {error && (
            <div className="ar-toast ar-toast-error" style={{ margin: 0 }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="ar-modal-footer">
          <button
            type="button"
            className="ar-btn-cancel"
            onClick={onClose}
            disabled={transferring}
          >
            Cancel
          </button>
          <button
            type="button"
            className="ar-btn-confirm-transfer"
            onClick={handleTransfer}
            disabled={transferring || !targetUser}
          >
            {transferring ? (
              <>
                <FiLoader className="spin" size={16} /> Transferring...
              </>
            ) : (
              <>
                Transfer Subject & Topics <FiArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
