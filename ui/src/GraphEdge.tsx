// Custom React Flow edge. Two jobs the default edge can't do:
//   1. the label is a status-colored pill with a leading diff glyph
//      (+ new · ~ modify · − delete · none for existing), turning accent when
//      the edge is selected — same diff vocabulary as the node status pills.
//   2. clicking anywhere on it selects the edge → opens the edge inspector
//      (React Flow's interaction path gives a fat, easy hit target).
//
// Stroke/dash/marker still come from edgeStyle() via the `style`/`markerEnd`
// props (layout.ts); this only overrides stroke → accent while selected.
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from "@xyflow/react";
import { STATUS_GLYPH } from "./diff.ts";
import type { Status } from "./protocol.ts";

interface ArchEdgeData {
  status?: Status;
  kind?: string;
  pendingDelete?: boolean;
  [key: string]: unknown;
}

export function ArchEdge({
  id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
  data, selected, markerEnd, style,
}: EdgeProps) {
  const [path, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition,
  });
  const d = (data ?? {}) as ArchEdgeData;
  // pending-delete wins over the authored status, so the pill matches the dimmed
  // stroke the moment you double-click to mark an edge for deletion (mirrors ArchNode).
  const status: Status = d.pendingDelete ? "delete" : d.status ?? "existing";
  const kind = d.kind ?? "";
  const glyph = STATUS_GLYPH[status];
  const text = kind ? `${glyph ? glyph + " " : ""}${kind}` : "";

  const strokeStyle = selected
    ? { ...style, stroke: "var(--accent)", strokeWidth: (Number(style?.strokeWidth) || 1.5) + 0.5 }
    : style;

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={strokeStyle} />
      {text && (
        <EdgeLabelRenderer>
          <div
            className={`ax-edge-label ${status}${selected ? " selected" : ""}`}
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
            data-edge-label={id}
          >
            {text}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
