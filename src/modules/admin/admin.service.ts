import { fromNodeHeaders } from "better-auth/node";
import type { IncomingHttpHeaders } from "node:http";
import { auth } from "../../auth.js";
import { ForbiddenError } from "../../lib/errors.js";

export async function getAdminSession(headers: IncomingHttpHeaders) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(headers),
  });

  if (!session?.user) return null;

  const role = (session.user as { role?: string }).role ?? "";
  const isAdmin = role
    .split(",")
    .map((r) => r.trim().toLowerCase())
    .includes("admin");

  if (!isAdmin) throw new ForbiddenError("Admin access required");

  return session;
}
