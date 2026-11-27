"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BookOpenIcon, ChevronRightIcon, DownloadIcon, FileTextIcon } from "@animateicons/react/lucide";
import SMDirectoryNode from "@/app/admin/study-materials/SMDirectoryNode";
import "@/app/materials/SMViewer.css";

const PARAMS = ["university", "college", "course", "semester", "batch", "subject", "file"];
const PARAM_FOR_TYPE = Object.fromEntries(PARAMS.map((key) => [key, key]));

function displayName(item, type) {
    if (type === "semester") return `Semester ${item.sem}`;
    if (type === "batch") return `Batch ${item.startyear}-${item.endyear}`;
    if (type === "file") return item.name || decodeURIComponent(item.fileurl?.split("/").pop()?.split("?")[0] || "Study material");
    return item.name || "Study materials";
}

export default function SMSharedMaterialsClient() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const searchKey = searchParams.toString();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const controller = new window.AbortController();
        const loadSharedItem = async () => {
            setLoading(true);
            setError("");
            try {
                const response = await fetch(`/api/sm/v1/share-item?${searchKey}`, { cache: "no-store", signal: controller.signal });
                const json = await response.json();
                if (!response.ok || !json.success) throw new Error(json.error || "This shared item could not be found.");
                setResult(json);
            } catch (requestError) {
                if (requestError.name !== "AbortError") setError(requestError.message || "This shared item could not be found.");
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };
        loadSharedItem();
        return () => controller.abort();
    }, [searchKey]);

    const breadcrumbs = useMemo(() => {
        if (!result) return [];
        const item = { ...result.item };
        const itemType = result.itemType || item.type;
        item.type = itemType;
        item.name = displayName(item, itemType);
        item.id = item.id || String(item._id);
        const currentPath = [...(result.ancestors || []), item];
        let accumulated = {};
        return currentPath.map((crumb) => {
            const key = PARAM_FOR_TYPE[crumb.type];
            if (key) accumulated = { ...accumulated, [key]: crumb.id || String(crumb._id) };
            return { ...crumb, id: crumb.id || String(crumb._id), params: { ...accumulated } };
        });
    }, [result]);

    const goToBreadcrumb = (crumb) => {
        const params = new window.URLSearchParams();
        PARAMS.forEach((key) => {
            if (crumb.params[key]) params.set(key, crumb.params[key]);
        });
        router.push(`${pathname}?${params.toString()}`);
    };

    const navigateToNode = (params) => {
        const query = new window.URLSearchParams();
        PARAMS.forEach((key) => {
            const value = params[`${key}Id`];
            if (value) query.set(key, String(value));
        });
        if (query.size) router.push(`${pathname}?${query.toString()}`);
    };

    const openFile = () => {
        const url = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(result.item.fileurl)}`;
        window.open(url, "_blank", "noopener,noreferrer");
    };

    const parentParams = Object.fromEntries(
        (result?.ancestors || [])
            .map((crumb) => [PARAM_FOR_TYPE[crumb.type] ? `${PARAM_FOR_TYPE[crumb.type]}Id` : "", crumb.id])
            .filter(([key]) => key),
    );

    return (
        <main className="sm-share-page">
            <header className="sm-share-header">
                <div className="sm-share-header-icon"><BookOpenIcon size={23} /></div>
                <div>
                    <p className="sm-share-eyebrow">LEARNIX · STUDY MATERIALS</p>
                    <h1>Shared study materials</h1>
                    <p className="sm-share-subtitle">Browse the shared folder or open the material you need.</p>
                </div>
            </header>

            {loading ? (
                <div className="sm-share-loading" role="status">Opening shared materials…</div>
            ) : error ? (
                <div className="sm-share-error" role="alert"><strong>We couldn’t open this link</strong><span>{error}</span></div>
            ) : (
                <>
                    <nav className="sm-share-breadcrumbs" aria-label="Study materials location">
                        {breadcrumbs.map((crumb, index) => (
                            <span className="sm-share-crumb-wrap" key={`${crumb.type}-${crumb.id}`}>
                                {index > 0 && <ChevronRightIcon size={15} aria-hidden="true" />}
                                <button
                                    type="button"
                                    className={index === breadcrumbs.length - 1 ? "is-current" : ""}
                                    onClick={() => goToBreadcrumb(crumb)}
                                    aria-current={index === breadcrumbs.length - 1 ? "page" : undefined}
                                >
                                    {crumb.name}
                                </button>
                            </span>
                        ))}
                    </nav>

                    <section className="sm-share-content" aria-label="Shared study material directory">
                        {result.itemType === "file" ? (
                            <article className="sm-share-file-card">
                                <div className="sm-share-file-icon"><FileTextIcon size={23} /></div>
                                <div className="sm-share-file-copy">
                                    <span>SHARED FILE</span>
                                    <h2>{displayName(result.item, "file")}</h2>
                                    <p>Open the document or download a copy.</p>
                                </div>
                                <div className="sm-share-file-actions">
                                    <button type="button" onClick={openFile}>Open file</button>
                                    <a href={result.item.fileurl} target="_blank" rel="noreferrer"><DownloadIcon size={16} /> Download</a>
                                </div>
                            </article>
                        ) : (
                            <>
                                <div className="sm-share-location-title">
                                    <span>SHARED LOCATION</span>
                                    <h2>{displayName(result.item, result.itemType)}</h2>
                                </div>
                                <SMDirectoryNode
                                    key={`${result.itemType}-${result.item._id}`}
                                    type={result.itemType}
                                    data={result.item}
                                    parentParams={parentParams}
                                    autoExpand
                                    onNavigate={navigateToNode}
                                />
                            </>
                        )}
                    </section>
                </>
            )}
        </main>
    );
}
