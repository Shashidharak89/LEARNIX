"use client";

import { useReducer, useRef, useState } from "react";
import { Undo2, Redo2 } from "lucide-react";
import { BoldIcon, ExternalLinkIcon, FileIcon, FileSpreadsheetIcon, HeadingIcon, ImageIcon, LinkIcon } from "@animateicons/react/lucide";
import { KEEP_TYPES, KEEP_CONTENT_LIMIT, KEEP_FILE_LIMIT, keepContentError, keepYouTubeId } from "@/lib/keepFields";
import MarkdownRenderer from "../components/MarkdownRenderer";
import { KeepButton } from "./keepIcons";
import { kinds } from "./keepKinds";
import { editDraft, initialDraft } from "./keepDraft";

const markdownTools = [
  { label: "Heading", icon: HeadingIcon, before: "\n\n## ", fallback: "Heading" },
  { label: "Bold", icon: BoldIcon, before: "**", after: "**", fallback: "text" },
  { label: "Add link", icon: LinkIcon, before: "[", after: "](https://example.com)", fallback: "Link text" },
  { label: "Add image URL", icon: ImageIcon, before: "![Image description](", after: ")", fallback: "https://example.com/image.png" },
  { label: "Add table", icon: FileSpreadsheetIcon, snippet: "\n\n| Column 1 | Column 2 |\n| --- | --- |\n| Value | Value |\n\n" },
  { label: "Add YouTube link", icon: ExternalLinkIcon, before: "[Watch on YouTube](", after: ")", fallback: "https://www.youtube.com/watch?v=" },
];

