import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import cloudinary from "@/lib/cloudinary";
import { connectDB } from "@/lib/db";
import File from "@/models/File";
import { cleanupExpiredFiles } from "@/lib/fileCleanup";

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
        console.warn("[WS Server] Token verification failed:", err.message);
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

    // Send welcome confirmation
    try {
      ws.send(JSON.stringify({
        type: "authenticated",
        message: "WebSocket connection established",
        userId: ws.userId || "guest"
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
          const { filename, fileSize, userId, folder: requestedFolder } = msg;
          if (!uploadId || !filename) {
            ws.send(JSON.stringify({
              type: "error",
              uploadId,
              message: "Missing required init fields (uploadId, filename)"
            }));
            return;
          }

          const cloudName = process.env.CLOUDINARY_NAME || process.env.CLOUDINARY_CLOUD_NAME;
          const apiKey = process.env.CLOUDINARY_KEY || process.env.CLOUDINARY_API_KEY;
          const apiSecret = process.env.CLOUDINARY_SECRET || process.env.CLOUDINARY_API_SECRET;

          if (!cloudName || !apiKey || !apiSecret) {
            ws.send(JSON.stringify({
              type: "error",
              uploadId,
              message: "Cloudinary credentials missing on server"
            }));
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

          // Return signed Cloudinary credentials for browser direct chunk upload
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
            if (!cleanId) {
              ws.send(JSON.stringify({ type: "file_data", fileId, error: "Invalid file code" }));
              break;
            }
            await connectDB();
            cleanupExpiredFiles().catch(() => {});
            const fileDoc = await File.findOne({ fileid: cleanId });
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
            await connectDB();
            const existing = await File.findOne({ fileid: clean });
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
    console.error("[WS Server] WebSocket Server error:", err);
  });

  const instance = {
    wss,
    port: desiredPort,
    activeUploads
  };

  global.__updatesWsServerInstance = instance;
  console.log(`[WS Server] WebSocket Server running on ws://localhost:${desiredPort}`);

  return instance;
}
