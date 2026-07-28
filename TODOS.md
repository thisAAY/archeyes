# TODOS

## Before publish: bump version to 0.2.0 (edge-inspector feature)

**What:** Bump `version` from `0.1.0` → `0.2.0` in all three places, together:
- `package.json`
- `plugins/archeyes/.claude-plugin/plugin.json`
- `.claude-plugin/marketplace.json` (the plugin entry's `version`)

**Why:** The `feat/edge-inspector` work added user-facing capability — edge
`description` + `calls[]` in the graph schema, a clickable edge inspector, and a new
`edgeComments` feedback channel. The plugin/marketplace still advertise `0.1.0`, so
consumers can't tell the skill's behavior grew.

**Context:** Additive/backward-compatible (all new schema fields are optional), so a
minor bump fits pre-1.0 semantics — not a breaking change. Deliberately deferred:
nothing is published to npm yet (`NPM_TOKEN` secret not set per CLAUDE.md), so the
version only matters once something ships. Do this as part of the first release.

**Depends on / blocked by:** none. Pairs with cutting the matching GitHub release
(`gh release create v0.2.0`) per CLAUDE.md's publish flow.

## Design provenance: port EdgeInspector back into Claude Design

**What:** The shipped edge inspector lives in `ui/src/Rail.tsx` (`EdgeInspector`). The
Claude Design System project's `ui_kits/canvas/Inspector.jsx` is still node-only.

**Why:** Keep the design source matching what shipped, per the one-way sync rule in
CLAUDE.md (Claude Design → `_ds/` → `ui/src/tokens`). The React port itself lives in
`ui/src`; only the design-system reference component drifts.

**Context:** The full edge-inspector layout is already specced in `proto/Panel.jsx`
(`EdgeInspectorView`) — port that into the design-system project when convenient. Not
blocking; provenance hygiene only.
