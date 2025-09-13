"use client";
import { useState } from "react";

export default function FileUploader({ workId, subjectId, contentId, onDone }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadingIndex, setUploadingIndex] = useState(-1);
  const [loading, setLoading] = useState(false);

  const handleSelect = (e) => {
    const list = Array.from(e.target.files || []);
    if (list.length === 0) return;
    setSelectedFiles(list);
  };

  const uploadAll = async () => {
    if (!selectedFiles.length) return alert("Select file(s) first");
    setLoading(true);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        setUploadingIndex(i);
        const file = selectedFiles[i];
        const fd = new FormData();
        fd.append("file", file);

        const res = await fetch(
          `/api/work/${workId}/subject/${subjectId}/content/${contentId}/file`,
          { method: "POST", body: fd }
        );

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
      }

      setSelectedFiles([]);
      setUploadingIndex(-1);
      if (onDone) onDone();
      window.dispatchEvent(new Event("workUpdated"));
    } catch (err) {
      console.error(err);
      alert("Upload error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input type="file" accept="image/*" multiple onChange={handleSelect} />
      <div style={{ marginTop: 8 }}>
        {selectedFiles.map((f, idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 120 }}>
              <img
                src={URL.createObjectURL(f)}
                alt={f.name}
                style={{ width: "100%", height: 80, objectFit: "cover" }}
              />
            </div>
            <div>
              <div>{f.name}</div>
              <div style={{ fontSize: 12, color: "#666" }}>
                {uploadingIndex === idx
                  ? "Uploading..."
                  : uploadingIndex > -1 && uploadingIndex > idx
                  ? "Uploaded"
                  : ""}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 8 }}>
        <button onClick={uploadAll} disabled={loading || selectedFiles.length === 0}>
          {loading ? "Uploading..." : "Upload Selected"}
        </button>
        <button style={{ marginLeft: 8 }} onClick={() => setSelectedFiles([])} disabled={loading}>
          Clear
        </button>
      </div>
    </div>
  );
}
