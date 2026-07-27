// The foreground poller. Thin and disposable: it watches the session's
// feedback.json and, the moment it appears, prints the envelope to stdout and
// exits 0. If the harness kills it (bash timeout), the detached server lives on
// and `archeyes review --resume` attaches a fresh poller — which reads the same
// feedback.json if feedback fired while nothing was attached.
//
// stdout carries the feedback JSON and NOTHING else. All diagnostics → stderr.

import { readFeedback, pidAlive } from "./session.ts";

export interface PollOptions {
  intervalMs?: number;
  timeoutMs?: number; // 0 = no timeout (block until feedback or server death)
  serverPid?: number | null;
}

export interface PollResult {
  feedback: unknown | null;
  reason: "feedback" | "server-gone" | "timeout";
}

export async function pollForFeedback(repoRoot: string, token: string, opts: PollOptions = {}): Promise<PollResult> {
  const interval = opts.intervalMs ?? 400;
  const timeout = opts.timeoutMs ?? 0;
  const start = Date.now();

  // Fast path: feedback already on disk (the --resume-after-unattended case).
  const immediate = readFeedback(repoRoot, token);
  if (immediate) return { feedback: immediate, reason: "feedback" };

  while (true) {
    await sleep(interval);
    const fb = readFeedback(repoRoot, token);
    if (fb) return { feedback: fb, reason: "feedback" };

    // Server died without producing feedback (e.g. idle timeout) → nothing to wait for.
    if (opts.serverPid != null && !pidAlive(opts.serverPid)) {
      const late = readFeedback(repoRoot, token); // race: feedback written just before exit
      if (late) return { feedback: late, reason: "feedback" };
      return { feedback: null, reason: "server-gone" };
    }

    if (timeout > 0 && Date.now() - start > timeout) return { feedback: null, reason: "timeout" };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
