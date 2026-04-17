import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { createSelectSchema } from "drizzle-zod";
import { users } from "../../db/schema/index.js";

extendZodWithOpenApi(z);

const userSelectSchema = createSelectSchema(users);

export const adminUserSchema = userSelectSchema
  .pick({ id: true, name: true, email: true, role: true, createdAt: true })
  .openapi("AdminUser", {});

export const sessionResponseSchema = z
  .object({
    authenticated: z.literal(true),
    user: adminUserSchema,
  })
  .openapi("AdminSessionResponse", {});

export const dashboardResponseSchema = z
  .object({
    message: z.string(),
    user: adminUserSchema,
  })
  .openapi("AdminDashboardResponse", {});
