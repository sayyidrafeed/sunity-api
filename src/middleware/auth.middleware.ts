import { fromNodeHeaders } from "better-auth/node";
import type { NextFunction, Request, Response } from "express";
import { auth } from "../auth.js";

type Session = Awaited<ReturnType<typeof auth.api.getSession>>;

type SessionGetter = (context: { headers: Headers }) => Promise<Session>;

const defaultGetSession: SessionGetter = auth.api.getSession as unknown as SessionGetter;

export function createRequireSession(getSession: SessionGetter = defaultGetSession) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const session = await getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    req.session = session;
    next();
  };
}

export const requireSession = createRequireSession();

export function requirePermission(roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userRole = (req.session?.user as { role?: string } | undefined)?.role ?? "";
    const userRoles = userRole.split(",").map((r) => r.trim().toLowerCase());

    const allowed = roles.some((r) => userRoles.includes(r.toLowerCase()));

    if (!allowed) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    next();
  };
}
