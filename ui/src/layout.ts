// First-render auto-layout with dagre, plus group-container bounding boxes.
// Saved positions (layout.json) win over the computed layout so the dev's
// arrangement survives rounds.
import dagre from "@dagrejs/dagre";
import { MarkerType } from "@xyflow/react";
import type { CSSProperties } from "react";
import type { Node as RFNode, Edge as RFEdge } from "@xyflow/react";
import { EDGE_VAR } from "./diff.ts";
import type { PlanGraph, Status } from "./protocol.ts";
import type { LayoutMap } from "./api.ts";

export function edgeStyle(status: Status, pendingDelete = false): { style: CSSProperties; markerEnd: { type: MarkerType; color: string } } {
  const e = EDGE_VAR[pendingDelete ? "delete" : status];
  return {
    style: { stroke: e.color, strokeWidth: e.width, strokeDasharray: e.dash, opacity: pendingDelete || status === "delete" ? 0.55 : 1 },
    markerEnd: { type: MarkerType.ArrowClosed, color: e.color },
  };
}

const NODE_W = 180;
const NODE_H = 68;
const GROUP_PAD = 28;

export interface BuiltGraph {
  nodes: RFNode[];
  edges: RFEdge[];
}

export function buildGraph(graph: PlanGraph, saved: LayoutMap): BuiltGraph {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "TB", nodesep: 60, ranksep: 90 });
  g.setDefaultEdgeLabel(() => ({}));
  for (const n of graph.nodes) g.setNode(n.id, { width: NODE_W, height: NODE_H });
  for (const e of graph.edges) g.setEdge(e.from, e.to);
  dagre.layout(g);

  const positions: Record<string, { x: number; y: number }> = {};
  for (const n of graph.nodes) {
    const p = g.node(n.id);
    const savedPos = saved[n.id];
    positions[n.id] = savedPos ?? { x: p.x - NODE_W / 2, y: p.y - NODE_H / 2 };
  }

  const groupNodes: RFNode[] = [];
  for (const grp of graph.groups ?? []) {
    const members = graph.nodes.filter((n) => n.group === grp.id).map((n) => positions[n.id]);
    if (members.length === 0) continue;
    const minX = Math.min(...members.map((m) => m.x)) - GROUP_PAD;
    const minY = Math.min(...members.map((m) => m.y)) - GROUP_PAD - 18;
    const maxX = Math.max(...members.map((m) => m.x)) + NODE_W + GROUP_PAD;
    const maxY = Math.max(...members.map((m) => m.y)) + NODE_H + GROUP_PAD;
    groupNodes.push({
      id: `group:${grp.id}`,
      type: "archgroup", // custom type — avoids React Flow's built-in gray group chrome
      position: { x: minX, y: minY },
      data: { label: grp.label, variant: grp.id === "domain" ? "domain" : undefined, count: members.length },
      draggable: false,
      selectable: false,
      focusable: false,
      zIndex: -1,
      style: { width: maxX - minX, height: maxY - minY },
    });
  }

  const nodes: RFNode[] = [
    ...groupNodes,
    ...graph.nodes.map((n) => ({
      id: n.id,
      type: "arch",
      position: positions[n.id],
      data: { node: n },
    })),
  ];

  const edges: RFEdge[] = graph.edges.map((e) => ({
    id: e.id,
    source: e.from,
    target: e.to,
    data: { status: e.status },
    label: e.kind ?? "",
    labelStyle: { fill: "#8b98ad", fontSize: 10 },
    labelBgStyle: { fill: "#131722" },
    reconnectable: true,
    ...edgeStyle(e.status),
  }));

  return { nodes, edges };
}

export { NODE_W, NODE_H };
