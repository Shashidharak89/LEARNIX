"use client";

import pdfSvg from "../updates/icons/pdf-file-type-svgrepo-com.svg";
import docxSvg from "../updates/icons/doc-document-docx-svgrepo-com.svg";
import zipSvg from "../updates/icons/ZIP File Icon Animation.svg";

/**
 * Renders custom SVG icons for PDF, DOCX, and ZIP files if available,
 * with fallback to standard document icon.
 */
export default function FileIcon({ filename, className = "upd-file-icon-badge" }) {
  const lower = String(filename || "").toLowerCase().split("?")[0];

  let src = null;
  let alt = "File";

  if (lower.endsWith(".pdf")) {
    src = pdfSvg.src || pdfSvg;
    alt = "PDF";
  } else if (lower.endsWith(".docx") || lower.endsWith(".doc")) {
    src = docxSvg.src || docxSvg;
    alt = "DOCX";
  } else if (
    lower.endsWith(".zip") ||
    lower.endsWith(".rar") ||
    lower.endsWith(".7z") ||
    lower.endsWith(".tar") ||
    lower.endsWith(".gz")
  ) {
    src = zipSvg.src || zipSvg;
    alt = "ZIP";
  }

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "28px",
        height: "28px",
        borderRadius: "6px",
        border: "1px solid rgba(0, 0, 0, 0.12)",
        background: "#ffffff",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
        flexShrink: 0,
        boxSizing: "border-box",
        padding: "3px"
      }}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block"
          }}
        />
      ) : (
        <span style={{ fontSize: "14px", lineHeight: 1 }}>📄</span>
      )}
    </span>
  );
}
