"use client";

import pdfSvg from "../updates/icons/pdf-file-type-svgrepo-com.svg";
import docxSvg from "../updates/icons/doc-document-docx-svgrepo-com.svg";
import zipSvg from "../updates/icons/ZIP File Icon Animation.svg";

/**
 * Renders custom SVG icons for PDF, DOCX, and ZIP files if available,
 * with fallback to standard document icon.
 */
export default function FileIcon({ filename, className = "upd-file-icon-img" }) {
  if (!filename) return <span className="upd-file-card-icon">📄</span>;

  const lower = String(filename).toLowerCase().split("?")[0];

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

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        style={{
          width: "22px",
          height: "22px",
          objectFit: "contain",
          flexShrink: 0,
          display: "inline-block",
          verticalAlign: "middle"
        }}
      />
    );
  }

  return <span className="upd-file-card-icon">📄</span>;
}
