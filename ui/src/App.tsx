import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  reconnectEdge,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
  type EdgeTypes,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./styles.css";
import { MousePointer2, Hand, Plus, Filter, MessageSquarePlus, Sun, Moon, X, Send, Check, GitCompareArrows } from "lucide-react";
import { fetchGraph, fetchLayout, saveLayout, sendFeedback, token } from "./api.ts";
import { buildGraph, edgeStyle } from "./layout.ts";
import { ArchNode, GroupNode } from "./GraphNode.tsx";
import { ArchEdge } from "./GraphEdge.tsx";
import { Rail } from "./Rail.tsx";
import { KindIcon, Button, ArchEyesLogo } from "./ui.tsx";
import { EDGE_VAR, STATUS_LABEL, iconFor } from "./diff.ts";
import {
  addComment as addCommentE, addEdgeComment as addEdgeCommentE, addEdge as addEdgeE, addNode as addNodeE, nextTempId, empty, reconnect as reconnectE,
  removeEdit as removeEditE, toEnvelope, toggleDeleteNode as toggleDeleteNodeE, toggleDeleteEdge as toggleDeleteEdgeE,
} from "./pending.ts";
import type { AddedNode, EditRef, PendingEdits } from "./pending.ts";
import type { Feedback, GraphNodeData, GraphEdgeData, PlanGraph, Status } from "./protocol.ts";

const NODE_KINDS: GraphNodeData["kind"][] = ["service", "repository", "datastore", "adapter", "external", "module", "component", "other"];
const ALL_STATUSES: Status[] = ["existing", "new", "modify", "delete"];

const nodeTypes: NodeTypes = { arch: ArchNode, archgroup: GroupNode };
const edgeTypes: EdgeTypes = { arch: ArchEdge };
const STATUS_MINI: Record<string, string> = {
  existing: "var(--st-existing)", new: "var(--st-new-line)", modify: "var(--st-modified-line)", delete: "var(--st-deleted-line)",
};
type Phase = "loading" | "ready" | "empty" | "sent" | "error";
type Tool = "select" | "pan" | "add" | "comment";

