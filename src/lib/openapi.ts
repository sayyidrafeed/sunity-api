import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";

export const registry = new OpenAPIRegistry();

let cachedDocument: ReturnType<OpenApiGeneratorV3["generateDocument"]> | null = null;

export function generateOpenAPIDocument() {
  if (cachedDocument) return cachedDocument;

  const generator = new OpenApiGeneratorV3(registry.definitions);
  cachedDocument = generator.generateDocument({
    openapi: "3.0.0",
    info: { title: "Sunity API", version: "1.0.0" },
    servers: [{ url: "/api" }],
  });

  return cachedDocument;
}
