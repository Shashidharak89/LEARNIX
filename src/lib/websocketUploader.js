/**
 * Client-side Direct Cloudinary Resumable Chunk Uploader for Updates
 * 
 * Features:
 * - Zero binary payload transferred through application server (0 bytes RAM/disk usage on server).
 * - Authenticated WebSocket handshake to receive signed Cloudinary upload credentials.
 * - Slices file in browser into smaller chunks and posts directly to Cloudinary's chunk upload REST endpoint.
 * - Automatic chunk retry (up to 3 retries per chunk with backoff).
 * - Real-time progress updates sent over WebSocket and UI callback.
 * - Server complete/abort signaling for database workflow integration.
 * - Supports very large files, cancellation, and resilient network fallback.
 */

export async function uploadFileViaWebSocket(file, options = {}) {
  const {
    userId = "",
    token = (typeof window !== "undefined" ? localStorage.getItem("token") || "" : ""),
    chunkSize = 6 * 1024 * 1024, // 6MB chunk size for Cloudinary direct resumable upload (Cloudinary requires min 5MB chunks)
    onProgress = () => {},
    onStatus = () => {},
  } = options;

  let ws = null;
  let currentXhr = null;
  let isAborted = false;

  const cryptoObj = typeof window !== "undefined" ? window.crypto : null;
  const uploadId = (cryptoObj && cryptoObj.randomUUID)
    ? cryptoObj.randomUUID()
    : `up-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const abortUpload = () => {
    isAborted = true;
    if (currentXhr) {
      try { currentXhr.abort(); } catch { /* ignore */ }
    }
    if (ws && ws.readyState === 1) {
      try {
        ws.send(JSON.stringify({ type: "abort", uploadId }));
      } catch { /* ignore */ }
      try { ws.close(); } catch { /* ignore */ }
    }
  };

  try {
    onStatus("Connecting to upload server via WebSocket...");

    // 1. Fetch WebSocket server coordinates from API
    const infoRes = await fetch("/api/updates/upload/ws-info");
    const info = await infoRes.json().catch(() => ({}));
    const port = info?.port || 5001;

    const isSecure = window.location.protocol === "https:";
    const protocol = isSecure ? "wss:" : "ws:";
    const hostname = window.location.hostname || "localhost";

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
        try { socket.close(); } catch (_e) {}
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

    onStatus("WebSocket connected. Requesting Cloudinary upload signature...");

    // 3. Request signed Cloudinary credentials over WebSocket
    const credentials = await new Promise((resolve, reject) => {
      const handleMessage = (event) => {
        let msg;
        try { msg = JSON.parse(event.data); } catch { return; }

        if (msg.type === "error" && (!msg.uploadId || msg.uploadId === uploadId)) {
          return reject(new Error(msg.message || "Upload authorization error"));
        }

        if (msg.type === "ready" && msg.uploadId === uploadId) {
          ws.removeEventListener("message", handleMessage);
          resolve(msg.credentials);
        }
      };

      ws.addEventListener("message", handleMessage);

      // Send Init message to server
      ws.send(JSON.stringify({
        type: "init",
        uploadId,
        filename: file.name,
        fileSize: file.size,
        userId
      }));
    });

    onStatus("Upload credentials generated. Direct Cloudinary upload starting...");

    // 4. Perform Direct Chunked Upload from Browser to Cloudinary
    // Cloudinary requires minimum 5MB (5,242,880 bytes) per chunk for resumable upload (except final chunk or file <= 5MB)
    const CLOUDINARY_MIN_CHUNK = 5 * 1024 * 1024;
    const effectiveChunkSize = file.size <= CLOUDINARY_MIN_CHUNK
      ? file.size
      : Math.max(CLOUDINARY_MIN_CHUNK, chunkSize);
    const totalChunks = Math.max(1, Math.ceil(file.size / effectiveChunkSize));
    let finalCloudinaryResponse = null;

    for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
      if (isAborted) {
        throw new Error("Upload cancelled by user");
      }

      const start = chunkIdx * effectiveChunkSize;
      const end = Math.min(start + effectiveChunkSize, file.size);
      const chunkBlob = file.slice(start, end);

      // Chunk Retry Loop (up to 3 attempts with backoff)
      let chunkSuccess = false;
      let lastChunkErr = null;

      for (let attempt = 1; attempt <= 3; attempt++) {
        if (isAborted) break;

        try {
          const res = await new Promise((resolveChunk, rejectChunk) => {
            const XHRConstructor = typeof window !== "undefined" && window.XMLHttpRequest
              ? window.XMLHttpRequest
              : globalThis.XMLHttpRequest;

            if (!XHRConstructor) {
              return rejectChunk(new Error("XMLHttpRequest not available in environment"));
            }

            const xhr = new XHRConstructor();
            currentXhr = xhr;

            xhr.open("POST", credentials.uploadUrl);

            // Cloudinary direct resumable chunk headers
            xhr.setRequestHeader("X-Unique-Upload-Id", uploadId);
            xhr.setRequestHeader("Content-Range", `bytes ${start}-${end - 1}/${file.size}`);

            const fd = new FormData();
            fd.append("file", chunkBlob);
            fd.append("api_key", credentials.apiKey);
            fd.append("timestamp", String(credentials.timestamp));
            fd.append("signature", credentials.signature);
            fd.append("folder", credentials.folder);
            fd.append("public_id", credentials.publicId);

            xhr.upload.onprogress = (evt) => {
              if (evt.lengthComputable) {
                const totalUploadedSoFar = start + evt.loaded;
                const percent = Math.min(99, Math.round((totalUploadedSoFar / file.size) * 100));

                onProgress({
                  percent,
                  currentChunk: chunkIdx + 1,
                  totalChunks,
                  filename: file.name,
                  size: file.size,
                  statusText: `${percent}% uploaded`
                });

                // Send real-time progress update to server over WebSocket
                if (ws && ws.readyState === 1) {
                  try {
                    ws.send(JSON.stringify({
                      type: "progress",
                      uploadId,
                      bytesUploaded: totalUploadedSoFar,
                      totalBytes: file.size,
                      percent
                    }));
                  } catch (_e) {}
                }
              }
            };

            xhr.onload = () => {
              currentXhr = null;
              try {
                const data = JSON.parse(xhr.responseText);
                if (xhr.status >= 200 && xhr.status < 300) {
                  resolveChunk(data);
                } else {
                  rejectChunk(new Error(data?.error?.message || `Cloudinary returned HTTP ${xhr.status}`));
                }
              } catch (e) {
                rejectChunk(new Error(`Cloudinary response parse failed: ${xhr.statusText}`));
              }
            };

            xhr.onerror = () => {
              currentXhr = null;
              rejectChunk(new Error("Network error during direct Cloudinary upload"));
            };

            xhr.onabort = () => {
              currentXhr = null;
              rejectChunk(new Error("Chunk upload aborted"));
            };

            xhr.send(fd);
          });

          chunkSuccess = true;
          if (chunkIdx === totalChunks - 1) {
            finalCloudinaryResponse = res;
          }
          break; // Chunk succeeded, exit retry loop
        } catch (err) {
          lastChunkErr = err;
          if (attempt < 3 && !isAborted) {
            onStatus(`Chunk ${chunkIdx + 1} failed. Retrying (${attempt + 1}/3)...`);
            await new Promise(r => setTimeout(r, attempt * 500));
          }
        }
      }

      if (!chunkSuccess) {
        throw new Error(lastChunkErr?.message || `Failed to upload chunk ${chunkIdx + 1} after 3 retries`);
      }
    }

    if (!finalCloudinaryResponse || !finalCloudinaryResponse.secure_url) {
      throw new Error("Direct Cloudinary upload finished but invalid response received");
    }

    // 5. Complete Upload & Register Metadata with Server via WebSocket
    const fileResult = {
      url: finalCloudinaryResponse.secure_url,
      publicId: finalCloudinaryResponse.public_id,
      name: file.name,
      resourceType: finalCloudinaryResponse.resource_type,
      size: finalCloudinaryResponse.bytes || file.size
    };

    onProgress({
      percent: 100,
      currentChunk: totalChunks,
      totalChunks,
      filename: file.name,
      size: file.size,
      statusText: "100% uploaded"
    });

    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify({
        type: "complete",
        uploadId,
        file: fileResult
      }));
    }

    try { ws.close(); } catch { /* ignore */ }

    return { file: fileResult, abort: abortUpload };

  } catch (wsError) {
    if (isAborted) {
      throw wsError;
    }

    console.warn("[WS Upload] WebSocket connection unavailable. Using direct browser-to-Cloudinary HTTP fallback:", wsError?.message);

    if (ws) {
      try { ws.close(); } catch { /* ignore */ }
    }

    // Fallback: Fetch signed credentials via API and upload directly to Cloudinary from browser
    onStatus("Fetching direct upload credentials...");
    const sigRes = await fetch("/api/updates/upload/signature", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ filename: file.name })
    });

    const sigData = await sigRes.json();
    if (!sigRes.ok || !sigData?.credentials) {
      throw new Error(sigData?.error || "Failed to fetch direct upload credentials");
    }

    const credentials = sigData.credentials;
    onStatus("Direct Cloudinary upload starting...");

    const CLOUDINARY_MIN_CHUNK = 5 * 1024 * 1024;
    const effectiveChunkSize = file.size <= CLOUDINARY_MIN_CHUNK
      ? file.size
      : Math.max(CLOUDINARY_MIN_CHUNK, chunkSize);
    const totalChunks = Math.max(1, Math.ceil(file.size / effectiveChunkSize));
    let finalCloudinaryResponse = null;

    for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
      if (isAborted) throw new Error("Upload cancelled by user");

      const start = chunkIdx * effectiveChunkSize;
      const end = Math.min(start + effectiveChunkSize, file.size);
      const chunkBlob = file.slice(start, end);

      let chunkSuccess = false;
      let lastChunkErr = null;

      for (let attempt = 1; attempt <= 3; attempt++) {
        if (isAborted) break;

        try {
          const res = await new Promise((resolveChunk, rejectChunk) => {
            const XHRConstructor = typeof window !== "undefined" && window.XMLHttpRequest
              ? window.XMLHttpRequest
              : globalThis.XMLHttpRequest;

            const xhr = new XHRConstructor();
            currentXhr = xhr;

            xhr.open("POST", credentials.uploadUrl);
            xhr.setRequestHeader("X-Unique-Upload-Id", uploadId);
            xhr.setRequestHeader("Content-Range", `bytes ${start}-${end - 1}/${file.size}`);

            const fd = new FormData();
            fd.append("file", chunkBlob);
            fd.append("api_key", credentials.apiKey);
            fd.append("timestamp", String(credentials.timestamp));
            fd.append("signature", credentials.signature);
            fd.append("folder", credentials.folder);
            fd.append("public_id", credentials.publicId);

            xhr.upload.onprogress = (evt) => {
              if (evt.lengthComputable) {
                const totalUploadedSoFar = start + evt.loaded;
                const percent = Math.min(99, Math.round((totalUploadedSoFar / file.size) * 100));

                onProgress({
                  percent,
                  currentChunk: chunkIdx + 1,
                  totalChunks,
                  filename: file.name,
                  size: file.size,
                  statusText: `${percent}% uploaded`
                });
              }
            };

            xhr.onload = () => {
              currentXhr = null;
              try {
                const data = JSON.parse(xhr.responseText);
                if (xhr.status >= 200 && xhr.status < 300) {
                  resolveChunk(data);
                } else {
                  rejectChunk(new Error(data?.error?.message || `HTTP ${xhr.status}`));
                }
              } catch (e) {
                rejectChunk(new Error("Response parse failed"));
              }
            };

            xhr.onerror = () => {
              currentXhr = null;
              rejectChunk(new Error("Network error"));
            };

            xhr.onabort = () => {
              currentXhr = null;
              rejectChunk(new Error("Aborted"));
            };

            xhr.send(fd);
          });

          chunkSuccess = true;
          if (chunkIdx === totalChunks - 1) finalCloudinaryResponse = res;
          break;
        } catch (err) {
          lastChunkErr = err;
          if (attempt < 3 && !isAborted) {
            await new Promise(r => setTimeout(r, attempt * 500));
          }
        }
      }

      if (!chunkSuccess) {
        throw new Error(lastChunkErr?.message || `Failed to upload chunk ${chunkIdx + 1}`);
      }
    }

    const fileResult = {
      url: finalCloudinaryResponse.secure_url,
      publicId: finalCloudinaryResponse.public_id,
      name: file.name,
      resourceType: finalCloudinaryResponse.resource_type,
      size: finalCloudinaryResponse.bytes || file.size
    };

    onProgress({
      percent: 100,
      currentChunk: totalChunks,
      totalChunks,
      filename: file.name,
      size: file.size,
      statusText: "100% uploaded"
    });

    return { file: fileResult, abort: abortUpload };
  }
}