export default function App() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [graph, setGraph] = useState<PlanGraph | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [pending, setPending] = useState<PendingEdits>(empty());
  // one source of truth for what the inspector shows — a node OR an edge, never both
  const [selection, setSelection] = useState<{ type: "node" | "edge"; id: string } | null>(null);
  const [tab, setTab] = useState<"changes" | "inspector">("changes");
  const [busy, setBusy] = useState(false);
  const [sentAction, setSentAction] = useState<Feedback["action"] | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [tool, setTool] = useState<Tool>("select");
  const [legendOpen, setLegendOpen] = useState(false);
  const [composer, setComposer] = useState<{ id: string; x: number; y: number } | null>(null);
  // add-node placement: screen coords of the pane click where the form opens
  const [nodeForm, setNodeForm] = useState<{ x: number; y: number } | null>(null);
  // status filter (view-only, never sent). All statuses visible by default.
  const [filter, setFilter] = useState<Set<Status>>(() => new Set(ALL_STATUSES));
  const [filterOpen, setFilterOpen] = useState(false);
  const rf = useRef<ReactFlowInstance<Node, Edge> | null>(null);

  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); }, [theme]);

  useEffect(() => {
    if (!token) { setPhase("error"); setErrorMsg("This review link is missing its token. Re-run `archeyes review` in your terminal."); return; }
    (async () => {
      try {
        const [g, layout] = await Promise.all([fetchGraph(), fetchLayout()]);
        setGraph(g);
        if (!g.nodes?.length) { setPhase("empty"); return; }
        const built = buildGraph(g, layout);
        setNodes(built.nodes); setEdges(built.edges); setPhase("ready");
      } catch (e: unknown) { setPhase("error"); setErrorMsg(e instanceof Error ? e.message : String(e)); }
    })();
  }, [setNodes, setEdges]);

  // Synthetic GraphNodeData for each node the dev drew this round (status "new"),
  // so every lookup (tray labels, inspector, comment composer, @mentions) resolves
  // a temp id exactly like a real node.
  const pendingNodeById = useMemo(() => {
    const m = new Map<string, GraphNodeData>();
    for (const a of pending.addedNodes) {
      m.set(a.tempId, { id: a.tempId, label: a.label, kind: a.kind, status: "new", group: a.group, description: a.description, files: [] });
    }
    return m;
  }, [pending.addedNodes]);
  const nodeById = useMemo(() => {
    const m = new Map<string, GraphNodeData>((graph?.nodes ?? []).map((n) => [n.id, n]));
    for (const [id, n] of pendingNodeById) m.set(id, n);
    return m;
  }, [graph, pendingNodeById]);
  const edgeById = useMemo(() => new Map((graph?.edges ?? []).map((e) => [e.id, e])), [graph]);
  const allNodeIds = useMemo(() => [...(graph?.nodes ?? []).map((n) => n.id), ...pendingNodeById.keys()], [graph, pendingNodeById]);
  const labelOf = useCallback((id: string) => nodeById.get(id)?.label ?? id, [nodeById]);
  const nodeHidden = useCallback((id: string) => { const nd = nodeById.get(id); return nd ? !filter.has(nd.status) : false; }, [nodeById, filter]);
  const selectedNode: GraphNodeData | null = selection?.type === "node" ? nodeById.get(selection.id) ?? null : null;
  const selectedEdge: GraphEdgeData | null = selection?.type === "edge" ? edgeById.get(selection.id) ?? null : null;

  const commentCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of pending.comments) m.set(c.nodeId, (m.get(c.nodeId) ?? 0) + 1);
    return m;
  }, [pending.comments]);

  useEffect(() => {
    setNodes((ns) => ns.map((n) => n.type === "arch"
      ? { ...n, hidden: !filter.has((n.data as { node?: GraphNodeData })?.node?.status ?? "existing"), data: { ...n.data, pendingDelete: pending.deletedNodes.includes(n.id), commentCount: commentCounts.get(n.id) ?? 0, armed: tool === "comment" && composer?.id !== n.id } }
      : n));
  }, [pending.deletedNodes, commentCounts, tool, composer, filter, setNodes]);

  useEffect(() => {
    setEdges((es) => es.map((e) => {
      const st = ((e.data as { status?: Status } | undefined)?.status ?? "existing");
      const del = pending.deletedEdges.includes(e.id);
      const hide = !filter.has(st) || nodeHidden(e.source) || nodeHidden(e.target);
      return { ...e, hidden: hide, data: { ...(e.data as object), pendingDelete: del }, ...edgeStyle(st, del) };
    }));
  }, [pending.deletedEdges, filter, nodeHidden, setEdges]);

  const onNodeDragStop = useCallback((_: unknown, node: Node) => { void saveLayout({ [node.id]: { x: node.position.x, y: node.position.y } }); }, []);
  const onConnect = useCallback((c: Connection) => {
    if (!c.source || !c.target) return;
    setEdges((es) => addEdge({ ...c, ...edgeStyle("new"), data: { status: "new" }, reconnectable: true }, es));
    setPending((p) => addEdgeE(p, c.source!, c.target!));
  }, [setEdges]);
  const onReconnect = useCallback((oldEdge: Edge, conn: Connection) => {
    const end: "source" | "target" = oldEdge.source !== conn.source ? "source" : "target";
    const was = end === "source" ? oldEdge.source : oldEdge.target;
    const now = end === "source" ? conn.source : conn.target;
    if (!now || was === now) return;
    setEdges((es) => reconnectEdge(oldEdge, conn, es));
    setPending((p) => reconnectE(p, { edgeId: oldEdge.id, end, was: was!, now }));
  }, [setEdges]);
  const onEdgeDoubleClick = useCallback((_: unknown, edge: Edge) => setPending((p) => toggleDeleteEdgeE(p, edge.id)), []);

  const onNodeClick = useCallback((e: { clientX: number; clientY: number }, node: Node) => {
    if (node.type !== "arch") return;
    if (tool === "comment") {
      setComposer({ id: node.id, x: e.clientX, y: e.clientY });
    } else {
      setSelection({ type: "node", id: node.id }); setTab("inspector");
    }
  }, [tool]);

  // click an arrow → inspect the connection. Tool-independent: edges aren't part
  // of the comment-composer flow, the edge inspector carries its own feedback box.
  const onEdgeClick = useCallback((_: unknown, edge: Edge) => {
    setComposer(null);
    setSelection({ type: "edge", id: edge.id }); setTab("inspector");
  }, []);

  // Drop a pending new node everywhere: its canvas node, any edges drawn to/from
  // its temp id, and the selection if it pointed at it. (pending.ts already drops
  // the temp-id edges from PendingEdits; this clears the React Flow mirror.)
  const dropAddedNode = useCallback((tempId: string) => {
    setNodes((ns) => ns.filter((n) => n.id !== tempId));
    setEdges((es) => es.filter((e) => e.source !== tempId && e.target !== tempId));
    setSelection((s) => (s?.type === "node" && s.id === tempId ? null : s));
  }, [setNodes, setEdges]);

  const removeEdit = useCallback((ref: EditRef) => {
    if (ref.kind === "addedNode") { const t = pending.addedNodes[ref.index]?.tempId; if (t) dropAddedNode(t); }
    setPending((p) => removeEditE(p, ref));
  }, [pending.addedNodes, dropAddedNode]);
  const addComment = useCallback((nodeId: string, text: string) => setPending((p) => addCommentE(p, nodeId, text)), []);
  const addEdgeComment = useCallback((edgeId: string, text: string) => setPending((p) => addEdgeCommentE(p, edgeId, text)), []);
  // Deleting a not-yet-sent new node means *removing the request*, not marking a
  // real node for deletion — route it to dropAddedNode instead.
  const toggleDeleteNode = useCallback((id: string) => {
    if (pendingNodeById.has(id)) {
      setPending((p) => { const i = p.addedNodes.findIndex((a) => a.tempId === id); return i < 0 ? p : removeEditE(p, { kind: "addedNode", index: i }); });
      dropAddedNode(id);
      return;
    }
    setPending((p) => toggleDeleteNodeE(p, id));
  }, [pendingNodeById, dropAddedNode]);

  // Add tool: click empty canvas → open the new-node form at that point.
  const onPaneClick = useCallback((e: React.MouseEvent) => {
    setComposer(null);
    setFilterOpen(false);
    if (tool === "add") setNodeForm({ x: e.clientX, y: e.clientY });
    else setNodeForm(null);
  }, [tool]);

  const createNode = useCallback((fields: { label: string; kind: GraphNodeData["kind"]; group?: string; description?: string }) => {
    if (!nodeForm) return;
    const tempId = nextTempId(pending);
    const pos = rf.current?.screenToFlowPosition({ x: nodeForm.x, y: nodeForm.y }) ?? { x: 0, y: 0 };
    const added: AddedNode = { tempId, label: fields.label, kind: fields.kind, group: fields.group || undefined, description: fields.description || undefined };
    setPending((p) => addNodeE(p, added));
    setNodes((ns) => [...ns, {
      id: tempId, type: "arch", position: pos,
      hidden: !filter.has("new"),
      data: { node: { id: tempId, label: added.label, kind: added.kind, status: "new" as Status, group: added.group, description: added.description, files: [] }, pendingDelete: false, commentCount: 0, armed: false },
    }]);
    void saveLayout({ [tempId]: pos });
    setNodeForm(null);
    setTool("select"); // back to select so the dev can immediately wire it up
  }, [nodeForm, pending, filter, setNodes]);

  const submit = useCallback(async (action: Feedback["action"]) => {
    setBusy(true);
    try { await sendFeedback(toEnvelope(pending, action)); setSentAction(action); setPhase("sent"); }
    catch (e: unknown) { setPhase("error"); setErrorMsg(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }, [pending]);

  if (phase === "loading") return <Shell><Banner t="Laying out graph…" /></Shell>;
  if (phase === "error") return <Shell><Banner t="Lost connection to the agent" d={errorMsg} cmd="archeyes review --resume" /></Shell>;
  if (phase === "empty") return <Shell><Banner t="Nothing mapped yet" d="The agent hasn't mapped any components for this plan. When it proposes an implementation, its architecture shows up here as an editable diagram." cmd="archeyes review <graph.json>" /></Shell>;
  if (phase === "sent") {
    const t = sentAction === "approve" ? "Approved — this plan is final." : sentAction === "cancel" ? "Cancelled." : "Feedback sent — the agent is revising.";
    const d = sentAction === "cancel" ? "The agent keeps the plan as-is and will check in with you." : "You can return to your terminal; the next round opens in a fresh tab.";
    return <Shell><Banner t={t} d={d} /></Shell>;
  }

  return (
    <div className="ax-app">
      <header className="ax-header">
        <span className="ax-logo"><ArchEyesLogo size={18} /></span>
        <div className="ax-header-titles">
          <span className="ax-header-title">{graph?.title}</span>
          <span className="ax-header-sub">plan review · {countLabel(pending)} pending</span>
        </div>
        <span className="ax-phase-chip ready"><span className="dot" /> READY</span>
        <div className="ax-header-actions">
          <button className={`ax-btn sm${legendOpen ? " active" : ""}`} onClick={() => setLegendOpen((v) => !v)}>
            <GitCompareArrows size={14} /> Diff key
          </button>
          <button className="ax-iconbtn" title="Toggle theme" onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}>
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
        {legendOpen && <Legend onClose={() => setLegendOpen(false)} />}
      </header>

      <div className="ax-body">
        <div className="ax-canvas-wrap">
          <div className="ax-toolbar tl" role="toolbar" aria-label="Canvas tools">
            <ToolBtn t="select" active={tool} setTool={setTool} title="Select (V)"><MousePointer2 size={16} /></ToolBtn>
            <ToolBtn t="pan" active={tool} setTool={setTool} title="Pan (H)"><Hand size={16} /></ToolBtn>
            <span className="sep" aria-hidden />
            <ToolBtn t="add" active={tool} setTool={setTool} title="Add node (N)"><Plus size={16} /></ToolBtn>
            <ToolBtn t="comment" active={tool} setTool={setTool} title="Comment (C)"><MessageSquarePlus size={16} /></ToolBtn>
            <span className="sep" aria-hidden />
            <button className={`ax-tool${filterOpen || filter.size < ALL_STATUSES.length ? " active" : ""}`} title="Filter by status" aria-pressed={filter.size < ALL_STATUSES.length} onClick={() => setFilterOpen((v) => !v)}><Filter size={16} /></button>
          </div>
          {filterOpen && <FilterPopover filter={filter} setFilter={setFilter} onClose={() => setFilterOpen(false)} />}

          {(tool === "comment" || tool === "add") && (
            <div className="ax-toast mode">
              {tool === "comment"
                ? <><MessageSquarePlus size={13} style={{ color: "var(--accent)" }} /> Comment mode — click a node to leave feedback</>
                : <><Plus size={13} style={{ color: "var(--accent)" }} /> Add mode — click the canvas to place a new node</>}
              <button className="ax-crow-x" onClick={() => setTool("select")}><X size={13} /></button>
            </div>
          )}

          <ReactFlow
            nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes}
            onInit={(inst) => { rf.current = inst; }}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onNodeDragStop={onNodeDragStop} onConnect={onConnect} onReconnect={onReconnect}
            onEdgeDoubleClick={onEdgeDoubleClick} onEdgeClick={onEdgeClick} onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodesDraggable={tool !== "pan"} elementsSelectable={tool !== "pan"}
            deleteKeyCode={null} fitView proOptions={{ hideAttribution: true }}
            minZoom={0.2}
            className={`ax-canvas-bg tool-${tool}`}
          >
            <Background variant={BackgroundVariant.Dots} gap={26} size={1} color="var(--canvas-dot)" />
            <Controls showInteractive={false} position="bottom-right" />
            <MiniMap
              position="top-right"
              className="ax-map"
              pannable zoomable
              maskColor="color-mix(in srgb, var(--bg-canvas) 55%, transparent)"
              maskStrokeColor="var(--accent)"
              bgColor="var(--surface-1)"
              nodeColor={(n) => (n.type === "archgroup" ? "var(--group-header)" : STATUS_MINI[(n.data as { node?: GraphNodeData })?.node?.status ?? "existing"])}
              nodeStrokeWidth={2}
            />
          </ReactFlow>

          {composer && (
            <Composer
              label={labelOf(composer.id)} kind={nodeById.get(composer.id)?.kind ?? "other"}
              screen={{ x: composer.x, y: composer.y }}
              onPost={(text) => { addComment(composer.id, text); setComposer(null); }}
              onClose={() => setComposer(null)}
            />
          )}

          {nodeForm && (
            <NodeComposer
              screen={nodeForm} groups={graph?.groups ?? []}
              onCreate={createNode} onClose={() => { setNodeForm(null); setTool("select"); }}
            />
          )}
        </div>

        <Rail
          tab={tab} setTab={setTab} pending={pending} removeEdit={removeEdit}
          selectedNode={selectedNode} selectedEdge={selectedEdge}
          nodeById={nodeById} edgeById={edgeById} allNodeIds={allNodeIds} labelOf={labelOf}
          addComment={addComment} addEdgeComment={addEdgeComment} toggleDeleteNode={toggleDeleteNode}
          onSend={() => submit("revise")} onApprove={() => submit("approve")} onCancel={() => submit("cancel")}
          busy={busy}
        />
      </div>
    </div>
  );
}

