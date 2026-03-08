"use client";

import { useState } from "react";
import "./styles/ImageLoader.css";

/**
 * ImageLoader — drop-in replacement for <img> that shows a shimmer
 * placeholder until the image has fully loaded.
 *
 * Props: same as <img> (src, alt, className, onClick, loading, style, …)
 * The `className` is forwarded to the <img> element itself.
 * `wrapperClassName` lets you style the outer wrapper div.
 */
export default function ImageLoader({
  src,
  alt = "",
  className = "",
  wrapperClassName = "",
  onClick,
  loading = "lazy",
  style,
  onError,
  ...rest
}) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const handleLoad = () => setLoaded(true);

  const handleError = (e) => {
    setLoaded(true);   // hide shimmer even on error
    setErrored(true);
    if (onError) onError(e);
  };

  return (
    <div className={`img-loader-wrap ${wrapperClassName}`}>
      {/* Shimmer — visible until image loads */}
      {!loaded && <div className="img-loader-shimmer" aria-hidden="true" />}

      {/* Actual image */}
      {!errored && (
        <img
          src={src}
          alt={alt}
          loading={loading}
          style={style}
          className={`img-loader-img ${loaded ? "img-loader-img--visible" : "img-loader-img--hidden"} ${className}`}
          onLoad={handleLoad}
          onError={handleError}
          onClick={onClick}
          {...rest}
        />
      )}
    </div>
  );
}
