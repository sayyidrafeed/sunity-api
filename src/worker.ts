/**
 * Cloudflare Workers entry point.
 * Uses the Node.js HTTP server compatibility layer introduced in wrangler 4.28.0.
 *
 * Requires compatibility flags:
 *   - nodejs_compat
 *   - enable_nodejs_http_server_modules
 */
// @ts-ignore -- provided by CF Workers runtime with enable_nodejs_http_server_modules flag
import { httpServerHandler } from "cloudflare:node";
import { createServer } from "node:http";
import { app } from "./app.js";

const server = createServer(app);

// Port acts as a routing key inside the Worker, not an actual network port.
server.listen(8080);

export default httpServerHandler({ port: 8080 });
