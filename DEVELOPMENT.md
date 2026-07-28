# ArchEyes — under the hood

The [README](README.md) is for people who just want to install the skill. This is for
everyone else: how the loop works, the CLI, the protocol, and how to run it locally.

## The loop

```
plan / spec / codebase ──▶ agent authors plan-graph.json ──▶ archeyes review
                                                                   │
     ┌─────────────────────────  interactive canvas  ────────────┘
     │  drag · reconnect · draw edge · comment @Node · delete
     ▼
   SEND ──▶ { comments, reconnected, added, deleted, moved }  ──▶ agent revises ──▶ loop
```

The agent authors a `plan-graph.json`, runs `archeyes review`, and the command **blocks**
until you hit Send/Approve/Cancel in the browser. It then prints your edits as one JSON
envelope to stdout and exits; the agent applies them and re-runs. The agent is the parser —
ArchEyes never reads your plan or code; it renders and collects, the agent interprets.

## The CLI (what the skill runs for you)

```bash
npx archeyes review plan-graph.json    # serve, open browser, block until Send/Approve/Cancel
npx archeyes review --resume           # re-attach if the poller was killed (e.g. a bash timeout)
```

Contract the skill relies on:

- **stdout is the feedback JSON and nothing else** — all logs go to stderr, so the agent can parse stdout wholesale.
- **exit `0`** = a feedback envelope was printed (`revise` | `approve` | `cancel`); **non-zero** = no feedback (idle timeout / error).
- **Process model:** `review` spawns a *detached* localhost server that outlives the foreground poller, so a ~10-minute harness bash timeout can't kill your review. `--resume` attaches a fresh poller and reads feedback persisted while nothing was attached.

## Repo layout

- **`schema/`** — the protocol, and the whole product. JSON Schema for `plan-graph.json`
  and the feedback envelope; TypeScript types are **generated** from the schemas
  (`npm run gen:types`). Also referential-integrity checks and orphaned-ref detection.
- **`cli/`** — the `archeyes` command (detached server + poller + `--resume`), compiled
  to `dist/cli/*.js` for publish via esbuild.
- **`ui/`** — a React Flow canvas built to a single self-contained `dist/ui/index.html`
  (`vite-plugin-singlefile`). Consumes the design tokens from `_ds/`.
- **`plugins/archeyes/`** — the agent skill (`skills/review/SKILL.md`) + the Claude Code
  plugin manifest; `.claude-plugin/marketplace.json` (repo root) lists it.
- **`_ds/`, `proto/`** — the design system (source of the visual language) and the original
  Claude Design prototype. Provenance; not shipped to npm.

## Security

Local-only. The server binds `127.0.0.1` on a random port, requires a per-session token in
the URL, and **validates the `Host`/`Origin` header on every request** so a malicious web
page can't reach it via DNS rebinding. Nothing leaves your machine.

## Scope

**V1 ships:** the full round-trip; before/after diff; a 5-tool canvas toolbar
(select / pan / add node / comment / filter-by-status); drag / reconnect / draw-edge /
on-canvas node creation / comment (`@mention`) / delete; layout persistence; `--resume`;
colorblind-safe diff encoding; light + dark.

**Deferred (V2):** live re-render over websockets, full keyboard/screen-reader parity
(the prose plan is the accessible representation in V1), whole-project collapse/expand,
an MCP-server transport.

## Run it locally

```bash
npm install
npm test               # schema + CLI + process-model integration tests
npm run typecheck
npm run gen:types      # regenerate schema TS types (CI checks these are in sync)
npm run build          # build:cli (esbuild → dist/cli) + build:ui (vite → dist/ui)
cd ui && npm run test:e2e   # Playwright E2E (needs: npx playwright install chromium)

# drive the CLI directly against the sample graph:
npm run archeyes -- review test/fixtures/order-payment.graph.json
```

See [CLAUDE.md](CLAUDE.md) for the full build/publish/release process and project invariants.
