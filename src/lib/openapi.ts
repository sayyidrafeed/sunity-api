import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";

export const registry = new OpenAPIRegistry();

export type AppOpenAPIDocument = ReturnType<OpenApiGeneratorV3["generateDocument"]>;
type OpenAPIComponents = NonNullable<AppOpenAPIDocument["components"]>;
type OpenAPITag = NonNullable<AppOpenAPIDocument["tags"]>[number];
type OpenAPIServer = NonNullable<AppOpenAPIDocument["servers"]>[number];

export type ExternalOpenAPIDocument = {
  paths?: Record<string, unknown>;
  components?: Record<string, Record<string, unknown>>;
  tags?: Array<Record<string, unknown>>;
  servers?: Array<Record<string, unknown>>;
  security?: Array<Record<string, unknown>>;
};

let cachedAppDocument: AppOpenAPIDocument | null = null;

export function generateOpenAPIDocument() {
  if (cachedAppDocument) return cachedAppDocument;

  const generator = new OpenApiGeneratorV3(registry.definitions);
  cachedAppDocument = generator.generateDocument({
    openapi: "3.0.0",
    info: { title: "Sunity API", version: "1.0.0" },
    servers: [{ url: "/api" }],
  });

  return cachedAppDocument;
}

function mergeTags(appTags: OpenAPITag[] = [], externalTags: Array<Record<string, unknown>> = []) {
  const merged = new Map<string, OpenAPITag>();

  for (const tag of appTags) {
    merged.set(tag.name, tag);
  }

  for (const tag of externalTags) {
    const name = typeof tag.name === "string" ? tag.name : null;
    if (!name) continue;
    if (!merged.has(name)) {
      merged.set(name, tag as OpenAPITag);
    }
  }

  return [...merged.values()];
}

function mergeServers(
  appServers: AppOpenAPIDocument["servers"] = [],
  externalServers: Array<Record<string, unknown>> = [],
) {
  const merged = new Map<string, OpenAPIServer>();

  for (const server of appServers) {
    merged.set(server.url, server);
  }

  for (const server of externalServers) {
    const url = typeof server.url === "string" ? server.url : null;
    if (!url) continue;
    if (!merged.has(url)) {
      merged.set(url, server as unknown as OpenAPIServer);
    }
  }

  return [...merged.values()];
}

function mergeComponentSection(
  appSection: Record<string, unknown>,
  externalSection: Record<string, unknown>,
) {
  return { ...appSection, ...externalSection };
}

export function mergeOpenAPIDocuments(
  appDocument: AppOpenAPIDocument,
  externalDocument: ExternalOpenAPIDocument,
): AppOpenAPIDocument {
  const appComponents = (appDocument.components ?? {}) as OpenAPIComponents;
  const externalComponents = externalDocument.components ?? {};

  const mergedComponents: OpenAPIComponents = {
    ...appComponents,
  };

  for (const [sectionName, sectionValue] of Object.entries(externalComponents)) {
    const key = sectionName as keyof OpenAPIComponents;
    const externalSection = sectionValue;
    if (!externalSection) continue;

    const appSection = (mergedComponents[key] ?? {}) as Record<string, unknown>;
    mergedComponents[key] = mergeComponentSection(
      appSection,
      externalSection as Record<string, unknown>,
    ) as OpenAPIComponents[keyof OpenAPIComponents];
  }

  const mergedPaths = {
    ...appDocument.paths,
    ...externalDocument.paths,
  } as AppOpenAPIDocument["paths"];

  const mergedSecurity = [
    ...(appDocument.security ?? []),
    ...(externalDocument.security ?? []),
  ] as NonNullable<AppOpenAPIDocument["security"]>;

  return {
    ...appDocument,
    paths: mergedPaths,
    components: mergedComponents,
    tags: mergeTags(appDocument.tags, externalDocument.tags),
    servers: mergeServers(appDocument.servers, externalDocument.servers),
    security: mergedSecurity,
  };
}
