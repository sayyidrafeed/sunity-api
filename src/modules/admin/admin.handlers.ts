import type { NextFunction, Request, Response } from "express";
import { ForbiddenError } from "../../lib/errors.js";
import { getAdminSession } from "./admin.service.js";

export async function getSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const session = await getAdminSession(req.headers);
    res.status(200).json({ authenticated: true, user: session?.user });
  } catch (err) {
    if (err instanceof ForbiddenError) {
      res.status(403).json({ error: err.userMessage });
      return;
    }
    next(err);
  }
}

export async function getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const session = await getAdminSession(req.headers);
    res.status(200).json({
      message: "Admin dashboard session is valid",
      user: session?.user,
    });
  } catch (err) {
    if (err instanceof ForbiddenError) {
      res.status(403).json({ error: err.userMessage });
      return;
    }
    next(err);
  }
}
