// Protocol types come from the ONE schema module (see eng review: schema is the
// single source of truth). These are type-only imports — elided at build time,
// so nothing from outside the UI root is bundled.
export type { PlanGraph, Node as GraphNodeData, Edge as GraphEdgeData, Status } from "../../schema/plan-graph.types.ts";
export type { Feedback } from "../../schema/feedback.types.ts";
