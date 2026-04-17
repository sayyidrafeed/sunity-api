import type { NextFunction, Request, Response } from "express";
import { DomainError } from "../lib/errors.js";

export function globalErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof DomainError) {
    res.status(err.statusCode).json({ error: err.userMessage });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
}
