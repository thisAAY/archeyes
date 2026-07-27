# Contributing to ArchEyes

Thanks for helping build the diagram you talk back to. This is a small, focused project —
contributions that keep it small and focused are the most welcome.

## Ground rules

- **`main` is protected.** All changes land through a pull request (fork → branch → PR).
- **Keep the schema authoritative.** The protocol lives in `schema/*.json`; TypeScript types
  are generated (`npm run gen:types`), never hand-edited. CI fails if they drift.
- **Tests are part of the change.** New behavior ships with tests. Don't regress the count.
- Match the surrounding style; keep the diff the smallest that cleanly expresses the change.

## Getting set up

```bash
git clone https://github.com/<you>/archeyes && cd archeyes
npm install
npm test          # schema + CLI + process-model integration tests
npm run typecheck
cd ui && npm install && npm run build   # single-file UI bundle
```

Drive the CLI against the sample graph: `npm run archeyes -- review test/fixtures/order-payment.graph.json`

See [DEVELOPMENT.md](DEVELOPMENT.md) for the architecture and [CLAUDE.md](CLAUDE.md) for the
full build/publish process.

## Before you open a PR

- [ ] `npm test` passes (root) and `cd ui && npm run test:e2e` if you touched the UI.
- [ ] `npm run typecheck` is clean.
- [ ] If you changed a schema, you ran `npm run gen:types` and committed the result.
- [ ] The PR description says what changed and why; screenshots for UI changes.

## Invariants not to break

- **stdout purity:** the CLI prints the feedback JSON and nothing else; all logs go to stderr.
- **Localhost security:** the server validates `Host`/`Origin` = localhost on every request.
- **Diff encoding is border-first** (colorblind-safe), color second.

By contributing, you agree your contributions are licensed under the MIT License.
