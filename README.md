<p align="center">
  <img src="https://raw.githubusercontent.com/thisAAY/archeyes/main/assets/banner.png" alt="ArchEyes — a diagram you talk back to" width="100%">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/archeyes"><img src="https://img.shields.io/npm/v/archeyes?color=4d7cfe&label=npm" alt="npm"></a>
  <img src="https://img.shields.io/badge/license-MIT-4d7cfe" alt="MIT">
  <img src="https://img.shields.io/badge/agents-Claude%20Code%20%C2%B7%20Cursor%20%C2%B7%20any-6b7280" alt="works with any agent">
</p>

<p align="center"><b>A diagram you talk back to — edit your agent's plan, send structured feedback.</b></p>

<p align="center">
  <img src="https://raw.githubusercontent.com/thisAAY/archeyes/main/assets/canvas.png" alt="ArchEyes review canvas — a diff-styled architecture graph with a comment, a reconnection, and a deletion pending in the Changes panel" width="100%">
</p>

Every other tool in this space is one-way: code or plan in, picture out. **ArchEyes closes the loop.** Your coding agent renders an architecture as an interactive graph; you drag nodes, reconnect edges, draw new ones, and comment on nodes (with `@mentions`); you hit **Send**; the edits flow back to the agent as revision instructions with exact node IDs — no prose, no ambiguity. It revises and re-renders. Repeat until you're happy.

**It's not just for plans.** Ask your agent to graph anything with a shape:

- **A plan** it just proposed — review the architecture *before* any code is written.
- **Your existing codebase** — "visualize the architecture" and actually see how it hangs together.
- **A feature or subsystem** — map one slice of the system on its own.
- **A refactor** — current vs. planned in a single before/after diff (solid = today, dashed = coming, struck-through = going).

## Install — just the skill

You install **one thing: the skill.** Your agent does the rest — it fetches and runs the ArchEyes tool for you automatically (via `npx`). You never install a CLI, run a command, or start a server.

**Claude Code:**
```
/plugin marketplace add thisAAY/archeyes
/plugin install archeyes@archeyes
```
Then just ask — *"diagram this plan"*, *"visualize the current architecture"* — or invoke `/archeyes:review`.

**Cursor:**
1. Download [`SKILL.md`](plugins/archeyes/skills/review/SKILL.md) from this repo.
2. Save it in your project as `.cursor/rules/archeyes.mdc` with this on top:
   ```
   ---
   description: Render an architecture as an editable ArchEyes diagram
   alwaysApply: false
   ---
   ```
   (paste the rest of `SKILL.md` below it)
3. Ask Cursor's agent to *"diagram this with ArchEyes."*

**Any other agent** (Codex, Cline, …): give it [`SKILL.md`](plugins/archeyes/skills/review/SKILL.md) as a rule or system prompt. That's it.

> The only prerequisite is Node on your machine (that's what `npx` uses). The skill handles everything else — no `npm install`, no setup.

## The diff, at a glance

Status reads by **border style** first (colorblind-safe), color second — with a `+ ~ −` pill:

| status   | border                          | color |
|----------|---------------------------------|-------|
| existing | thin solid                      | gray  |
| new      | thick solid + glow ring         | green |
| modified | dashed                          | amber |
| deleted  | dotted + faded + strikethrough  | red   |

Node **kind** is an icon (service, repository, datastore, adapter, …); **groups** are container regions. Dark by default, light theme included.

---

Building on ArchEyes, or curious how it works? See **[DEVELOPMENT.md](DEVELOPMENT.md)** — the CLI, the protocol, the architecture, security, and how to run it locally.

MIT © [thisAAY](https://github.com/thisAAY)