function countLabel(p: PendingEdits): number {
  return p.comments.length + p.edgeComments.length + p.reconnected.length + p.addedNodes.length + p.added.length + p.deletedNodes.length + p.deletedEdges.length + p.moved.length;
}

function ToolBtn({ t, active, setTool, title, children }: { t: Tool; active: Tool; setTool: (t: Tool) => void; title: string; children: React.ReactNode }) {
  return (
    <button className={`ax-tool${active === t ? " active" : ""}`} title={title} aria-label={title} aria-pressed={active === t} onClick={() => setTool(t)}>
      {children}
    </button>
  );
}

function FilterPopover({ filter, setFilter, onClose }: { filter: Set<Status>; setFilter: (f: Set<Status>) => void; onClose: () => void }) {
  const toggle = (s: Status) => {
    const next = new Set(filter);
    if (next.has(s)) next.delete(s); else next.add(s);
    setFilter(next);
  };
  return (
    <div className="ax-filter-pop" onMouseLeave={onClose}>
      <div className="ttl">Show statuses</div>
      {ALL_STATUSES.map((s) => {
        const e = EDGE_VAR[s];
        const on = filter.has(s);
        return (
          <button key={s} className={`ax-filter-row${on ? " on" : ""}`} aria-pressed={on} onClick={() => toggle(s)}>
            <span className="box">{on && <Check size={11} strokeWidth={3} />}</span>
            <span className="sw" style={{ borderTopColor: e.color, borderTopStyle: e.dash ? "dashed" : "solid" }} />
            <span style={{ textTransform: "capitalize" }}>{STATUS_LABEL[s]}</span>
          </button>
        );
      })}
    </div>
  );
}