function htmlToMarkdown(root) {
  if (!root) return "";

  const render = (node) => {
    if (node.nodeType === 3) return node.nodeValue || "";
    if (node.nodeType !== 1) return "";
    const tag = node.tagName.toLowerCase();
    const children = Array.from(node.childNodes).map(render).join("");
    if (tag === "br") return "\n";
    if (tag === "strong" || tag === "b") return `**${children}**`;
    if (tag === "em" || tag === "i") return `*${children}*`;
    if (tag === "del" || tag === "s" || tag === "strike") return `~~${children}~~`;
    if (/^h[1-6]$/.test(tag)) return `${"#".repeat(Number(tag[1]))} ${children.trim()}\n\n`;
    if (tag === "p") return `${children.trim()}\n\n`;
    if (tag === "a") {
      const href = node.getAttribute("href") || "";
      return href ? `[${children.trim() || href}](${href})` : children;
    }
    if (tag === "img") {
      const src = node.getAttribute("src") || "";
      return src ? `![${node.getAttribute("alt") || "Image"}](${src})` : "";
    }
    if (tag === "pre") {
      const code = node.querySelector("code");
      return `\n\n\`\`\`\n${(code?.textContent || node.textContent || "").replace(/\n+$/, "")}\n\`\`\`\n\n`;
    }
    if (tag === "code") return `\`${children}\``;
    if (tag === "blockquote") return `${children.trim().split("\n").map((line) => `> ${line}`).join("\n")}\n\n`;
    if (tag === "ul" || tag === "ol") {
      const items = Array.from(node.children).filter((child) => child.tagName?.toLowerCase() === "li");
      return `${items.map((item, index) => `${tag === "ol" ? `${index + 1}.` : "-"} ${Array.from(item.childNodes).map(render).join("").trim()}`).join("\n")}\n\n`;
    }
    if (tag === "table") {
      const rows = Array.from(node.querySelectorAll("tr")).map((row) => Array.from(row.children)
        .filter((cell) => ["th", "td"].includes(cell.tagName.toLowerCase()))
        .map((cell) => Array.from(cell.childNodes).map(render).join("").replace(/\|/g, "\\|").trim()));
      if (!rows.length) return "";
      const line = (cells) => `| ${cells.join(" | ")} |`;
      const header = rows[0];
      return `\n\n${line(header)}\n${line(header.map(() => "---"))}${rows.slice(1).map((row) => `\n${line(row)}`).join("")}\n\n`;
    }
    if (tag === "hr") return "\n\n---\n\n";
    if (tag === "div" || tag === "section") {
      const codeBlock = node.classList.contains("code-block-container") ? node.querySelector("pre") : null;
      if (codeBlock) return render(codeBlock);
      return `${children}\n\n`;
    }
    return children;
  };

  return Array.from(root.childNodes).map(render).join("")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function KeepEditor({ activeItem, kind, formRef, busy, dialogError, setDialogError, onSave }) {
  const [history, dispatch] = useReducer(editDraft, { item: activeItem, kind }, initialDraft);
  const draft = history.present;
  const [preview, setPreview] = useState(() => (activeItem?.type || kind) === "text");
  const [richContent, setRichContent] = useState(() => draft.content);
  const textareaRef = useRef(null);
  const previewRef = useRef(null);
  const fileInputRef = useRef(null);
  const uploads = useRef(new WeakMap());
  const validation = keepContentError({
    ...draft,
    content: preview && draft.type === "text" ? richContent : draft.content,
    file: draft.file || activeItem?.file,
  });

  function setField(field, value) {
    setDialogError("");
    if (field === "content") setRichContent(value);
    dispatch({ type: "change", field, value });
  }

  function applyHistory(actionType) {
    if (actionType === "undo" && history.past.length) setRichContent(history.past.at(-1).content);
    if (actionType === "redo" && history.future.length) setRichContent(history.future[0].content);
    dispatch({ type: actionType });
  }

  function handleHistoryKey(event) {
    if ((!event.ctrlKey && !event.metaKey) || event.altKey || event.nativeEvent.isComposing || busy) return;
    const key = event.key.toLowerCase();
    if (key !== "z" && key !== "y") return;
    if (preview && previewRef.current?.contains(event.target)) return;
    event.preventDefault();
    applyHistory(key === "y" || event.shiftKey ? "redo" : "undo");
  }

  function submit(event) {
    event.preventDefault();
    const nextDraft = preview && draft.type === "text" && previewRef.current
      ? { ...draft, content: htmlToMarkdown(previewRef.current) }
      : draft;
    const nextValidation = keepContentError({ ...nextDraft, file: nextDraft.file || activeItem?.file });
    if (nextValidation) {
      setDialogError(nextValidation);
      return;
    }
    onSave(nextDraft, uploads.current);
  }

  function commitRichDraft() {
    if (!previewRef.current || draft.type !== "text") return;
    const content = htmlToMarkdown(previewRef.current);
    if (content !== draft.content) setField("content", content);
  }

  function applyPreviewTool(tool) {
    const editor = previewRef.current;
    if (!editor) return;
    editor.focus();
    const selection = window.getSelection();
    const selectedText = selection?.toString() || "";
    const safe = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
    const insert = (html) => document.execCommand("insertHTML", false, html);

    switch (tool.label) {
      case "Heading":
        document.execCommand("formatBlock", false, "h2");
        break;
      case "Bold":
        document.execCommand("bold");
        break;
      case "Add link":
        if (selectedText) document.execCommand("createLink", false, "https://example.com");
        else insert('<a href="https://example.com">Link text</a>');
        break;
      case "Add image URL":
        insert('<img src="https://example.com/image.png" alt="Image description" />');
        break;
      case "Add table":
        insert("<table><thead><tr><th>Column 1</th><th>Column 2</th></tr></thead><tbody><tr><td>Value</td><td>Value</td></tr></tbody></table><p><br /></p>");
        break;
      case "Add YouTube link":
        insert(`<a href="https://www.youtube.com/watch?v=">${safe(selectedText || "Watch on YouTube")}</a>`);
        break;
      default:
        break;
    }
    setRichContent(htmlToMarkdown(editor));
    setDialogError("");
  }

  function selectFile(file) {
    if (!file || busy) return;
    if (file.size > KEEP_FILE_LIMIT) {
      setDialogError("Choose a file that is 20 MB or smaller.");
      return;
    }
    setDialogError("");
    setField("file", file);
  }

  function insertMarkdown({ before = "", after = "", fallback = "", snippet }) {
    const field = textareaRef.current;
    if (!field) return;
    const { selectionStart: start, selectionEnd: end } = field;
    const selected = draft.content.slice(start, end) || fallback;
    const text = snippet || before + selected + after;
    const content = draft.content.slice(0, start) + text + draft.content.slice(end);
    if (content.length > KEEP_CONTENT_LIMIT) return;
    setField("content", content);
    window.requestAnimationFrame(() => {
      field.focus();
      const selection = snippet ? start + text.length : start + before.length;
      field.setSelectionRange(selection, snippet ? selection : selection + selected.length);
    });
  }

  return (
    <form ref={formRef} onSubmit={submit} onKeyDown={handleHistoryKey} className="keep-editor-form">
      <fieldset disabled={busy}>
        {!activeItem && (
          <div className="keep-create-tabs" role="group" aria-label="Item type">
            {KEEP_TYPES.map((kind) => (
              <KeepButton key={kind} icon={kinds[kind].icon} className={draft.type === kind ? "is-active" : ""}
                aria-pressed={draft.type === kind} onClick={() => { commitRichDraft(); setField("type", kind); setPreview(kind === "text"); setDialogError(""); }}>
                {kinds[kind].label}
              </KeepButton>
            ))}
          </div>
        )}
        <label htmlFor="keep-title">Title <span>Optional</span></label>
        <input id="keep-title" value={draft.title} onChange={(event) => setField("title", event.target.value)}
          placeholder="Untitled" maxLength={180} />
        {draft.type === "link" && (
          <>
            <label htmlFor="keep-url">URL</label>
            <input id="keep-url" type="url" value={draft.url} maxLength={2048} required autoComplete="off"
              onChange={(event) => setField("url", event.target.value)} placeholder="https://…" />
            {keepYouTubeId(draft.url) && <p className="keep-youtube-hint">This item will open with a YouTube player.</p>}
          </>
        )}
        {draft.type === "file" && (
          <>
            <input ref={fileInputRef} type="file" hidden onChange={(event) => {
              selectFile(event.target.files?.[0]);
              event.target.value = "";
            }} />
            <button type="button" className="keep-upload-area" onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
                event.preventDefault();
                selectFile(event.dataTransfer.files?.[0]);
              }}>
              <span><FileIcon aria-hidden="true" /></span>
              <strong>{draft.file?.name || activeItem?.file?.name || "Choose a file or drop it here"}</strong>
              <small>{draft.file || activeItem?.file ? "Choose a different file" : "Up to 20 MB"}</small>
            </button>
          </>
        )}
        <div className="keep-note-label">
          <label id="keep-content-label" htmlFor={draft.type === "text" && preview ? undefined : "keep-content"}>
            {draft.type === "text" ? "Note" : "Description"} {draft.type !== "text" && <span>Optional</span>}
          </label>
          {draft.type === "text" && (
            <div className="keep-note-modes" role="tablist" aria-label="Note editor mode">
              <button type="button" role="tab" aria-selected={preview} className={preview ? "is-active" : ""}
                onClick={() => { commitRichDraft(); setPreview(true); }}>Preview</button>
              <button type="button" role="tab" aria-selected={!preview} className={!preview ? "is-active" : ""}
                onClick={() => { commitRichDraft(); setPreview(false); }}>Markdown</button>
            </div>
          )}
        </div>
        {draft.type === "text" && (
          <div className="keep-md-toolbar" role="group" aria-label="Formatting tools">
            {markdownTools.map((tool) => <KeepButton key={tool.label} icon={tool.icon} aria-label={tool.label}
              title={tool.label} onMouseDown={(event) => { if (preview) event.preventDefault(); }}
              onClick={() => preview ? applyPreviewTool(tool) : insertMarkdown(tool)} />)}
          </div>
        )}
        {draft.type === "text" && preview ? (
          <div ref={previewRef} className="keep-note-preview keep-markdown keep-rich-editor" contentEditable={!busy}
            suppressContentEditableWarning role="textbox" aria-multiline="true" aria-labelledby="keep-content-label"
            aria-label="Formatted note editor" data-placeholder="Start writing your note…"
            onInput={(event) => { setRichContent(htmlToMarkdown(event.currentTarget)); setDialogError(""); }}
            onClick={(event) => { if (event.target.closest("a")) event.preventDefault(); }}
            onBlur={commitRichDraft}>
            {draft.content ? <MarkdownRenderer content={draft.content} /> : null}
          </div>
        ) : (
          <>
            <textarea id="keep-content" required={draft.type === "text"} ref={textareaRef} rows={draft.type === "text" ? 8 : 3}
              maxLength={KEEP_CONTENT_LIMIT} value={draft.content} onChange={(event) => setField("content", event.target.value)}
              placeholder={draft.type === "text" ? "Write a note in plain text or Markdown…" : "Add context for later…"} />
          </>
        )}
      </fieldset>
      {!dialogError && validation && <p className="keep-validation">{validation}</p>}
      {dialogError && <p className="keep-form-error" role="alert">{dialogError}</p>}
      <footer className="keep-editor-footer">
        <div className="keep-history-actions" role="group" aria-label="Edit history">
          <KeepButton icon={Undo2} title="Undo (Ctrl or ⌘ + Z)" aria-label="Undo" disabled={!history.past.length || busy}
            onMouseDown={(event) => { if (preview) event.preventDefault(); }} onClick={() => applyHistory("undo")} />
          <KeepButton icon={Redo2} title="Redo (Ctrl or ⌘ + Shift + Z)" aria-label="Redo" disabled={!history.future.length || busy}
            onMouseDown={(event) => { if (preview) event.preventDefault(); }} onClick={() => applyHistory("redo")} />
        </div>
        <button type="submit" className="keep-primary-btn" disabled={busy || Boolean(validation)} aria-keyshortcuts="Control+Enter Meta+Enter">
          {busy ? "Saving…" : activeItem ? "Save changes" : "Save to Keep"}
        </button>
      </footer>
    </form>
  );
}
