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

export default function KeepEditor({ activeItem, kind, formRef, busy, dialogError, setDialogError, onSave }) {
  const [history, dispatch] = useReducer(editDraft, { item: activeItem, kind }, initialDraft);
  const draft = history.present;
  const [preview, setPreview] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const uploads = useRef(new WeakMap());
  const validation = keepContentError({ ...draft, file: draft.file || activeItem?.file });

  function setField(field, value) {
    setDialogError("");
    dispatch({ type: "change", field, value });
  }

  function handleHistoryKey(event) {
    if ((!event.ctrlKey && !event.metaKey) || event.altKey || event.nativeEvent.isComposing || busy) return;
    const key = event.key.toLowerCase();
    if (key !== "z" && key !== "y") return;
    event.preventDefault();
    dispatch({ type: key === "y" || event.shiftKey ? "redo" : "undo" });
  }

  function submit(event) {
    event.preventDefault();
    if (validation) {
      setDialogError(validation);
      return;
    }
    onSave(draft, uploads.current);
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
                aria-pressed={draft.type === kind} onClick={() => { setField("type", kind); setDialogError(""); }}>
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
          <label htmlFor={preview && draft.type === "text" ? undefined : "keep-content"}>
            {draft.type === "text" ? "Note" : "Description"} {draft.type !== "text" && <span>Optional</span>}
          </label>
          {draft.type === "text" && <button type="button" className="keep-text-btn" aria-pressed={preview}
            onClick={() => setPreview((value) => !value)}>{preview ? "Back to writing" : "Preview"}</button>}
        </div>
        {draft.type === "text" && preview ? (
          <div className="keep-note-preview keep-markdown">
            {draft.content ? <MarkdownRenderer content={draft.content} /> : "Your note is empty."}
          </div>
        ) : (
          <>
            {draft.type === "text" && (
              <div className="keep-md-toolbar" role="group" aria-label="Markdown formatting">
                {markdownTools.map((tool) => <KeepButton key={tool.label} icon={tool.icon} aria-label={tool.label}
                  title={tool.label} onClick={() => insertMarkdown(tool)} />)}
              </div>
            )}
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
            onClick={() => dispatch({ type: "undo" })} />
          <KeepButton icon={Redo2} title="Redo (Ctrl or ⌘ + Shift + Z)" aria-label="Redo" disabled={!history.future.length || busy}
            onClick={() => dispatch({ type: "redo" })} />
        </div>
        <button type="submit" className="keep-primary-btn" disabled={busy || Boolean(validation)} aria-keyshortcuts="Control+Enter Meta+Enter">
          {busy ? "Saving…" : activeItem ? "Save changes" : "Save to Keep"}
        </button>
      </footer>
    </form>
  );
}
