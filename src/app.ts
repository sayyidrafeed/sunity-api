import { apiReference } from "@scalar/express-api-reference";
import cors from "cors";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth.js";
import { env } from "./env.js";
import { globalErrorHandler } from "./middleware/error.middleware.js";
import { generateOpenAPIDocument, mergeOpenAPIDocuments } from "./lib/openapi.js";

export const app = express();

app.use(
  cors({
    origin: env.frontendUrls,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "Origin"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

let cachedMergedOpenApi: ReturnType<typeof generateOpenAPIDocument> | null = null;

app.get("/openapi.json", async (_req, res, next) => {
  try {
    if (!cachedMergedOpenApi) {
      const appSchema = generateOpenAPIDocument();
      const authSchema = await auth.api.generateOpenAPISchema();
      cachedMergedOpenApi = mergeOpenAPIDocuments(appSchema, authSchema);
    }

    res.json(cachedMergedOpenApi);
  } catch (error) {
    next(error);
  }
});

app.use("/docs", apiReference({ pageTitle: "Sunity API Reference", url: "/openapi.json" }));

app.use(globalErrorHandler);
