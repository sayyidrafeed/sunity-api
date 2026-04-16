import { Router } from "express";
import { auth } from "../auth.js";

export const authRouter = Router();

authRouter.get("/login/google", async (req, res) => {
  const response = await auth.api.signInSocial({
    body: {
      provider: "google",
      callbackURL: `${process.env.BETTER_AUTH_URL}/api/admin/auth/callback`,
    },
    headers: req.headers as any,
  });

  if (response?.url) {
    res.redirect(response.url);
  }
});