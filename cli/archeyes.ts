// ArchEyes CLI. One command per review round.
//
//   archeyes review <plan-graph.json>   → serve, open browser, block until Send/Approve/Cancel,
//                                          print feedback JSON to stdout, exit.
//   archeyes review --resume             → re-attach to a running review whose poller was killed.
//
// Process model (survives the harness's ~10-min bash timeout):
//
//   review ─┬─ spawn DETACHED server ───────────────► (owns its own session; unref'd)
//           │      binds ephemeral port, writes session.json, waits for ONE feedback,
//           │      persists it to feedback.json, then self-exits (idle timeout as backstop)
//           │
//           └─ foreground POLLER  ── watches feedback.json ──► prints JSON to stdout, exit 0
//                    │
//                    ✗ killed by bash timeout?  server lives on ▲
//                    └─ `review --resume`  ── re-attach a fresh poller ──► reads feedback.json
//                       (feedback that fired while unattended is already on disk)
//
// Contract the skill relies on:
//   stdout = the feedback JSON envelope, and nothing else.
//   exit 0 = feedback printed (revise | approve | cancel).
//   exit non-zero = no feedback (server error, idle timeout, bad usage).

import { spawn } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { resolve, join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { platform } from "node:os";
import { validateGraph, findOrphanedRefs } from "../schema/index.ts";
import type { Feedback, PlanGraph } from "../schema/index.ts";
import {
  newToken,
  writeSession,
  readSession,
  findResumableSession,
  archeyesDir,
  ensureDir,
  pidAlive,
} from "./session.ts";
import { pollForFeedback } from "./poller.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
// ".ts" when run from source (dev, via --experimental-strip-types); ".js" when
// running the compiled/published bundle. The sibling server matches our own ext.
const SELF_EXT = extname(fileURLToPath(import.meta.url));
const SERVER = join(HERE, `server${SELF_EXT}`);

/** Walk up to the package root (dev: repo; published: node_modules/archeyes). */
function findPackageRoot(from: string): string {
  let dir = from;
  for (let i = 0; i < 6; i++) {
    if (existsSync(join(dir, "package.json"))) return dir;
    const up = dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return resolve(HERE, "..");
}
const DEFAULT_UI_DIR = join(findPackageRoot(HERE), "dist", "ui");

// Everything that isn't the feedback envelope goes to stderr — stdout stays pure.
function log(msg: string): void {
  process.stderr.write(`[archeyes] ${msg}\n`);
}
function emitFeedback(feedback: unknown): void {
  process.stdout.write(JSON.stringify(feedback, null, 2) + "\n");
}
function fail(msg: string, code = 1): never {
  log(msg);
  process.exit(code);
}

function lastFeedbackPath(repoRoot: string): string {
  return join(archeyesDir(repoRoot), "last-feedback.json");
}

function openBrowser(url: string): void {
  const cmd = platform() === "darwin" ? "open" : platform() === "win32" ? "start" : "xdg-open";
  try {
    const child = spawn(cmd, [url], { stdio: "ignore", detached: true, shell: platform() === "win32" });
    child.unref();
  } catch {
    log(`could not open a browser automatically — open ${url} yourself`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Wait for the detached server to bind and write its port into session.json. */
async function waitForPort(repoRoot: string, token: string, timeoutMs = 20000): Promise<number> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const info = readSession(repoRoot, token);
    // port is set the instant the server binds. Don't gate on status === "ready":
    // fast feedback can flip it to "done" before we observe "ready" (race).
    if (info && info.port > 0) return info.port;
    await sleep(100);
  }
  throw new Error("server did not come up in time");
}

/** The build-now safety net: if the graph the agent just authored dropped a node
 * that the previous round's feedback referenced, the agent renamed/lost it and
 * that feedback silently orphaned. Warn (don't block). */
function warnOrphans(repoRoot: string, graph: PlanGraph): void {
  const lf = lastFeedbackPath(repoRoot);
  if (!existsSync(lf)) return;
  try {
    const prior = JSON.parse(readFileSync(lf, "utf8")) as Feedback;
    const orphans = findOrphanedRefs(prior, graph);
    if (orphans.length > 0) {
      log(`WARN: your last round referenced ${orphans.map((o) => `"${o}"`).join(", ")}, ` +
        `not present in this graph. The agent may have renamed or dropped ${orphans.length === 1 ? "it" : "them"}; ` +
        `that feedback lost its anchor.`);
    }
  } catch {
    /* ignore a malformed prior-feedback file */
  }
}

async function finishWithFeedback(repoRoot: string, feedback: unknown): Promise<void> {
  // Stash for the next round's orphan check, then emit on stdout.
  try {
    ensureDir(archeyesDir(repoRoot));
    writeFileSync(lastFeedbackPath(repoRoot), JSON.stringify(feedback, null, 2));
  } catch {
    /* non-fatal */
  }
  emitFeedback(feedback);
  process.exit(0);
}

async function reviewFresh(graphArg: string, flags: Flags): Promise<void> {
  const repoRoot = process.cwd();
  const graphPath = resolve(graphArg);
  if (!existsSync(graphPath)) fail(`graph file not found: ${graphPath}`, 2);

  let graph: PlanGraph;
  try {
    graph = JSON.parse(readFileSync(graphPath, "utf8"));
  } catch (e: any) {
    return fail(`could not parse ${graphPath}: ${e?.message ?? e}`, 2);
  }
  const check = validateGraph(graph);
  if (!check.valid) {
    log("plan-graph.json failed validation:");
    for (const err of check.errors) log(`  - ${err}`);
    process.exit(2);
  }

  warnOrphans(repoRoot, graph);

  const token = newToken();
  const uiDir = existsSync(DEFAULT_UI_DIR) ? DEFAULT_UI_DIR : "";
  if (!uiDir) log("UI bundle not built (dist/ui). Serving fallback page — run `npm run build:ui` for the canvas.");

  writeSession(repoRoot, {
    token,
    pid: null,
    port: 0,
    graphPath,
    uiDir,
    createdAt: new Date().toISOString(),
    status: "starting",
  });

  const args = [...(SELF_EXT === ".ts" ? ["--experimental-strip-types"] : []), SERVER, repoRoot, token];
  if (flags.idleMs != null) process.env.ARCHEYES_IDLE_MS = String(flags.idleMs);
  const server = spawn(process.execPath, args, { detached: true, stdio: "ignore", env: process.env });
  server.unref();

  const port = await waitForPort(repoRoot, token).catch((e) => fail(String(e?.message ?? e), 1));
  const url = `http://127.0.0.1:${port}/?token=${token}`;
  log(`review server ready — ${graph.title}`);
  log(`open: ${url}`);
  if (!flags.noOpen) openBrowser(url);

  const info = readSession(repoRoot, token);
  const result = await pollForFeedback(repoRoot, token, { serverPid: info?.pid ?? server.pid ?? null, timeoutMs: flags.timeoutMs ?? 0 });
  if (result.reason === "feedback") return finishWithFeedback(repoRoot, result.feedback);
  if (result.reason === "server-gone") fail("the review server exited without feedback (idle timeout?). Re-run to start a new round.", 1);
  fail("timed out waiting for feedback — the server is still up; re-run `archeyes review --resume`.", 1);
}

async function reviewResume(flags: Flags): Promise<void> {
  const repoRoot = process.cwd();
  const info = findResumableSession(repoRoot);
  if (!info) fail("nothing to resume — no live review session found. Start one with `archeyes review <graph.json>`.", 3);

  if (!pidAlive(info.pid)) log("server process not alive, but reading persisted feedback if present…");
  else {
    const url = `http://127.0.0.1:${info.port}/?token=${info.token}`;
    log(`re-attached to review on 127.0.0.1:${info.port}`);
    if (!flags.noOpen) openBrowser(url);
  }

  const result = await pollForFeedback(repoRoot, info.token, { serverPid: info.pid, timeoutMs: flags.timeoutMs ?? 0 });
  if (result.reason === "feedback") return finishWithFeedback(repoRoot, result.feedback);
  if (result.reason === "server-gone") fail("the review server is gone and no feedback was persisted.", 1);
  fail("timed out waiting for feedback; re-run `archeyes review --resume`.", 1);
}

interface Flags {
  resume: boolean;
  noOpen: boolean;
  idleMs: number | null;
  timeoutMs: number | null;
}

function parseFlags(argv: string[]): { positionals: string[]; flags: Flags } {
  const positionals: string[] = [];
  const flags: Flags = { resume: false, noOpen: false, idleMs: null, timeoutMs: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--resume") flags.resume = true;
    else if (a === "--no-open") flags.noOpen = true;
    else if (a === "--idle-ms") flags.idleMs = Number(argv[++i]);
    else if (a === "--timeout-ms") flags.timeoutMs = Number(argv[++i]);
    else positionals.push(a);
  }
  return { positionals, flags };
}

const USAGE = `archeyes — bidirectional plan diagrams for AI coding agents

usage:
  archeyes review <plan-graph.json>    serve the graph, open the browser, block until you Send/Approve/Cancel
  archeyes review --resume             re-attach to a review whose poller was killed (e.g. bash timeout)

flags:
  --no-open        don't open a browser (print the URL only)
  --idle-ms <n>    server self-terminates after n ms with no activity (default 1800000)
  --timeout-ms <n> give up the foreground poll after n ms (0 = block; default 0)

output contract:
  stdout = the feedback JSON envelope, nothing else.
  exit 0 = feedback printed; non-zero = no feedback.`;

async function main(): Promise<void> {
  const [cmd, ...rest] = process.argv.slice(2);
  const { positionals, flags } = parseFlags(rest);

  if (cmd === "review") {
    if (flags.resume) return reviewResume(flags);
    if (positionals.length === 0) fail("`archeyes review` needs a graph file (or --resume).\n\n" + USAGE, 2);
    return reviewFresh(positionals[0], flags);
  }
  if (cmd === "--help" || cmd === "-h" || cmd === "help" || !cmd) {
    process.stdout.write(USAGE + "\n");
    process.exit(cmd ? 0 : 2);
  }
  fail(`unknown command: ${cmd}\n\n${USAGE}`, 2);
}

main();
