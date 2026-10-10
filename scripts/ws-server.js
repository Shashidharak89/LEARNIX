#!/usr/bin/env node

/**
 * Standalone WebSocket Server for Learnix Direct Cloudinary Upload Handshake
 * Usage: node scripts/ws-server.js
 */

const { WebSocketServer } = require("ws");
const jwt = require("jsonwebtoken");
const cloudinary = require("cloudinary").v2;
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const SECRET_KEY = process.env.SECRET_KEY || "mysecretkey@learnix";
const WS_PORT = Number(process.env.WS_PORT) || 5001;
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_SECRET,
  secure: true,
});

if (MONGO_URI) {
  mongoose.connect(MONGO_URI).catch((err) => {
    console.warn("[WS Server] Mongo connection warning:", err.message);
  });
}

const FileSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  fileid: { type: String, required: true, unique: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  cloudinaryUrl: { type: String, required: true },
  publicId: { type: String, required: true },
  uploadedBy: { type: String, default: "anonymous" },
  createdAt: { type: Date, default: Date.now, expires: 86400 }
});

const FileModel = mongoose.models.File || mongoose.model("File", FileSchema);

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

  if (authenticatedUser) {
    ws.userId = authenticatedUser.userId;
    ws.isAuthenticated = true;
  } else {
    ws.userId = null;
    ws.isAuthenticated = false;
    ws.isGuest = true;
  }

  try {
    ws.send(JSON.stringify({
      type: "authenticated",
      message: "WebSocket connection established",
      userId: ws.userId || "guest"
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
        const { filename, fileSize, userId, folder: requestedFolder } = msg;
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
        const folder = requestedFolder || (targetUserId ? `updates/${targetUserId}` : "updates");
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

      case "fetch_file": {
        const { fileId } = msg;
        try {
          const cleanId = String(fileId || "").trim().toLowerCase();
          const fileDoc = await FileModel.findOne({ fileid: cleanId });
          if (!fileDoc) {
            ws.send(JSON.stringify({ type: "file_data", fileId: cleanId, error: "File not found or expired" }));
            break;
          }
          const isExpired = Date.now() - new Date(fileDoc.createdAt).getTime() > 24 * 60 * 60 * 1000;
          if (isExpired) {
            ws.send(JSON.stringify({ type: "file_data", fileId: cleanId, error: "This file has expired after 24 hours." }));
            break;
          }
          let downloadUrl = fileDoc.cloudinaryUrl;
          if (typeof downloadUrl === "string" && downloadUrl.includes("res.cloudinary.com")) {
            downloadUrl = downloadUrl.replace("/upload/", "/upload/fl_attachment/");
          }
          const nameLower = String(fileDoc.originalName || "").toLowerCase();
          const isImage = (fileDoc.mimeType || "").startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)$/i.test(nameLower);
          const isPdf = (fileDoc.mimeType === "application/pdf") || /\.pdf$/i.test(nameLower);
          const isOfficeDoc = /\.(docx?|pptx?|xlsx?|odt|rtf|csv|txt)$/i.test(nameLower);
          let viewUrl = fileDoc.cloudinaryUrl;
          if (!isImage && !isPdf && isOfficeDoc) {
            viewUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(fileDoc.cloudinaryUrl)}`;
          }
          ws.send(JSON.stringify({
            type: "file_data",
            fileId: fileDoc.fileid,
            file: {
              fileid: fileDoc.fileid,
              fileName: fileDoc.originalName,
              mimeType: fileDoc.mimeType,
              size: fileDoc.size,
              isImage,
              isPdf,
              isOfficeDoc,
              cloudinaryUrl: fileDoc.cloudinaryUrl,
              downloadUrl,
              viewUrl,
              createdAt: fileDoc.createdAt
            }
          }));
        } catch (err) {
          ws.send(JSON.stringify({ type: "file_data", fileId, error: err.message || "Failed to fetch file" }));
        }
        break;
      }

      case "check_code": {
        const { customCode } = msg;
        try {
          const clean = String(customCode || "").toLowerCase().trim();
          if (!/^[a-z0-9_-]{3,20}$/.test(clean)) {
            ws.send(JSON.stringify({ type: "code_availability", customCode: clean, available: false, error: "Code must be 3-20 letters/numbers." }));
            break;
          }
          const existing = await FileModel.findOne({ fileid: clean });
          ws.send(JSON.stringify({ type: "code_availability", customCode: clean, available: !existing }));
        } catch (err) {
          ws.send(JSON.stringify({ type: "code_availability", customCode, available: false, error: "Database error" }));
        }
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

  ws.on("error", (err) => {
    console.warn("[WS Server] Socket error:", err.message);
  });
});

wss.on("error", (err) => {
  console.error("[WS Server] Server error:", err);
});

console.log(`[WS Server] Standalone Server running on ws://localhost:${WS_PORT}`);
