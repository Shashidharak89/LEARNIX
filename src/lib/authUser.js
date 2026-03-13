import jwt from "jsonwebtoken";
import User from "@/models/User";

const SECRET_KEY = process.env.SECRET_KEY || "mysecretkey";

export async function resolveAuthenticatedUser(req) {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;

  const token = auth.slice(7).trim();
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await User.findById(decoded.userId).lean();
    if (!user) return null;

    const decodedUsn = String(decoded.usn || "").toUpperCase();
    const actualUsn = String(user.usn || "").toUpperCase();
    if (decodedUsn && actualUsn && decodedUsn !== actualUsn) return null;

    if (user.token && user.token !== token) return null;

    return user;
  } catch {
    return null;
  }
}
