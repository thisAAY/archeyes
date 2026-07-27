// The detached review server. Spawned by `archeyes review`, it outlives the
// foreground poller (so a bash timeout that kills the poller doesn't kill the
// review). It:
//   - serves the prebuilt UI + the graph + saved layout
//   - accepts feedback on Send/Approve/Cancel and PERSISTS it to feedback.json
//   - validates the DNS-rebinding guard (Host/Origin = localhost) + a session token
//   - self-terminates on idle timeout or once feedback is consumed
//
// Runs standalone:  node --experimental-strip-types cli/server.ts <repoRoot> <token>

import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse, Server } from "node:http";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, extname, normalize } from "node:path";
import { validateFeedback } from "../schema/index.ts";
import {
  readSession,
  writeSession,
  feedbackFile,
  layoutFile,
  ensureDir,
  sessionDir,
} from "./session.ts";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);
const DEFAULT_IDLE_MS = Number(process.env.ARCHEYES_IDLE_MS ?? 30 * 60 * 1000);

function hostOf(value: string | undefined): string | null {
  if (!value) return null;
  try {
    // Host header has no scheme; Origin does. Handle both.
    const u = value.includes("://") ? new URL(value) : new URL(`http://${value}`);
    return u.hostname;
  } catch {
    return null;
  }
}

/** DNS-rebinding guard: only requests whose Host (and Origin, if present) resolve
 * to localhost are allowed, regardless of the token. Token-in-URL alone does not
 * stop a malicious page in another tab from POSTing to our port. */
export function isLocalRequest(req: IncomingMessage): boolean {
  const host = hostOf(req.headers.host);
  if (!host || !LOCAL_HOSTS.has(host)) return false;
  const origin = req.headers.origin;
  if (origin) {
    const oh = hostOf(origin);
    if (!oh || !LOCAL_HOSTS.has(oh)) return false;
  }
  return true;
}

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
};

