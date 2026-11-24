"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FiArchive, FiArrowRight, FiExternalLink, FiFile, FiLock, FiPlus } from "react-icons/fi";
import { authFetch } from "@/lib/clientAuth";
import "./styles/WorkspaceKeep.css";

export default function WorkspaceKeep({ loggedIn }) {
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(Boolean(loggedIn));
  const load = useCallback(async () => {
    if (!loggedIn) { setLoading(false); return; }
    try { const response = await authFetch("/api/keep?page=1&size=3"); const data = await response.json(); if (response.ok) { setItems(data.items || []); setCount(data.total || 0); } }
    catch (error) { console.error("Could not load Keep widget:", error); }
    finally { setLoading(false); }
  }, [loggedIn]);
  useEffect(() => { load(); }, [load]);
  return (
    <section className="wk-section" aria-labelledby="wk-title">
      <div className="wk-card">
        <div className="wk-head"><div className="wk-title-group"><span className="wk-icon"><FiArchive /></span><div><h2 id="wk-title">Keep</h2><p>Your notes, links, and saved files</p></div></div><Link className="wk-visit" href={loggedIn ? "/keep" : "/login?redirect=%2Fkeep"}>{loggedIn ? "Open Keep" : "Sign in"}<FiArrowRight /></Link></div>
        {!loggedIn ? <div className="wk-empty"><FiLock /><span>Sign in to see your private collection.</span><Link href="/login?redirect=%2Fkeep">Sign in to Keep <FiArrowRight /></Link></div> : loading ? <div className="wk-loading">Loading your saved items…</div> : items.length ? <><div className="wk-list">{items.map((item) => <div className="wk-item" key={item.itemId}><span className={`wk-type wk-type--${item.type}`}>{item.type === "file" ? <FiFile /> : item.type === "link" ? <FiExternalLink /> : <FiArchive />}</span><span className="wk-item-title">{item.title}</span>{item.pinned && <span className="wk-pinned">Pinned</span>}</div>)}</div><div className="wk-foot"><span>{count} {count === 1 ? "item" : "items"} in Keep</span><Link href="/keep">See all <FiArrowRight /></Link></div></> : <div className="wk-empty"><span>No saved items yet.</span><Link href="/keep"><FiPlus /> Add your first item</Link></div>}
      </div>
    </section>
  );
}
