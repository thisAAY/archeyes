# ArchEyes

**Bidirectional plan diagrams for AI coding agents.** The diagram isn't a picture you look at — it's an input device you edit.

Works with any agent that can run a CLI and read its output (Claude Code, Cursor, Codex, …). The agent authors a graph, runs `archeyes review`, and reads your edits back as structured JSON.

Every other tool in this space is one-way: plan in, picture out. ArchEyes closes the loop. The agent renders its plan as an interactive architecture graph; you drag nodes, reconnect edges, draw new ones, and comment on nodes (with `@mentions`); you hit **Send**; the structured edits flow back to the agent as revision instructions with exact node IDs — no prose, no ambiguity. It revises and re-renders. Repeat until you approve.

```
plan / spec / codebase ──▶ agent authors plan-graph.json ──▶ archeyes review
                                                                   │
     ┌─────────────────────────  interactive canvas  ────────────┘
     │  drag · reconnect · draw edge · comment @Node · delete
     ▼
   SEND ──▶ { comments, reconnected, added, deleted, moved }  ──▶ agent revises ──▶ loop
```

## Quick start

```bash
# in a Claude Code session, once the agent has authored plan-graph.json:
npx archeyes review plan-graph.json
```

A canvas opens in your browser. Rearrange it, reconnect a dependency, comment "this shouldn't talk to the DB directly" on a node, hit **Send**. The agent gets your edits as structured JSON and redraws the plan.

## Install

The CLI is the same everywhere (`npx archeyes`, from npm). Only how you give your agent the skill differs.

**Claude Code — plugin marketplace (one-liner):**
```
/plugin marketplace add thisAAY/archeyes
/plugin install archeyes@archeyes
```
Then invoke `/archeyes:review` or just ask it to "diagram this plan". The skill calls `npx archeyes` on first use — nothing else to install.

(Or, no plugin: copy `plugins/archeyes/skills/review/SKILL.md` to `~/.claude/skills/archeyes/SKILL.md` → `/archeyes`.)

**Cursor — add it as a project rule:**
1. Download the skill file [`plugins/archeyes/skills/review/SKILL.md`](plugins/archeyes/skills/review/SKILL.md) from this repo.
2. Save it in your project as `.cursor/rules/archeyes.mdc`, and add this frontmatter at the top so Cursor loads it on demand:
   ```
   ---
   description: Render a plan/architecture as an editable ArchEyes diagram
   alwaysApply: false
   ---
   ```
   (paste the rest of SKILL.md below the frontmatter)
3. Make the CLI available once: `npm i -g archeyes` (or rely on `npx archeyes`).
4. Ask Cursor's agent to "diagram this plan with archeyes" — it follows the rule, authors the graph, and runs `archeyes review`.

**Any other agent (Codex, Cline, custom):** the skill is just a markdown instruction file. Give its contents to your agent as a rule / system prompt / command, and make sure `archeyes` is on the PATH (`npm i -g archeyes`). The agent authors `plan-graph.json`, runs `archeyes review plan-graph.json`, and reads the feedback JSON from stdout.

**CLI only (no agent):** `npx archeyes review plan-graph.json`.

## The diff, at a glance

Status reads by **border style** first (colorblind-safe), color second — with a `+ ~ −` pill:

| status   | border                     | color |
|----------|----------------------------|-------|
| existing | thin solid                 | gray  |
| new      | thick solid + glow ring    | green |
| modify   | dashed                     | amber |
| delete   | dotted + faded + strikethrough | red |

Node **kind** is an icon (service, repository, datastore, adapter, …); **groups** are container regions.

## How it works

- **`schema/`** — the protocol, and the whole product: JSON Schema for `plan-graph.json` and the feedback envelope, with generated TypeScript types. One source of truth, imported by both the CLI and the UI.
- **`cli/`** — `archeyes review`. Spawns a **detached** localhost server that outlives the foreground poller, so a 10-minute harness timeout can't kill your review. `--resume` re-attaches. stdout is the feedback JSON and nothing else; exit `0` = feedback, non-zero = none.
- **`ui/`** — a React Flow canvas built into a single self-contained `dist/ui/index.html`. No runtime build.
- **`plugins/archeyes/`** — the agent skill (`skills/review/SKILL.md`): how to author a graph, run the loop, and interpret the edits. Also the Claude Code plugin, listed by the repo-root `.claude-plugin/marketplace.json`.

## Security

Local-only. The server binds `127.0.0.1` on a random port, requires a per-session token in the URL, and **validates the `Host`/`Origin` header on every request** so a malicious web page can't reach it via DNS rebinding. Nothing is sent anywhere.

## Scope (V1)

Ships: the full round-trip, before/after diff, drag/reconnect/draw-edge/comment/delete, layout persistence, `--resume`.

Deferred (V2): live re-render over websockets, on-canvas node creation, full keyboard/screen-reader parity (the prose plan is the accessible representation in V1), whole-project collapse/expand, an MCP-server transport for other agents.

## Develop

```bash
npm install            # CLI deps
npm test               # schema + CLI + process-model integration tests
npm run typecheck
npm run gen:types      # regenerate TS types from the JSON schemas
npm run build:ui       # build the single-file UI bundle into dist/ui
```

MIT.
