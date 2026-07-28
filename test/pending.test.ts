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
  toggleDeleteNode,
  toggleDeleteEdge,
  removeEdit,
  toEnvelope,
} from "../ui/src/pending.ts";
import { validateFeedback } from "../schema/index.ts";

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
