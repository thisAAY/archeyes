import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  validateGraph,
  validateFeedback,
  referencedNodeIds,
  findOrphanedRefs,
} from "../schema/index.ts";
import type { PlanGraph } from "../schema/index.ts";

const here = dirname(fileURLToPath(import.meta.url));
const goldenGraph: PlanGraph = JSON.parse(
  readFileSync(join(here, "fixtures/order-payment.graph.json"), "utf8"),
);

test("golden fixture graph validates", () => {
  const r = validateGraph(goldenGraph);
  assert.equal(r.valid, true, r.errors.join("; "));
});

test("graph: bad status enum is rejected", () => {
  const bad = structuredClone(goldenGraph);
  (bad.nodes[0] as any).status = "renamed";
  const r = validateGraph(bad);
  assert.equal(r.valid, false);
  assert.ok(r.errors.some((e) => e.includes("status")));
});

test("graph: missing required node id is rejected", () => {
  const bad = structuredClone(goldenGraph);
  delete (bad.nodes[0] as any).id;
  assert.equal(validateGraph(bad).valid, false);
});

test("graph: duplicate node id is rejected", () => {
  const bad = structuredClone(goldenGraph);
  bad.nodes.push(structuredClone(bad.nodes[0]));
  const r = validateGraph(bad);
  assert.equal(r.valid, false);
  assert.ok(r.errors.some((e) => e.includes("duplicate node id")));
});

test("graph: edge referencing unknown node is rejected", () => {
  const bad = structuredClone(goldenGraph);
  bad.edges.push({ id: "e9", from: "OrderService", to: "Ghost", kind: "calls", status: "new" });
  const r = validateGraph(bad);
  assert.equal(r.valid, false);
  assert.ok(r.errors.some((e) => e.includes("unknown target node")));
});

test("graph: node referencing unknown group is rejected", () => {
  const bad = structuredClone(goldenGraph);
  bad.nodes[0].group = "nope";
  const r = validateGraph(bad);
  assert.equal(r.valid, false);
  assert.ok(r.errors.some((e) => e.includes("unknown group")));
});

test("graph: additional properties are rejected (typo guard)", () => {
  const bad = structuredClone(goldenGraph) as any;
  bad.nodes[0].colour = "red";
  assert.equal(validateGraph(bad).valid, false);
});

test("graph: edge accepts description + calls[]", () => {
  const g = structuredClone(goldenGraph);
  const e1 = g.edges.find((e) => e.id === "e1")!;
  assert.equal(typeof e1.description, "string");
  assert.ok(Array.isArray(e1.calls) && e1.calls.length > 0);
  assert.equal(validateGraph(g).valid, true);
});

test("graph: edge without description/calls is still valid (optional)", () => {
  const g = structuredClone(goldenGraph) as any;
  delete g.edges[0].description;
  delete g.edges[0].calls;
  assert.equal(validateGraph(g).valid, true);
});

test("graph: edge calls must be an array of strings", () => {
  const bad = structuredClone(goldenGraph) as any;
  bad.edges[0].calls = "store.query()"; // not an array
  assert.equal(validateGraph(bad).valid, false);
});

test("feedback: valid revise envelope (design-doc example)", () => {
  const fb = {
    action: "revise",
    comments: [{ nodeId: "OrderService", text: "move token refresh into @PaymentService" }],
    reconnected: [{ edgeId: "e1", end: "target", was: "DB", now: "OrderRepo" }],
    deleted: { nodes: ["LegacyPayAdapter"], edges: [] },
    added: { edges: [{ from: "PaymentService", to: "PaymentRepo" }] },
    moved: [{ nodeId: "PaymentRepo", toGroup: "infra" }],
    generalNote: "looks close",
  };
  const r = validateFeedback(fb);
  assert.equal(r.valid, true, r.errors.join("; "));
});

test("feedback: reconnected.end must be source|target", () => {
  const r = validateFeedback({ action: "revise", reconnected: [{ edgeId: "e1", end: "middle", was: "DB", now: "OrderRepo" }] });
  assert.equal(r.valid, false);
});

test("feedback: added.nodes is rejected (V1 = edges only)", () => {
  const r = validateFeedback({ action: "revise", added: { nodes: [{ id: "X" }] } as any });
  assert.equal(r.valid, false);
});

test("feedback: edgeComments envelope is valid", () => {
  const r = validateFeedback({
    action: "revise",
    edgeComments: [{ edgeId: "e1", text: "route this through @OrderRepo" }],
  });
  assert.equal(r.valid, true, r.errors.join("; "));
});

test("feedback: edgeComment missing edgeId is rejected", () => {
  const r = validateFeedback({ action: "revise", edgeComments: [{ text: "no target" }] as any });
  assert.equal(r.valid, false);
});

test("feedback: edgeComment with empty text is rejected", () => {
  const r = validateFeedback({ action: "revise", edgeComments: [{ edgeId: "e1", text: "" }] });
  assert.equal(r.valid, false);
});

test("feedback: unknown action is rejected", () => {
  assert.equal(validateFeedback({ action: "ship" }).valid, false);
});

test("feedback: approve with no edits is valid", () => {
  assert.equal(validateFeedback({ action: "approve" }).valid, true);
});

test("referencedNodeIds excludes intentionally-deleted nodes", () => {
  const fb = {
    action: "revise" as const,
    comments: [{ nodeId: "OrderService", text: "x" }],
    deleted: { nodes: ["LegacyPayAdapter"], edges: [] },
    reconnected: [{ edgeId: "e2", end: "source" as const, was: "LegacyPayAdapter", now: "PaymentService" }],
  };
  const refs = referencedNodeIds(fb);
  assert.ok(refs.includes("OrderService"));
  assert.ok(refs.includes("PaymentService"));
  assert.ok(!refs.includes("LegacyPayAdapter"), "deleted node should not count as referenced");
});

test("findOrphanedRefs flags a node the agent renamed away", () => {
  const feedback = { action: "revise" as const, comments: [{ nodeId: "OrderService", text: "x" }] };
  const renamed = structuredClone(goldenGraph);
  renamed.nodes[0].id = "OrderSvc"; // agent renamed it
  const orphans = findOrphanedRefs(feedback, renamed);
  assert.deepEqual(orphans, ["OrderService"]);
});

test("findOrphanedRefs is empty when the agent reuses ids", () => {
  const feedback = { action: "revise" as const, comments: [{ nodeId: "OrderService", text: "x" }] };
  assert.deepEqual(findOrphanedRefs(feedback, goldenGraph), []);
});