function NodeComposer({ screen, groups, onCreate, onClose }: {
  screen: { x: number; y: number };
  groups: NonNullable<PlanGraph["groups"]>;
  onCreate: (fields: { label: string; kind: GraphNodeData["kind"]; group?: string; description?: string }) => void;
  onClose: () => void;
}) {
  const [label, setLabel] = useState("");
  const [kind, setKind] = useState<GraphNodeData["kind"]>("service");
  const [group, setGroup] = useState<string>("");
  const [desc, setDesc] = useState("");
  const left = Math.min(screen.x + 12, window.innerWidth - 300);
  const top = Math.min(screen.y, window.innerHeight - 320);
  const submit = () => { if (label.trim()) onCreate({ label: label.trim(), kind, group: group || undefined, description: desc.trim() || undefined }); };
  const KindGlyph = iconFor(kind);
  return (
    <div className="ax-composer" style={{ left, top, width: 288 }} onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <KindIcon kind={kind} size="sm" />
        <span style={{ fontSize: "var(--fs-small)", fontWeight: 600 }}>New node</span>
        <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: "var(--fs-micro)", letterSpacing: "var(--ls-caps)", textTransform: "uppercase", color: "var(--text-3)" }}>Add</span>
        <button className="ax-crow-x" onClick={onClose}><X size={13} /></button>
      </div>

      <label className="ax-field-label" style={{ marginTop: 6 }}>Label</label>
      <input autoFocus className="ax-input" value={label} onChange={(e) => setLabel(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(); }}
        placeholder="e.g. PricingService" />

      <label className="ax-field-label" style={{ marginTop: 8 }}>Kind</label>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <KindGlyph size={15} strokeWidth={1.9} style={{ color: "var(--text-3)", flex: "none" }} />
        <select className="ax-input" value={kind} onChange={(e) => setKind(e.target.value as GraphNodeData["kind"])} style={{ flex: 1, textTransform: "capitalize" }}>
          {NODE_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>

      <label className="ax-field-label" style={{ marginTop: 8 }}>Group</label>
      <select className="ax-input" value={group} onChange={(e) => setGroup(e.target.value)}>
        <option value="">No group</option>
        {groups.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
      </select>

      <label className="ax-field-label" style={{ marginTop: 8 }}>Description</label>
      <textarea className="ax-textarea" rows={2} value={desc} onChange={(e) => setDesc(e.target.value)}
        placeholder="What this component is for (optional)" />

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-micro)", color: "var(--text-3)" }}>⌘↵ to add</span>
        <Button variant="primary" size="sm" style={{ marginLeft: "auto" }} disabled={!label.trim()} onClick={submit}><Plus size={13} /> Add node</Button>
      </div>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="ax-app"><div className="ax-canvas-wrap ax-canvas-bg" style={{ background: "var(--bg-canvas)" }}>{children}</div></div>;
}

