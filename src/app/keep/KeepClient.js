"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  BoldIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon, DownloadIcon, ExternalLinkIcon,
  FileIcon, FileSpreadsheetIcon, FileTextIcon, FolderIcon, HeadingIcon, ImageIcon,
  KeyboardIcon, LinkIcon, LockIcon, PencilIcon, PinIcon, PinOffIcon, PlusIcon, SearchIcon,
  Trash2Icon, XIcon,
} from "@animateicons/react/lucide";
import { authFetch } from "@/lib/clientAuth";
import { KEEP_CONTENT_LIMIT, KEEP_FILE_LIMIT, KEEP_PAGE_SIZE, KEEP_TYPES, keepPageNumber, keepWebUrl, keepYouTubeId } from "@/lib/keepFields";
import MarkdownRenderer from "../components/MarkdownRenderer";
import YouTubeEmbed from "../components/YouTubeEmbed";
import { KeepButton } from "./keepIcons";
import "./keep.css";

const EMPTY_DRAFT = { title: "", content: "", url: "", file: null, type: "text" };
const kinds = {
  text: { label: "Note", filter: "Notes", icon: FileTextIcon },
  link: { label: "Link", filter: "Links", icon: LinkIcon },
  file: { label: "File", filter: "Files", icon: FileIcon },
};
const shortcuts = [
  ["N", "Create an item"],
  ["/", "Focus Keep search"],
  ["?", "Show keyboard shortcuts"],
  ["Ctrl / ⌘ + Enter", "Save the item you’re editing"],
  ["Esc", "Close the dialog"],
];
const markdownTools = [
  { label: "Heading", icon: HeadingIcon, before: "\n\n## ", fallback: "Heading" },
  { label: "Bold", icon: BoldIcon, before: "**", after: "**", fallback: "text" },
  { label: "Add link", icon: LinkIcon, before: "[", after: "](https://example.com)", fallback: "Link text" },
  { label: "Add image URL", icon: ImageIcon, before: "![Image description](", after: ")", fallback: "https://example.com/image.png" },
  { label: "Add table", icon: FileSpreadsheetIcon, snippet: "\n\n| Column 1 | Column 2 |\n| --- | --- |\n| Value | Value |\n\n" },
  { label: "Add YouTube link", icon: ExternalLinkIcon, before: "[Watch on YouTube](", after: ")", fallback: "https://www.youtube.com/watch?v=" },
];

