import { useMemo, useState } from "react";
import { MessageSquare, GitCompare, Plus, Trash2, Send, Check, X, Pencil } from "lucide-react";
import { count } from "./pending.ts";
import type { EditRef, PendingEdits } from "./pending.ts";
import { KindIcon, StatusPill, Button } from "./ui.tsx";
import type { GraphNodeData } from "./protocol.ts";

interface RailProps {
  tab: "changes" | "inspector";
  setTab: (t: "changes" | "inspector") => void;
  pending: PendingEdits;
  removeEdit: (ref: EditRef) => void;
  selected: GraphNodeData | null;
  allNodeIds: string[];
  labelOf: (id: string) => string;
  addComment: (nodeId: string, text: string) => void;
  toggleDeleteNode: (id: string) => void;
  onSend: () => void;
  onApprove: () => void;
  onCancel: () => void;
  busy: boolean;
}

export function Rail(p: RailProps) {
  const n = count(p.pending);
  return (
    <aside className="ax-panel">
      <div className="ax-tabs">
        <button className={`ax-tab${p.tab === "changes" ? " active" : ""}`} onClick={() => p.setTab("changes")}>
          Changes {<span className="ax-tab-badge">{n}</span>}
        </button>
        <button
          className={`ax-tab${p.tab === "inspector" ? " active" : ""}`}
          disabled={!p.selected}
          onClick={() => p.selected && p.setTab("inspector")}
        >
          Inspector
        </button>
      </div>

      <div className="ax-panel-body">
        {p.tab === "changes" ? <Changes {...p} /> : p.selected ? <Inspector {...p} /> : (
          <div className="ax-empty-panel"><div className="d">Select a node on the canvas to inspect it.</div></div>
        )}
      </div>

      <div className="ax-panel-foot">
        <Button variant="primary" size="md" disabled={n === 0 || p.busy} onClick={p.onSend} style={{ width: "100%" }}>
          <Send size={14} /> Send {n} change{n === 1 ? "" : "s"}
        </Button>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="secondary" size="sm" disabled={p.busy} onClick={p.onApprove} style={{ flex: 1 }}>
            <Check size={13} /> Approve plan
          </Button>
          <Button variant="ghost" size="sm" disabled={p.busy} onClick={p.onCancel} style={{ flex: 1 }}>Cancel</Button>
        </div>
      </div>
    </aside>
  );
}

function Changes(p: RailProps) {
  const { pending, removeEdit, labelOf } = p;
  if (count(pending) === 0) {
    return (
      <div className="ax-empty-panel">
        <span className="ic"><Pencil size={16} /></span>
        <div className="t">No pending edits</div>
        <div className="d">Comment on a node, reconnect an edge, draw a new edge, or delete a component. Your edits collect here before you send them to the agent.</div>
      </div>
    );
  }
  return (
    <div style={{ paddingBottom: 14 }}>
      <Group show={pending.comments.length > 0} icon={<MessageSquare size={12} />} label="Comments" n={pending.comments.length}>
        {pending.comments.map((c, i) => (
          <Row key={i} onX={() => removeEdit({ kind: "comment", index: i })}
            primary={<>Comment on <b>{labelOf(c.nodeId)}</b></>} detail={c.text} />
        ))}
      </Group>
      <Group show={pending.reconnected.length > 0} icon={<GitCompare size={12} />} label="Reconnections" n={pending.reconnected.length}>
        {pending.reconnected.map((r, i) => (
          <Row key={i} onX={() => removeEdit({ kind: "reconnected", index: i })} mono
            primary={<>Reconnect <span className="mono">{labelOf(r.was)} → {labelOf(r.now)}</span></>} detail={`${r.end} endpoint`} />
        ))}
      </Group>
      <Group show={pending.added.length > 0} icon={<Plus size={12} />} label="Additions" n={pending.added.length}>
        {pending.added.map((e, i) => (
          <Row key={i} onX={() => removeEdit({ kind: "added", index: i })} mono
            primary={<>Add edge <span className="mono">{labelOf(e.from)} → {labelOf(e.to)}</span></>} />
        ))}
      </Group>
      <Group show={pending.deletedNodes.length + pending.deletedEdges.length > 0} icon={<Trash2 size={12} />} label="Deletions" n={pending.deletedNodes.length + pending.deletedEdges.length}>
        {pending.deletedNodes.map((id) => (
          <Row key={id} onX={() => removeEdit({ kind: "deletedNode", id })} primary={<>Delete <b>{labelOf(id)}</b></>} />
        ))}
        {pending.deletedEdges.map((id) => (
          <Row key={id} onX={() => removeEdit({ kind: "deletedEdge", id })} primary={<>Delete edge <span className="mono">{id}</span></>} />
        ))}
      </Group>
    </div>
  );
}

