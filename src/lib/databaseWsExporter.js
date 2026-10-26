/* global Blob */
/**
 * Client-side Real-time WebSocket Database CSV Exporter
 *
 * Features:
 * - Real-time progress updates via WebSocket during database scan and CSV formatting.
 * - Live percentage, rows processed, and transfer status indicators.
 * - Automatic browser file download when complete.
 * - Seamless automatic HTTP fallback if WebSockets are unavailable or timed out.
 */

export async function exportDatabaseViaWebSocket(collection, options = {}) {
  const {
    token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "",
    wsInfoUrl = "/api/updates/upload/ws-info",
    onProgress = () => {},
    onStatus = () => {},
  } = options;

  const exportId = `exp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  let ws = null;

  try {
    onStatus("Connecting to WebSocket server...");
    onProgress({ percent: 5, processed: 0, total: 100, status: "Connecting to server..." });

    // 1. Fetch WebSocket server coordinates from API
    const infoRes = await fetch(wsInfoUrl).catch(() => null);
    const info = infoRes ? await infoRes.json().catch(() => ({})) : {};
    const port = info?.port || 5001;

    const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
    const protocol = isSecure ? "wss:" : "ws:";
    const hostname = typeof window !== "undefined" ? (window.location.hostname || "localhost") : "localhost";

    const queryAuth = token ? `?token=${encodeURIComponent(token)}` : "";
    const wsUrl = `${protocol}//${hostname}:${port}${queryAuth}`;
    const protocols = token ? ["bearer", token] : [];

    // 2. Establish WebSocket connection with a 4.5 second timeout
    ws = await new Promise((resolve, reject) => {
      let socket;
      const WSConstructor = typeof window !== "undefined" && window.WebSocket ? window.WebSocket : globalThis.WebSocket;
      if (!WSConstructor) return reject(new Error("WebSocket not supported in this browser"));

      try {
        socket = new WSConstructor(wsUrl, protocols);
      } catch (err) {
        return reject(err);
      }

      const connectionTimeout = setTimeout(() => {
        try { socket.close(); } catch {}
        reject(new Error("WebSocket connection timed out (using HTTP fallback)"));
      }, 4500);

      socket.onopen = () => {
        clearTimeout(connectionTimeout);
        resolve(socket);
      };

      socket.onerror = (err) => {
        clearTimeout(connectionTimeout);
        reject(err);
      };
    });

    onStatus("Requesting database export...");
    onProgress({ percent: 12, processed: 0, total: 100, status: "Initiating live database scan..." });

    // 3. Send export request over WebSocket & await progress / completion
    const exportResult = await new Promise((resolve, reject) => {
      const handleMessage = (event) => {
        let msg;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }

        if (msg.exportId && msg.exportId !== exportId) return;

        if (msg.type === "export_progress") {
          onStatus(msg.status || "Exporting database...");
          onProgress({
            percent: msg.percent ?? 50,
            processed: msg.processed ?? 0,
            total: msg.total ?? 0,
            status: msg.status || "Processing..."
          });
        } else if (msg.type === "export_complete") {
          ws.removeEventListener("message", handleMessage);
          resolve(msg);
        } else if (msg.type === "export_error" || msg.type === "error") {
          ws.removeEventListener("message", handleMessage);
          reject(new Error(msg.message || "Failed to export data over WebSocket"));
        }
      };

      ws.addEventListener("message", handleMessage);

      // Send the export request
      ws.send(JSON.stringify({
        type: "export_database",
        exportId,
        collection,
        token
      }));
    });

    // 4. Download file to browser
    triggerFileDownload(exportResult.csvData, exportResult.filename);

    onProgress({
      percent: 100,
      processed: exportResult.rowCount || 0,
      total: exportResult.rowCount || 0,
      status: "Download completed successfully"
    });
    onStatus("Export completed via WebSocket");

    try { ws.close(); } catch {}

    return {
      success: true,
      method: "websocket",
      filename: exportResult.filename,
      rowCount: exportResult.rowCount,
      sizeBytes: exportResult.sizeBytes
    };

  } catch (err) {
    console.warn("[WS Export] WebSocket attempt failed or timed out:", err.message);
    if (ws) {
      try { ws.close(); } catch {}
    }

    // 5. Seamless fallback to HTTP API
    onStatus("Switching to fast HTTP stream...");
    return await exportDatabaseViaHTTP(collection, { token, onProgress, onStatus });
  }
}

/**
 * Fallback HTTP direct export with progressive UI updates
 */
export async function exportDatabaseViaHTTP(collection, options = {}) {
  const {
    token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "",
    onProgress = () => {},
    onStatus = () => {},
  } = options;

  onStatus("Querying records over HTTP...");
  onProgress({ percent: 25, processed: 0, total: 100, status: "Fetching data from server..." });

  const headers = {
    Authorization: token ? `Bearer ${token}` : ""
  };

  const res = await fetch(`/api/admin/database/export?collection=${encodeURIComponent(collection)}&format=json`, {
    headers
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${res.status}`);
  }

  onProgress({ percent: 75, processed: 0, total: 100, status: "Formatting CSV payload..." });
  const data = await res.json();

  if (!data.success) {
    throw new Error(data.error || "Failed to download export");
  }

  onProgress({ percent: 90, processed: data.rowCount, total: data.rowCount, status: "Triggering file download..." });

  triggerFileDownload(data.csvData, data.filename);

  onProgress({ percent: 100, processed: data.rowCount, total: data.rowCount, status: "Download ready" });
  onStatus("Export completed via HTTP");

  return {
    success: true,
    method: "http",
    filename: data.filename,
    rowCount: data.rowCount,
    sizeBytes: data.sizeBytes
  };
}

/**
 * Triggers a browser download using a temporary Blob URL
 */
function triggerFileDownload(content, filename) {
  if (typeof window === "undefined") return;

  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename || "learnix_export.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}
