#!/usr/bin/env node

/**
 * Standalone WebSocket Server for Learnix Updates Direct Cloudinary Upload Handshake
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
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_SECRET,
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
        const { filename, fileSize, userId } = msg;
        if (!uploadId || !filename) {
          ws.send(JSON.stringify({ type: "error", uploadId, message: "Missing uploadId or filename" }));
          return;
        }

        const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_SECRET;

        if (!cloudName || !apiKey || !apiSecret) {
          ws.send(JSON.stringify({ type: "error", uploadId, message: "Cloudinary credentials missing on server" }));
          return;
        }

        const timestamp = Math.floor(Date.now() / 1000);
        const targetUserId = userId || ws.userId;
        const folder = targetUserId ? `updates/${targetUserId}` : "updates";
        const sanitizedName = (filename || `upload-${Date.now()}`).replace(/[^a-zA-Z0-9._-]/g, "_");
        const publicId = `${Date.now()}_${sanitizedName}`;

        const paramsToSign = {
          folder,
          public_id: publicId,
          timestamp,
        };

        const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

        activeUploads.set(uploadId, {
          uploadId,
          filename,
          fileSize: Number(fileSize) || 0,
          userId: targetUserId,
          publicId,
          folder,
          timestamp,
          ws
        });

        ws.send(JSON.stringify({
          type: "ready",
          uploadId,
          credentials: {
            cloudName,
            apiKey,
            timestamp,
            signature,
            folder,
            publicId,
            uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`
          }
        }));
        break;
      }

      case "progress": {
        const session = activeUploads.get(uploadId);
        if (session) {
          session.bytesUploaded = Number(msg.bytesUploaded) || 0;
          session.percent = Number(msg.percent) || 0;
        }
        break;
      }

      case "complete": {
        activeUploads.delete(uploadId);

        ws.send(JSON.stringify({
          type: "complete_ack",
          uploadId,
          file: msg.file
        }));
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
    for (const [id, session] of activeUploads.entries()) {
      if (session.ws === ws) {
        activeUploads.delete(id);
      }
    }
  });
});

console.log(`[WS Server] Learnix Updates WebSocket Upload Server running on ws://localhost:${WS_PORT}`);