function Banner({ t, d, cmd }: { t: string; d?: string; cmd?: string }) {
  return (
    <div className="ax-banner">
      <div className="card">
        <div className="t">{t}</div>
        {d && <div className="d">{d}</div>}
        {cmd && <div className="ax-cmd"><span className="dollar">$</span><span className="cmd">{cmd}</span></div>}
      </div>
    </div>
  );
}

function Legend({ onClose }: { onClose: () => void }) {
  const rows: { s: Status; d: string; note?: string }[] = [
    { s: "existing", d: "Existing", note: "unchanged" },
    { s: "new", d: "New", note: "added by this plan" },
    { s: "modify", d: "Modified", note: "touched" },
    { s: "delete", d: "Deleted", note: "removed · dbl-click an edge to mark" },
  ];
  return (
    <div className="ax-legend-pop" onMouseLeave={onClose}>
      <div className="ttl">Diff key</div>
      {rows.map((r) => {
        const e = EDGE_VAR[r.s];
        return (
          <div className="row" key={r.s}>
            <span className={`chip ax-status-${r.s === "modify" ? "modified" : r.s === "delete" ? "deleted" : r.s}`} />
            <span className="sw" style={{ borderTop: `${e.width}px ${e.dash ? "dashed" : "solid"} ${e.color}` }} />
            <span className="lbl">{r.d}</span>
            {r.note && <span className="note">{r.note}</span>}
          </div>
        );
      })}
    </div>
  );
}

