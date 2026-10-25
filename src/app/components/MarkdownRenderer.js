"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import CodeBlock from "./CodeBlock";
import "katex/dist/katex.min.css";
import "./styles/MarkdownRenderer.css";

export default function MarkdownRenderer({ content, className = "" }) {
  if (!content) return null;

  // Preprocess HTML image tags and line breaks into standard markdown
  const normalizedContent =
    typeof content === "string"
      ? content
          .replace(
            /<img\s+[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][^>]*\/?>/gi,
            "![$2]($1)"
          )
          .replace(
            /<img\s+[^>]*alt=["']([^"']*)["'][^>]*src=["']([^"']+)["'][^>]*\/?>/gi,
            "![$1]($2)"
          )
          .replace(/<img\s+[^>]*src=["']([^"']+)["'][^>]*\/?>/gi, "![]($1)")
          .replace(/<br\s*\/?>/gi, "\n\n")
      : content;

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
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
