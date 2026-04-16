import cors from "cors";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth.js";
import { authRouter } from "./routes/auth.js";
import { adminRouter } from "./routes/admin.js";
import { env } from "./config/env.js";

export const app = express();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "Origin"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));

app.use("/api/auth", toNodeHandler(auth));

app.use(express.json());
app.use("/api", authRouter);
app.use("/api", adminRouter);