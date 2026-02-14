"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { FiTrash2, FiEdit2, FiSave, FiX } from "react-icons/fi";

export default function UpdatesList() {
  const [updates, setUpdates] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [toast, setToast] = useState(null);
  const pendingRef = useRef({});
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editLinksText, setEditLinksText] = useState("");

  const fetchPage = async (p = 1, append = false) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/updates/latest?index=${p}`);
      if (!res.ok) throw new Error("Failed to load updates");
      const data = await res.json();
      const items = data?.updates || [];
      setHasMore(items.length === 10);
      setUpdates((prev) => (append ? [...prev, ...items] : items));
    } catch (err) {
      console.error(err);
      setToast("Failed to load updates");
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage(1, false);

    const usn =
      typeof window !== "undefined" ? localStorage.getItem("usn") : null;
    if (!usn) return;

    (async () => {
      try {
        const res = await fetch(
          `/api/user/id?usn=${encodeURIComponent(usn)}`
        );
        if (res.ok) {
          const d = await res.json();
          if (d?.userId) setCurrentUserId(d.userId);
        }
      } catch (e) {
        console.error("Failed to resolve current user id", e);
      }
    })();
  }, []);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPage(next, true);
  };

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  const parseLinks = (text) => {
    if (!text) return [];
    return text
      .split(/[,\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const openEdit = (u) => {
    setEditingId(String(u._id));
    setEditTitle(u.title || "");
    setEditContent(u.content || "");
    setEditLinksText((u.links || []).join("\n"));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
    setEditLinksText("");
  };

  const saveEdit = async (updateId) => {
    if (!currentUserId) {
      setToast("You must be signed in to edit");
      setTimeout(() => setToast(null), 2500);
      return;
    }

    const payload = {
      updateId,
      userId: currentUserId,
      title: editTitle,
      content: editContent,
      links: parseLinks(editLinksText),
    };

    try {
      const res = await fetch("/api/updates/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Edit failed");

      setUpdates((prev) =>
        prev.map((it) =>
          it._id === updateId
            ? {
                ...it,
                title: data.update.title,
                content: data.update.content,
                links: data.update.links || [],
              }
            : it
        )
      );

      setToast("Update saved");
      setTimeout(() => setToast(null), 1800);
      cancelEdit();
    } catch (err) {
      console.error("Edit error", err);
      setToast("Failed to save update");
      setTimeout(() => setToast(null), 2500);
    }
  };

  const handleDelete = async (updateId) => {
    if (!currentUserId) {
      setToast("You must be signed in to delete");
      setTimeout(() => setToast(null), 2500);
      return;
    }

    const ok = confirm("Delete this update? This cannot be undone.");
    if (!ok) return;

    const prev = updates;
    setUpdates(updates.filter((u) => u._id !== updateId));
    pendingRef.current[updateId] = true;

    try {
      const res = await fetch("/api/updates/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updateId, userId: currentUserId }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.error || `Delete failed (${res.status})`);

      setToast("Update deleted");
      setTimeout(() => setToast(null), 2000);
    } catch (err) {
      console.error("Delete error", err);
      setToast("Failed to delete update");
      setTimeout(() => setToast(null), 3000);
      setUpdates(prev);
    } finally {
      delete pendingRef.current[updateId];
    }
  };

  return (
    <section style={{ marginTop: 20 }}>
      <h4 style={{ margin: "6px 0 12px" }}>Recent Updates</h4>

      {toast && (
        <div
          style={{
            marginBottom: 12,
            padding: 10,
            borderRadius: 6,
            background: "#fff7f0",
            color: "#333",
          }}
        >
          {toast}
        </div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {updates.map((u) => (
          <article
            key={u._id}
            style={{
              padding: 12,
              borderRadius: 8,
              border: "1px solid #eee",
              background: "#fff",
            }}
          >
            <strong>{u.title}</strong>
            <div style={{ fontSize: 12, color: "#666" }}>
              {formatDate(u.createdAt)}
            </div>
            <div style={{ marginTop: 6 }}>{u.content}</div>

            {u.links && u.links.length > 0 && (
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                {u.links.map((ln, idx) => {
                  const raw = String(ln || "").trim();
                  if (!raw) return null;

                  // Internal routing
                  if (raw.startsWith("/")) {
                    return (
                      <Link
                        key={idx}
                        href={raw}
                        style={{
                          padding: "6px 10px",
                          background: "#f5f5f5",
                          borderRadius: 6,
                          fontSize: 13,
                          textDecoration: "none",
                        }}
                      >
                        Visit
                      </Link>
                    );
                  }

                  // External links
                  const hasScheme =
                    /^https?:\/\//i.test(raw) ||
                    /^mailto:/i.test(raw) ||
                    /^tel:/i.test(raw);

                  const href = hasScheme ? raw : `https://${raw}`;

                  return (
                    <a
                      key={idx}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: "6px 10px",
                        background: "#f0f7ff",
                        borderRadius: 6,
                        fontSize: 13,
                        textDecoration: "none",
                        color: "#0366d6",
                      }}
                    >
                      {raw}
                    </a>
                  );
                })}
              </div>
            )}
          </article>
        ))}
      </div>

      <div style={{ marginTop: 14, textAlign: "center" }}>
        {loading ? (
          <button disabled>Loading...</button>
        ) : hasMore ? (
          <button onClick={loadMore}>Load more</button>
        ) : (
          updates.length > 0 && <div>No more updates</div>
        )}
      </div>
    </section>
  );
}
