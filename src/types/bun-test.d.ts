declare module "bun:test" {
  export { afterAll, afterEach, beforeAll, beforeEach, describe, it, test } from "node:test";
  export function expect(actual: unknown): {
    toBe(expected: unknown): void;
    toEqual(expected: unknown): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
  };
  export const mock: typeof import("node:test").mock;
}
