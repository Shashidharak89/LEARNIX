"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import CodeBlock from "./CodeBlock";
import "./styles/MarkdownRenderer.css";

export default function MarkdownRenderer({ content, className = "" }) {
  if (!content) return null;

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
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
          table({ node, children, ...props }) {
            return (
              <div className="markdown-table-wrapper">
                <table className="markdown-table" {...props}>
                  {children}
                </table>
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
