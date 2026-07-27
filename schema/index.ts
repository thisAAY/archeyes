// ArchEyes protocol — the single source of truth.
//
// The JSON Schemas define structure; this module adds the cross-reference checks
// JSON Schema can't express (duplicate IDs, dangling edge/group refs) and the
// orphan-detection used for the "node was renamed between rounds" warning.
//
//   status → render map (mirrored in the UI's tokens/diff.css):
//     existing → solid  · gray    new    → dashed   · green
//     modify   → dashed · amber   delete → strike   · red
//
import { Ajv } from "ajv";
import * as ajvFormatsNs from "ajv-formats";

// ajv-formats ships CJS with an ESM `export default`; the interop shape differs
// between the runtime (Node type-stripping) and tsc (nodenext), so normalize.
const nsAny = ajvFormatsNs as unknown as { default?: (ajv: Ajv) => void };
const addFormats: (ajv: Ajv) => void =
  nsAny.default ?? (ajvFormatsNs as unknown as (ajv: Ajv) => void);

// Static JSON imports: Node loads them natively (dev, type-stripping) and esbuild
// inlines them into the published bundle. (createRequire left them unresolved.)
import planGraphSchema from "./plan-graph.schema.json" with { type: "json" };
import feedbackSchema from "./feedback.schema.json" with { type: "json" };

import type { PlanGraph, Node, Edge } from "./plan-graph.types.ts";
import type { Feedback } from "./feedback.types.ts";

export type { PlanGraph, Node, Edge, Status } from "./plan-graph.types.ts";
export type { Feedback } from "./feedback.types.ts";

const ajv = new Ajv({ allErrors: true, useDefaults: true, strict: false });
addFormats(ajv);

const validatePlanGraphSchema = ajv.compile(planGraphSchema);
const validateFeedbackSchema = ajv.compile(feedbackSchema);

export interface ValidationResult<T> {
  valid: boolean;
  errors: string[];
  data?: T;
}

function schemaErrors(errs: typeof ajv.errors): string[] {
  return (errs ?? []).map((e) => `${e.instancePath || "(root)"} ${e.message ?? ""}`.trim());
}

/**
 * Validate a plan-graph.json against the schema AND the referential-integrity
 * rules the schema can't express. Returns every problem found, not just the first.
 */
export function validateGraph(data: unknown): ValidationResult<PlanGraph> {
  const ok = validatePlanGraphSchema(data);
  const errors = ok ? [] : schemaErrors(validatePlanGraphSchema.errors);
  if (!ok) return { valid: false, errors };

  const graph = data as unknown as PlanGraph;
  const refErrors: string[] = [];

  const nodeIds = new Set<string>();
  for (const n of graph.nodes) {
    if (nodeIds.has(n.id)) refErrors.push(`duplicate node id: "${n.id}"`);
    nodeIds.add(n.id);
  }

  const edgeIds = new Set<string>();
  for (const e of graph.edges) {
    if (edgeIds.has(e.id)) refErrors.push(`duplicate edge id: "${e.id}"`);
    edgeIds.add(e.id);
    if (!nodeIds.has(e.from)) refErrors.push(`edge "${e.id}" references unknown source node "${e.from}"`);
    if (!nodeIds.has(e.to)) refErrors.push(`edge "${e.id}" references unknown target node "${e.to}"`);
  }

  const groupIds = new Set((graph.groups ?? []).map((g) => g.id));
  for (const n of graph.nodes) {
    if (n.group && !groupIds.has(n.group)) {
      refErrors.push(`node "${n.id}" references unknown group "${n.group}"`);
    }
  }

  return { valid: refErrors.length === 0, errors: refErrors, data: graph };
}

/** Validate a feedback envelope emitted by the UI. */
export function validateFeedback(data: unknown): ValidationResult<Feedback> {
  const ok = validateFeedbackSchema(data);
  if (!ok) return { valid: false, errors: schemaErrors(validateFeedbackSchema.errors) };
  return { valid: true, errors: [], data: data as unknown as Feedback };
}

/**
 * Every node id a feedback envelope points at (comments, reconnect endpoints,
 * added-edge endpoints, moves). Nodes the dev explicitly deleted are excluded —
 * those are *supposed* to be gone in the next graph.
 */
export function referencedNodeIds(feedback: Feedback): string[] {
  const refs = new Set<string>();
  for (const c of feedback.comments ?? []) refs.add(c.nodeId);
  for (const r of feedback.reconnected ?? []) {
    refs.add(r.was);
    refs.add(r.now);
  }
  for (const e of feedback.added?.edges ?? []) {
    refs.add(e.from);
    refs.add(e.to);
  }
  for (const m of feedback.moved ?? []) refs.add(m.nodeId);
  for (const del of feedback.deleted?.nodes ?? []) refs.delete(del);
  return [...refs];
}

/**
 * The build-now safety net for the agent-only node-identity convention.
 * Given feedback the dev already sent and the graph the agent produced in
 * response, return any referenced node id that vanished from the new graph —
 * i.e. the agent renamed or dropped a node the dev was pointing at, so that
 * feedback silently lost its anchor. The CLI prints these as a stderr WARN.
 */
export function findOrphanedRefs(feedback: Feedback, revisedGraph: PlanGraph): string[] {
  const present = new Set(revisedGraph.nodes.map((n) => n.id));
  return referencedNodeIds(feedback).filter((id) => !present.has(id));
}

export { planGraphSchema, feedbackSchema };
