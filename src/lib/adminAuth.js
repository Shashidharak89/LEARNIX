import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

const SECRET_KEY = process.env.SECRET_KEY || "mysecretkey";

export async function verifyAdminCaller(req) {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    await connectDB();
    const caller = await User.findById(decoded.userId).lean();
    if (!caller || (caller.role !== "admin" && caller.role !== "superadmin")) {
      return null;
    }
    return caller;
  } catch {
    return null;
  }
}
