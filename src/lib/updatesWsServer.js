import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import cloudinary from "@/lib/cloudinary";

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
        // Socket may be closed
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
          const { filename, fileSize, userId } = msg;
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
  console.log(`[WS Updates] WebSocket Upload Server running on ws://localhost:${desiredPort}`);

  return instance;
}