function Group({ show, icon, label, n, children }: { show: boolean; icon: React.ReactNode; label: string; n: number; children: React.ReactNode }) {
  if (!show) return null;
  return (
    <div className="ax-cgroup">
      <div className="ax-cgroup-h">{icon}<span>{label}</span><span>{n}</span></div>
      {children}
    </div>
  );
}

function Row({ primary, detail, onX }: { primary: React.ReactNode; detail?: string; onX: () => void; mono?: boolean }) {
  return (
    <div className="ax-crow">
      <div className="txt">{primary}{detail && <div className="detail">{detail}</div>}</div>
      <button className="ax-crow-x" title="Remove this edit" onClick={onX}><X size={13} /></button>
    </div>
  );
}

function Inspector(p: RailProps) {
  const node = p.selected!;
  const marked = p.pending.deletedNodes.includes(node.id);
  return (
    <div>
      <div className="ax-insp-head">
        <KindIcon kind={node.kind} size="lg" />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="t">{node.label}</div>
          {node.files?.[0] && <div className="p">{node.files[0]}</div>}
        </div>
      </div>
      <div className="ax-insp-sec">
        <div style={{ display: "flex", gap: 28 }}>
          <Field label="Kind"><span style={{ textTransform: "capitalize" }}>{node.kind}</span></Field>
          <Field label="Status"><StatusPill status={node.status} /></Field>
        </div>
        {node.description && <Field label="Description"><p style={{ margin: 0, lineHeight: 1.55 }}>{node.description}</p></Field>}
      </div>
      {node.files && node.files.length > 0 && (
        <div className="ax-insp-sec pad">
          <span className="ax-field-label">Files · {node.files.length}</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {node.files.map((f) => <div key={f} className="ax-file"><Pencil size={11} /> <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f}</span></div>)}
          </div>
        </div>
      )}
      <div className="ax-insp-sec pad">
        <span className="ax-field-label">Feedback to agent</span>
        <MentionBox nodeId={node.id} allNodeIds={p.allNodeIds} labelOf={p.labelOf} onAdd={(t) => p.addComment(node.id, t)} />
        <Button variant="ghost" size="sm" onClick={() => p.toggleDeleteNode(node.id)} style={{ color: marked ? "var(--st-deleted)" : undefined }}>
          <Trash2 size={13} /> {marked ? "Undo delete" : "Mark for deletion"}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span className="ax-field-label">{label}</span>
      <span style={{ fontSize: "var(--fs-small)", color: "var(--text-1)" }}>{children}</span>
    </div>
  );
}

function MentionBox({ nodeId, allNodeIds, labelOf, onAdd }: { nodeId: string; allNodeIds: string[]; labelOf: (id: string) => string; onAdd: (t: string) => void }) {
  const [text, setText] = useState("");
  const mention = useMemo(() => {
    const m = /@([\w.-]*)$/.exec(text);
    if (!m) return null;
    const q = m[1].toLowerCase();
    return allNodeIds.filter((id) => id !== nodeId && (id.toLowerCase().includes(q) || labelOf(id).toLowerCase().includes(q))).slice(0, 6);
  }, [text, allNodeIds, nodeId, labelOf]);
  function pick(id: string) { setText((t) => t.replace(/@([\w.-]*)$/, `@${id} `)); }
  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 8 }}>
      <textarea
        className="ax-textarea" rows={3} value={text} onChange={(e) => setText(e.target.value)}
        placeholder="Add feedback for the agent…  use @ to mention another node"
      />
      {mention && mention.length > 0 && (
        <div className="ax-mention">
          <div className="hd">MENTION A NODE</div>
          {mention.map((id) => (
            <button key={id} className="ax-mention-item" onMouseDown={(e) => { e.preventDefault(); pick(id); }}>
              <KindIcon kind="other" size="sm" /> {labelOf(id)}
            </button>
          ))}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-micro)", color: "var(--text-3)" }}>then Send to the agent</span>
        <Button variant="secondary" size="sm" style={{ marginLeft: "auto" }} disabled={!text.trim()} onClick={() => { onAdd(text.trim()); setText(""); }}>
          <MessageSquare size={13} /> Add comment
        </Button>
      </div>
    </div>
  );
}
