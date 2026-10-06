/**
 * Client-side WebSocket Chunk Uploader for Updates
 * Uploads files chunk-by-chunk over an authenticated WebSocket connection,
 * reporting real-time progress for progressbars.
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
 * Falls back to HTTP upload if WebSocket is unavailable.
 */
export async function uploadFileViaWebSocket(file, options = {}) {
  const {
    userId = "",
    token = (typeof window !== "undefined" ? localStorage.getItem("token") || "" : ""),
    chunkSize = 64 * 1024, // 64 KB per chunk
    onProgress = () => {},
    onStatus = () => {},
  } = options;

  let ws = null;

  try {
    onStatus("Connecting to upload server via WebSocket...");

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

    onStatus("WebSocket connection authenticated. Initializing upload...");

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
            : Math.round(((msg.chunkIndex + 1) / totalChunks) * 100);

          onProgress({
            percent,
            currentChunk: msg.chunkIndex + 1,
            totalChunks,
            filename: file.name,
            size: file.size
          });

          onStatus(`Uploading chunk ${msg.chunkIndex + 1} of ${totalChunks} (${percent}%)...`);

          currentChunkIdx = msg.chunkIndex + 1;
          if (currentChunkIdx < totalChunks) {
            sendNextChunk();
          }
          return;
        }

        if (msg.type === "processing") {
          onProgress({
            percent: 100,
            currentChunk: totalChunks,
            totalChunks,
            filename: file.name,
            size: file.size
          });
          onStatus(msg.message || "Processing upload on Cloudinary...");
          return;
        }

        if (msg.type === "complete") {
          onStatus("Upload complete!");
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
            totalChunks,
            data: base64Data
          }));
        } catch (err) {
          try {
            ws.close();
          } catch {
            // Ignore close error on send failure
          }
          reject(err);
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
    console.warn("[WS Upload] WebSocket failed, falling back to HTTP upload:", wsError.message);
    if (ws) {
      try {
        ws.close();
      } catch {
        // Ignore close error on fallback
      }
    }

    onStatus("Falling back to reliable HTTP upload...");
    onProgress({ percent: 50, currentChunk: 1, totalChunks: 1, filename: file.name, size: file.size });

    // Fallback: standard HTTP multipart upload to ensure reliable completion
    const fd = new FormData();
    fd.append("file", file);
    if (userId) fd.append("userId", userId);

    const res = await fetch("/api/updates/upload", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd
    });
    const data = await res.json();

    if (res.ok && data?.file) {
      onProgress({ percent: 100, currentChunk: 1, totalChunks: 1, filename: file.name, size: file.size });
      onStatus("Upload complete!");
      return { file: data.file };
    } else {
      throw new Error(data?.error || `Upload failed for ${file.name}`);
    }
  }
}
