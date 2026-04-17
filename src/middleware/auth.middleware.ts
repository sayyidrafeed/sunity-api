import { fromNodeHeaders } from "better-auth/node";
import type { NextFunction, Request, Response } from "express";
import { auth } from "../auth.js";

export const requireSession = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session?.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  req.session = session;
  next();
};

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
