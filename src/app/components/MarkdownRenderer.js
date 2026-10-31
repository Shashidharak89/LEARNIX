"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import CodeBlock from "./CodeBlock";
import "katex/dist/katex.min.css";
import "./styles/MarkdownRenderer.css";

function highlightReactNode(node, query, highlightClass = "upd-highlight") {
  if (!query || !query.trim() || !node) return node;

  if (typeof node === "string") {
    const words = query
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    if (words.length === 0) return node;
    const regex = new RegExp(`(${words.join("|")})`, "gi");
    const parts = node.split(regex);
    if (parts.length <= 1) return node;
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className={highlightClass}>
          {part}
        </mark>
      ) : (
        part
      )
    );
  }

  if (Array.isArray(node)) {
    return node.map((child, idx) => {
      const res = highlightReactNode(child, query, highlightClass);
      return React.isValidElement(res) ? React.cloneElement(res, { key: idx }) : res;
    });
  }

  if (React.isValidElement(node) && node.props && node.props.children) {
    if (node.type === "code" || node.type === "pre") return node;
    return React.cloneElement(
      node,
      {},
      highlightReactNode(node.props.children, query, highlightClass)
    );
  }

  return node;
}

export default function MarkdownRenderer({
  content,
  className = "",
  highlightQuery = "",
  highlightClass = "upd-highlight",
}) {
  if (!content) return null;

  // Preprocess HTML image tags and normalize newlines from raw JSON strings
  let normalized = typeof content === "string" ? content : String(content || "");

  // Convert literal escaped "\n" (from raw JSON copy-paste) to real newlines
  if (normalized.includes("\\n")) {
    normalized = normalized.replace(/\\n/g, "\n");
  }

  // Collapse 3 or more consecutive newlines down to standard double newline to prevent cavernous gaps
  normalized = normalized.replace(/\n{3,}/g, "\n\n");

  // Preprocess HTML image tags and <br> into standard markdown (br converts to single newline with remarkBreaks)
  const normalizedContent = normalized
    .replace(
      /<img\s+[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][^>]*\/?>/gi,
      "![$2]($1)"
    )
    .replace(
      /<img\s+[^>]*alt=["']([^"']*)["'][^>]*src=["']([^"']+)["'][^>]*\/?>/gi,
      "![$1]($2)"
    )
    .replace(/<img\s+[^>]*src=["']([^"']+)["'][^>]*\/?>/gi, "![]($1)")
    .replace(/<br\s*\/?>/gi, "\n");

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p({ node, children, ...props }) {
            return (
              <p {...props}>
                {highlightQuery
                  ? highlightReactNode(children, highlightQuery, highlightClass)
                  : children}
              </p>
            );
          },
          li({ node, children, ...props }) {
            return (
              <li {...props}>
                {highlightQuery
                  ? highlightReactNode(children, highlightQuery, highlightClass)
                  : children}
              </li>
            );
          },
          h1({ node, children, ...props }) {
            return (
              <h1 {...props}>
                {highlightQuery
                  ? highlightReactNode(children, highlightQuery, highlightClass)
                  : children}
              </h1>
            );
          },
          h2({ node, children, ...props }) {
            return (
              <h2 {...props}>
                {highlightQuery
                  ? highlightReactNode(children, highlightQuery, highlightClass)
                  : children}
              </h2>
            );
          },
          h3({ node, children, ...props }) {
            return (
              <h3 {...props}>
                {highlightQuery
                  ? highlightReactNode(children, highlightQuery, highlightClass)
                  : children}
              </h3>
            );
          },
          blockquote({ node, children, ...props }) {
            return (
              <blockquote {...props}>
                {highlightQuery
                  ? highlightReactNode(children, highlightQuery, highlightClass)
                  : children}
              </blockquote>
            );
          },
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const codeString = String(children || "").replace(/\n$/, "");

            if (!inline && (match || codeString.includes("\n") || className)) {
              return (
                <CodeBlock
                  code={codeString}
                  language={match ? match[1] : ""}
                />
              );
            }

            return (
              <code className="inline-code" {...props}>
                {children}
              </code>
            );
          },
          a({ node, href, children, ...props }) {
            const isInternal = href && href.startsWith("/");
            return (
              <a
                href={href}
                target={isInternal ? "_self" : "_blank"}
                rel={isInternal ? undefined : "noopener noreferrer"}
                className="markdown-link"
                {...props}
              >
                {children}
              </a>
            );
          },
          img({ node, src, alt, ...props }) {
            const hasCaption = alt && alt !== "Image preview" && alt !== "Illustration";
            return (
              <span className="markdown-img-wrapper">
                <img
                  src={src}
                  alt={alt || "Illustration"}
                  className="markdown-img"
                  loading="lazy"
                  onClick={() => {
                    if (typeof window !== "undefined" && src) {
                      window.open(src, "_blank");
                    }
                  }}
                  title="Click to view full image in a new tab"
                  style={{ cursor: "pointer" }}
                  {...props}
                />
                {hasCaption && (
                  <span className="markdown-img-caption">{alt}</span>
                )}
              </span>
            );
          },
          table({ node, children, ...props }) {
            return (
              <div className="markdown-table-wrapper">
                <table className="markdown-table" {...props}>
                  {children}
                </table>
              </div>
            );
          },
          input({ node, type, checked, ...props }) {
            if (type === "checkbox") {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  readOnly
                  className="markdown-checkbox"
                  {...props}
                />
              );
            }
            return <input type={type} {...props} />;
          },
        }}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
}
