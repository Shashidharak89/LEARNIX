/*
  Temporary File Share, Cloudflare Worker (Cache API version)

  NO bindings needed: no R2, no KV. Just paste and deploy.

  Notes:
  - Files and the "recent uploads" index both live in Cloudflare Cache.
  - Cache is per data center, so the recent list shows files uploaded
    through the same data center (normally the same region you use).
  - The Cache API works on custom domains / routes. On *.workers.dev it
    may silently store nothing (if uploads never download there, that's why).
*/

const TTL = 24 * 60 * 60; // seconds
const MAX_SIZE = 100 * 1024 * 1024; // 100 MB
const RECENT_LIMIT = 12;
const INDEX_MAX = 60;
const BASE = "https://temporary-files.internal/";

const CORS_HEADERS = {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "Content-Type, Authorization, x-requested-with",
    "access-control-max-age": "86400",
};

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;

        // Handle CORS preflight
        if (request.method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: CORS_HEADERS,
            });
        }

        if (path === "/" && request.method === "GET") {
            return new Response(HTML, {
                headers: { "content-type": "text/html; charset=UTF-8", ...CORS_HEADERS },
            });
        }

        if (path === "/api/upload" && request.method === "POST") {
            return handleUpload(request);
        }

        if (path === "/api/files" && request.method === "GET") {
            return handleList();
        }

        if (path.startsWith("/api/download/") && request.method === "GET") {
            const code = decodeURIComponent(path.split("/").pop() || "");
            return handleDownload(code);
        }

        return new Response("Not Found", { status: 404, headers: CORS_HEADERS });
    },
};

// ============================================================
// CACHE HELPERS
// ============================================================

const fileReq = (code) => new Request(BASE + "file:" + code);
const indexReq = () => new Request(BASE + "index:recent");

async function readIndex() {
    const res = await caches.default.match(indexReq());
    if (!res) return [];
    try {
        const list = await res.json();
        return Array.isArray(list) ? list : [];
    } catch (e) {
        return [];
    }
}

async function writeIndex(list) {
    await caches.default.put(
        indexReq(),
        new Response(JSON.stringify(list), {
            headers: {
                "content-type": "application/json",
                "cache-control": "public, max-age=" + TTL,
            },
        })
    );
}

// ============================================================
// UPLOAD
// ============================================================

async function handleUpload(request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file");

        if (!file || typeof file === "string") {
            return json({ success: false, error: "No file provided" }, 400);
        }

        if (file.size > MAX_SIZE) {
            return json(
                {
                    success: false,
                    error: "File too large. Maximum size is " + formatSize(MAX_SIZE) + ".",
                },
                413
            );
        }

        const listed = formData.get("listed") === "0" ? false : true;
        const cache = caches.default;

        // Unique code (retry on collision)
        let code = "";
        for (let i = 0; i < 5; i++) {
            const candidate = generateCode();
            const existing = await cache.match(fileReq(candidate));
            if (!existing) {
                code = candidate;
                break;
            }
            if (existing.body) existing.body.cancel();
        }
        if (!code) {
            return json({ success: false, error: "Could not allocate a code. Try again." }, 500);
        }

        const fileName = sanitizeFilename(file.name || "file");
        const now = Date.now();

        const headers = new Headers();
        headers.set("content-type", file.type || "application/octet-stream");
        headers.set(
            "content-disposition",
            "attachment; filename=\"" +
            asciiName(fileName) +
            "\"; filename*=UTF-8''" +
            encodeURIComponent(fileName)
        );
        headers.set("x-file-name", encodeURIComponent(fileName));
        headers.set("x-file-size", String(file.size));
        headers.set("x-content-type-options", "nosniff");
        headers.set("cache-control", "public, max-age=" + TTL);

        await cache.put(fileReq(code), new Response(file.stream(), { headers }));

        // Update the recent-uploads index
        const list = (await readIndex()).filter((f) => f.expiresAt > now);
        list.unshift({
            code,
            name: fileName,
            size: file.size,
            createdAt: now,
            expiresAt: now + TTL * 1000,
            listed,
        });
        await writeIndex(list.slice(0, INDEX_MAX));

        return json({
            success: true,
            code,
            name: fileName,
            size: file.size,
            expiresAt: now + TTL * 1000,
            downloadUrl: "/api/download/" + code,
        });
    } catch (error) {
        console.error(error);
        return json({ success: false, error: "Upload failed" }, 500);
    }
}

// ============================================================
// DOWNLOAD
// ============================================================

