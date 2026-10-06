/**
 * Client-side WebSocket Chunk Uploader for Updates
 * Uploads files chunk-by-chunk over an authenticated WebSocket connection,
 * reporting real-time granular progress (e.g. 20% uploaded, 35% uploaded, ... 100% uploaded)
 * for informative UI progressbars.
 */

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function readSliceAsBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const base64 = arrayBufferToBase64(reader.result);
        resolve(base64);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

/**
 * Uploads a file via WebSocket in chunks with progress reporting and authentication.
 * Dynamically paces and sizes chunks so users clearly see live progress (e.g., 20% uploaded, 35% uploaded... 100% uploaded).
 * Falls back to XMLHttpRequest progress upload if WebSocket is unavailable.
 */
export async function uploadFileViaWebSocket(file, options = {}) {
  const {
    userId = "",
    token = (typeof window !== "undefined" ? localStorage.getItem("token") || "" : ""),
    chunkSize: customChunkSize,
    onProgress = () => {},
    onStatus = () => {},
  } = options;

  // Determine granular chunk size so users see informed progress (20% uploaded, 35% uploaded, ... 100%)
  let chunkSize = customChunkSize;
  if (!chunkSize) {
    if (file.size <= 256 * 1024) {
      chunkSize = 16 * 1024; // 16 KB (e.g. 100KB file = 7 chunks)
    } else if (file.size <= 1024 * 1024) {
      chunkSize = 32 * 1024; // 32 KB (e.g. 500KB file = 16 chunks)
    } else if (file.size <= 8 * 1024 * 1024) {
      chunkSize = 64 * 1024; // 64 KB
    } else {
      chunkSize = 128 * 1024; // 128 KB
    }
  }

  let ws = null;

  try {
    onStatus("Connecting to upload server via WebSocket...");
    onProgress({
      percent: 0,
      currentChunk: 0,
      totalChunks: Math.max(1, Math.ceil(file.size / chunkSize)),
      filename: file.name,
      size: file.size,
      statusText: "0% uploaded"
    });

    // 1. Fetch WebSocket server coordinates from API
    const infoRes = await fetch("/api/updates/upload/ws-info");
    const info = await infoRes.json().catch(() => ({}));
    const port = info?.port || 5001;

    const isSecure = window.location.protocol === "https:";
    const protocol = isSecure ? "wss:" : "ws:";
    const hostname = window.location.hostname || "localhost";

    // Auth header is passed via query param and subprotocol
    const queryAuth = token ? `?token=${encodeURIComponent(token)}` : "";
    const wsUrl = `${protocol}//${hostname}:${port}${queryAuth}`;

    const protocols = token ? ["bearer", token] : [];

    // 2. Establish WebSocket connection
    ws = await new Promise((resolve, reject) => {
      let socket;
      const WSConstructor = typeof window !== "undefined" && window.WebSocket ? window.WebSocket : globalThis.WebSocket;
      try {
        socket = new WSConstructor(wsUrl, protocols);
      } catch (err) {
        return reject(err);
      }

      const connectionTimeout = setTimeout(() => {
        try {
          socket.close();
        } catch {
          // Ignore close error on timeout
        }
        reject(new Error("WebSocket connection timed out"));
      }, 7000);

      socket.onopen = () => {
        clearTimeout(connectionTimeout);
        resolve(socket);
      };

      socket.onerror = (err) => {
        clearTimeout(connectionTimeout);
        reject(err);
      };
    });

    onStatus("WebSocket connected. Starting chunk upload...");

    // 3. Prepare chunking
    const totalChunks = Math.max(1, Math.ceil(file.size / chunkSize));
    const cryptoObj = typeof window !== "undefined" ? window.crypto : null;
    const uploadId = (cryptoObj && cryptoObj.randomUUID)
      ? cryptoObj.randomUUID()
      : `up-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    return await new Promise((resolve, reject) => {
      let isReady = false;
      let currentChunkIdx = 0;

      const handleMessage = async (event) => {
        let msg;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }

        if (msg.type === "error") {
          ws.close();
          return reject(new Error(msg.message || "WebSocket upload error"));
        }

        if (msg.type === "ready") {
          isReady = true;
          sendNextChunk();
          return;
        }

        if (msg.type === "progress") {
          const percent = msg.percent !== undefined
            ? msg.percent
            : Math.min(100, Math.round(((msg.chunkIndex + 1) / totalChunks) * 100));

          const statusText = `${percent}% uploaded`;

          onProgress({
            percent,
            currentChunk: msg.chunkIndex + 1,
            totalChunks,
            filename: file.name,
            size: file.size,
            statusText
          });

          onStatus(statusText);

          currentChunkIdx = msg.chunkIndex + 1;
          if (currentChunkIdx < totalChunks) {
            // Smooth pacing (25ms) so users clearly see the percentage progression
            setTimeout(() => {
              sendNextChunk();
            }, 25);
          }
          return;
        }

        if (msg.type === "processing") {
          onProgress({
            percent: 100,
            currentChunk: totalChunks,
            totalChunks,
            filename: file.name,
            size: file.size,
            statusText: "100% uploaded • Processing on Cloudinary..."
          });
          onStatus("100% uploaded • Processing on Cloudinary...");
          return;
        }

        if (msg.type === "complete") {
          onProgress({
            percent: 100,
            currentChunk: totalChunks,
            totalChunks,
            filename: file.name,
            size: file.size,
            statusText: "100% uploaded"
          });
          onStatus("100% uploaded");
          try {
            ws.close();
          } catch {
            // Ignore close error on completion
          }
          return resolve({ file: msg.file });
        }
      };

      const sendNextChunk = async () => {
        if (!isReady || currentChunkIdx >= totalChunks) return;

        const start = currentChunkIdx * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunkBlob = file.slice(start, end);

        try {
          const base64Data = await readSliceAsBase64(chunkBlob);
          ws.send(JSON.stringify({
            type: "chunk",
            uploadId,
            chunkIndex: currentChunkIdx,
            data: base64Data
          }));
        } catch (err) {
          try { ws.close(); } catch { /* ignore close error */ }
          reject(new Error(`Failed to read file chunk: ${err.message}`));
        }
      };

      ws.onmessage = handleMessage;
      ws.onerror = () => {
        reject(new Error("WebSocket communication error"));
      };
      ws.onclose = (event) => {
        if (!event.wasClean && currentChunkIdx < totalChunks) {
          reject(new Error(`WebSocket connection closed unexpectedly (code: ${event.code})`));
        }
      };

      // Send Init message
      ws.send(JSON.stringify({
        type: "init",
        uploadId,
        filename: file.name,
        fileSize: file.size,
        totalChunks,
        chunkSize,
        userId
      }));
    });

  } catch (wsError) {
    console.warn("[WS Upload] WebSocket failed, falling back to HTTP upload:", wsError?.message);
    if (ws) {
      try {
        ws.close();
      } catch {
        // Ignore close error on fallback
      }
    }

    onStatus("Falling back to HTTP upload...");
    onProgress({
      percent: 10,
      currentChunk: 1,
      totalChunks: 1,
      filename: file.name,
      size: file.size,
      statusText: "10% uploaded"
    });

    // Fallback: standard HTTP multipart upload with XMLHttpRequest progress reporting
    const fd = new FormData();
    fd.append("file", file);
    const XHRConstructor = typeof window !== "undefined" && window.XMLHttpRequest ? window.XMLHttpRequest : globalThis.XMLHttpRequest;
    if (!XHRConstructor) {
      const res = await fetch("/api/updates/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd
      });
      const data = await res.json();
      if (res.ok && data?.file) {
        onProgress({ percent: 100, currentChunk: 1, totalChunks: 1, filename: file.name, size: file.size, statusText: "100% uploaded" });
        return { file: data.file };
      }
      throw new Error(data?.error || `Upload failed for ${file.name}`);
    }

    const uploadResult = await new Promise((resolveHttp, rejectHttp) => {
      const xhr = new XHRConstructor();
      xhr.open("POST", "/api/updates/upload");
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }

      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          const percent = Math.min(99, Math.round((evt.loaded / evt.total) * 100));
          onProgress({
            percent,
            currentChunk: 1,
            totalChunks: 1,
            filename: file.name,
            size: file.size,
            statusText: `${percent}% uploaded`
          });
          onStatus(`${percent}% uploaded`);
        }
      };

      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && data?.file) {
            onProgress({
              percent: 100,
              currentChunk: 1,
              totalChunks: 1,
              filename: file.name,
              size: file.size,
              statusText: "100% uploaded"
            });
            onStatus("100% uploaded");
            resolveHttp({ file: data.file });
          } else {
            rejectHttp(new Error(data?.error || `Upload failed for ${file.name}`));
          }
        } catch {
          rejectHttp(new Error(`Upload failed: ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => rejectHttp(new Error("Network error during fallback upload"));
      xhr.send(fd);
    });

    return uploadResult;
  }
}
