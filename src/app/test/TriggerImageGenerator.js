"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import "./TriggerImageGenerator.css";

const DEFAULT_PROMPT = "a realistic portrait of a man, cinematic lighting";

export default function TriggerImageGenerator() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [jobId, setJobId] = useState("");
  const [status, setStatus] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [error, setError] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const pollingRef = useRef(null);

  const loadImages = async () => {
    try {
      const res = await fetch("/api/generate/list");
      const data = await res.json();
      if (res.ok) {
        setImages(Array.isArray(data?.items) ? data.items : []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const startPolling = (id) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/generate/${id}`);
        const data = await res.json();
        if (!res.ok) return;

        setStatus(data.status || "");
        if (data.status === "completed") {
          setResultUrl(data.cloudinaryUrl || "");
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          loadImages();
        }
        if (data.status === "failed") {
          setError(data.error || "Generation failed");
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      } catch {
        // ignore
      }
    }, 5000);
  };

  const handleGenerate = async (event) => {
    event.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed) {
      setError("Please enter a prompt");
      return;
    }

    setLoading(true);
    setError("");
    setResultUrl("");

    let userId = null;
    const usn = typeof window !== "undefined" ? localStorage.getItem("usn") : null;
    if (usn) {
      try {
        const res = await fetch(`/api/user/id?usn=${encodeURIComponent(usn)}`);
        if (res.ok) {
          const data = await res.json();
          userId = data?.userId || null;
        }
      } catch {
        // ignore
      }
    }

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed, userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to start job");

      setJobId(data.jobId || "");
      setStatus(data.status || "processing");
      startPolling(data.jobId);
    } catch (err) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="tig-wrap">
      <h2 className="tig-title">Trigger.dev Image Generation</h2>
      <p className="tig-subtitle">Starts a background job and stores results in Cloudinary.</p>

      <form className="tig-form" onSubmit={handleGenerate}>
        <textarea
          className="tig-textarea"
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your image..."
        />
        <button type="submit" className="tig-btn" disabled={loading}>
          {loading ? "Starting..." : "Generate"}
        </button>
      </form>

      {jobId && (
        <div className="tig-status">
          <span>Job: {jobId}</span>
          <span>Status: {status || "processing"}</span>
        </div>
      )}

      {error && <p className="tig-error">{error}</p>}

      {resultUrl && (
        <div className="tig-result">
          <Image src={resultUrl} alt="Generated result" width={800} height={800} />
        </div>
      )}

      <div className="tig-gallery">
        <h3>All Generated Images</h3>
        {images.length === 0 ? (
          <p className="tig-empty">No images yet.</p>
        ) : (
          <div className="tig-grid">
            {images.map((item) => (
              <div key={item.id} className="tig-card">
                {item.cloudinaryUrl ? (
                  <Image
                    src={item.cloudinaryUrl}
                    alt={item.prompt || "Generated"}
                    width={400}
                    height={400}
                  />
                ) : (
                  <div className="tig-placeholder">{item.status}</div>
                )}
                <div className="tig-card-meta">
                  <span>{item.prompt}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
