"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AddUpdateForm() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [linksText, setLinksText] = useState("");
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const usn = typeof window !== 'undefined' ? localStorage.getItem('usn') : null;
    if (!usn) return;

    (async () => {
      try {
        const res = await fetch(`/api/user/id?usn=${encodeURIComponent(usn)}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.userId) setUserId(data.userId);
        }
      } catch (err) {
        console.error('Failed to resolve user id', err);
      }
    })();
  }, []);

  const showToast = (msg, timeout = 3500) => {
    setToast(msg);
    setTimeout(() => setToast(null), timeout);
  };

  const parseLinks = (text) => {
    if (!text) return [];
    // Support newline or comma separated
    return text
      .split(/[,\n]+/)
      .map(s => s.trim())
      .filter(Boolean);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showToast('Please enter title and content');
      return;
    }

    setLoading(true);
    const links = parseLinks(linksText);

    try {
      const res = await fetch('/api/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), content: content.trim(), links, userId }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Update created successfully');
        setTitle('');
        setContent('');
        setLinksText('');
        // Optionally navigate to updates list
        // router.push('/updates');
      } else {
        showToast(data?.error || 'Failed to create update');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginBottom: 8 }}>
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            style={{ display: 'block', width: '100%', padding: 8, marginTop: 6 }}
          />
        </label>

        <label style={{ display: 'block', marginBottom: 8 }}>
          Content
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your update content here"
            rows={6}
            style={{ display: 'block', width: '100%', padding: 8, marginTop: 6 }}
          />
        </label>

        <label style={{ display: 'block', marginBottom: 8 }}>
          Links (comma or newline separated)
          <textarea
            value={linksText}
            onChange={(e) => setLinksText(e.target.value)}
            placeholder="/works/subject/.. or https://example.com"
            rows={3}
            style={{ display: 'block', width: '100%', padding: 8, marginTop: 6 }}
          />
        </label>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10 }}>
          <button type="submit" disabled={loading} style={{ padding: '8px 14px' }}>
            {loading ? 'Saving...' : 'Create Update'}
          </button>
          <button type="button" onClick={() => { setTitle(''); setContent(''); setLinksText(''); }} style={{ padding: '8px 12px' }}>
            Clear
          </button>
          <div style={{ marginLeft: 'auto', fontSize: 13, opacity: 0.9 }}>
            {userId ? 'Posting as user' : 'Not signed in'}
          </div>
        </div>
      </form>

      {toast && (
        <div style={{ marginTop: 12, padding: 10, borderRadius: 6, background: '#f0f4f8' }}>{toast}</div>
      )}
    </div>
  );
}
