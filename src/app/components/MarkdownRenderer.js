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
            return (
              <span className="markdown-img-wrapper">
                <img
                  src={src}
                  alt={alt || "Image preview"}
                  className="markdown-img"
                  loading="lazy"
                  {...props}
                />
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
        {content}
      </ReactMarkdown>
    </div>
  );
}
