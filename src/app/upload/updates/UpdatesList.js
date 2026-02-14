"use client";
import { useEffect, useState, useRef } from "react";
import { FiTrash2 } from "react-icons/fi";

export default function UpdatesList() {
  const [updates, setUpdates] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [toast, setToast] = useState(null);
  const pendingRef = useRef({});

  const fetchPage = async (p = 1, append = false) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/updates/latest?index=${p}`);
      if (!res.ok) throw new Error('Failed to load updates');
      const data = await res.json();
      const items = data?.updates || [];
      setHasMore(items.length === 10); // simple heuristic
      setUpdates(prev => (append ? [...prev, ...items] : items));
    } catch (err) {
      console.error(err);
      setToast('Failed to load updates');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage(1, false);

    // resolve current user id from localStorage usn
    const usn = typeof window !== 'undefined' ? localStorage.getItem('usn') : null;
    if (!usn) return;
    (async () => {
      try {
        const res = await fetch(`/api/user/id?usn=${encodeURIComponent(usn)}`);
        if (res.ok) {
          const d = await res.json();
          if (d?.userId) setCurrentUserId(d.userId);
        }
      } catch (e) {
        console.error('Failed to resolve current user id', e);
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
      const d = new Date(iso);
      return d.toLocaleString();
    } catch (e) {
      return iso;
    }
  };

  const handleDelete = async (updateId) => {
    if (!currentUserId) {
      setToast('You must be signed in to delete');
      setTimeout(() => setToast(null), 2500);
      return;
    }

    const ok = confirm('Delete this update? This cannot be undone.');
    if (!ok) return;

    // optimistic remove
    const prev = updates;
    const newList = updates.filter(u => u._id !== updateId);
    setUpdates(newList);
    pendingRef.current[updateId] = true;

    try {
      const url = `/api/updates/delete`;
      console.log('Deleting update (POST):', url, { updateId, userId: currentUserId });
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updateId, userId: currentUserId }),
      });
      let data;
      try { data = await res.json(); } catch (e) { data = null; }
      if (!res.ok) {
        console.error('Delete response not ok', res.status, data);
        throw new Error(data?.error || `Delete failed (status ${res.status})`);
      }
      setToast('Update deleted');
      setTimeout(() => setToast(null), 2000);
    } catch (err) {
      console.error('Delete error', err);
      setToast('Failed to delete update');
      setTimeout(() => setToast(null), 3000);
      // revert
      setUpdates(prev);
    } finally {
      delete pendingRef.current[updateId];
    }
  };

  return (
    <section style={{ marginTop: 20 }}>
      <h4 style={{ margin: '6px 0 12px' }}>Recent Updates</h4>

      {toast && (
        <div style={{ marginBottom: 12, padding: 10, borderRadius: 6, background: '#fff7f0', color: '#333' }}>{toast}</div>
      )}

      {updates.length === 0 && !loading && (
        <div style={{ padding: 12, borderRadius: 6, background: '#fbfbfb' }}>No updates yet.</div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {updates.map(u => (
          <article key={u._id} style={{ padding: 12, borderRadius: 8, border: '1px solid #eee', background: '#fff', position: 'relative' }}>
            {currentUserId && u.userId && String(currentUserId) === String(u.userId) && (
              <button
                onClick={() => handleDelete(String(u._id))}
                title="Delete"
                style={{ position: 'absolute', right: 12, top: 12, border: 'none', background: 'transparent', cursor: 'pointer', color: '#c33' }}
              >
                <FiTrash2 />
              </button>
            )}

            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: 44, overflow: 'hidden', background: '#ddd' }}>
                {u.profileUrl ? (
                  <img src={u.profileUrl} alt={u.name || 'profile'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%' }} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                  <strong style={{ fontSize: 15 }}>{u.title}</strong>
                  <div style={{ marginLeft: 'auto', fontSize: 12, color: '#666' }}>{formatDate(u.createdAt)}</div>
                </div>
                <div style={{ marginTop: 6, color: '#333' }}>{u.content}</div>

                {u.links && u.links.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {u.links.map((ln, idx) => {
                      const internal = String(ln || '').startsWith('/');
                      if (internal) {
                        return (
                          <a key={idx} href={ln} style={{ padding: '6px 10px', background: '#f5f5f5', borderRadius: 6, fontSize: 13, color: '#111', textDecoration: 'none' }}>
                            Visit
                          </a>
                        );
                      }
                      return (
                        <a key={idx} href={ln} target="_blank" rel="noreferrer" style={{ padding: '6px 10px', background: '#f0f7ff', borderRadius: 6, fontSize: 13, color: '#0366d6', textDecoration: 'none' }}>
                          {ln}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center' }}>
        {loading ? (
          <button disabled style={{ padding: '8px 12px' }}>Loading...</button>
        ) : hasMore ? (
          <button onClick={loadMore} style={{ padding: '8px 12px' }}>Load more</button>
        ) : (
          updates.length > 0 && <div style={{ color: '#666' }}>No more updates</div>
        )}
      </div>
    </section>
  );
}
