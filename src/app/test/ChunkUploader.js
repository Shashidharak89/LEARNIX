"use client";

import { useState, useRef } from "react";

export default function ChunkUploader() {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const abortRef = useRef(null);

  const CHUNK_SIZE = 100 * 1024; // 100KB

  const handleFile = (e) => {
    setFile(e.target.files[0]);
    setProgress(0);
    setStatus("");
  };

  const upload = async () => {
    if (!file) return;
    const total = Math.ceil(file.size / CHUNK_SIZE);
    const uploadId = (crypto && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    setStatus("Uploading...");
    abortRef.current = false;

    for (let i = 0; i < total; i++) {
      if (abortRef.current) {
        setStatus("Aborted");
        return;
      }

      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      // prepare form
      const form = new FormData();
      form.append("chunk", chunk);
      form.append("index", String(i));
      form.append("total", String(total));
      form.append("uploadId", uploadId);
      form.append("filename", file.name);

      // retry logic for each chunk
      let attempts = 0;
      let ok = false;
      while (attempts < 3 && !ok) {
        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            body: form
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          if (json.success) {
            ok = true;
            const done = (i + 1) / total;
            setProgress(Math.round(done * 100));
            if (json.final) {
              setStatus("Upload complete");
            }
          } else {
            throw new Error(json.error || "Upload failed");
          }
        } catch (err) {
          attempts += 1;
          if (attempts >= 3) {
            setStatus(`Chunk ${i} failed: ${err.message}`);
            return;
          }
          // small backoff
          await new Promise((r) => setTimeout(r, 500 * attempts));
        }
      }
    }
  };

  const abort = () => {
    abortRef.current = true;
  };

  return (
    <div style={{maxWidth:700,margin:16,padding:16,border:'1px solid #e6e6e6',borderRadius:8}}>
      <h3>Chunked Upload (100KB chunks)</h3>
      <input type="file" onChange={handleFile} />
      <div style={{marginTop:12,display:'flex',gap:8}}>
        <button onClick={upload} disabled={!file}>Upload</button>
        <button onClick={abort}>Abort</button>
      </div>

      <div style={{marginTop:12}}>
        <div style={{height:12,background:'#f1f1f1',borderRadius:8,overflow:'hidden'}}>
          <div style={{width:`${progress}%`,height:'100%',background:'#0ea5a4'}} />
        </div>
        <div style={{marginTop:8}}>{progress}% — {status}</div>
      </div>
    </div>
  );
}
