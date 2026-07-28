# Changelog

All notable changes to ArchEyes are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-07-29

### Added

- **Edge inspector.** Click an edge to see and act on its `kind` ("used for"),
  `description`, and `calls`, with live connection feedback while reconnecting.
- **Canvas toolbar.** A 5-tool toolbar with on-canvas node creation — draw nodes and
  edges directly on the graph instead of only editing existing ones.

### Fixed

- **Group layout no longer overlaps.** Dagre laid out nodes ignoring their `group`, so
  members scattered across ranks and the group bounding boxes overlapped into a hairball
  on any grouped graph. Layout now uses a dagre compound graph so group members cluster
  and their boxes stack cleanly in dependency order.

### Changed

- Renamed the **"Approve plan"** button to **"Approve design"**.
- **Review skill guidance:** don't interview the developer before the first render (the
  graph is the question); state the chosen altitude and diff-vs-single-state framing up
  front; keep the ~30-node aim but allow more when necessary; use short identifier labels
  and push prose into `description`/`files`/`calls`.

## [0.1.0] - 2026-07-27

- Initial release: `archeyes review` CLI, React Flow canvas, the `plan-graph.json` +
  feedback protocol, and the `/archeyes:review` skill.
