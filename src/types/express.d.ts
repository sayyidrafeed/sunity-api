import type { auth } from "../auth.js";

type Session = Awaited<ReturnType<typeof auth.api.getSession>>;

declare global {
  namespace Express {
    interface Request {
      session?: Session;
      validatedBody?: unknown;
      validatedQuery?: unknown;
      validatedParams?: unknown;
    }
  }
}

export {};
