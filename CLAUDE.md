# ArchEyes — project guide

Bidirectional plan diagrams for AI coding agents. The agent renders a plan as an
interactive architecture graph; the developer edits it directly (drag, reconnect,
draw edges, comment with `@mentions`, delete); the structured edits flow back to the
agent as JSON. Works with any agent that can run a CLI and read stdout.

## Layout

- `schema/` — the protocol and the single source of truth. JSON Schema for
  `plan-graph.json` + the feedback envelope; TS types are **generated** from the
  schemas (`npm run gen:types`), never hand-edited. Also referential-integrity and
  orphaned-ref checks.
- `cli/` — the `archeyes` CLI. `review <graph.json>` spawns a **detached** localhost
  server that outlives the foreground poller (survives a ~10-min bash timeout);
  `review --resume` re-attaches. DNS-rebinding guard (Host/Origin = localhost) +
  session token. **stdout carries only the feedback JSON**; exit 0 = feedback.
- `ui/` — React Flow canvas, built to a single self-contained `dist/ui/index.html`
  via `vite-plugin-singlefile`. Consumes the design tokens from `_ds/` (copied into
  `ui/src/tokens/`).
- `plugins/archeyes/` — the agent skill (`skills/review/SKILL.md`) and the Claude Code
  plugin manifest. `.claude-plugin/marketplace.json` (repo root) lists it.
- `_ds/`, `proto/` — the Claude Design system (source of the visual language) and the
  original clickable prototype. Design provenance, not shipped to npm.

The published npm package ships only `dist/cli/*.js` + `dist/ui/index.html` + docs
(see `files` in package.json). Source runs as TS directly in dev via Node's
type-stripping; **the published artifact is compiled JS** (esbuild).

## Commands

```bash
npm test          # schema + CLI + process-model + reducer tests (Node test runner)
npm run typecheck # tsc --noEmit (root: cli + schema + tests)
npm run gen:types # regenerate schema TS types (CI checks these are in sync)
npm run build     # build:cli (esbuild → dist/cli) + build:ui (vite → dist/ui)
cd ui && npm run build      # UI bundle only
cd ui && npm run test:e2e   # Playwright E2E (needs: npx playwright install chromium)
```

Run the CLI in dev: `npm run archeyes -- review test/fixtures/order-payment.graph.json`

## Publishing a release

CI (`.github/workflows/ci.yml`) auto-publishes on a GitHub release **only if the
`NPM_TOKEN` repo secret is set** (otherwise the publish step skips cleanly). Until
that secret exists, publish manually:

```bash
npm login                 # as the package owner
npm publish               # prepublishOnly builds CLI + UI first; ships dist/ + docs
```

Verify before publishing without uploading: `npm publish --dry-run` (runs the full
build + pack). Then cut the matching GitHub release:

```bash
gh release create vX.Y.Z --title "vX.Y.Z" --generate-notes
```

Bump `version` in **both** `package.json` and `plugins/archeyes/.claude-plugin/plugin.json`
(and the marketplace entry) together.

## Install (for users)

- **Claude Code:** `/plugin marketplace add thisAAY/archeyes` → `/plugin install archeyes@archeyes` → `/archeyes:review`.
- **Cursor / other agents:** add `plugins/archeyes/skills/review/SKILL.md` as a rule/prompt and put `archeyes` on PATH (`npm i -g archeyes`).
- The skill calls `npx archeyes` for the CLI in all cases.

## Invariants worth keeping

- **stdout purity:** the CLI must print the feedback JSON and nothing else — all logs
  to stderr. The agent parses stdout wholesale.
- **Schema is the source of truth:** edit the JSON Schemas, regenerate types; don't
  restate field lists in prose (they drift). CI fails if generated types are stale.
- **Diff encoding is border-first, color-second** (colorblind-safe): existing=thin
  solid, new=thick solid+glow, modify=dashed, delete=dotted+strike. Mirrored between
  `ui/src/tokens/diff.css` and the node/edge rendering.
- **Node identity across rounds:** the agent must reuse node IDs when revising. The
  CLI warns (stderr) if a revised graph drops an ID the last round's feedback used.
