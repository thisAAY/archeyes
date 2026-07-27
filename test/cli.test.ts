import { test, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { findResumableSession, feedbackFile, pidAlive, archeyesDir } from "../cli/session.ts";
import { raw, tempRepo, until, sleep } from "./helpers.ts";

const here = dirname(fileURLToPath(import.meta.url));
const CLI = join(here, "../cli/archeyes.ts");
const FIXTURE = join(here, "fixtures/order-payment.graph.json");

const serverPids: number[] = [];
after(() => {
  for (const pid of serverPids) {
    try {
      if (pidAlive(pid)) process.kill(pid, "SIGKILL");
    } catch {
      /* already gone */
    }
  }
});

interface Run {
  child: ChildProcess;
  out: () => string;
  err: () => string;
  done: Promise<number | null>;
}

function run(cwd: string, args: string[]): Run {
  const child = spawn(process.execPath, ["--experimental-strip-types", CLI, ...args], {
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let out = "";
  let err = "";
  child.stdout!.on("data", (d) => (out += d.toString()));
  child.stderr!.on("data", (d) => (err += d.toString()));
  const done = new Promise<number | null>((res) => child.on("exit", (code) => res(code)));
  return { child, out: () => out, err: () => err, done };
}

function sendFeedback(port: number, token: string, envelope: unknown) {
  return raw(port, {
    method: "POST",
    path: `/feedback?token=${token}`,
    headers: { host: "127.0.0.1", "content-type": "application/json" },
    body: JSON.stringify(envelope),
  });
}

test("CRITICAL: poller killed → detached server survives → feedback persists unattended → --resume retrieves it", async () => {
  const repo = tempRepo();
  const a = run(repo, ["review", FIXTURE, "--no-open", "--idle-ms", "6000"]);

  const session = await until(() => {
    const s = findResumableSession(repo);
    return s && s.port > 0 && pidAlive(s.pid) ? s : null;
  }, 10000);
  serverPids.push(session.pid!);
  const serverPid = session.pid!;

  // Kill the foreground poller, as a bash 10-minute timeout would.
  a.child.kill("SIGKILL");
  await a.done;

  // The detached server must outlive the poller.
  await sleep(300);
  assert.ok(pidAlive(serverPid), "detached server should survive the poller being killed");

  // Dev clicks Send while NO poller is attached — feedback must persist to disk.
  const envelope = { action: "revise", comments: [{ nodeId: "OrderService", text: "split payment out" }] };
  const res = await sendFeedback(session.port, session.token, envelope);
  assert.equal(res.status, 200);
  await until(() => {
    try {
      readFileSync(feedbackFile(repo, session.token));
      return true;
    } catch {
      return null;
    }
  }, 5000);

  // --resume attaches a fresh poller and picks up the feedback that fired unattended.
  const b = run(repo, ["review", "--resume", "--no-open"]);
  const code = await b.done;
  assert.equal(code, 0, `--resume should exit 0; stderr:\n${b.err()}`);
  const printed = JSON.parse(b.out());
  assert.equal(printed.action, "revise");
  assert.equal(printed.comments[0].nodeId, "OrderService");
});

test("stdout carries ONLY the feedback JSON; all logs go to stderr", async () => {
  const repo = tempRepo();
  const a = run(repo, ["review", FIXTURE, "--no-open", "--idle-ms", "6000"]);
  const session = await until(() => {
    const s = findResumableSession(repo);
    return s && s.port > 0 && pidAlive(s.pid) ? s : null;
  }, 10000);
  serverPids.push(session.pid!);

  await sendFeedback(session.port, session.token, { action: "approve" });
  const code = await a.done;

  assert.equal(code, 0, `exit ${code}; stderr:\n${a.err()}\nstdout:\n${a.out()}`);
  // stdout must parse cleanly as the envelope — no log lines mixed in.
  const printed = JSON.parse(a.out());
  assert.equal(printed.action, "approve");
  assert.ok(!a.out().includes("[archeyes]"), "stdout must not contain log lines");
  assert.ok(a.err().includes("[archeyes]"), "logs belong on stderr");
});

test("exit non-zero when the server idle-exits without feedback", async () => {
  const repo = tempRepo();
  const a = run(repo, ["review", FIXTURE, "--no-open", "--idle-ms", "600", "--timeout-ms", "8000"]);
  const s = await until(() => {
    const x = findResumableSession(repo);
    return x && x.pid ? x : null;
  }, 10000);
  if (s.pid) serverPids.push(s.pid);
  const code = await a.done;
  assert.notEqual(code, 0, `expected non-zero exit; stdout was: ${a.out()}`);
  assert.equal(a.out().trim(), "", "no feedback → nothing on stdout");
});

test("invalid graph → exit 2, nothing on stdout", async () => {
  const repo = tempRepo();
  const badPath = join(repo, "bad.graph.json");
  writeFileSync(badPath, JSON.stringify({ version: 1, title: "x", nodes: [{ id: "a" }], edges: [] }));
  const a = run(repo, ["review", badPath, "--no-open"]);
  const code = await a.done;
  assert.equal(code, 2);
  assert.equal(a.out().trim(), "");
  assert.ok(a.err().includes("failed validation"));
});

test("orphan warning fires when the new graph drops a node the last round referenced", async () => {
  const repo = tempRepo();
  mkdirSync(archeyesDir(repo), { recursive: true });
  writeFileSync(
    join(archeyesDir(repo), "last-feedback.json"),
    JSON.stringify({ action: "revise", comments: [{ nodeId: "OrderService", text: "x" }] }),
  );
  // A graph where the agent renamed OrderService → OrderSvc.
  const renamed = JSON.parse(readFileSync(FIXTURE, "utf8"));
  renamed.nodes[0].id = "OrderSvc";
  renamed.edges = renamed.edges.filter((e: any) => e.from !== "OrderService" && e.to !== "OrderService");
  const gpath = join(repo, "renamed.graph.json");
  writeFileSync(gpath, JSON.stringify(renamed));

  const a = run(repo, ["review", gpath, "--no-open", "--timeout-ms", "1500", "--idle-ms", "2500"]);
  const code = await a.done;
  assert.notEqual(code, 0); // no feedback sent → non-zero, that's expected
  assert.ok(a.err().includes("WARN"), `expected orphan WARN; stderr:\n${a.err()}`);
  assert.ok(a.err().includes("OrderService"));
});
