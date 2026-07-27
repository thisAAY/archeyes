import { useCallback, useEffect, useMemo, useState } from "react";
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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./styles.css";
import { MousePointer2, MessageSquarePlus, Sun, Moon, X, Send, GitCompareArrows } from "lucide-react";
import { fetchGraph, fetchLayout, saveLayout, sendFeedback, token } from "./api.ts";
import { buildGraph, edgeStyle } from "./layout.ts";
import { ArchNode, GroupNode } from "./GraphNode.tsx";
import { Rail } from "./Rail.tsx";
import { KindIcon, Button, ArchEyesLogo } from "./ui.tsx";
import { EDGE_VAR } from "./diff.ts";
import {
  addComment as addCommentE, addEdge as addEdgeE, empty, reconnect as reconnectE,
  removeEdit as removeEditE, toEnvelope, toggleDeleteNode as toggleDeleteNodeE, toggleDeleteEdge as toggleDeleteEdgeE,
} from "./pending.ts";
import type { EditRef, PendingEdits } from "./pending.ts";
import type { Feedback, GraphNodeData, PlanGraph, Status } from "./protocol.ts";

const nodeTypes: NodeTypes = { arch: ArchNode, archgroup: GroupNode };
const STATUS_MINI: Record<string, string> = {
  existing: "var(--st-existing)", new: "var(--st-new-line)", modify: "var(--st-modified-line)", delete: "var(--st-deleted-line)",
};
type Phase = "loading" | "ready" | "empty" | "sent" | "error";
type Tool = "select" | "comment";

export default function App() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [graph, setGraph] = useState<PlanGraph | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [pending, setPending] = useState<PendingEdits>(empty());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"changes" | "inspector">("changes");
  const [busy, setBusy] = useState(false);
  const [sentAction, setSentAction] = useState<Feedback["action"] | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [tool, setTool] = useState<Tool>("select");
  const [legendOpen, setLegendOpen] = useState(false);
  const [composer, setComposer] = useState<{ id: string; x: number; y: number } | null>(null);

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

  const nodeById = useMemo(() => new Map((graph?.nodes ?? []).map((n) => [n.id, n])), [graph]);
  const allNodeIds = useMemo(() => (graph?.nodes ?? []).map((n) => n.id), [graph]);
  const labelOf = useCallback((id: string) => nodeById.get(id)?.label ?? id, [nodeById]);
  const selected: GraphNodeData | null = selectedId ? nodeById.get(selectedId) ?? null : null;

  const commentCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of pending.comments) m.set(c.nodeId, (m.get(c.nodeId) ?? 0) + 1);
    return m;
  }, [pending.comments]);

  useEffect(() => {
    setNodes((ns) => ns.map((n) => n.type === "arch"
      ? { ...n, data: { ...n.data, pendingDelete: pending.deletedNodes.includes(n.id), commentCount: commentCounts.get(n.id) ?? 0, armed: tool === "comment" && composer?.id !== n.id } }
      : n));
  }, [pending.deletedNodes, commentCounts, tool, composer, setNodes]);

  useEffect(() => {
    setEdges((es) => es.map((e) => {
      const st = ((e.data as { status?: Status } | undefined)?.status ?? "existing");
      return { ...e, ...edgeStyle(st, pending.deletedEdges.includes(e.id)) };
    }));
  }, [pending.deletedEdges, setEdges]);

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
      setSelectedId(node.id); setTab("inspector");
    }
  }, [tool]);

  const removeEdit = useCallback((ref: EditRef) => setPending((p) => removeEditE(p, ref)), []);
  const addComment = useCallback((nodeId: string, text: string) => setPending((p) => addCommentE(p, nodeId, text)), []);
  const toggleDeleteNode = useCallback((id: string) => setPending((p) => toggleDeleteNodeE(p, id)), []);

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
          <div className="ax-toolbar tl">
            <button className={`ax-tool${tool === "select" ? " active" : ""}`} title="Select (V)" onClick={() => setTool("select")}><MousePointer2 size={16} /></button>
            <button className={`ax-tool${tool === "comment" ? " active" : ""}`} title="Comment (C)" onClick={() => setTool("comment")}><MessageSquarePlus size={16} /></button>
          </div>

          {tool === "comment" && (
            <div className="ax-toast mode">
              <MessageSquarePlus size={13} style={{ color: "var(--accent)" }} /> Comment mode — click a node to leave feedback
              <button className="ax-crow-x" onClick={() => setTool("select")}><X size={13} /></button>
            </div>
          )}

          <ReactFlow
            nodes={nodes} edges={edges} nodeTypes={nodeTypes}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onNodeDragStop={onNodeDragStop} onConnect={onConnect} onReconnect={onReconnect}
            onEdgeDoubleClick={onEdgeDoubleClick} onNodeClick={onNodeClick}
            onPaneClick={() => setComposer(null)}
            deleteKeyCode={null} fitView proOptions={{ hideAttribution: true }}
            minZoom={0.2}
            className="ax-canvas-bg"
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
        </div>

        <Rail
          tab={tab} setTab={setTab} pending={pending} removeEdit={removeEdit}
          selected={selected} allNodeIds={allNodeIds} labelOf={labelOf}
          addComment={addComment} toggleDeleteNode={toggleDeleteNode}
          onSend={() => submit("revise")} onApprove={() => submit("approve")} onCancel={() => submit("cancel")}
          busy={busy}
        />
      </div>
    </div>
  );
}

function countLabel(p: PendingEdits): number {
  return p.comments.length + p.reconnected.length + p.added.length + p.deletedNodes.length + p.deletedEdges.length + p.moved.length;
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
