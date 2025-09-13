"use client";

import { useEffect, useState } from "react";
import AddSubjectBox from "./AddSubjectBox";
import AddContentBox from "./AddContentBox";
import FileUploader from "./FileUploader";

export default function Dashboard() {
  const [work, setWork] = useState(null);
  const [loading, setLoading] = useState(true);
  const usn = typeof window !== "undefined" ? localStorage.getItem("usn") : null;

  const fetchWork = async () => {
    if (!usn) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/work?usn=${usn}`);
      const data = await res.json();
      setWork(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWork();
    // listen for custom event to refresh after uploads
    const handler = () => fetchWork();
    window.addEventListener("workUpdated", handler);
    return () => window.removeEventListener("workUpdated", handler);
  }, []);

  if (!usn) return <p>Please login.</p>;
  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h2>Your Dashboard</h2>
      <p><strong>Name:</strong> {work?.name ?? "-"}</p>
      <p><strong>USN:</strong> {work?.usn ?? "-"}</p>

      <section style={{ marginTop: 20 }}>
        <h3>Add Subject</h3>
        <AddSubjectBox workId={work?._id} onDone={fetchWork} />
      </section>

      <section style={{ marginTop: 20 }}>
        <h3>Subjects & Contents</h3>
        {!work?.contents || work.contents.length === 0 ? (
          <p>No subjects yet. Add one above.</p>
        ) : (
          work.contents.map((s) => (
            <div key={s._id} style={{ border: "1px solid #ddd", padding: 12, marginBottom: 12 }}>
              <h4>{s.subject}</h4>

              <div style={{ marginTop: 8 }}>
                <AddContentBox workId={work._id} subjectId={s._id} onDone={fetchWork} />
              </div>

              <div style={{ marginTop: 8 }}>
                {(!s.items || s.items.length === 0) ? (
                  <p>No contents for this subject.</p>
                ) : (
                  s.items.map((it) => (
                    <div key={it._id} style={{ borderTop: "1px dashed #eee", paddingTop: 8, marginTop: 8 }}>
                      <div><strong>Text:</strong> {it.text || "(no text)"}</div>

                      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                        {(it.files || []).map((f, idx) => {
                          const url = f.url || f;
                          const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                          const isPDF = /\.pdf$/i.test(url);
                          return (
                            <div key={idx} style={{ width: 120 }}>
                              {isImage ? (
                                <img src={url} alt={`file-${idx}`} style={{ width: "100%", height: 80, objectFit: "cover" }} />
                              ) : isPDF ? (
                                <a href={url} target="_blank" rel="noreferrer">📄 PDF</a>
                              ) : (
                                <a href={url} target="_blank" rel="noreferrer">🔗 File</a>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div style={{ marginTop: 8 }}>
                        <FileUploader workId={work._id} subjectId={s._id} contentId={it._id} onDone={fetchWork} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
