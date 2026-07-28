---
description: >-
  Turn an implementation plan, tech spec, or existing codebase into an interactive
  architecture diagram the developer can edit directly — drag, reconnect edges, draw
  new edges, comment on nodes with @mentions — then feed those structured edits back
  as revision instructions. Use when the user asks to "diagram this plan", "review the
  architecture visually", "show me the architecture", "visualize current architecture",
  or wants to review a plan-mode plan on a canvas instead of in prose.
---

# ArchEyes — bidirectional plan diagrams

ArchEyes makes the diagram an **input device**. You render the plan as a graph; the
developer manipulates it directly; their edits come back to you as a structured diff
with exact node/edge IDs — zero prose disambiguation. You revise and re-render. Loop
until they approve.

**You are the parser.** ArchEyes' code never reads a plan. You author `plan-graph.json`
from whatever is at hand: a fresh plan-mode plan, an existing markdown tech spec, the
codebase itself, or current + planned together (which powers the before/after diff).

## The loop

1. **Author the graph.** Write `plan-graph.json` (schema below). Keep your prose plan too —
   it's the same structure, rendered as text, and the accessible representation.
2. **Run the review.** `npx archeyes review plan-graph.json` (or `archeyes review …` if
   installed). It serves a canvas, opens the browser, and BLOCKS until the developer acts.
3. **Read the feedback.** The command prints ONE JSON envelope to stdout and exits.
   - exit `0` → an envelope was printed (`revise` | `approve` | `cancel`). Act on it.
   - exit non-zero → no feedback (idle timeout / error). If it says the server is still
     up, run `archeyes review --resume` to re-attach. Otherwise start a new round.
4. **Interpret + revise** (guide below). Rewrite `plan-graph.json` AND your prose plan.
5. **Re-render.** Run `archeyes review plan-graph.json` again. Loop.
   - `action: "approve"` → the current graph + plan are final. Stop.
   - `action: "cancel"` → stop the loop, keep the plan as-is, ask the developer in the
     terminal how they want to proceed.

**Reuse node IDs across rounds.** Positions and comments are keyed to node `id`. If you
rename a node's `id` when revising, the developer's saved layout resets and any comment
that referenced it loses its anchor. The CLI prints a `WARN` to stderr when the graph
you just authored dropped an `id` the previous round referenced — if you see that, you
renamed something you shouldn't have; reconcile before re-rendering.

## Authoring `plan-graph.json`

```json
{
  "version": 1,
  "title": "Split payment flow out of OrderService",
  "groups": [{ "id": "domain", "label": "Domain layer" }, { "id": "infra", "label": "Infrastructure" }],
  "nodes": [
    { "id": "OrderService", "label": "OrderService", "kind": "service", "group": "domain",
      "status": "modify", "files": ["src/services/order.ts"], "description": "payment logic moving out" },
    { "id": "PaymentService", "label": "PaymentService", "kind": "service", "group": "domain",
      "status": "new", "files": ["src/services/payment.ts"] }
  ],
  "edges": [
    { "id": "e1", "from": "OrderService", "to": "DB", "kind": "reads / writes", "status": "existing",
      "description": "Reads and writes order rows through the shared Postgres pool.",
      "calls": ["store.query<Order>(sql, params)", "store.tx(fn)"] }
  ]
}
```

- `kind` ∈ `service | repository | datastore | adapter | external | module | component | other`
  (drives the node icon).
- `status` ∈ `existing | new | modify | delete` on **both** nodes and edges — this is the
  whole before/after diff. For a plain plan (no "before"), most things are `new`. For a
  refactor, mark what's already there `existing`, what you're adding `new`, what you're
  changing `modify`, what you're removing `delete`.
- Every `edge.from`/`edge.to` must be a real node `id`; every `node.group` a real group `id`.
  The CLI validates this and refuses an inconsistent graph.
- On an edge, `kind` is the short "used for" verb (rendered on the arrow); `description` is the
  free-text "what the source uses the target for"; `calls[]` lists the specific methods/functions
  the source invokes on the target (the edge-analog of `node.files[]`). The dev sees all three by
  clicking the arrow. Author them — a bare arrow with no `description`/`calls` is a weaker diagram.

**Granularity.** Class/module-level for a feature plan. Cap at ~30 nodes — beyond that,
collapse detail into groups. A graph you can read at a glance beats a complete-but-dense one.

## Interpreting the feedback envelope

```json
{
  "action": "revise",
  "comments":     [{ "nodeId": "OrderService", "text": "move token refresh into @PaymentService" }],
  "edgeComments": [{ "edgeId": "e1", "text": "this read/write should go through @OrderRepo, not the DB directly" }],
  "reconnected":  [{ "edgeId": "e1", "end": "target", "was": "DB", "now": "OrderRepo" }],
  "added":       {
    "nodes": [{ "tempId": "new:1", "label": "PricingService", "kind": "service", "group": "domain", "description": "owns price calc" }],
    "edges": [{ "from": "OrderService", "to": "new:1" }, { "from": "PaymentService", "to": "PaymentRepo" }]
  },
  "deleted":     { "nodes": ["LegacyPayAdapter"], "edges": [] },
  "moved":       [{ "nodeId": "PaymentRepo", "toGroup": "infra" }],
  "generalNote": "optional free-text"
}
```

What each edit MEANS architecturally:

- **comments** — the developer's intent for that node. `@Name` mentions reference other
  nodes by id. This is the richest signal; read it as a direct instruction.
- **edgeComments** — the developer's intent for that *connection* (left via the edge inspector).
  `{edgeId, text}`, `@Name` mentions allowed. Read it as an instruction about the relationship —
  revise the edge's `kind`/`description`/`calls` and the code plan to match.
- **reconnected** — an edge's endpoint was re-dragged. `{edgeId, end, was, now}`: the `end`
  (`source`|`target`) of `edgeId` should now point at `now` instead of `was`. Treat it as a
  decision: "this dependency should target `now`, not `was`." Update the edge in the graph
  and change the code plan to match (e.g. call the repository, not the DB directly).
- **added.nodes** — a new component the developer drew on the canvas. Each carries a
  client-side `tempId` (e.g. `"new:1"`), a `label`, a `kind`, and optional `group`/`description`.
  Create a real node for each: **assign it a real, stable id** (do NOT keep `new:1`), honor the
  label/kind/group, and fold the component into the code plan. In your revised `plan-graph.json`,
  set the new node's `status` to `"new"`.
- **added.edges** — new dependencies the developer drew. An endpoint (`from`/`to`) may be a real
  node id OR an added-node `tempId` — resolve each tempId to the real id you assigned above, then
  add the edge and reflect the new coupling in the plan.
- **deleted** — nodes/edges the developer wants gone. Remove them and remove the
  corresponding code from the plan.
- **moved** — a node reassigned to a different group/layer. Re-home it.

When you create nodes from `added.nodes`, **echo the tempId → real-id mapping** to the developer
in your terminal reply (e.g. `new:1 → PricingService`) so the next render shows the real name and
they can see their node was understood.

After revising, rewrite BOTH `plan-graph.json` and the prose plan so they stay in sync,
then re-run `archeyes review plan-graph.json`.

## Contract notes

- stdout is the envelope and nothing else — safe to `JSON.parse` the whole thing.
- The server binds `127.0.0.1` on a random port with a session token in the URL and
  rejects non-localhost requests. It's local-only; nothing leaves the machine.
- If a round takes long and your `review` call gets killed, the browser tab stays live;
  `archeyes review --resume` reconnects and picks up feedback that fired meanwhile.