function Composer({ label, kind, screen, onPost, onClose }: { label: string; kind: string; screen: { x: number; y: number }; onPost: (t: string) => void; onClose: () => void }) {
  const [text, setText] = useState("");
  const left = Math.min(screen.x + 12, window.innerWidth - 280);
  const top = Math.min(screen.y, window.innerHeight - 200);
  return (
    <div className="ax-composer" style={{ left, top }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <KindIcon kind={kind} size="sm" />
        <span style={{ fontSize: "var(--fs-small)", fontWeight: 600 }}>{label}</span>
        <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: "var(--fs-micro)", letterSpacing: "var(--ls-caps)", textTransform: "uppercase", color: "var(--text-3)" }}>Comment</span>
        <button className="ax-crow-x" onClick={onClose}><X size={13} /></button>
      </div>
      <textarea autoFocus className="ax-textarea" rows={3} value={text} onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Escape") onClose(); if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && text.trim()) onPost(text.trim()); }}
        placeholder={`Feedback for the agent on ${label}…`} />
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-micro)", color: "var(--text-3)" }}>⌘↵ to add</span>
        <Button variant="primary" size="sm" style={{ marginLeft: "auto" }} disabled={!text.trim()} onClick={() => onPost(text.trim())}><Send size={13} /> Comment</Button>
      </div>
    </div>
  );
}
