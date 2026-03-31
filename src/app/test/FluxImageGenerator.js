"use client";

import { useState } from "react";
import "./FluxImageGenerator.css";

const DEFAULT_PROMPT =
  'black forest gateau cake spelling out the words "FLUX 1 . 1 Pro", tasty, food photography';

export default function FluxImageGenerator() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async (event) => {
    event.preventDefault();
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt) {
      setError("Please enter a prompt first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/test/flux-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmedPrompt, prompt_upsampling: true }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to generate image");
      }

      setImageUrl(data.imageUrl || "");
    } catch (requestError) {
      setError(requestError?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="fig-wrap">
      <h2 className="fig-title">FLUX 1.1 Pro Image Test</h2>
      <p className="fig-meta">
        Uses Replicate model <code>black-forest-labs/flux-1.1-pro</code> via backend API.
      </p>

      <form onSubmit={handleGenerate} className="fig-form">
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          className="fig-textarea"
          rows={4}
          placeholder="Write your image prompt..."
        />
        <button type="submit" className="fig-generate-btn" disabled={loading}>
          {loading ? "Generating..." : "Generate Image"}
        </button>
      </form>

      {error ? <p className="fig-error">{error}</p> : null}

      {imageUrl ? (
        <div className="fig-preview-card">
          <div
            className="fig-preview-image"
            role="img"
            aria-label="Generated image"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
          <div className="fig-preview-actions">
            <a href={imageUrl} target="_blank" rel="noreferrer noopener" className="fig-action-link">
              Open image
            </a>
            <a href={imageUrl} download="flux-output.jpg" className="fig-action-link fig-download-link">
              Download
            </a>
          </div>
        </div>
      ) : null}
    </section>
  );
}
