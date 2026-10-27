import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { app } from "../app.js";
import { env } from "../env.js";

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => {
  server.close();
});

describe("app routing", () => {
  test("CORS preflight allows PATCH from a frontend origin", async () => {
    const res = await fetch(`${baseUrl}/api/admin/campaigns/some-id/status`, {
      method: "OPTIONS",
      headers: {
        Origin: env.frontendUrls[0]!,
        "Access-Control-Request-Method": "PATCH",
      },
    });

    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-methods")?.split(",").includes("PATCH")).toBe(
      true,
    );
  });

  test("Midtrans webhook is mounted and rejects a bad signature before touching the database", async () => {
    const res = await fetch(`${baseUrl}/api/webhook/midtrans`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: "SUNITY-DON-1",
        status_code: "200",
        gross_amount: "10000.00",
        signature_key: "not-a-valid-signature",
        transaction_status: "settlement",
      }),
    });

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Invalid Midtrans webhook signature" });
  });

  test("asset upload lives at /api/assets/upload, matching the OpenAPI contract", async () => {
    const post = (path: string) =>
      fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });

    expect((await post("/api/assets/upload")).status).toBe(400);
    expect((await post("/api/assets/assets/upload")).status).toBe(404);
  });
});
