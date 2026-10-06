#!/usr/bin/env node

/**
 * Standalone WebSocket Server for Learnix Updates File Uploading
 * Usage: node scripts/ws-server.js
 */

const { WebSocketServer } = require("ws");
const jwt = require("jsonwebtoken");
const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const SECRET_KEY = process.env.SECRET_KEY || "mysecretkey@learnix";
const WS_PORT = Number(process.env.WS_PORT) || 5001;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

function extractToken(req) {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  if (authHeader && typeof authHeader === "string" && authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }

  if (req.url) {
    try {
      const parsed = new URL(req.url, "http://localhost");
      const qToken = parsed.searchParams.get("token");
      if (qToken) return qToken.trim();
    } catch {}
  }

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

const activeUploads = new Map();

const wss = new WebSocketServer({
  port: WS_PORT,
  handleProtocols: (protocols) => {
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
      console.warn("[WS Server] Invalid token:", err.message);
    }
  }

  if (!authenticatedUser) {
    try {
      ws.send(JSON.stringify({
        type: "error",
        code: "UNAUTHORIZED",
        message: "Authentication failed. Valid Bearer token required during handshake."
      }));
    } catch {}
    setTimeout(() => ws.close(4401, "Unauthorized"), 150);
    return;
  }

  ws.userId = authenticatedUser.userId;

  try {
    ws.send(JSON.stringify({
      type: "authenticated",
      message: "WebSocket connection established with authentication",
      userId: ws.userId
    }));
  } catch {}

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
          ws.send(JSON.stringify({ type: "error", uploadId, message: "Missing init parameters" }));
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

        ws.send(JSON.stringify({ type: "ready", uploadId }));
        break;
      }

      case "chunk": {
        const session = activeUploads.get(uploadId);
        if (!session) {
          ws.send(JSON.stringify({ type: "error", uploadId, message: "Upload session not found" }));
          return;
        }

        const { chunkIndex, data: chunkData } = msg;
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

            const uploadResult = await new Promise((resolve, reject) => {
              const stream = cloudinary.uploader.upload_stream(
                {
                  folder,
                  resource_type: "auto",
                  public_id: `${Date.now()}_${sanitizedName}`
                },
                (error, result) => {
                  if (error) reject(error);
                  else resolve(result);
                }
              );
              stream.end(finalBuffer);
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
            console.error("[WS Server] Cloudinary error:", cloudErr);
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
    }
  });

  ws.on("close", () => {
    for (const [id, session] of activeUploads.entries()) {
      if (session.ws === ws) {
        activeUploads.delete(id);
      }
    }
  });
});

console.log(`[WS Server] Learnix Updates WebSocket Upload Server running on ws://localhost:${WS_PORT}`);
