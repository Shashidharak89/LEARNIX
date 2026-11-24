"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FiArchive, FiArrowDown, FiCheck, FiChevronLeft, FiChevronRight, FiExternalLink, FiFile, FiImage, FiLink, FiLock, FiMapPin, FiMoreHorizontal, FiPlus, FiSearch, FiTable, FiTrash2, FiType, FiX, FiYoutube } from "react-icons/fi";
import { authFetch } from "@/lib/clientAuth";
import MarkdownRenderer from "../components/MarkdownRenderer";
import YouTubeEmbed from "../components/YouTubeEmbed";
import "./keep.css";

const INITIAL_DRAFT = { title: "", type: "text", content: "", url: "", file: null };
const youtubeId = (value = "") => value.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/)?.[1] || "";
const fmtDate = (value) => value ? new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "";

export default function KeepClient() {
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [signedIn, setSignedIn] = useState(null);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(INITIAL_DRAFT);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [queryReady, setQueryReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setPage(Math.max(1, Number(params.get("page")) || 1));
    setSearchInput(params.get("search") || "");
    setSearch(params.get("search") || "");
    setSignedIn(Boolean(localStorage.getItem("token") && localStorage.getItem("usn")));
    setQueryReady(true);
  }, []);

  const fetchItems = useCallback(async () => {
    if (!signedIn) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), size: String(size), search, type });
      const response = await authFetch(`/api/keep?${params}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load Keep.");
      setItems(data.items || []); setTotal(data.total || 0); setPages(data.pages || 0);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [signedIn, page, size, search, type]);

  useEffect(() => {
    if (!queryReady) return;
    const params = new URLSearchParams({ page: String(page), size: String(size), search });
    window.history.replaceState(null, "", `/keep${params.size ? `?${params}` : ""}`);
  }, [page, size, search, queryReady]);
  useEffect(() => { if (queryReady) fetchItems(); }, [fetchItems, queryReady]);

  const notify = (message) => { setToast(message); window.setTimeout(() => setToast(""), 2400); };
  const openNew = (newType = "text") => { setEditing(null); setDraft({ ...INITIAL_DRAFT, type: newType }); setError(""); setEditorOpen(true); };
  const openEdit = (item) => { setEditing(item); setDraft({ title: item.title, type: item.type, content: item.content || "", url: item.url || "", file: item.file || null }); setError(""); setEditorOpen(true); };
  const insertMarkdown = (before, after = "") => {
    const field = textareaRef.current;
    if (!field) return;
    const start = field.selectionStart; const end = field.selectionEnd;
    const selected = draft.content.slice(start, end) || "text";
    const next = `${draft.content.slice(0, start)}${before}${selected}${after}${draft.content.slice(end)}`;
    setDraft({ ...draft, content: next });
    requestAnimationFrame(() => { field.focus(); field.setSelectionRange(start + before.length, start + before.length + selected.length); });
  };

  const save = async (event) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      let file = draft.file;
      if (draft.type === "file" && file instanceof File) {
        const form = new FormData(); form.append("file", file);
        const uploadResponse = await authFetch("/api/keep/upload", { method: "POST", body: form });
        const uploadData = await uploadResponse.json();
        if (!uploadResponse.ok) throw new Error(uploadData.error || "Upload failed.");
        file = uploadData.file;
      }
      const payload = { title: draft.title, type: draft.type, content: draft.content, url: draft.url, file };
      const response = await authFetch(editing ? `/api/keep/${encodeURIComponent(editing.itemId)}` : "/api/keep", {
        method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save this item.");
      setEditorOpen(false); setDraft(INITIAL_DRAFT); setPage(1); notify(editing ? "Changes saved" : "Added to Keep");
      if (page === 1) await fetchItems();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  const togglePin = async (item) => {
    const response = await authFetch(`/api/keep/${encodeURIComponent(item.itemId)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pinned: !item.pinned }) });
    if (response.ok) { notify(item.pinned ? "Unpinned" : "Pinned to top"); fetchItems(); }
  };
  const remove = async (item) => {
    if (!window.confirm(`Delete “${item.title}”?`)) return;
    const response = await authFetch(`/api/keep/${encodeURIComponent(item.itemId)}`, { method: "DELETE" });
    if (response.ok) { notify("Item deleted"); fetchItems(); }
  };
  const downloadFile = async (item) => {
    try {
      const response = await authFetch(`/api/keep/${encodeURIComponent(item.itemId)}`);
      if (!response.ok) throw new Error("Could not download this file.");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a"); anchor.href = objectUrl; anchor.download = item.file?.name || "saved-file";
      document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(objectUrl);
    } catch (err) { setError(err.message); }
  };

  if (signedIn === null) return <main className="keep-shell"><div className="keep-loading" aria-label="Loading Keep" /></main>;
  if (!signedIn) return (
    <main className="keep-shell">
      <section className="keep-auth-card"><span className="keep-lock-icon"><FiLock /></span><p className="keep-eyebrow">YOUR PRIVATE COLLECTION</p><h1>Keep it all in one place.</h1><p>Save notes, links, and files to your personal Learnix space. Sign in to access them anywhere.</p><Link href={`/login?redirect=${encodeURIComponent("/keep")}`} className="keep-primary-btn">Sign in to Keep <FiLock /></Link></section>
    </main>
  );

  return (
    <main className="keep-shell">
      {toast && <div className="keep-toast" role="status"><FiCheck />{toast}</div>}
      <header className="keep-heading">
        <div><p className="keep-eyebrow">YOUR PERSONAL SPACE</p><h1><FiArchive /> Keep</h1><p className="keep-lede">Notes, links, and files worth keeping close.</p></div>
        <button className="keep-primary-btn" onClick={() => openNew()}><FiPlus /> New item</button>
      </header>
      <section className="keep-toolbar" aria-label="Search and filter Keep">
        <form className="keep-search" onSubmit={(event) => { event.preventDefault(); setPage(1); setSearch(searchInput.trim()); }}><FiSearch /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search your Keep" aria-label="Search your Keep" />{searchInput && <button type="button" onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }} aria-label="Clear search"><FiX /></button>}</form>
        <div className="keep-type-tabs" role="group" aria-label="Filter items">{[["all", "All"], ["text", "Notes"], ["link", "Links"], ["file", "Files"]].map(([value, label]) => <button key={value} className={type === value ? "is-active" : ""} onClick={() => { setType(value); setPage(1); }}>{label}</button>)}</div>
      </section>

      {error && !editorOpen && <div className="keep-inline-error">{error}</div>}
      {loading ? <div className="keep-loading" aria-label="Loading Keep" /> : items.length ? (
        <>
          <section className="keep-grid" aria-live="polite">
            {items.map((item) => {
              const videoId = youtubeId(item.url);
              return <article className={`keep-card keep-card--${item.type}`} key={item.itemId}>
                <div className="keep-card-top"><span className={`keep-kind keep-kind--${item.type}`}>{item.type === "text" ? <FiType /> : item.type === "link" ? <FiLink /> : <FiFile />}{item.type === "text" ? "Note" : item.type === "link" ? "Link" : "File"}</span><div className="keep-card-actions"><button title={item.pinned ? "Unpin" : "Pin to top"} aria-label={item.pinned ? "Unpin item" : "Pin item to top"} className={item.pinned ? "is-pinned" : ""} onClick={() => togglePin(item)}><FiMapPin /></button><button title="Edit" aria-label="Edit item" onClick={() => openEdit(item)}><FiMoreHorizontal /></button><button title="Delete" aria-label="Delete item" onClick={() => remove(item)}><FiTrash2 /></button></div></div>
                <h2>{item.title}</h2>
                {item.type === "text" && <div className="keep-markdown"><MarkdownRenderer content={item.content} /></div>}
                {item.type === "link" && <div className="keep-link-block">{videoId && <YouTubeEmbed ytId={videoId} wrapperClass="keep-video" />}<a href={item.url} target="_blank" rel="noreferrer" className="keep-url"><span>{item.url}</span><FiExternalLink /></a>{item.content && <p>{item.content}</p>}</div>}
                {item.type === "file" && <div className="keep-file-block"><div className="keep-file-icon"><FiFile /></div><div className="keep-file-info"><strong>{item.file?.name || "Saved file"}</strong><span>{item.file?.mimeType || "File"} · {Math.max(1, Math.round((item.file?.size || 0) / 1024))} KB</span></div><button type="button" className="keep-download" onClick={() => downloadFile(item)} aria-label={`Download ${item.file?.name || "file"}`}><FiArrowDown /></button></div>}
                <footer className="keep-card-footer"><span>{fmtDate(item.updatedAt || item.createdAt)}</span>{item.pinned && <span className="keep-pin-label"><FiMapPin /> Pinned</span>}</footer>
              </article>;
            })}
          </section>
          <div className="keep-pagination"><span>{total} {total === 1 ? "item" : "items"}</span><div><span>Page {page} of {Math.max(1, pages)}</span><button disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} aria-label="Previous page"><FiChevronLeft /></button><button disabled={page >= pages} onClick={() => setPage((value) => value + 1)} aria-label="Next page"><FiChevronRight /></button></div></div>
        </>
      ) : <section className="keep-empty"><span><FiArchive /></span><h2>{search || type !== "all" ? "Nothing here yet" : "Your Keep starts here"}</h2><p>{search || type !== "all" ? "Try a different search or filter." : "Save a thought, link, or file and find it here whenever you need it."}</p><button className="keep-primary-btn" onClick={() => openNew()}><FiPlus /> Create your first item</button></section>}

      {editorOpen && <div className="keep-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditorOpen(false); }}><section className="keep-modal" role="dialog" aria-modal="true" aria-labelledby="keep-editor-title"><header className="keep-modal-header"><div><p className="keep-eyebrow">{editing ? "UPDATE YOUR ITEM" : "ADD SOMETHING TO KEEP"}</p><h2 id="keep-editor-title">{editing ? "Edit item" : "New item"}</h2></div><button onClick={() => setEditorOpen(false)} aria-label="Close"><FiX /></button></header>
        <div className="keep-create-tabs">{[["text", <FiType />, "Note"], ["link", <FiLink />, "Link"], ["file", <FiFile />, "File"]].map(([value, icon, label]) => <button type="button" key={value} className={draft.type === value ? "is-active" : ""} disabled={Boolean(editing && draft.type !== value)} onClick={() => setDraft({ ...draft, type: value })}>{icon}{label}</button>)}</div>
        <form onSubmit={save} className="keep-editor-form"><label>Title <span>Optional</span><input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder={draft.type === "text" ? "Untitled note" : draft.type === "link" ? "A useful link" : "File name"} maxLength={180} /></label>
          {draft.type === "text" && <label>Note <div className="keep-md-toolbar"><button type="button" onClick={() => insertMarkdown("## ")} title="Heading">H</button><button type="button" onClick={() => insertMarkdown("**", "**")} title="Bold"><strong>B</strong></button><button type="button" onClick={() => insertMarkdown("[", "](https://example.com)")} title="Add link"><FiLink /></button><button type="button" onClick={() => insertMarkdown("![Image description](", ")")} title="Add image"><FiImage /></button><button type="button" onClick={() => insertMarkdown("| Column 1 | Column 2 |\n| --- | --- |\n| Value | Value |\n")} title="Add table"><FiTable /></button><button type="button" onClick={() => insertMarkdown("[Watch on YouTube](", ")")} title="Add YouTube link"><FiYoutube /></button></div><textarea ref={textareaRef} rows={9} value={draft.content} onChange={(event) => setDraft({ ...draft, content: event.target.value })} placeholder="Write freely. Markdown formatting, lists, links, images, and tables are supported." /></label>}
          {draft.type === "link" && <><label>URL<input type="url" value={draft.url} onChange={(event) => setDraft({ ...draft, url: event.target.value })} placeholder="https://…" required /></label><label>Note <span>Optional</span><textarea rows={4} value={draft.content} onChange={(event) => setDraft({ ...draft, content: event.target.value })} placeholder="Add a few words about this link" /></label>{draft.url && youtubeId(draft.url) && <p className="keep-youtube-hint"><FiYoutube /> YouTube link detected. It will appear with an embedded preview.</p>}</>}
          {draft.type === "file" && <div className="keep-upload-area" onClick={() => !busy && fileInputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files?.[0]; if (file) setDraft({ ...draft, file }); }}><input ref={fileInputRef} type="file" onChange={(event) => setDraft({ ...draft, file: event.target.files?.[0] || null })} hidden /><span><FiFile /></span><strong>{draft.file?.name || "Choose a file or drop it here"}</strong><small>Files up to 20 MB · Stored privately</small></div>}
          {error && <p className="keep-form-error" role="alert">{error}</p>}<footer className="keep-editor-footer"><span><FiLock /> Only you can access these items</span><button type="submit" className="keep-primary-btn" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Save to Keep"}</button></footer>
        </form></section></div>}
    </main>
  );
}
