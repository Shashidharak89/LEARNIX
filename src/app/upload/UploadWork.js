"use client";

import { useState } from "react";

export default function UploadWork() {
  const [step, setStep] = useState("create"); // create | manage
  const [work, setWork] = useState(null); // saved work object from server
  const [form, setForm] = useState({ name: "", usn: "" });
  const [subjectText, setSubjectText] = useState("");
  const [contentText, setContentText] = useState("");
  const [uploading, setUploading] = useState(false);

  // create work
  const handleCreate = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/work", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, usn: form.usn }),
    });
    const data = await res.json();
    if (res.ok) {
      setWork(data);
      setStep("manage");
    } else {
      alert("Error: " + (data.error || "create failed"));
    }
  };

  // add subject
  const addSubject = async () => {
    if (!subjectText.trim()) return alert("Enter subject");
    const res = await fetch(`/api/work/${work._id}/subject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: subjectText.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      // update local work (append subject)
      setWork((w) => ({ ...w, contents: [...w.contents, data] }));
      setSubjectText("");
    } else alert("Error: " + (data.error || "failed"));
  };

  // add content under a subject
  const addContent = async (subjectId) => {
    if (!contentText.trim()) return alert("Enter content text");
    const res = await fetch(`/api/work/${work._id}/subject/${subjectId}/content`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: contentText.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      // update local work
      setWork((w) => {
        const copy = JSON.parse(JSON.stringify(w));
        const subj = copy.contents.find((s) => s._id === subjectId);
        subj.items.push(data);
        return copy;
      });
      setContentText("");
    } else alert("Error: " + (data.error || "failed"));
  };

  // upload single file to a content (one by one)
  const uploadFile = async (subjectId, contentId, file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch(`/api/work/${work._id}/subject/${subjectId}/content/${contentId}/file`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (res.ok) {
        // update local work - append returned url to the correct item
        setWork((w) => {
          const copy = JSON.parse(JSON.stringify(w));
          const subj = copy.contents.find((s) => s._id === subjectId);
          const item = subj.items.find((it) => it._id === contentId);
          item.files.push(data.url);
          return copy;
        });
      } else {
        alert("Upload error: " + (data.error || "failed"));
      }
    } catch (err) {
      console.error("uploadFile error", err);
      alert("Upload failed: " + String(err));
    } finally {
      setUploading(false);
    }
  };

  // small UI helpers
  if (step === "create") {
    return (
      <div style={{ padding: 20, maxWidth: 700, margin: "0 auto" }}>
        <h2>Create your Work record</h2>
        <form onSubmit={handleCreate}>
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <br />
          <input placeholder="USN" value={form.usn} onChange={(e) => setForm({ ...form, usn: e.target.value })} required />
          <br />
          <button type="submit">Create</button>
        </form>
      </div>
    );
  }

  // manage step: show subjects, add subject, add content, upload file per content
  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <h2>Manage Work — {work.name} ({work.usn})</h2>

      <section style={{ marginBottom: 20 }}>
        <h3>Add Subject</h3>
        <input placeholder="Subject name" value={subjectText} onChange={(e) => setSubjectText(e.target.value)} />
        <button type="button" onClick={addSubject}>Add Subject</button>
      </section>

      <section>
        <h3>Subjects & Contents</h3>
        {work.contents.length === 0 && <p>No subjects yet</p>}
        {work.contents.map((s) => (
          <div key={s._id} style={{ border: "1px solid #ddd", padding: 12, marginBottom: 12 }}>
            <strong>Subject:</strong> {s.subject}
            <div style={{ marginTop: 8 }}>
              <input placeholder="New content text" value={contentText} onChange={(e) => setContentText(e.target.value)} />
              <button type="button" onClick={() => addContent(s._id)}>Add Content</button>
            </div>

            <div style={{ marginTop: 10 }}>
              <h4>Contents</h4>
              {s.items.length === 0 && <p>No contents yet</p>}
              {s.items.map((it) => (
                <div key={it._id} style={{ borderTop: "1px dashed #eee", paddingTop: 8, marginTop: 8 }}>
                  <div><strong>Text:</strong> {it.text}</div>

                  <div style={{ marginTop: 6 }}>
                    <strong>Files:</strong>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                      {it.files.map((f, idx) => {
                        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(f);
                        const isPDF = /\.pdf$/i.test(f);
                        return (
                          <div key={idx} style={{ width: 120 }}>
                            {isImage ? (
                              <img src={f} alt={`file-${idx}`} style={{ width: "100%", height: 80, objectFit: "cover" }} />
                            ) : isPDF ? (
                              <a href={f} target="_blank" rel="noreferrer">PDF {idx + 1}</a>
                            ) : (
                              <a href={f} target="_blank" rel="noreferrer">File {idx + 1}</a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <label style={{ marginRight: 8 }}>
                      Upload single file:
                      <input type="file" accept="image/*,.pdf" style={{ display: "inline-block", marginLeft: 8 }} onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadFile(s._id, it._id, file);
                        e.target.value = null;
                      }} />
                    </label>
                    {uploading && <span>Uploading...</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <div style={{ marginTop: 20 }}>
        <button type="button" onClick={() => { setStep("create"); setWork(null); }}>Reset / Create new</button>
      </div>
    </div>
  );
}
