import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const errorSchema = z
  .object({ error: z.union([z.string(), z.record(z.string(), z.unknown())]) })
  .openapi("Error", {});
