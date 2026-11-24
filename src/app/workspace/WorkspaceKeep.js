"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRightIcon, FileIcon, FileTextIcon, FolderIcon, LinkIcon, LockIcon, PlusIcon } from "@animateicons/react/lucide";
import { authFetch } from "@/lib/clientAuth";
import { useKeepIcon } from "../keep/keepIcons";
import "./styles/WorkspaceKeep.css";

const icons = { file: FileIcon, link: LinkIcon, text: FileTextIcon };

function WidgetLink({ icon: Icon, children, ...props }) {
  const { ref, events } = useKeepIcon();
  return (
    <Link {...props} {...events}>
      <Icon ref={ref} size={16} aria-hidden="true" />
      {children}
    </Link>
  );
}

export default function WorkspaceKeep({ loggedIn }) {
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!loggedIn) return;
    const controller = new window.AbortController();
    authFetch("/api/keep?page=1&size=3", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Could not load recent items.");
        return response.json();
      })
      .then((data) => { if (!controller.signal.aborted) setResult(data); })
      .catch((error) => { if (!controller.signal.aborted) setResult({ error: error.message }); });
    return () => {
      controller.abort();
      setResult(null);
    };
  }, [loggedIn]);

  return (
    <section className="wk-section" aria-labelledby="wk-title">
      <div className="wk-card">
        <div className="wk-head">
          <div className="wk-title-group">
            <span className="wk-icon"><FolderIcon size={21} aria-hidden="true" /></span>
            <div><h2 id="wk-title">Keep</h2><p>Your notes, links, and saved files</p></div>
          </div>
          <WidgetLink icon={loggedIn ? ArrowRightIcon : LockIcon} className="wk-visit"
            href={loggedIn ? "/keep" : "/login?redirect=%2Fkeep"}>
            {loggedIn ? "Open Keep" : "Sign in"}
          </WidgetLink>
        </div>
        {!loggedIn ? (
          <p className="wk-empty">Sign in to see your private collection.</p>
        ) : (
          <>
            {!result ? (
              <p className="wk-loading" role="status">Loading your saved items…</p>
            ) : result.error ? (
              <p className="wk-empty">{result.error}</p>
            ) : result.items.length ? (
              <div className="wk-list">
                {result.items.map((item) => {
                  const Icon = icons[item.type] || FileTextIcon;
                  return (
                    <Link className="wk-item" key={item.itemId} href={`/keep?item=${encodeURIComponent(item.itemId)}`}>
                      <span className={`wk-type wk-type--${item.type}`}><Icon size={16} aria-hidden="true" /></span>
                      <span className="wk-item-title">{item.title}</span>
                      {item.pinned && <span className="wk-pinned">Pinned</span>}
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="wk-empty">No saved items yet.</p>
            )}
            <div className="wk-foot">
              <WidgetLink icon={PlusIcon} href="/keep?new=1">New item</WidgetLink>
              {result?.total > 0 && <span>{result.total} {result.total === 1 ? "item" : "items"} in Keep</span>}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
