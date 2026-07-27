// Thin client for the archeyes review server. The session token rides in the URL
// (?token=…); every request carries it, and the server also enforces a
// localhost Host/Origin guard.
import type { PlanGraph, Feedback } from "./protocol.ts";

export const token = new URLSearchParams(location.search).get("token") ?? "";

function url(path: string): string {
  const u = new URL(path, location.origin);
  u.searchParams.set("token", token);
  return u.toString();
}

export async function fetchGraph(): Promise<PlanGraph> {
  const res = await fetch(url("/graph"));
  if (!res.ok) throw new Error(`graph fetch failed: ${res.status}`);
  return res.json();
}

export type LayoutMap = Record<string, { x: number; y: number }>;

export async function fetchLayout(): Promise<LayoutMap> {
  try {
    const res = await fetch(url("/layout"));
    if (!res.ok) return {};
    return res.json();
  } catch {
    return {};
  }
}

export async function saveLayout(positions: LayoutMap): Promise<void> {
  await fetch(url("/layout"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(positions),
  }).catch(() => {});
}

export async function sendFeedback(feedback: Feedback): Promise<void> {
  const res = await fetch(url("/feedback"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(feedback),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`feedback rejected (${res.status}): ${body}`);
  }
}
