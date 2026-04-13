"use client";

import { useEffect, useState } from "react";
import "./HfImageGenerator.css";

const DEFAULT_PROMPT = "Astronaut riding a horse";

export default function HfImageGenerator() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [steps, setSteps] = useState(5);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

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
      const response = await fetch("/api/test/hf-text-to-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmedPrompt, numInferenceSteps: Number(steps) || 5 }),
      });

      if (!response.ok) {
        let message = "Failed to generate image";
        try {
          const data = await response.json();
          message = data?.error || message;
        } catch {
          // ignore non-json error body
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const nextUrl = URL.createObjectURL(blob);

      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }

      setImageUrl(nextUrl);
    } catch (requestError) {
      setError(requestError?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="hfig-wrap">
      <h2 className="hfig-title">Hugging Face SDXL Test</h2>
      <p className="hfig-meta">
        Uses <code>stabilityai/stable-diffusion-xl-base-1.0</code> with provider <code>nscale</code>.
      </p>

      <form onSubmit={handleGenerate} className="hfig-form">
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          className="hfig-textarea"
          rows={4}
          placeholder="Describe the image you want..."
        />

        <label className="hfig-steps-label" htmlFor="hf-steps-input">
          Inference steps
        </label>
        <input
          id="hf-steps-input"
          type="number"
          className="hfig-steps-input"
          min={1}
          max={50}
          value={steps}
          onChange={(event) => setSteps(event.target.value)}
        />

        <button type="submit" className="hfig-generate-btn" disabled={loading}>
          {loading ? "Generating..." : "Generate Image"}
        </button>
      </form>

      {error ? <p className="hfig-error">{error}</p> : null}

      {imageUrl ? (
        <div className="hfig-preview-card">
          <img src={imageUrl} alt="Generated output" className="hfig-preview-image" />
          <div className="hfig-preview-actions">
            <a href={imageUrl} target="_blank" rel="noreferrer noopener" className="hfig-action-link">
              Open image
            </a>
            <a href={imageUrl} download="hf-sdxl-output.png" className="hfig-action-link hfig-download-link">
              Download
            </a>
          </div>
        </div>
      ) : null}
    </section>
  );
}