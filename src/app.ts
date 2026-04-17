import { apiReference } from "@scalar/express-api-reference";
import cors from "cors";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth.js";
import { env } from "./config/env.js";
import { globalErrorHandler } from "./middleware/error.middleware.js";
import { generateOpenAPIDocument } from "./lib/openapi.js";
import { adminRouter } from "./modules/admin/admin.index.js";

export const app = express();

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "Origin"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);

app.all("/api/auth/*", toNodeHandler(auth));

app.use(express.json());

app.get("/openapi.json", (_req, res) => {
  res.json(generateOpenAPIDocument());
});

app.use("/docs", apiReference({ url: "/openapi.json" }));

app.use("/api", adminRouter);

app.use(globalErrorHandler);