async function handleDownload(rawCode) {
    const code = rawCode.trim().toUpperCase();

    if (!/^[A-Z0-9]{6}$/.test(code)) {
        return new Response("Invalid code", { status: 400, headers: CORS_HEADERS });
    }

    const response = await caches.default.match(fileReq(code));

    if (!response) {
        return new Response("File not found or expired.", { status: 404, headers: CORS_HEADERS });
    }

    const resHeaders = new Headers(response.headers);
    for (const [k, v] of Object.entries(CORS_HEADERS)) {
        resHeaders.set(k, v);
    }
    resHeaders.set("access-control-expose-headers", "x-file-name, x-file-size, content-disposition");

    return new Response(response.body, {
        status: response.status,
        headers: resHeaders,
    });
}

// ============================================================
// LIST RECENT FILES
// ============================================================

async function handleList() {
    const now = Date.now();
    const all = (await readIndex()).filter((f) => f.expiresAt > now);
    const out = [];

    for (const f of all) {
        if (!f.listed) continue;
        if (out.length >= RECENT_LIMIT) break;

        // Skip files that were evicted from cache
        const res = await caches.default.match(fileReq(f.code));
        if (!res) continue;
        if (res.body) res.body.cancel();

        out.push({
            code: f.code,
            name: f.name,
            size: f.size,
            createdAt: f.createdAt,
            expiresAt: f.expiresAt,
        });
    }

    return json({ success: true, files: out });
}

// ============================================================
// HELPERS
// ============================================================

function generateCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const bytes = new Uint8Array(6);
    crypto.getRandomValues(bytes);
    let result = "";
    for (let i = 0; i < 6; i++) result += chars[bytes[i] % chars.length];
    return result;
}

function sanitizeFilename(name) {
    return name.replace(/[\r\n"\\\/]/g, "").trim().substring(0, 200) || "file";
}

function asciiName(name) {
    return name.replace(/[^\x20-\x7E]/g, "_");
}

function formatSize(bytes) {
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(0) + " MB";
    if (bytes >= 1024) return (bytes / 1024).toFixed(0) + " KB";
    return bytes + " B";
}

function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "content-type": "application/json",
            "cache-control": "no-store",
            ...CORS_HEADERS,
        },
    });
}

// ============================================================
// HTML (String.raw: no backticks or dollar-brace inside!)
// ============================================================

