// Maps the protocol's status values onto the design system's diff recipe
// (_ds/tokens/diff.css). THE core rule: status reads without color — border
// style + glyph carry it, color reinforces. Colorblind-safe.
//
//   existing → thin solid, neutral        (no glyph)
//   new      → thick solid + glow ring      +
//   modify   → dashed                       ~
//   delete   → dotted, 55% opacity, strike  −
//
import { Archive, Box, Circle, Component, Database, Globe, Package, Plug } from "lucide-react";
import type { Status } from "./protocol.ts";

// protocol status → design-system class suffix (schema says modify/delete,
// the design system says modified/deleted)
const DS_STATUS: Record<Status, "existing" | "new" | "modified" | "deleted"> = {
  existing: "existing",
  new: "new",
  modify: "modified",
  delete: "deleted",
};

export function statusClass(s: Status): string {
  return `ax-status-${DS_STATUS[s]}`;
}
export function pillClass(s: Status): string {
  return `ax-status-pill ${DS_STATUS[s]}`;
}

export const STATUS_GLYPH: Record<Status, string> = { existing: "", new: "+", modify: "~", delete: "−" };
export const STATUS_LABEL: Record<Status, string> = { existing: "existing", new: "new", modify: "modified", delete: "deleted" };

/** edge stroke color + dash per status, pulling the exact token values. */
export const EDGE_VAR: Record<Status, { color: string; dash?: string; width: number }> = {
  existing: { color: "var(--st-existing)", width: 1.4 },
  new: { color: "var(--st-new-line)", width: 2.2 },
  modify: { color: "var(--st-modified-line)", dash: "6 4", width: 1.6 },
  delete: { color: "var(--st-deleted-line)", dash: "2 3", width: 1.6 },
};

export const KIND_ICON = {
  service: Box,
  repository: Archive,
  datastore: Database,
  adapter: Plug,
  external: Globe,
  module: Package,
  component: Component,
  other: Circle,
} as const;

export function iconFor(kind: string) {
  return (KIND_ICON as Record<string, typeof Box>)[kind] ?? Circle;
}