const itemPath = (id) => `/api/keep/${encodeURIComponent(id)}`;
const json = (method, body) => ({ method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

function ItemContent({ item, full, onDownload, busy }) {
  const url = keepWebUrl(item.url);
  const videoId = full && keepYouTubeId(item.url);

  return (
    <>
      {item.type === "link" && url && (
        <div className="keep-link-block">
          {videoId && <YouTubeEmbed key={videoId} ytId={videoId} wrapperClass="keep-video" />}
          <a href={url.href} target="_blank" rel="noreferrer" className="keep-url">
            <span>{item.url}</span><ExternalLinkIcon size={15} aria-hidden="true" />
          </a>
        </div>
      )}
      {item.type === "file" && item.file && (
        <div className="keep-file-block">
          <span className="keep-file-icon"><FileIcon size={18} aria-hidden="true" /></span>
          <div className="keep-file-info">
            <strong title={item.file.name}>{item.file.name}</strong>
            <span>{Math.ceil(item.file.size / 1024)} KB</span>
          </div>
          <KeepButton icon={DownloadIcon} className="keep-download" disabled={busy}
            title="Download" aria-label={`Download ${item.file.name}`} onClick={() => onDownload(item)} />
        </div>
      )}
      {item.content && (
        <div className="keep-markdown">
          <MarkdownRenderer content={full ? item.content : item.content.slice(0, 450) + (item.content.length > 450 ? "…" : "")} />
        </div>
      )}
    </>
  );
}

export default function KeepClient() {
  const searchRef = useRef(null);
  const dialogRef = useRef(null);
  const formRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const busyRef = useRef(false);
  const [signedIn, setSignedIn] = useState(null);
  const [entry, setEntry] = useState("");
  const [loginPath, setLoginPath] = useState("/keep");
  const [result, setResult] = useState({ items: [], total: 0, pages: 0, page: 1 });
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(KEEP_PAGE_SIZE);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [dialogError, setDialogError] = useState("");
  const [modal, setModal] = useState(null);
  const [activeItem, setActiveItem] = useState(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [preview, setPreview] = useState(false);
  const [pending, setPending] = useState("");
  const [toast, setToast] = useState("");

  const request = useCallback(async (url, init) => {
    const response = await authFetch(url, init);
    init?.signal?.throwIfAborted();
    if (response.status === 401) {
      setSignedIn(false);
      setModal(null);
      setDraft(EMPTY_DRAFT);
      setActiveItem(null);
      setResult({ items: [], total: 0, pages: 0, page: 1 });
    }
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Could not complete the request. Try again.");
    }
    return response;
  }, []);

  useEffect(() => {
    function readLocation() {
      const params = new window.URLSearchParams(window.location.search);
      const item = params.get("item");
      setEntry(item || (params.get("new") === "1" ? "new" : ""));
      setLoginPath(window.location.pathname + window.location.search);
      setPage(keepPageNumber(params.get("page")));
      setSize(Math.min(50, keepPageNumber(params.get("size"), KEEP_PAGE_SIZE)));
      const query = (params.get("search") || "").slice(0, 200);
      setSearchInput(query);
      setSearch(query.trim());
      const filter = params.get("type");
      setType(KEEP_TYPES.includes(filter) ? filter : "all");
    }
    readLocation();
    setSignedIn(Boolean(localStorage.getItem("token")));
    window.addEventListener("popstate", readLocation);
    return () => window.removeEventListener("popstate", readLocation);
  }, []);

  useEffect(() => {
    if (!signedIn) return;
    const params = new window.URLSearchParams({ page, size, search });
    if (type !== "all") params.set("type", type);
    if (entry) params.set(entry === "new" ? "new" : "item", entry === "new" ? "1" : entry);
    window.history.replaceState(window.history.state, "", `/keep?${params}`);
  }, [page, size, search, type, signedIn, entry]);

  useEffect(() => {
    if (!signedIn) return;
    const controller = new window.AbortController();
    const params = new window.URLSearchParams({ page, size, search, type });
    setLoading(true);
    setLoadError("");
    request(`/api/keep?${params}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((data) => {
        if (!controller.signal.aborted) {
          setResult(data);
          if (data.page !== page) setPage(data.page);
        }
      })
      .catch((error) => { if (!controller.signal.aborted) setLoadError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, size, search, type, signedIn, revision, request]);

  useEffect(() => {
    if (searchInput.trim() === search) return;
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchInput, search]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const openEditor = useCallback((item = null, kind = "text") => {
    setActiveItem(item);
    setDraft(item ? { ...EMPTY_DRAFT, ...item, file: null } : { ...EMPTY_DRAFT, type: kind });
    setPreview(false);
    setDialogError("");
    setModal("editor");
  }, []);

  const openItem = useCallback((item) => {
    setActiveItem(item);
    setDialogError("");
    setModal("view");
  }, []);

  useEffect(() => {
    if (!entry || !signedIn) return;
    const controller = new window.AbortController();
    if (entry === "new") {
      openEditor();
      setEntry("");
    } else {
      request(`${itemPath(entry)}?view=1`, { signal: controller.signal })
        .then((response) => response.json())
        .then(({ item }) => { if (!controller.signal.aborted) openItem(item); })
        .catch((error) => { if (!controller.signal.aborted) setActionError(error.message); })
        .finally(() => { if (!controller.signal.aborted) setEntry(""); });
    }
    return () => controller.abort();
  }, [entry, signedIn, openEditor, openItem, request]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!modal) {
      if (dialog.open) dialog.close();
      return;
    }
    if (!dialog.open) dialog.showModal();
    dialog.querySelector(modal === "editor" ? "#keep-title" : ".keep-dialog-close")?.focus();
  }, [modal, signedIn]);

  useEffect(() => {
    if (!signedIn) return;
    function onKeyDown(event) {
      if (event.defaultPrevented || event.isComposing || event.repeat) return;
      if (modal === "editor" && (event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        if (!busyRef.current) formRef.current?.requestSubmit();
        return;
      }
      if (modal || event.ctrlKey || event.metaKey || event.altKey ||
          document.querySelector("dialog[open], [aria-modal='true']") ||
          event.target.closest?.("input, textarea, select, [contenteditable], [role='textbox']")) return;
      if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        openEditor();
      } else if (event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      } else if (event.key === "?") {
        event.preventDefault();
        setModal("shortcuts");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modal, openEditor, signedIn]);

  function closeDialog() {
    if (!busyRef.current) {
      setModal(null);
      setDialogError("");
    }
  }

  function setField(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function selectFile(file) {
    if (!file || busyRef.current) return;
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

  async function runAction(key, action, reportError) {
    if (busyRef.current) return;
    busyRef.current = true;
    setPending(key);
    reportError("");
    try {
      await action();
    } catch (error) {
      reportError(error.message);
    } finally {
      busyRef.current = false;
      setPending("");
    }
  }

  function save(event) {
    event.preventDefault();
    runAction("save", async () => {
      const url = draft.type === "link" ? keepWebUrl(draft.url) : null;
      if (draft.type === "link" && !url) throw new Error("Enter a valid HTTP or HTTPS link.");
      let file = draft.type === "file" ? draft.file : null;
      if (draft.type === "file" && !file && !activeItem?.file) throw new Error("Choose a file to upload.");
      if (file instanceof File) {
        const form = new FormData();
        form.append("file", file);
        const response = await request("/api/keep/upload", { method: "POST", body: form });
        ({ file } = await response.json());
        setField("file", file);
      }
      const { title, type: kind, content } = draft;
      const payload = { title, type: kind, content, url: url?.href, file };
      await request(activeItem ? itemPath(activeItem.itemId) : "/api/keep", json(activeItem ? "PATCH" : "POST", payload));
      if (!activeItem) {
        setSearchInput("");
        setSearch("");
        setType("all");
        setPage(1);
      }
      setModal(null);
      setRevision((value) => value + 1);
      setToast(activeItem ? "Changes saved" : "Added to Keep");
    }, setDialogError);
  }

  function togglePin(item) {
    runAction(item.itemId, async () => {
      await request(itemPath(item.itemId), json("PATCH", { pinned: !item.pinned }));
      setRevision((value) => value + 1);
      setToast(item.pinned ? "Unpinned" : "Pinned to top");
    }, setActionError);
  }

  function remove(item) {
    if (!window.confirm(`Delete “${item.title}”?`)) return;
    runAction(item.itemId, async () => {
      await request(itemPath(item.itemId), { method: "DELETE" });
      setRevision((value) => value + 1);
      setToast("Item deleted");
    }, setActionError);
  }

  function download(item) {
    runAction(item.itemId, async () => {
      const response = await request(itemPath(item.itemId));
      const objectUrl = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = item.file?.name || "saved-file";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    }, modal === "view" ? setDialogError : setActionError);
  }

  if (signedIn === null) return <main className="keep-shell"><div className="keep-loading" role="status" aria-label="Loading Keep" /></main>;
  if (!signedIn) return (
    <main className="keep-shell">
      <section className="keep-auth-card">
        <span className="keep-lock-icon"><LockIcon aria-hidden="true" /></span>
        <h1>Keep</h1>
        <p>Sign in to access your private notes, links, and files.</p>
        <Link href={`/login?redirect=${encodeURIComponent(loginPath)}`} className="keep-primary-btn">Sign in to Keep</Link>
      </section>
    </main>
  );

  const { items, total, pages } = result;
  const filtered = search || type !== "all";
  return (
    <main className="keep-shell">
      {toast && <div className="keep-toast" role="status"><CheckIcon size={17} aria-hidden="true" />{toast}</div>}
      <header className="keep-heading">
        <div>
          <Link href="/workspace" className="keep-workspace-link">My Workspace</Link>
          <h1><FolderIcon aria-hidden="true" /> Keep</h1>
          <p className="keep-lede">Your private notes, links, and files.</p>
        </div>
        <div className="keep-heading-actions">
          <KeepButton icon={KeyboardIcon} className="keep-secondary-btn" onClick={() => setModal("shortcuts")} aria-keyshortcuts="?">
            Shortcuts
          </KeepButton>
          <KeepButton icon={PlusIcon} className="keep-primary-btn" onClick={() => openEditor()} aria-keyshortcuts="N">
            New item
          </KeepButton>
        </div>
      </header>

      <section className="keep-toolbar" aria-label="Search and filter Keep">
        <form className="keep-search" role="search" onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setSearch(searchInput.trim());
        }}>
          <SearchIcon size={17} aria-hidden="true" />
          <input ref={searchRef} type="search" value={searchInput} maxLength={200}
            onChange={(event) => setSearchInput(event.target.value)} placeholder="Search your Keep"
            aria-label="Search your Keep" aria-keyshortcuts="/" />
          {searchInput && <KeepButton icon={XIcon} onClick={() => {
            setSearchInput("");
            setSearch("");
            setPage(1);
            searchRef.current?.focus();
          }} aria-label="Clear search" />}
        </form>
        <div className="keep-type-tabs" role="group" aria-label="Filter items">
          {["all", ...KEEP_TYPES].map((kind) => (
            <button key={kind} type="button" className={type === kind ? "is-active" : ""} aria-pressed={type === kind}
              onClick={() => { setType(kind); setPage(1); }}>
              {kind === "all" ? "All" : kinds[kind].filter}
            </button>
          ))}
        </div>
      </section>

      {actionError && <p className="keep-inline-error" role="alert">{actionError}</p>}
      {loadError ? (
        <section className="keep-empty">
          <h2>Keep couldn’t load</h2>
          <p role="alert">{loadError}</p>
          <button type="button" className="keep-secondary-btn" onClick={() => setRevision((value) => value + 1)}>Try again</button>
        </section>
      ) : loading && !items.length ? (
        <div className="keep-loading" role="status" aria-label="Loading Keep" />
      ) : items.length ? (
        <>
          <section className="keep-grid" aria-label="Saved items" aria-busy={loading}>
            {items.map((item) => {
              const { icon: Icon, label } = kinds[item.type] || kinds.text;
              return (
                <article className={`keep-card keep-card--${item.type}`} key={item.itemId}>
                  <div className="keep-card-top">
                    <span className={`keep-kind keep-kind--${item.type}`}><Icon size={14} aria-hidden="true" />{label}</span>
                    <div className="keep-card-actions">
                      <KeepButton icon={item.pinned ? PinOffIcon : PinIcon} title={item.pinned ? "Unpin" : "Pin to top"}
                        aria-label={item.pinned ? `Unpin ${item.title}` : `Pin ${item.title} to top`}
                        className={item.pinned ? "is-pinned" : ""} disabled={Boolean(pending)} onClick={() => togglePin(item)} />
                      <KeepButton icon={PencilIcon} title="Edit" aria-label={`Edit ${item.title}`}
                        disabled={Boolean(pending)} onClick={() => openEditor(item)} />
                      <KeepButton icon={Trash2Icon} title="Delete" aria-label={`Delete ${item.title}`}
                        disabled={Boolean(pending)} onClick={() => remove(item)} />
                    </div>
                  </div>
                  <h2><button type="button" className="keep-item-title" onClick={() => openItem(item)}>{item.title}</button></h2>
                  <ItemContent item={item} onDownload={download} busy={Boolean(pending)} />
                  <footer className="keep-card-footer">
                    <time dateTime={item.updatedAt || item.createdAt}>
                      {new Date(item.updatedAt || item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </time>
                    {item.pinned && <span className="keep-pin-label"><PinIcon size={13} aria-hidden="true" /> Pinned</span>}
                  </footer>
                </article>
              );
            })}
          </section>
          <div className="keep-pagination">
            <span role="status">{total} {total === 1 ? "item" : "items"}</span>
            <div>
              <span>Page {result.page} of {pages}</span>
              <KeepButton icon={ChevronLeftIcon} disabled={loading || result.page <= 1} onClick={() => setPage(result.page - 1)} aria-label="Previous page" />
              <KeepButton icon={ChevronRightIcon} disabled={loading || result.page >= pages} onClick={() => setPage(result.page + 1)} aria-label="Next page" />
            </div>
          </div>
        </>
      ) : (
        <section className="keep-empty">
          <span><FolderIcon aria-hidden="true" /></span>
          <h2>{filtered ? "No matching items" : "Your Keep starts here"}</h2>
          <p>{filtered ? "Try a different search or filter." : "Save a note, link, or file to find it here later."}</p>
          {filtered ? (
            <button type="button" className="keep-secondary-btn" onClick={() => {
              setSearchInput(""); setSearch(""); setType("all"); setPage(1);
            }}>Clear filters</button>
          ) : (
            <div className="keep-heading-actions">
              {KEEP_TYPES.map((kind) => (
                <KeepButton key={kind} icon={kinds[kind].icon} className="keep-secondary-btn"
                  onClick={() => openEditor(null, kind)}>Add {kinds[kind].label.toLowerCase()}</KeepButton>
              ))}
            </div>
          )}
        </section>
      )}

      <dialog ref={dialogRef} className={`keep-modal${modal === "view" ? " keep-modal-view" : ""}`}
        aria-labelledby="keep-dialog-title" onCancel={(event) => { event.preventDefault(); closeDialog(); }}>
        {modal && (
          <>
            <header className="keep-modal-header">
              <h2 id="keep-dialog-title">
                {modal === "shortcuts" ? "Keyboard shortcuts" : modal === "view" ? activeItem?.title : activeItem ? "Edit item" : "New item"}
              </h2>
              <KeepButton icon={XIcon} className="keep-dialog-close" onClick={closeDialog} aria-label="Close dialog" disabled={Boolean(pending)} />
            </header>
            {modal === "shortcuts" && (
              <dl className="keep-shortcuts">{shortcuts.map(([key, description]) => (
                <div key={key}><dt><kbd>{key}</kbd></dt><dd>{description}</dd></div>
              ))}</dl>
            )}
            {modal === "view" && activeItem && (
              <>
                <ItemContent item={activeItem} full onDownload={download} busy={Boolean(pending)} />
                {dialogError && <p className="keep-form-error" role="alert">{dialogError}</p>}
                <footer className="keep-editor-footer">
                  <KeepButton icon={PencilIcon} className="keep-secondary-btn" onClick={() => openEditor(activeItem)} disabled={Boolean(pending)}>Edit item</KeepButton>
                </footer>
              </>
            )}
            {modal === "editor" && (
              <form ref={formRef} onSubmit={save} className="keep-editor-form">
                <fieldset disabled={pending === "save"}>
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
                      <textarea id="keep-content" ref={textareaRef} rows={draft.type === "text" ? 8 : 3}
                        maxLength={KEEP_CONTENT_LIMIT} value={draft.content} onChange={(event) => setField("content", event.target.value)}
                        placeholder={draft.type === "text" ? "Write a note in plain text or Markdown…" : "Add context for later…"} />
                    </>
                  )}
                </fieldset>
                {dialogError && <p className="keep-form-error" role="alert">{dialogError}</p>}
                <footer className="keep-editor-footer">
                  <span><LockIcon size={14} aria-hidden="true" /> Private to you</span>
                  <button type="submit" className="keep-primary-btn" disabled={Boolean(pending)} aria-keyshortcuts="Control+Enter Meta+Enter">
                    {pending === "save" ? "Saving…" : activeItem ? "Save changes" : "Save to Keep"}
                  </button>
                </footer>
              </form>
            )}
          </>
        )}
      </dialog>
    </main>
  );
}
