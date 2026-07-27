import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { startServer } from "../cli/server.ts";
import type { RunningServer } from "../cli/server.ts";
import { writeSession, feedbackFile, layoutFile } from "../cli/session.ts";
import { raw, tempRepo } from "./helpers.ts";

const here = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(here, "fixtures/order-payment.graph.json");
const TOKEN = "test-token-abc";

let repo: string;
let running: RunningServer;
let port: number;

before(async () => {
  repo = tempRepo();
  writeSession(repo, {
    token: TOKEN,
    pid: null,
    port: 0,
    graphPath: FIXTURE,
    uiDir: "",
    createdAt: new Date().toISOString(),
    status: "starting",
  });
  running = await startServer(repo, TOKEN, { idleMs: 120_000 });
  port = running.port;
});

after(async () => {
  await running.close();
});

const T = { host: "127.0.0.1" };

test("DNS-rebinding guard: non-local Host → 403", async () => {
  const res = await raw(port, { path: `/graph?token=${TOKEN}`, headers: { host: "evil.example.com" } });
  assert.equal(res.status, 403);
});

test("DNS-rebinding guard: non-local Origin → 403", async () => {
  const res = await raw(port, { path: `/graph?token=${TOKEN}`, headers: { ...T, origin: "http://evil.example.com" } });
  assert.equal(res.status, 403);
});

test("missing/invalid token → 401", async () => {
  assert.equal((await raw(port, { path: `/graph`, headers: T })).status, 401);
  assert.equal((await raw(port, { path: `/graph?token=wrong`, headers: T })).status, 401);
});

test("GET /graph returns the authored graph", async () => {
  const res = await raw(port, { path: `/graph?token=${TOKEN}`, headers: T });
  assert.equal(res.status, 200);
  assert.equal(res.json().title, "Split payment flow out of OrderService");
});

test("POST /layout merges and GET /layout returns it", async () => {
  const post = await raw(port, {
    method: "POST",
    path: `/layout?token=${TOKEN}`,
    headers: { ...T, "content-type": "application/json" },
    body: JSON.stringify({ OrderService: { x: 10, y: 20 } }),
  });
  assert.equal(post.status, 200);
  assert.ok(existsSync(layoutFile(repo)));
  const get = await raw(port, { path: `/layout?token=${TOKEN}`, headers: T });
  assert.deepEqual(get.json().OrderService, { x: 10, y: 20 });
});

test("POST /feedback rejects an invalid envelope (400)", async () => {
  const res = await raw(port, {
    method: "POST",
    path: `/feedback?token=${TOKEN}`,
    headers: { ...T, "content-type": "application/json" },
    body: JSON.stringify({ action: "ship" }),
  });
  assert.equal(res.status, 400);
  assert.ok(!existsSync(feedbackFile(repo, TOKEN)), "invalid feedback must not be persisted");
});

test("POST /feedback persists a valid envelope to disk", async () => {
  const envelope = {
    action: "revise",
    comments: [{ nodeId: "OrderService", text: "move token refresh into @PaymentService" }],
    reconnected: [{ edgeId: "e1", end: "target", was: "DB", now: "OrderRepo" }],
  };
  const res = await raw(port, {
    method: "POST",
    path: `/feedback?token=${TOKEN}`,
    headers: { ...T, "content-type": "application/json" },
    body: JSON.stringify(envelope),
  });
  assert.equal(res.status, 200);
  assert.ok(existsSync(feedbackFile(repo, TOKEN)));
  const persisted = JSON.parse(readFileSync(feedbackFile(repo, TOKEN), "utf8"));
  assert.equal(persisted.action, "revise");
  assert.equal(persisted.comments[0].nodeId, "OrderService");
});
