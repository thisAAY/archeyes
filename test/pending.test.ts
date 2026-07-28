// Unit coverage for the UI's pure edit-accumulator + envelope builder. The module
// lives in ui/src but has only type-only imports at runtime, so it runs here under
// node's type-stripping without a browser. The real-DOM drag paths are covered by
// the Playwright E2E spec (ui/e2e/), which needs `npx playwright install`.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  empty,
  count,
  addComment,
  addEdgeComment,
  reconnect,
  addEdge,
  addNode,
  nextTempId,
  toggleDeleteNode,
  toggleDeleteEdge,
  removeEdit,
  toEnvelope,
} from "../ui/src/pending.ts";
import { validateFeedback, referencedNodeIds } from "../schema/index.ts";

test("empty envelope is just the action; validates", () => {
  const fb = toEnvelope(empty(), "approve");
  assert.deepEqual(fb, { action: "approve" });
  assert.equal(validateFeedback(fb).valid, true);
});

test("accumulates each edit type and builds a schema-valid revise envelope", () => {
  let p = empty();
  p = addComment(p, "OrderService", "move token refresh into @PaymentService");
  p = reconnect(p, { edgeId: "e1", end: "target", was: "DB", now: "OrderRepo" });
  p = addEdge(p, "PaymentService", "PaymentRepo");
  p = toggleDeleteNode(p, "LegacyPayAdapter");
  assert.equal(count(p), 4);

  const fb = toEnvelope(p, "revise", "  looks close  ");
  assert.equal(validateFeedback(fb).valid, true);
  assert.equal(fb.comments![0].nodeId, "OrderService");
  assert.equal(fb.reconnected![0].now, "OrderRepo");
  assert.deepEqual(fb.added!.edges, [{ from: "PaymentService", to: "PaymentRepo", kind: undefined }]);
  assert.deepEqual(fb.deleted!.nodes, ["LegacyPayAdapter"]);
  assert.equal(fb.generalNote, "looks close"); // trimmed
});

test("addEdgeComment accumulates, counts, and serializes to edgeComments", () => {
  let p = empty();
  p = addEdgeComment(p, "e1", "route this through @OrderRepo");
  p = addEdgeComment(p, "e2", "drop this call");
  assert.equal(count(p), 2);
  const fb = toEnvelope(p, "revise");
  assert.equal(validateFeedback(fb).valid, true);
  assert.deepEqual(fb.edgeComments, [
    { edgeId: "e1", text: "route this through @OrderRepo" },
    { edgeId: "e2", text: "drop this call" },
  ]);
});

test("edgeComments are omitted from the envelope when empty (lean JSON)", () => {
  const fb = toEnvelope(addComment(empty(), "A", "hi"), "revise");
  assert.ok(!("edgeComments" in fb));
});

test("per-edit undo drops exactly one edge comment", () => {
  let p = empty();
  p = addEdgeComment(p, "e1", "one");
  p = addEdgeComment(p, "e2", "two");
  p = removeEdit(p, { kind: "edgeComment", index: 0 });
  assert.equal(p.edgeComments.length, 1);
  assert.equal(p.edgeComments[0].edgeId, "e2");
});

test("reconnect keeps only the latest edit per (edge,end)", () => {
  let p = empty();
  p = reconnect(p, { edgeId: "e1", end: "target", was: "DB", now: "OrderRepo" });
  p = reconnect(p, { edgeId: "e1", end: "target", was: "DB", now: "PaymentRepo" });
  assert.equal(p.reconnected.length, 1);
  assert.equal(p.reconnected[0].now, "PaymentRepo");
});

test("addEdge dedupes identical edges", () => {
  let p = empty();
  p = addEdge(p, "A", "B");
  p = addEdge(p, "A", "B");
  assert.equal(p.added.length, 1);
});

test("toggleDelete is idempotent-toggle (add then remove)", () => {
  let p = empty();
  p = toggleDeleteEdge(p, "e2");
  assert.deepEqual(p.deletedEdges, ["e2"]);
  p = toggleDeleteEdge(p, "e2");
  assert.deepEqual(p.deletedEdges, []);
});

test("per-edit undo drops exactly one pending edit", () => {
  let p = empty();
  p = addComment(p, "A", "one");
  p = addComment(p, "B", "two");
  p = removeEdit(p, { kind: "comment", index: 0 });
  assert.equal(p.comments.length, 1);
  assert.equal(p.comments[0].nodeId, "B");
});

test("empty collections are omitted from the envelope (lean JSON)", () => {
  const fb = toEnvelope(addComment(empty(), "A", "hi"), "revise");
  assert.ok(fb.comments);
  assert.ok(!("reconnected" in fb));
  assert.ok(!("added" in fb));
  assert.ok(!("deleted" in fb));
  assert.ok(!("moved" in fb));
});

