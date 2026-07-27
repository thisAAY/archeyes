// Pure accumulator for the dev's edits this round. Kept side-effect-free so the
// canvas → envelope wiring is easy to reason about (and unit-test). Every entry
// carries node/edge IDs, so the feedback the agent receives is zero-ambiguity.
import type { Feedback } from "./protocol.ts";

export interface PendingEdits {
  comments: { nodeId: string; text: string }[];
  reconnected: { edgeId: string; end: "source" | "target"; was: string; now: string }[];
  added: { from: string; to: string; kind?: string }[];
  deletedNodes: string[];
  deletedEdges: string[];
  moved: { nodeId: string; toGroup: string }[];
}

export function empty(): PendingEdits {
  return { comments: [], reconnected: [], added: [], deletedNodes: [], deletedEdges: [], moved: [] };
}

export function count(p: PendingEdits): number {
  return (
    p.comments.length +
    p.reconnected.length +
    p.added.length +
    p.deletedNodes.length +
    p.deletedEdges.length +
    p.moved.length
  );
}

/** A stable key for a single pending edit, used by the tray's per-edit undo. */
export type EditRef =
  | { kind: "comment"; index: number }
  | { kind: "reconnected"; index: number }
  | { kind: "added"; index: number }
  | { kind: "deletedNode"; id: string }
  | { kind: "deletedEdge"; id: string }
  | { kind: "moved"; index: number };

export function removeEdit(p: PendingEdits, ref: EditRef): PendingEdits {
  const next = clone(p);
  switch (ref.kind) {
    case "comment":
      next.comments.splice(ref.index, 1);
      break;
    case "reconnected":
      next.reconnected.splice(ref.index, 1);
      break;
    case "added":
      next.added.splice(ref.index, 1);
      break;
    case "deletedNode":
      next.deletedNodes = next.deletedNodes.filter((n) => n !== ref.id);
      break;
    case "deletedEdge":
      next.deletedEdges = next.deletedEdges.filter((e) => e !== ref.id);
      break;
    case "moved":
      next.moved.splice(ref.index, 1);
      break;
  }
  return next;
}

export function addComment(p: PendingEdits, nodeId: string, text: string): PendingEdits {
  const next = clone(p);
  next.comments.push({ nodeId, text });
  return next;
}

export function reconnect(p: PendingEdits, edit: PendingEdits["reconnected"][number]): PendingEdits {
  const next = clone(p);
  // one reconnect per (edge, end) — the latest wins
  next.reconnected = next.reconnected.filter((r) => !(r.edgeId === edit.edgeId && r.end === edit.end));
  next.reconnected.push(edit);
  return next;
}

export function addEdge(p: PendingEdits, from: string, to: string, kind?: string): PendingEdits {
  const next = clone(p);
  if (!next.added.some((e) => e.from === from && e.to === to)) next.added.push({ from, to, kind });
  return next;
}

export function toggleDeleteNode(p: PendingEdits, id: string): PendingEdits {
  const next = clone(p);
  next.deletedNodes = next.deletedNodes.includes(id)
    ? next.deletedNodes.filter((n) => n !== id)
    : [...next.deletedNodes, id];
  return next;
}

export function toggleDeleteEdge(p: PendingEdits, id: string): PendingEdits {
  const next = clone(p);
  next.deletedEdges = next.deletedEdges.includes(id)
    ? next.deletedEdges.filter((e) => e !== id)
    : [...next.deletedEdges, id];
  return next;
}

/** Build the feedback envelope. Omits empty collections so the JSON stays lean. */
export function toEnvelope(p: PendingEdits, action: Feedback["action"], generalNote?: string): Feedback {
  const fb: Feedback = { action };
  if (p.comments.length) fb.comments = p.comments;
  if (p.reconnected.length) fb.reconnected = p.reconnected;
  if (p.added.length) fb.added = { edges: p.added };
  if (p.deletedNodes.length || p.deletedEdges.length)
    fb.deleted = { nodes: p.deletedNodes, edges: p.deletedEdges };
  if (p.moved.length) fb.moved = p.moved;
  if (generalNote && generalNote.trim()) fb.generalNote = generalNote.trim();
  return fb;
}

function clone(p: PendingEdits): PendingEdits {
  return {
    comments: [...p.comments],
    reconnected: [...p.reconnected],
    added: [...p.added],
    deletedNodes: [...p.deletedNodes],
    deletedEdges: [...p.deletedEdges],
    moved: [...p.moved],
  };
}
