import assert from "node:assert/strict";
import { describe, test } from "bun:test";
import { type AppOpenAPIDocument, mergeOpenAPIDocuments } from "../openapi.js";

describe("mergeOpenAPIDocuments", () => {
  test("merges app and external paths", () => {
    const appDocument: AppOpenAPIDocument = {
      openapi: "3.0.0",
      info: { title: "Sunity API", version: "1.0.0" },
      paths: {
        "/app/health": {
          get: {
            summary: "App health",
            responses: {
              200: { description: "OK" },
            },
          },
        },
      },
      components: {},
      tags: [],
      servers: [{ url: "/api" }],
      security: [],
    };

    const externalDocument = {
      paths: {
        "/auth/ok": {
          get: {
            summary: "Auth health",
            responses: {
              200: { description: "OK" },
            },
          },
        },
      },
      components: {
        schemas: {
          AuthSchema: { type: "object" },
        },
      },
      tags: [{ name: "Auth" }],
      servers: [{ url: "/api/auth" }],
      security: [{ bearerAuth: [] }],
    };

    const merged = mergeOpenAPIDocuments(appDocument, externalDocument);

    assert.equal(Boolean(merged.paths["/app/health"]), true);
    assert.equal(Boolean(merged.paths["/auth/ok"]), true);
    assert.equal(Boolean(merged.components?.schemas?.AuthSchema), true);
    assert.equal(
      merged.tags?.some((tag) => tag.name === "Auth"),
      true,
    );
    assert.equal(
      merged.servers?.some((server) => server.url === "/api/auth"),
      true,
    );
    assert.equal(
      merged.security?.some((item) => "bearerAuth" in item),
      true,
    );
  });
});
