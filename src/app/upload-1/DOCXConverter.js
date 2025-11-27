// components/DOCXConverterMinimal.jsx
"use client";
import { useState, useRef } from "react";
import axios from "axios";

export default function DOCXConverterMinimal({ onConvertSuccess }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef();

  const uploadAndDownload = async () => {
    if (!file) return alert("Select a .docx file");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file); // server expects 'file'
      // POST to our Next API (which proxies to ConvertAPI)
      const res = await axios.post("/api/convert-docx", fd, {
        responseType: "blob",
        timeout: 120000,
      });

      // if server returned JSON (error), try to show
      const ct = res.headers["content-type"] || "";
      if (ct.includes("application/json")) {
        const txt = await res.data.text();
        alert("Conversion error: " + txt);
        return;
      }

      // success: download returned PDF blob
      const blob = res.data;
      const pdfName = file.name.replace(/\.docx$/i, "") + ".pdf";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = pdfName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      onConvertSuccess?.(new File([blob], pdfName, { type: "application/pdf" }));
    } catch (err) {
      console.error("Upload/convert error:", err?.response?.data || err?.message || err);
      // try to parse JSON error from server response
      if (err?.response?.data) {
        try {
          const txt = await err.response.data.text();
          alert("Conversion failed: " + txt);
        } catch (e) {
          alert(err.message || "Conversion failed");
        }
      } else {
        alert(err.message || "Conversion failed");
      }
    } finally {
      setBusy(false);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div style={{ maxWidth: 420, padding: 12 }}>
      <input
        ref={inputRef}
        type="file"
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        disabled={busy}
      />
      <div style={{ marginTop: 8 }}>
        <button onClick={uploadAndDownload} disabled={!file || busy}>
          {busy ? "Converting..." : "Convert & Download PDF"}
        </button>
      </div>
    </div>
  );
}