// --- Add-node: nodes the dev draws on the canvas this round ---

test("nextTempId mints collision-free new:N ids", () => {
  let p = empty();
  assert.equal(nextTempId(p), "new:1");
  p = addNode(p, { tempId: nextTempId(p), label: "PricingCache", kind: "service" });
  assert.equal(nextTempId(p), "new:2");
  p = addNode(p, { tempId: nextTempId(p), label: "PricingRepo", kind: "repository" });
  assert.equal(nextTempId(p), "new:3");
});

test("addNode + temp-id edge build a schema-valid envelope with added.nodes and added.edges", () => {
  let p = empty();
  const t = nextTempId(p);
  p = addNode(p, { tempId: t, label: "PricingCache", kind: "service", group: "domain", description: "cache pricing reads" });
  p = addEdge(p, "order", t); // existing node → new node (same round)
  assert.equal(count(p), 2);

  const fb = toEnvelope(p, "revise");
  assert.equal(validateFeedback(fb).valid, true);
  assert.deepEqual(fb.added!.nodes, [
    { tempId: "new:1", label: "PricingCache", kind: "service", group: "domain", description: "cache pricing reads" },
  ]);
  assert.deepEqual(fb.added!.edges, [{ from: "order", to: "new:1", kind: undefined }]);
});

test("new↔new edge (both temp ids) is allowed and validates", () => {
  let p = empty();
  const a = nextTempId(p);
  p = addNode(p, { tempId: a, label: "PricingCache", kind: "service" });
  const b = nextTempId(p);
  p = addNode(p, { tempId: b, label: "PricingRepo", kind: "repository" });
  p = addEdge(p, a, b);
  const fb = toEnvelope(p, "revise");
  assert.equal(validateFeedback(fb).valid, true);
  assert.deepEqual(fb.added!.edges, [{ from: "new:1", to: "new:2", kind: undefined }]);
});

test("removing an added node also drops edges drawn to/from its tempId", () => {
  let p = empty();
  const t = nextTempId(p);
  p = addNode(p, { tempId: t, label: "PricingCache", kind: "service" });
  p = addEdge(p, "order", t);
  p = addEdge(p, "cart", "repo"); // unrelated edge between existing nodes — must survive
  p = removeEdit(p, { kind: "addedNode", index: 0 });
  assert.equal(p.addedNodes.length, 0);
  assert.deepEqual(p.added, [{ from: "cart", to: "repo", kind: undefined }]);
});

test("an unconnected new node still sends (wiring is optional)", () => {
  let p = empty();
  p = addNode(p, { tempId: nextTempId(p), label: "PricingCache", kind: "service" });
  const fb = toEnvelope(p, "revise");
  // lean-JSON shape must be checked BEFORE validateFeedback (ajv useDefaults mutates).
  assert.equal(fb.added!.nodes!.length, 1);
  assert.ok(!("edges" in fb.added!)); // no edges key when none drawn
  assert.equal(validateFeedback(fb).valid, true);
});

// [REGRESSION] the added-shape change from {edges} → {edges, nodes} must stay
// backward-compatible: an edges-only envelope still validates unchanged.
test("[regression] edges-only added envelope still validates after the shape change", () => {
  let p = empty();
  p = addEdge(p, "PaymentService", "PaymentRepo");
  const fb = toEnvelope(p, "revise");
  // lean shape first — no injected `nodes` key before validation runs.
  assert.ok(!("nodes" in fb.added!));
  assert.deepEqual(fb.added!.edges, [{ from: "PaymentService", to: "PaymentRepo", kind: undefined }]);
  assert.equal(validateFeedback(fb).valid, true);
  // and a hand-authored legacy envelope (no nodes key) is accepted verbatim
  assert.equal(validateFeedback({ action: "revise", added: { edges: [{ from: "A", to: "B" }] } }).valid, true);
});

// [CRITICAL] added-node tempIds must be excluded from the orphan check — the
// agent renames new:1 → a real id, so new:1 will never be in the revised graph.
test("[critical] referencedNodeIds excludes added-node tempIds (no false orphan warning)", () => {
  let p = empty();
  const t = nextTempId(p);
  p = addNode(p, { tempId: t, label: "PricingCache", kind: "service" });
  p = addEdge(p, "order", t); // temp id becomes an added-edge endpoint
  p = addComment(p, "order", "keep this");
  const fb = toEnvelope(p, "revise");
  const refs = referencedNodeIds(fb);
  assert.ok(refs.includes("order"), "real node ids are still referenced");
  assert.ok(!refs.includes("new:1"), "temp id must NOT count as a referenced node");
});
