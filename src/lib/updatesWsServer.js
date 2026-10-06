import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import { uploadBufferToCloudinary } from "./cloudinaryUploadHelper.js";

const SECRET_KEY = process.env.SECRET_KEY || "mysecretkey@learnix";
const WS_DEFAULT_PORT = Number(process.env.WS_PORT) || 5001;

function extractToken(req) {
  // 1. Authorization header (Bearer token)
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  if (authHeader && typeof authHeader === "string" && authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }

  // 2. Query parameter (?token=...)
  if (req.url) {
    try {
      const parsed = new URL(req.url, "http://localhost");
      const qToken = parsed.searchParams.get("token");
      if (qToken) return qToken.trim();
    } catch {
      // Ignore URL parsing errors
    }
  }

  // 3. Sec-WebSocket-Protocol (e.g., ["bearer", "<token>"])
  const protocolHeader = req.headers["sec-websocket-protocol"];
  if (protocolHeader && typeof protocolHeader === "string") {
    const parts = protocolHeader.split(",").map(s => s.trim());
    for (const part of parts) {
      if (part && part.toLowerCase() !== "bearer") {
        return part;
      }
    }
  }

  return null;
}

export function getOrStartWsServer(desiredPort = WS_DEFAULT_PORT) {
  if (global.__updatesWsServerInstance) {
    return global.__updatesWsServerInstance;
  }

  const activeUploads = new Map();

  const wss = new WebSocketServer({
    port: desiredPort,
    handleProtocols: (protocols) => {
      // Negotiate "bearer" subprotocol if requested by client
      if (protocols.has("bearer")) return "bearer";
      if (protocols.size > 0) return Array.from(protocols)[0];
      return false;
    }
  });

  wss.on("connection", (ws, req) => {
    const token = extractToken(req);
    let authenticatedUser = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, SECRET_KEY);
        authenticatedUser = { userId: decoded.userId, ...decoded };
      } catch (err) {
        console.warn("[WS Updates] Token verification failed:", err.message);
      }
    }

    if (!authenticatedUser) {
      try {
        ws.send(JSON.stringify({
          type: "error",
          code: "UNAUTHORIZED",
          message: "Authentication failed. Valid Bearer token required during handshake."
        }));
      } catch {
        // Socket may already be closed
      }
      setTimeout(() => ws.close(4401, "Unauthorized"), 150);
      return;
    }

    ws.userId = authenticatedUser.userId;

    // Send welcome confirmation
    try {
      ws.send(JSON.stringify({
        type: "authenticated",
        message: "WebSocket connection established with authentication",
        userId: ws.userId
      }));
    } catch {
      // Socket may be closed
    }

    ws.on("message", async (data) => {
      let msg;
      try {
        msg = JSON.parse(data.toString());
      } catch {
        ws.send(JSON.stringify({ type: "error", message: "Invalid JSON format" }));
        return;
      }

      const { type, uploadId } = msg;

      switch (type) {
        case "init": {
          const { filename, fileSize, totalChunks, chunkSize, userId } = msg;
          if (!uploadId || !filename || !totalChunks) {
            ws.send(JSON.stringify({ type: "error", uploadId, message: "Missing required init fields (uploadId, filename, totalChunks)" }));
            return;
          }

          activeUploads.set(uploadId, {
            uploadId,
            filename,
            fileSize: Number(fileSize) || 0,
            totalChunks: Number(totalChunks),
            chunkSize: Number(chunkSize) || 64 * 1024,
            userId: userId || ws.userId,
            chunks: new Array(Number(totalChunks)),
            receivedCount: 0,
            receivedBytes: 0,
            ws
          });

          ws.send(JSON.stringify({
            type: "ready",
            uploadId,
            message: "Server ready for chunk streaming"
          }));
          break;
        }

        case "chunk": {
          const session = activeUploads.get(uploadId);
          if (!session) {
            ws.send(JSON.stringify({ type: "error", uploadId, message: "Upload session not found or already completed" }));
            return;
          }

          const { chunkIndex, data: chunkData } = msg;
          if (chunkIndex === undefined || !chunkData) {
            ws.send(JSON.stringify({ type: "error", uploadId, message: "Invalid chunk payload" }));
            return;
          }

          const chunkBuffer = Buffer.from(chunkData, "base64");

          if (!session.chunks[chunkIndex]) {
            session.chunks[chunkIndex] = chunkBuffer;
            session.receivedCount += 1;
            session.receivedBytes += chunkBuffer.length;
          }

          const percent = Math.min(100, Math.round((session.receivedCount / session.totalChunks) * 100));

          ws.send(JSON.stringify({
            type: "progress",
            uploadId,
            chunkIndex,
            receivedChunks: session.receivedCount,
            totalChunks: session.totalChunks,
            percent,
            receivedBytes: session.receivedBytes
          }));

          // All chunks received → Assemble and stream to Cloudinary
          if (session.receivedCount === session.totalChunks) {
            ws.send(JSON.stringify({
              type: "processing",
              uploadId,
              message: "All chunks received. Uploading to Cloudinary..."
            }));

            try {
              const finalBuffer = Buffer.concat(session.chunks);
              const folder = session.userId ? `updates/${session.userId}` : "updates";
              const sanitizedName = (session.filename || `upload-${Date.now()}`).replace(/[^a-zA-Z0-9._-]/g, "_");

              const uploadResult = await uploadBufferToCloudinary(finalBuffer, {
                folder,
                filename: session.filename || sanitizedName
              });

              activeUploads.delete(uploadId);

              ws.send(JSON.stringify({
                type: "complete",
                uploadId,
                file: {
                  url: uploadResult.secure_url,
                  publicId: uploadResult.public_id,
                  name: session.filename || sanitizedName,
                  resourceType: uploadResult.resource_type,
                  size: uploadResult.bytes || finalBuffer.length
                }
              }));
            } catch (cloudErr) {
              console.error("[WS Updates] Cloudinary upload error:", cloudErr);
              activeUploads.delete(uploadId);
              ws.send(JSON.stringify({
                type: "error",
                uploadId,
                message: "Cloudinary upload failed: " + (cloudErr.message || cloudErr)
              }));
            }
          }
          break;
        }

        case "abort": {
          activeUploads.delete(uploadId);
          ws.send(JSON.stringify({ type: "aborted", uploadId }));
          break;
        }

        default:
          break;
      }
    });

    ws.on("close", () => {
      // Clean up orphaned uploads associated with this socket
      for (const [id, session] of activeUploads.entries()) {
        if (session.ws === ws) {
          activeUploads.delete(id);
        }
      }
    });

    ws.on("error", (err) => {
      console.warn("[WS Updates] Socket error:", err.message);
    });
  });

  wss.on("error", (err) => {
    console.error("[WS Updates] WebSocket Server error:", err);
  });

  const instance = {
    wss,
    port: desiredPort,
    activeUploads
  };

  global.__updatesWsServerInstance = instance;
  console.log(`[WS Updates] WebSocket Chunk Upload Server running on ws://localhost:${desiredPort}`);

  return instance;
}
