import { Router } from "express";

import { env } from "../config/env.js";
import { getAuthSession, isAdminSession, requireAdminSession } from "../middleware/admin-session.js";

export const adminRouter = Router();

const resolveAdminRedirectPath = (value: unknown): string => {
  if (typeof value !== "string") {
    return env.adminSuccessRedirectPath;
  }

  if (!value.startsWith("/admin")) {
    return env.adminSuccessRedirectPath;
  }

  return value;
};

adminRouter.get("/admin/auth/callback", async (req, res) => {
  const session = await getAuthSession(req);

  if (!session?.user || !isAdminSession(session)) {
    res.redirect(302, env.adminFailureRedirectPath);
    return;
  }

  const nextPath = resolveAdminRedirectPath(req.query.redirect);
  res.redirect(302, nextPath);
});

adminRouter.get("/admin/session", requireAdminSession, async (req, res) => {
  const session = await getAuthSession(req);

  res.status(200).json({
    authenticated: true,
    session,
  });
});

adminRouter.get("/admin/dashboard", requireAdminSession, async (req, res) => {
  const session = await getAuthSession(req);

  res.status(200).json({
    message: "Admin dashboard session is valid",
    user: session?.user,
    session: session?.session,
  });
});
