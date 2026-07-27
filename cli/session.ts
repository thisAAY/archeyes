// Session + filesystem layout for a review round.
//
//   <repoRoot>/.archeyes/
//     layout.json                       ← per-repo, keyed by node id (survives rounds)
//     sessions/<token>/
//       session.json                    ← port/pid/graphPath/status handshake
//       feedback.json                   ← written by server on Send/Approve/Cancel;
//                                          persists so a re-attached poller (--resume)
//                                          retrieves feedback that fired unattended
//
// Session files live under sessions/<token>/ so two concurrent review sessions
// in the same repo never clobber each other (#4 from eng review). Only layout.json
// is shared at the repo root.

import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

export interface SessionInfo {
  token: string;
  pid: number | null;
  port: number; // 0 until the server binds
  graphPath: string;
  uiDir: string;
  createdAt: string;
  status: "starting" | "ready" | "done";
}

export function archeyesDir(repoRoot: string): string {
  return join(repoRoot, ".archeyes");
}

export function sessionsDir(repoRoot: string): string {
  return join(archeyesDir(repoRoot), "sessions");
}

export function sessionDir(repoRoot: string, token: string): string {
  return join(sessionsDir(repoRoot), token);
}

export function sessionFile(repoRoot: string, token: string): string {
  return join(sessionDir(repoRoot, token), "session.json");
}

export function feedbackFile(repoRoot: string, token: string): string {
  return join(sessionDir(repoRoot, token), "feedback.json");
}

export function layoutFile(repoRoot: string): string {
  return join(archeyesDir(repoRoot), "layout.json");
}

export function newToken(): string {
  return randomBytes(18).toString("base64url");
}

export function ensureDir(dir: string): void {
  mkdirSync(dir, { recursive: true });
}

export function readSession(repoRoot: string, token: string): SessionInfo | null {
  const f = sessionFile(repoRoot, token);
  if (!existsSync(f)) return null;
  try {
    return JSON.parse(readFileSync(f, "utf8")) as SessionInfo;
  } catch {
    return null;
  }
}

export function writeSession(repoRoot: string, info: SessionInfo): void {
  ensureDir(sessionDir(repoRoot, info.token));
  writeFileSync(sessionFile(repoRoot, info.token), JSON.stringify(info, null, 2));
}

/** Is a process still alive? Used to tell a stale session from a live one. */
export function pidAlive(pid: number | null): boolean {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err: any) {
    return err?.code === "EPERM"; // exists but not ours to signal
  }
}

/**
 * Find the session to re-attach for `--resume`: prefer a live server; otherwise
 * the most recent session that still has unread feedback on disk. Returns null
 * if there's nothing to resume.
 */
export function findResumableSession(repoRoot: string): SessionInfo | null {
  const dir = sessionsDir(repoRoot);
  if (!existsSync(dir)) return null;
  const candidates: SessionInfo[] = [];
  for (const token of readdirSync(dir)) {
    const info = readSession(repoRoot, token);
    if (!info) continue;
    const hasFeedback = existsSync(feedbackFile(repoRoot, token));
    if (pidAlive(info.pid) || hasFeedback) candidates.push(info);
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => {
    // live servers first, then most recently created
    const la = pidAlive(a.pid) ? 1 : 0;
    const lb = pidAlive(b.pid) ? 1 : 0;
    if (la !== lb) return lb - la;
    return b.createdAt.localeCompare(a.createdAt);
  });
  return candidates[0];
}

export function readFeedback(repoRoot: string, token: string): unknown | null {
  const f = feedbackFile(repoRoot, token);
  if (!existsSync(f)) return null;
  try {
    return JSON.parse(readFileSync(f, "utf8"));
  } catch {
    return null;
  }
}

export function fileMtimeMs(path: string): number {
  try {
    return statSync(path).mtimeMs;
  } catch {
    return 0;
  }
}
