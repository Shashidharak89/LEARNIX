import { NextResponse } from "next/server";
import { resolveAuthenticatedUser } from "@/lib/authUser";

/**
 * Validates that the request includes a valid Bearer token and belongs to an admin or superadmin.
 * Returns { authorized: true, caller } or { authorized: false, response: NextResponse }.
 */
export async function verifyAdminOrSuperAdmin(req) {
  const auth = await resolveAuthenticatedUser(req, { withMeta: true });

  if (!auth.tokenProvided) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Authorization token required. Please login with an admin account." },
        { status: 401 }
      ),
    };
  }

  if (auth.tokenInvalid) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Session expired or invalid token. Please login again." },
        { status: 401 }
      ),
    };
  }

  const caller = auth.user;
  if (!caller || (caller.role !== "admin" && caller.role !== "superadmin")) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Forbidden. Admin or Super Admin privileges required." },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, caller };
}
