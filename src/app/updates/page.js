"use client";

import { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import Footer from '../components/Footer';

export default function UpdatesPage() {
  const [updates, setUpdates] = useState([]);
  const [pageIndex, setPageIndex] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchUpdates = async (index = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/updates?index=${index}`);
      if (!res.ok) throw new Error('Failed to fetch updates');
      const data = await res.json();
      if (Array.isArray(data.updates)) {
        if (index === 1) setUpdates(data.updates);
        else setUpdates(prev => [...prev, ...data.updates]);
        setHasMore(data.updates.length === 10);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUpdates(1);
  }, []);

  const loadMore = () => {
    const next = pageIndex + 1;
    setPageIndex(next);
    fetchUpdates(next);
  };

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 1000, margin: '28px auto', padding: '0 16px' }}>
        <h1 style={{ color: '#f2c200', marginBottom: 6 }}>Updates</h1>
        <p style={{ color: '#6b7280', marginBottom: 20 }}>Recent activity: subjects and public topics created by users.</p>

        <div>
          {updates.length === 0 && !loading && (
            <div style={{ color: '#6b7280' }}>No updates yet.</div>
          )}

          {updates.map(u => (
            <div key={u._id} style={{ border: '1px solid rgba(0,0,0,0.06)', padding: 12, borderRadius: 8, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img src={u.profileUrl || '/default-profile.png'} alt={u.name || 'user'} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />
                <div>
                  <div style={{ fontWeight: 700 }}>{u.title}</div>
                  <div style={{ color: '#6b7280' }}>{u.name} • {u.usn}</div>
                </div>
                <div style={{ marginLeft: 'auto', color: '#6b7280', fontSize: 12 }}>{new Date(u.createdAt).toLocaleString()}</div>
              </div>
              <p style={{ marginTop: 10 }}>{u.content}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {u.links && u.links.map((l, i) => (
                  <a key={i} href={l} target="_blank" rel="noreferrer" style={{ color: '#ff9500', textDecoration: 'underline', fontSize: 14 }}>{l}</a>
                ))}
              </div>
            </div>
          ))}

          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <button className="tst-btn tst-btn-primary" onClick={loadMore} disabled={loading}>
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