function readBody(req: IncomingMessage, limitBytes = 2_000_000): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => {
      size += c.length;
      if (size > limitBytes) {
        reject(new Error("body too large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

export interface StartOptions {
  idleMs?: number;
  /** override the UI directory (defaults to the session's uiDir) */
  uiDir?: string;
}

export interface RunningServer {
  server: Server;
  port: number;
  close: () => Promise<void>;
}

export function startServer(repoRoot: string, token: string, opts: StartOptions = {}): Promise<RunningServer> {
  const idleMs = opts.idleMs ?? DEFAULT_IDLE_MS;
  const session = readSession(repoRoot, token);
  const uiDir = opts.uiDir ?? session?.uiDir ?? "";
  const graphPath = session?.graphPath ?? "";

  let idleTimer: NodeJS.Timeout;
  let closing = false;

  const server = createServer(async (req, res) => {
    resetIdle();
    try {
      await handle(req, res);
    } catch (err: any) {
      json(res, 500, { error: String(err?.message ?? err) });
    }
  });

  function resetIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => void close(), idleMs);
    if (typeof idleTimer.unref === "function") idleTimer.unref();
  }

  function json(res: ServerResponse, code: number, body: unknown) {
    const s = JSON.stringify(body);
    res.writeHead(code, { "content-type": "application/json; charset=utf-8" });
    res.end(s);
  }

  function tokenOf(url: URL, req: IncomingMessage): string | null {
    return url.searchParams.get("token") ?? (req.headers["x-archeyes-token"] as string | undefined) ?? null;
  }

  async function handle(req: IncomingMessage, res: ServerResponse) {
    if (!isLocalRequest(req)) return json(res, 403, { error: "non-local request rejected (DNS-rebinding guard)" });

    const url = new URL(req.url ?? "/", "http://localhost");
    const path = url.pathname;

    if (tokenOf(url, req) !== token) return json(res, 401, { error: "invalid or missing session token" });

    if (req.method === "GET" && (path === "/" || path === "/index.html")) return serveIndex(res);
    if (req.method === "GET" && path === "/graph") return serveGraph(res);
    if (req.method === "GET" && path === "/layout") return serveLayout(res);
    if (req.method === "POST" && path === "/layout") return await saveLayout(req, res);
    if (req.method === "POST" && path === "/feedback") return await postFeedback(req, res);
    if (req.method === "POST" && path === "/shutdown") {
      json(res, 200, { ok: true });
      void close();
      return;
    }
    if (req.method === "GET" && path.startsWith("/assets/")) return serveStatic(path, res);

    json(res, 404, { error: "not found" });
  }

  function serveIndex(res: ServerResponse) {
    const index = uiDir ? join(uiDir, "index.html") : "";
    if (index && existsSync(index)) {
      res.writeHead(200, { "content-type": MIME[".html"] });
      res.end(readFileSync(index));
      return;
    }
    // Fallback so the server is usable before the UI bundle is built.
    res.writeHead(200, { "content-type": MIME[".html"] });
    res.end(
      `<!doctype html><meta charset=utf8><title>ArchEyes</title>` +
        `<body style="font:14px ui-monospace,monospace;padding:2rem;background:#0b0e14;color:#cbd5e1">` +
        `<h1>ArchEyes server is up</h1><p>UI bundle not found. Run <code>npm run build:ui</code>.</p>` +
        `<p>Graph + feedback API are live at <code>/graph</code> and <code>/feedback</code>.</p></body>`,
    );
  }

  function serveGraph(res: ServerResponse) {
    if (!graphPath || !existsSync(graphPath)) return json(res, 404, { error: "graph not found" });
    res.writeHead(200, { "content-type": MIME[".json"] });
    res.end(readFileSync(graphPath));
  }

  function serveLayout(res: ServerResponse) {
    const f = layoutFile(repoRoot);
    res.writeHead(200, { "content-type": MIME[".json"] });
    res.end(existsSync(f) ? readFileSync(f) : "{}");
  }

  async function saveLayout(req: IncomingMessage, res: ServerResponse) {
    const body = JSON.parse((await readBody(req)) || "{}");
    ensureDir(join(repoRoot, ".archeyes"));
    const f = layoutFile(repoRoot);
    const existing = existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : {};
    writeFileSync(f, JSON.stringify({ ...existing, ...body }, null, 2));
    json(res, 200, { ok: true });
  }

  async function postFeedback(req: IncomingMessage, res: ServerResponse) {
    const parsed = JSON.parse((await readBody(req)) || "{}");
    const result = validateFeedback(parsed);
    if (!result.valid) return json(res, 400, { error: "invalid feedback", details: result.errors });

    ensureDir(sessionDir(repoRoot, token));
    writeFileSync(feedbackFile(repoRoot, token), JSON.stringify(result.data, null, 2));
    const info = readSession(repoRoot, token);
    if (info) writeSession(repoRoot, { ...info, status: "done" });

    json(res, 200, { ok: true });
    // Feedback captured + persisted; the poller (or --resume) will read it from
    // disk. Give the response a beat to flush, then wind down.
    setTimeout(() => void close(), 250);
  }

  function serveStatic(path: string, res: ServerResponse) {
    if (!uiDir) return json(res, 404, { error: "no ui" });
    const rel = normalize(path).replace(/^(\.\.[/\\])+/, "");
    const file = join(uiDir, rel);
    if (!file.startsWith(uiDir) || !existsSync(file)) return json(res, 404, { error: "not found" });
    res.writeHead(200, { "content-type": MIME[extname(file)] ?? "application/octet-stream" });
    res.end(readFileSync(file));
  }

  function close(): Promise<void> {
    if (closing) return Promise.resolve();
    closing = true;
    clearTimeout(idleTimer);
    return new Promise((resolve) => server.close(() => resolve()));
  }

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      const info = readSession(repoRoot, token);
      if (info) writeSession(repoRoot, { ...info, pid: process.pid, port, status: "ready" });
      resetIdle();
      resolve({ server, port, close });
    });
  });
}

// Detached-process entry point.
if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , repoRoot, token] = process.argv;
  if (!repoRoot || !token) {
    process.stderr.write("usage: server.ts <repoRoot> <token>\n");
    process.exit(2);
  }
  startServer(repoRoot, token).then(({ port }) => {
    process.stderr.write(`[archeyes] server ready on 127.0.0.1:${port}\n`);
  });
}
