import assert from "node:assert/strict";
import { describe, test } from "bun:test";

process.env.DATABASE_URL ??= "postgres://user:pass@localhost:5432/sunity-test";
process.env.BETTER_AUTH_SECRET ??= "test-secret";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
process.env.FRONTEND_URL ??= "http://localhost:5173";
process.env.GOOGLE_CLIENT_ID ??= "test-client-id";
process.env.GOOGLE_CLIENT_SECRET ??= "test-client-secret";

const { createRequireSession, requirePermission } = await import("../auth.middleware.js");

describe("createRequireSession", () => {
  test("returns 401 when the session is missing", async () => {
    const middleware = createRequireSession(async () => null as never);

    let statusCode: number | undefined;
    let payload: unknown;
    let nextCalled = false;

    const req = { headers: {} };
    const res = {
      status(status: number) {
        statusCode = status;
        return this;
      },
      json(body: unknown) {
        payload = body;
        return this;
      },
    };

    await middleware(req as never, res as never, () => {
      nextCalled = true;
    });

    assert.equal(statusCode, 401);
    assert.deepEqual(payload, { error: "Unauthorized" });
    assert.equal(nextCalled, false);
  });

  test("stores the session and continues when authenticated", async () => {
    const session = { user: { role: "admin" } };
    const middleware = createRequireSession(async () => session as never);

    let nextCalled = false;
    const req = { headers: {} };
    const res = {};

    await middleware(req as never, res as never, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.deepEqual((req as { session?: unknown }).session, session);
  });
});

describe("requirePermission", () => {
  test("returns 403 when the role does not match", async () => {
    const middleware = requirePermission(["admin"]);

    let statusCode: number | undefined;
    let payload: unknown;
    let nextCalled = false;

    const req = {
      session: {
        user: {
          role: "member",
        },
      },
    };
    const res = {
      status(status: number) {
        statusCode = status;
        return this;
      },
      json(body: unknown) {
        payload = body;
        return this;
      },
    };

    await middleware(req as never, res as never, () => {
      nextCalled = true;
    });

    assert.equal(statusCode, 403);
    assert.deepEqual(payload, { error: "Forbidden" });
    assert.equal(nextCalled, false);
  });

  test("continues when the role matches", async () => {
    const middleware = requirePermission(["admin"]);

    let nextCalled = false;
    const req = {
      session: {
        user: {
          role: "admin,editor",
        },
      },
    };
    const res = {};

    await middleware(req as never, res as never, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
  });
});
