"use client";

import React, { useState } from "react";
import { FiCopy, FiCheck, FiCode } from "react-icons/fi";
import "./styles/CodeBlock.css";

function highlightCode(code, language = "") {
  if (!code) return "";

  const escapeHtml = (str) =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const lang = (language || "").toLowerCase();

  // HTML / XML / SVG tag handling
  if (lang === "html" || lang === "xml" || lang === "svg") {
    let escaped = escapeHtml(code);
    escaped = escaped.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="token-comment">$1</span>');
    escaped = escaped.replace(/(&lt;\/?[a-zA-Z0-9-]+)/g, '<span class="token-tag">$1</span>');
    escaped = escaped.replace(/([a-zA-Z0-9-]+)=/g, '<span class="token-attr">$1</span>=');
    escaped = escaped.replace(/(&quot;[\s\S]*?&quot;|&#039;[\s\S]*?&#039;)/g, '<span class="token-string">$1</span>');
    return escaped;
  }

  const lines = code.split("\n");

  const highlightedLines = lines.map((line) => {
    let escaped = escapeHtml(line);

    // Single line comments
    if (escaped.trim().startsWith("//") || escaped.trim().startsWith("#") || escaped.trim().startsWith("--")) {
      return `<span class="token-comment">${escaped}</span>`;
    }

    // Strings
    escaped = escaped.replace(
      /(&quot;[\s\S]*?&quot;|&#039;[\s\S]*?&#039;|`[\s\S]*?`)/g,
      '<span class="token-string">$1</span>'
    );

    // Keywords
    const keywords = [
      "const", "let", "var", "function", "return", "if", "else", "for", "while",
      "import", "export", "default", "from", "class", "extends", "async", "await",
      "try", "catch", "throw", "new", "this", "typeof", "instanceof", "def", "elif",
      "public", "private", "protected", "void", "static", "final", "int", "float",
      "double", "char", "bool", "boolean", "string", "struct", "enum", "namespace",
      "using", "include", "package", "interface", "implements", "SELECT", "FROM",
      "WHERE", "INSERT", "UPDATE", "DELETE", "JOIN", "INTO", "VALUES", "GROUP",
      "ORDER", "BY", "HAVING", "LIMIT", "CREATE", "TABLE", "DROP", "ALTER",
      "echo", "sudo", "cd", "ls", "mkdir", "rm", "cp", "mv", "chmod", "chown",
      "git", "npm", "npx", "yarn", "docker"
    ];
    const keywordRegex = new RegExp(`\\b(${keywords.join("|")})\\b`, "g");
    escaped = escaped.replace(keywordRegex, '<span class="token-keyword">$1</span>');

    // Numbers
    escaped = escaped.replace(/\b(\d+(\.\d+)?)\b/g, '<span class="token-number">$1</span>');

    // Function calls
    escaped = escaped.replace(/\b([a-zA-Z_]\w*)(?=\()/g, '<span class="token-function">$1</span>');

    // Booleans / null / undefined
    escaped = escaped.replace(/\b(true|false|null|undefined|None|True|False|nil)\b/g, '<span class="token-boolean">$1</span>');

    return escaped;
  });

  return highlightedLines.join("\n");
}

export default function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);

  const cleanCode = String(code || "").replace(/\n$/, "");
  const langLabel = (language || "code").toLowerCase();

  const handleCopy = (e) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(cleanCode).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const html = highlightCode(cleanCode, langLabel);

  return (
    <div className="code-block-container">
      <div className="code-block-header">
        <div className="code-block-lang">
          <FiCode size={14} className="code-block-lang-icon" />
          <span>{langLabel}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className={`code-block-copy-btn ${copied ? "copied" : ""}`}
          title="Copy code"
        >
          {copied ? (
            <>
              <FiCheck size={14} />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <FiCopy size={14} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="code-block-content">
        <pre className="code-block-pre">
          <code
            className="code-block-code"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </pre>
      </div>
    </div>
  );
}
