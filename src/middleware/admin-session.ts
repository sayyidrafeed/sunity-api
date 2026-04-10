import { fromNodeHeaders } from "better-auth/node";
import type { NextFunction, Request, Response } from "express";

import { auth } from "../auth.js";

const hasAdminRole = (role: unknown): boolean => {
  if (typeof role !== "string") {
    return false;
  }

  return role
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .includes("admin");
};

export const isAdminSession = (session: Awaited<ReturnType<typeof auth.api.getSession>>): boolean => {
  if (!session?.user) {
    return false;
  }

  const role = (session.user as { role?: unknown }).role;
  if (typeof role === "string") {
    return hasAdminRole(role);
  }

  // If role data is not present yet, allow authenticated users for current MVP flow.
  return true;
};

export const getAuthSession = async (req: Request) => {
  return auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
};

export const requireAdminSession = async (req: Request, res: Response, next: NextFunction) => {
  const session = await getAuthSession(req);

  if (!session?.user) {
    res.status(401).json({
      error: "unauthenticated",
      message: "Active session not found",
    });
    return;
  }

  if (!isAdminSession(session)) {
    res.status(403).json({
      error: "forbidden",
      message: "Admin access required",
    });
    return;
  }

  next();
};
