import { Handle, Position } from "@xyflow/react";
import { MessageSquare, Layers, Server } from "lucide-react";
import { statusClass } from "./diff.ts";
import { KindIcon, StatusPill } from "./ui.tsx";
import type { GraphNodeData } from "./protocol.ts";

export interface ArchNodeData {
  node: GraphNodeData;
  pendingDelete?: boolean;
  pulse?: boolean;
  commentCount?: number;
  armed?: boolean; // comment-mode target outline
  [key: string]: unknown;
}

export function ArchNode({ data, selected }: { data: ArchNodeData; selected: boolean }) {
  const { node } = data;
  const effectiveStatus = data.pendingDelete ? "delete" : node.status;
  const showPill = effectiveStatus !== "existing";
  return (
    <div
      className={`ax-node ${statusClass(effectiveStatus)}${selected ? " selected" : ""}${data.pulse ? " ax-arrived-ring" : ""}${data.armed ? " armed" : ""}`}
    >
      <Handle type="target" position={Position.Top} className="ax-port" />
      {data.commentCount ? (
        <span className="ax-node-badge" title={`${data.commentCount} comment(s)`}>
          <MessageSquare size={10} /> {data.commentCount}
        </span>
      ) : null}
      {showPill && (
        <span className="ax-node-pillwrap">
          <StatusPill status={effectiveStatus} />
        </span>
      )}
      <div className="ax-node-row">
        <KindIcon kind={node.kind} size="sm" />
        <span className="ax-node-title">{node.label}</span>
      </div>
      {node.files && node.files.length > 0 && <div className="ax-node-path">{node.files[0]}</div>}
      <Handle type="source" position={Position.Bottom} className="ax-port" />
    </div>
  );
}

export function GroupNode({ data }: { data: { label: string; variant?: string; count?: number } }) {
  const Icon = data.variant === "domain" ? Layers : Server;
  return (
    <div className={`ax-group${data.variant === "domain" ? " domain" : ""}`}>
      <span className="ax-group-header">
        <Icon size={13} />
        <span className="ax-group-label">{data.label}</span>
        {data.count != null && <span className="ax-group-count">{data.count}</span>}
      </span>
    </div>
  );
}