const HTML = String.raw`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Drop. Share. Gone in 24 hours.</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@500;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
<style>
:root {
  --bg: #0b1220;
  --bg2: #111a2e;
  --panel: #151f36;
  --line: #26334f;
  --text: #e8edf7;
  --muted: #8d9ab5;
  --accent: #5eead4;
  --accent-ink: #042f2a;
  --warm: #ffb86b;
  --danger: #ff7a8a;
  --ok: #6ee7a0;
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  min-height: 100vh;
  font-family: "Inter", system-ui, sans-serif;
  color: var(--text);
  background:
    radial-gradient(900px 500px at 85% -10%, rgba(94,234,212,.12), transparent 60%),
    radial-gradient(700px 500px at -10% 110%, rgba(255,184,107,.08), transparent 60%),
    var(--bg);
  line-height: 1.5;
}
.wrap { width: min(1040px, 92%); margin: 0 auto; padding: 48px 0 70px; }

header h1 {
  font-family: "Bricolage Grotesque", sans-serif;
  font-weight: 800;
  font-size: clamp(34px, 6vw, 60px);
  line-height: 1.02;
  letter-spacing: -0.03em;
  margin: 0 0 12px;
}
header p { color: var(--muted); margin: 0; max-width: 52ch; font-size: 17px; }

.grid {
  display: grid;
  grid-template-columns: 1.35fr 1fr;
  gap: 22px;
  margin-top: 36px;
  align-items: start;
}
@media (max-width: 860px) { .grid { grid-template-columns: 1fr; } }

.panel {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 20px;
  padding: 24px;
}
.panel h2 {
  font-family: "Bricolage Grotesque", sans-serif;
  font-size: 22px;
  margin: 0 0 16px;
  letter-spacing: -0.01em;
}
.stack { display: grid; gap: 22px; }

/* Drop zone */
.drop {
  border: 2px dashed #3a4a6e;
  border-radius: 16px;
  padding: 34px 20px;
  text-align: center;
  cursor: pointer;
  transition: border-color .15s, background .15s;
  background: rgba(255,255,255,.015);
}
.drop:hover, .drop:focus-visible, .drop.over {
  border-color: var(--accent);
  background: rgba(94,234,212,.06);
  outline: none;
}
.drop .big { font-size: 18px; font-weight: 600; margin: 6px 0 4px; }
.drop .sub { color: var(--muted); font-size: 14px; }
.drop svg { width: 40px; height: 40px; color: var(--accent); }
#fileInput { display: none; }

.picked {
  display: none;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding: 12px 14px;
  background: var(--bg2);
  border: 1px solid var(--line);
  border-radius: 12px;
}
.picked.show { display: flex; }
.picked .nm { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.picked .sz { color: var(--muted); font-size: 13px; }
.picked .grow { flex: 1; min-width: 0; }

.opt {
  display: flex; align-items: center; gap: 10px;
  margin-top: 14px; color: var(--muted); font-size: 14px; cursor: pointer;
}
.opt input { accent-color: var(--accent); width: 16px; height: 16px; }

button, .btn {
  font: inherit;
  font-weight: 600;
  border: 0;
  border-radius: 12px;
  padding: 12px 20px;
  cursor: pointer;
  background: var(--accent);
  color: var(--accent-ink);
  transition: transform .08s, opacity .15s;
}
button:hover { opacity: .92; }
button:active { transform: scale(.98); }
button:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
button:disabled { opacity: .45; cursor: not-allowed; }
button.ghost {
  background: transparent; color: var(--text);
  border: 1px solid var(--line); padding: 8px 12px; font-size: 13px;
}
button.ghost:hover { border-color: var(--accent); color: var(--accent); }
.full { width: 100%; margin-top: 16px; }

/* Progress */
.progress { display: none; margin-top: 18px; }
.progress.show { display: block; }
.bar { height: 10px; background: var(--bg2); border-radius: 99px; overflow: hidden; border: 1px solid var(--line); }
.fill {
  height: 100%; width: 0%;
  background: linear-gradient(90deg, var(--accent), #7dd3fc);
  border-radius: 99px;
  transition: width .15s linear;
}
.pstats { display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; margin-top: 8px; font-size: 13px; color: var(--muted); }
.pstats b { color: var(--text); font-family: "JetBrains Mono", monospace; }

/* Result ticket */
.ticket {
  display: none;
  margin-top: 20px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(94,234,212,.12), rgba(94,234,212,.03));
  border: 1px solid rgba(94,234,212,.35);
  padding: 20px;
}
.ticket.show { display: block; }
.ticket .lbl { color: var(--muted); font-size: 13px; }
.code {
  font-family: "JetBrains Mono", monospace;
  font-weight: 700;
  font-size: clamp(34px, 8vw, 50px);
  letter-spacing: .22em;
  color: var(--accent);
  margin: 4px 0 6px;
}
.ticket .row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
.msg-err { color: var(--danger); margin-top: 14px; font-size: 14px; display: none; }
.msg-err.show { display: block; }

/* Download */
.dl-row { display: flex; gap: 10px; }
.dl-row input {
  flex: 1; min-width: 0;
  font-family: "JetBrains Mono", monospace;
  font-size: 20px; font-weight: 700;
  letter-spacing: .25em; text-transform: uppercase; text-align: center;
  padding: 12px; border-radius: 12px;
  border: 1px solid var(--line); background: var(--bg2); color: var(--text);
}
.dl-row input::placeholder { color: #44537a; letter-spacing: .25em; }
.dl-row input:focus { outline: 2px solid var(--accent); border-color: transparent; }

/* Recent */
.recent-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.recent-head h2 { margin: 0; }
.list { display: grid; gap: 10px; }
.item {
  display: grid; grid-template-columns: 1fr auto; gap: 4px 12px; align-items: center;
  padding: 12px 14px; background: var(--bg2);
  border: 1px solid var(--line); border-radius: 14px;
}
.item .nm { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.item .meta { color: var(--muted); font-size: 12.5px; }
.item .cd { font-family: "JetBrains Mono", monospace; font-weight: 700; color: var(--accent); letter-spacing: .12em; font-size: 13px; text-align: right; }
.item a {
  grid-column: 2; grid-row: 2; justify-self: end;
  color: var(--warm); font-size: 13px; font-weight: 600; text-decoration: none;
}
.item a:hover { text-decoration: underline; }
.empty { color: var(--muted); font-size: 14px; padding: 18px 4px; text-align: center; }

.toast {
  position: fixed; bottom: 22px; left: 50%; transform: translate(-50%, 20px);
  background: #fff; color: #0b1220; padding: 10px 16px; border-radius: 10px;
  font-weight: 600; font-size: 14px; opacity: 0; pointer-events: none;
  transition: .2s;
}
.toast.show { opacity: 1; transform: translate(-50%, 0); }

@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
</style>
</head>
<body>
<div class="wrap">

<header>
  <h1>Drop a file.<br>Share a code.</h1>
  <p>Files vanish after 24 hours. No account, no email, just a six-character code.</p>
</header>

<div class="grid">

  <section class="panel">
    <h2>Upload</h2>

    <div class="drop" id="drop" tabindex="0" role="button" aria-label="Choose a file to upload">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4m0 0L7 9m5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg>
      <div class="big">Drag a file here or click to browse</div>
      <div class="sub">Up to 100 MB</div>
      <input type="file" id="fileInput">
    </div>

    <div class="picked" id="picked">
      <div class="grow">
        <div class="nm" id="pickedName"></div>
        <div class="sz" id="pickedSize"></div>
      </div>
      <button class="ghost" id="clearBtn" type="button">Remove</button>
    </div>

    <label class="opt">
      <input type="checkbox" id="listed" checked>
      Show in the recent uploads list
    </label>

    <button class="full" id="uploadBtn" type="button" disabled>Upload file</button>

    <div class="progress" id="progress" aria-live="polite">
      <div class="bar"><div class="fill" id="fill"></div></div>
      <div class="pstats">
        <span><b id="pPct">0%</b> uploaded</span>
        <span id="pBytes">0 B / 0 B</span>
        <span id="pSpeed"></span>
        <span id="pEta"></span>
      </div>
      <button class="ghost" id="cancelBtn" type="button" style="margin-top:12px">Cancel upload</button>
    </div>

    <div class="msg-err" id="err"></div>

    <div class="ticket" id="ticket">
      <div class="lbl">Your file is ready. Share this code:</div>
      <div class="code" id="tCode"></div>
      <div class="lbl" id="tInfo"></div>
      <div class="row">
        <button class="ghost" id="copyCode" type="button">Copy code</button>
        <button class="ghost" id="copyLink" type="button">Copy download link</button>
      </div>
    </div>
  </section>

  <div class="stack">
    <section class="panel">
      <h2>Download</h2>
      <div class="dl-row">
        <input type="text" id="dlCode" maxlength="6" placeholder="ABC123" autocomplete="off" spellcheck="false">
        <button id="dlBtn" type="button">Download</button>
      </div>
    </section>

    <section class="panel">
      <div class="recent-head">
        <h2>Recent uploads</h2>
        <button class="ghost" id="refreshBtn" type="button">Refresh</button>
      </div>
      <div class="list" id="files"><div class="empty">Loading...</div></div>
    </section>
  </div>

</div>
</div>

<div class="toast" id="toast"></div>

<script>
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var drop = $("drop"), input = $("fileInput");
  var picked = $("picked"), uploadBtn = $("uploadBtn");
  var progress = $("progress"), fill = $("fill");
  var ticket = $("ticket"), errBox = $("err");
  var chosen = null, xhr = null, lastCode = "";

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fmtSize(b) {
    if (b >= 1073741824) return (b / 1073741824).toFixed(2) + " GB";
    if (b >= 1048576) return (b / 1048576).toFixed(1) + " MB";
    if (b >= 1024) return (b / 1024).toFixed(0) + " KB";
    return b + " B";
  }
  function fmtTime(sec) {
    if (!isFinite(sec) || sec < 0) return "";
    if (sec < 60) return Math.ceil(sec) + "s left";
    return Math.floor(sec / 60) + "m " + Math.ceil(sec % 60) + "s left";
  }
  function ago(ts) {
    var s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return Math.floor(s / 60) + " min ago";
    return Math.floor(s / 3600) + " h ago";
  }
  function leftLabel(ts) {
    var m = Math.floor((ts - Date.now()) / 60000);
    if (m <= 0) return "expiring";
    if (m < 60) return m + " min left";
    return Math.floor(m / 60) + " h left";
  }
  function toast(msg) {
    var t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(function () { t.classList.remove("show"); }, 1800);
  }
  function copy(text, msg) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function () { toast(msg); });
    } else {
      var ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta); toast(msg);
    }
  }

  // ---------- file selection ----------
  function setFile(f) {
    chosen = f;
    errBox.classList.remove("show");
    ticket.classList.remove("show");
    if (!f) {
      picked.classList.remove("show");
      uploadBtn.disabled = true;
      return;
    }
    $("pickedName").textContent = f.name;
    $("pickedSize").textContent = fmtSize(f.size);
    picked.classList.add("show");
    uploadBtn.disabled = false;
  }

  drop.addEventListener("click", function () { input.click(); });
  drop.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); }
  });
  input.addEventListener("change", function () { setFile(input.files[0] || null); });
  $("clearBtn").addEventListener("click", function () { input.value = ""; setFile(null); });

  ["dragenter", "dragover"].forEach(function (ev) {
    drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("over"); });
  });
  ["dragleave", "drop"].forEach(function (ev) {
    drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("over"); });
  });
  drop.addEventListener("drop", function (e) {
    if (e.dataTransfer.files.length) setFile(e.dataTransfer.files[0]);
  });

  // ---------- upload with real progress ----------
  uploadBtn.addEventListener("click", function () {
    if (!chosen) return;

    var fd = new FormData();
    fd.append("file", chosen);
    fd.append("listed", $("listed").checked ? "1" : "0");

    xhr = new XMLHttpRequest();
    var started = Date.now();

    uploadBtn.disabled = true;
    errBox.classList.remove("show");
    ticket.classList.remove("show");
    fill.style.width = "0%";
    $("pPct").textContent = "0%";
    $("pBytes").textContent = "0 B / " + fmtSize(chosen.size);
    $("pSpeed").textContent = "";
    $("pEta").textContent = "";
    progress.classList.add("show");

    xhr.upload.onprogress = function (e) {
      if (!e.lengthComputable) return;
      var pct = Math.min(100, (e.loaded / e.total) * 100);
      var elapsed = (Date.now() - started) / 1000;
      var speed = elapsed > 0 ? e.loaded / elapsed : 0;
      var eta = speed > 0 ? (e.total - e.loaded) / speed : NaN;
      fill.style.width = pct.toFixed(1) + "%";
      $("pPct").textContent = Math.floor(pct) + "%";
      $("pBytes").textContent = fmtSize(e.loaded) + " / " + fmtSize(e.total);
      $("pSpeed").textContent = fmtSize(speed) + "/s";
      $("pEta").textContent = pct >= 100 ? "finishing..." : fmtTime(eta);
    };

    function fail(text) {
      progress.classList.remove("show");
      uploadBtn.disabled = false;
      errBox.textContent = text;
      errBox.classList.add("show");
    }

    xhr.onload = function () {
      var data = null;
      try { data = JSON.parse(xhr.responseText); } catch (e) {}
      if (!data || !data.success) {
        fail((data && data.error) || "Upload failed. Try again.");
        return;
      }
      progress.classList.remove("show");
      lastCode = data.code;
      $("tCode").textContent = data.code;
      $("tInfo").textContent = data.name + " (" + fmtSize(data.size) + "), available for 24 hours";
      ticket.classList.add("show");
      input.value = "";
      setFile(null);
      ticket.classList.add("show");
      loadFiles();
    };
    xhr.onerror = function () { fail("Network error. Check your connection and try again."); };
    xhr.onabort = function () { fail("Upload cancelled."); };

    xhr.open("POST", "/api/upload");
    xhr.send(fd);
  });

  $("cancelBtn").addEventListener("click", function () { if (xhr) xhr.abort(); });
  $("copyCode").addEventListener("click", function () { copy(lastCode, "Code copied"); });
  $("copyLink").addEventListener("click", function () {
    copy(location.origin + "/api/download/" + lastCode, "Link copied");
  });

  // ---------- download ----------
  function download() {
    var code = $("dlCode").value.trim().toUpperCase();
    if (code.length !== 6) { toast("Enter the 6-character code"); return; }
    window.location.href = "/api/download/" + encodeURIComponent(code);
  }
  $("dlBtn").addEventListener("click", download);
  $("dlCode").addEventListener("keydown", function (e) { if (e.key === "Enter") download(); });

  // ---------- recent uploads ----------
  function loadFiles() {
    fetch("/api/files", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var box = $("files");
        if (!data.success || !data.files.length) {
          box.innerHTML = '<div class="empty">No public uploads yet. Be the first.</div>';
          return;
        }
        box.innerHTML = data.files.map(function (f) {
          return '<div class="item">' +
            '<div class="nm" title="' + esc(f.name) + '">' + esc(f.name) + '</div>' +
            '<div class="cd">' + esc(f.code) + '</div>' +
            '<div class="meta">' + fmtSize(f.size) + ' &middot; ' + ago(f.createdAt) + ' &middot; ' + leftLabel(f.expiresAt) + '</div>' +
            '<a href="/api/download/' + encodeURIComponent(f.code) + '">Download</a>' +
          '</div>';
        }).join("");
      })
      .catch(function () {
        $("files").innerHTML = '<div class="empty">Could not load recent uploads.</div>';
      });
  }
  $("refreshBtn").addEventListener("click", loadFiles);
  loadFiles();
  setInterval(loadFiles, 30000);
})();
</script>
</body>
</html>`;