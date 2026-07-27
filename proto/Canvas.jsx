(function(){
/* global React */
const D = window.AXData;
const { Node, GroupLayer, Edge, Toolbar, ToolbarSeparator, IconButton, Legend, Icon, KindIcon, Button } = window.ArchEyesDesignSystem_eaa862;

const STATUS_MINI = {
  existing:{ b:"1px solid var(--st-existing)" },
  new:     { b:"2px solid var(--st-new-line)" },
  modified:{ b:"1.5px dashed var(--st-modified-line)" },
  deleted: { b:"1.5px dotted var(--st-deleted-line)", o:.5 },
};

function Minimap(){
  const S = 0.16;
  return (
    <div style={{
      position:"absolute", top:12, right:12, zIndex:20, padding:"18px 9px 9px",
      background:"color-mix(in srgb, var(--surface-1) 86%, transparent)",
      border:"1px solid var(--border-strong)", borderRadius:"var(--r-lg)",
      boxShadow:"var(--sh-node)", backdropFilter:"blur(6px)",
    }}>
      <div style={{ position:"absolute", top:5, left:10, fontFamily:"var(--font-mono)", fontSize:"var(--fs-micro)", letterSpacing:"var(--ls-caps)", color:"var(--text-3)" }}>MAP</div>
      <div style={{ position:"relative", width:D.BOARD_W*S, height:D.BOARD_H*S }}>
        {D.GROUPS.map((g,i)=>(
          <div key={i} style={{ position:"absolute", left:g.x*S, top:g.y*S, width:g.w*S, height:g.h*S, border:"1px solid var(--border)", borderRadius:3, background: g.variant==="domain"?"var(--group-fill-domain)":"var(--group-fill)" }} />
        ))}
        {D.NODES.map(n=>{
          const m = STATUS_MINI[n.status];
          return <div key={n.id} style={{ position:"absolute", left:n.x*S, top:n.y*S, width:D.NODE_W*S, height:D.NODE_H*S, borderRadius:2, background:"var(--surface-2)", border:m.b, opacity:m.o||1 }} />;
        })}
        <div style={{ position:"absolute", left:2, top:2, right:2, bottom:2, border:"1px solid var(--accent)", borderRadius:3, background:"var(--accent-weak)" }} />
      </div>
    </div>
  );
}

function Hint({ x, y, children }){
  return (
    <div className="ax-hint" style={{ position:"absolute", left:x, top:y, zIndex:15, maxWidth:186 }}>
      <div style={{ display:"flex", alignItems:"center", gap:7, padding:"7px 10px", background:"var(--surface-1)", border:"1px dashed var(--accent)", borderRadius:"var(--r-md)", boxShadow:"var(--sh-node)", fontSize:"var(--fs-small)", color:"var(--text-1)", lineHeight:1.35 }}>
        <span style={{ width:6, height:6, borderRadius:"50%", background:"var(--accent)", flex:"none" }} />
        {children}
      </div>
    </div>
  );
}

function Board({ scenario, phase, selected, onSelect, dim, scale, commenting, commentCounts, activeComment }){
  const arrivedRing = phase==="arrived";
  return (
    <div style={{ position:"relative", width:D.BOARD_W, height:D.BOARD_H, transform:`scale(${scale})`, transformOrigin:"top left", opacity:dim?0.4:1, filter:dim?"saturate(.7)":"none", transition:"opacity var(--dur-slow) var(--ease-out)", pointerEvents:dim?"none":"auto", cursor:commenting?"crosshair":"default" }}>
      {D.GROUPS.map((g,i)=>(
        <GroupLayer key={i} label={g.label} icon={g.icon} variant={g.variant} count={g.count} style={{ position:"absolute", left:g.x, top:g.y, width:g.w, height:g.h }} />
      ))}

      <svg style={{ position:"absolute", inset:0, width:D.BOARD_W, height:D.BOARD_H, pointerEvents:"none", overflow:"visible" }}>
        {D.EDGES.map(e=>{
          const sel = selected===e.from || selected===e.to;
          return <Edge key={e.id} id={e.id} from={D.port(D.byId[e.from], e.fromSide)} to={D.port(D.byId[e.to], e.toSide)} status={e.status} selected={sel} />;
        })}
      </svg>

      {D.NODES.map(n=>{
        const isArrived = arrivedRing && D.ARRIVED_IDS.includes(n.id);
        const cc = (n.comments||0) + (commentCounts[n.id]||0);
        const armed = commenting && activeComment!==n.id;
        return (
          <div key={n.id} className={isArrived ? "ax-arrived-ring" : ""} style={{ position:"absolute", left:n.x, top:n.y, borderRadius:"var(--r-md)", outline: armed?"1px dashed var(--accent)":"none", outlineOffset:3 }}>
            <Node kind={n.kind} status={n.status} title={n.title} path={n.path} width={D.NODE_W} ports selected={selected===n.id||activeComment===n.id} hasComment={cc>0} comments={cc} onClick={()=>onSelect(n.id)} />
          </div>
        );
      })}

      {scenario==="firstrun" && (
        <>
          <Hint x={30} y={112}>Drag any node to rearrange the layout</Hint>
          <Hint x={470} y={150}>Drag from a node's port to reconnect an edge</Hint>
          <Hint x={258} y={22}>Click a node to comment or inspect it</Hint>
        </>
      )}
    </div>
  );
}

function WorkingCard({ changes }){
  return (
    <div style={{ position:"absolute", inset:0, zIndex:40, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ position:"absolute", inset:0, background:"color-mix(in srgb, var(--bg-canvas) 62%, transparent)", backdropFilter:"blur(2px)" }} />
      <div style={{ position:"relative", width:400, padding:"22px 22px 18px", background:"var(--surface-1)", border:"1px solid var(--border-strong)", borderRadius:"var(--r-xl)", boxShadow:"var(--sh-pop)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:11, marginBottom:14 }}>
          <span className="ax-spin" style={{ width:20, height:20, borderRadius:"50%", border:"2px solid var(--border-strong)", borderTopColor:"var(--accent)", flex:"none" }} />
          <div style={{ display:"flex", flexDirection:"column", lineHeight:1.3 }}>
            <span style={{ fontSize:"var(--fs-h2)", fontWeight:600, color:"var(--text-1)", letterSpacing:"-0.01em" }}>Agent is revising your plan…</span>
            <span style={{ fontFamily:"var(--font-mono)", fontSize:"var(--fs-micro)", color:"var(--text-3)", letterSpacing:"var(--ls-caps)" }}>ROUND 3 · {changes.length} CHANGES SENT</span>
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
          {changes.map(c=>(
            <div key={c.id} style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"6px 0", borderTop:"1px solid var(--border)", fontSize:"var(--fs-small)", color:"var(--text-2)", lineHeight:1.4 }}>
              <Icon name="check" size={13} strokeWidth={2.4} style={{ color:"var(--text-3)", marginTop:1, flex:"none" }} />
              <span>{c.text}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop:14, fontSize:"var(--fs-small)", color:"var(--text-3)" }}>You can keep editing — new feedback queues for the next round.</div>
      </div>
    </div>
  );
}

function ArrivedToast({ onDismiss }){
  return (
    <div className="ax-toast" style={{ position:"absolute", top:16, left:"50%", transform:"translateX(-50%)", zIndex:45, display:"flex", alignItems:"center", gap:10, padding:"9px 12px", background:"var(--surface-1)", border:"1px solid var(--st-new-line)", borderRadius:"var(--r-lg)", boxShadow:"var(--sh-pop)" }}>
      <span style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:20, height:20, borderRadius:"50%", background:"var(--st-new-tint)", color:"var(--st-new)", flex:"none" }}><Icon name="check" size={13} strokeWidth={2.6} /></span>
      <span style={{ fontSize:"var(--fs-small)", color:"var(--text-1)" }}><strong style={{fontWeight:600}}>3 changes</strong> from your feedback</span>
      <button onClick={onDismiss} aria-label="Dismiss" style={{ background:"transparent", border:0, color:"var(--text-3)", cursor:"pointer", padding:2, marginLeft:4, display:"inline-flex" }}><Icon name="x" size={13} /></button>
    </div>
  );
}

function EmptyState(){
  return (
    <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:18, textAlign:"center", padding:24 }}>
      <svg width="66" height="66" viewBox="0 0 32 32" fill="none" style={{ color:"var(--text-3)", opacity:.7 }}>
        <path d="M1 16 H5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity=".5"/>
        <path d="M26.5 16 H31" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity=".5"/>
        <path d="M4 16 Q16 5 28 16 Q16 27 4 16 Z" stroke="currentColor" strokeWidth="1.6" fill="none"/>
        <rect x="11" y="11" width="10" height="10" rx="2.2" stroke="currentColor" strokeWidth="1.6" fill="none" strokeDasharray="2 2.4"/>
      </svg>
      <div style={{ maxWidth:400, display:"flex", flexDirection:"column", gap:9 }}>
        <div style={{ fontSize:"var(--fs-display)", fontWeight:600, letterSpacing:"-0.01em", color:"var(--text-1)" }}>Nothing mapped yet</div>
        <div style={{ fontSize:"var(--fs-body)", color:"var(--text-2)", lineHeight:1.55 }}>The agent hasn't mapped any components for this plan yet. When it proposes an implementation, its architecture shows up here as an editable diagram you can talk back to.</div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 12px", background:"var(--surface-sunken)", border:"1px solid var(--border)", borderRadius:"var(--r-md)" }}>
        <span style={{ fontFamily:"var(--font-mono)", fontSize:"var(--fs-mono)", color:"var(--text-3)" }}>$</span>
        <span style={{ fontFamily:"var(--font-mono)", fontSize:"var(--fs-mono)", color:"var(--text-1)" }}>claude plan --watch</span>
      </div>
    </div>
  );
}

function CommentComposer({ node, x, y, onPost, onClose }){
  const [text, setText] = React.useState("");
  const ref = React.useRef(null);
  React.useEffect(()=>{ if(ref.current) ref.current.focus(); }, []);
  const post = ()=>{ if(!text.trim()) return; onPost(node, text.trim()); };
  return (
    <div style={{ position:"absolute", left:x, top:y, zIndex:55, width:262 }}>
      <div style={{ background:"var(--surface-1)", border:"1px solid var(--border-strong)", borderRadius:"var(--r-xl)", boxShadow:"var(--sh-pop)", padding:12, display:"flex", flexDirection:"column", gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
          <KindIcon kind={node.kind} size="sm" />
          <span style={{ fontSize:"var(--fs-small)", fontWeight:600, color:"var(--text-1)" }}>{node.title}</span>
          <span style={{ fontFamily:"var(--font-mono)", fontSize:"var(--fs-micro)", letterSpacing:"var(--ls-caps)", color:"var(--text-3)", textTransform:"uppercase", marginLeft:"auto" }}>Comment</span>
          <button onClick={onClose} aria-label="Close" style={{ background:"transparent", border:0, color:"var(--text-3)", cursor:"pointer", padding:2, display:"inline-flex" }}><Icon name="x" size={13} /></button>
        </div>
        <textarea ref={ref} value={text} onChange={e=>setText(e.target.value)} rows={3}
          onKeyDown={e=>{ if(e.key==="Escape") onClose(); if(e.key==="Enter"&&(e.metaKey||e.ctrlKey)) post(); }}
          placeholder={`Add feedback for the agent on ${node.title}…`}
          style={{ resize:"none", width:"100%", boxSizing:"border-box", padding:"8px 10px", background:"var(--surface-sunken)", color:"var(--text-1)", border:"1px solid var(--border-strong)", borderRadius:"var(--r-sm)", fontFamily:"var(--font-sans)", fontSize:"var(--fs-small)", lineHeight:1.5, outline:"none" }} />
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontFamily:"var(--font-mono)", fontSize:"var(--fs-micro)", color:"var(--text-3)" }}>⌘↵ to send</span>
          <Button size="sm" variant="primary" iconLeft="send" style={{ marginLeft:"auto" }} disabled={!text.trim()} onClick={post}>Comment</Button>
        </div>
      </div>
    </div>
  );
}

function Canvas({ scenario, phase, tool, setTool, selected, onSelect, changes, onDismissArrived, onAddComment }){
  const empty = scenario==="empty";
  const working = phase==="working";
  const boardDim = scenario==="disconnected";
  const commenting = tool==="comment" && !working && !boardDim;
  const [composer, setComposer] = React.useState(null); // node id
  const [commentCounts, setCommentCounts] = React.useState({});
  const ref = React.useRef(null);
  const [box, setBox] = React.useState({ w:960, h:640 });

  React.useEffect(()=>{ if(!commenting) setComposer(null); }, [commenting]);

  React.useEffect(()=>{
    const el = ref.current; if(!el) return;
    const ro = new ResizeObserver(()=> setBox({ w:el.clientWidth, h:el.clientHeight }));
    ro.observe(el); setBox({ w:el.clientWidth, h:el.clientHeight });
    return ()=> ro.disconnect();
  }, []);

  const PAD_X = 24, PAD_TOP = 72, PAD_BOT = 56;
  const availW = Math.max(200, box.w - PAD_X*2);
  const availH = Math.max(200, box.h - PAD_TOP - PAD_BOT);
  const scale = Math.min(1, availW/D.BOARD_W, availH/D.BOARD_H);
  const bw = D.BOARD_W*scale, bh = D.BOARD_H*scale;
  const left = Math.max(PAD_X, (box.w - bw)/2);
  const top = PAD_TOP + Math.max(0, (availH - bh)/2);

  const handleNodeClick = (id)=>{ if(commenting){ setComposer(id); } else { onSelect(id); } };
  const postComment = (node, text)=>{
    setCommentCounts(c=>({ ...c, [node.id]:(c[node.id]||0)+1 }));
    onAddComment && onAddComment(node.title, text);
    setComposer(null);
  };
  const cNode = composer ? D.byId[composer] : null;

  return (
    <div ref={ref} className="ax-canvas" style={{ position:"relative", flex:1, overflow:"hidden", minWidth:0 }}>
      {!empty && <>
        <div style={{ position:"absolute", top:12, left:12, zIndex:20 }}>
          <Toolbar>
            <IconButton icon="cursor" label="Select (V)" active={tool==="select"} onClick={()=>setTool("select")} />
            <IconButton icon="hand" label="Pan (H)" active={tool==="pan"} onClick={()=>setTool("pan")} />
            <ToolbarSeparator />
            <IconButton icon="plus" label="Add node" active={tool==="add"} onClick={()=>setTool("add")} />
            <IconButton icon="comment" label="Comment" active={tool==="comment"} onClick={()=>setTool("comment")} />
            <ToolbarSeparator />
            <IconButton icon="filter" label="Filter by status" />
          </Toolbar>
        </div>

        <Minimap />

        <div style={{ position:"absolute", bottom:14, right:14, zIndex:20 }}>
          <Toolbar orientation="vertical">
            <IconButton icon="zoomIn" label="Zoom in" />
            <IconButton icon="zoomOut" label="Zoom out" />
            <ToolbarSeparator orientation="vertical" />
            <IconButton icon="fit" label="Fit view" />
          </Toolbar>
        </div>

        <div style={{ position:"absolute", bottom:16, left:16, zIndex:20, background:"color-mix(in srgb, var(--surface-1) 82%, transparent)", border:"1px solid var(--border)", borderRadius:"var(--r-md)", padding:"7px 11px", backdropFilter:"blur(6px)" }}>
          <Legend />
        </div>

        <div style={{ position:"absolute", left, top }}>
          <Board scenario={scenario} phase={phase} selected={selected} onSelect={handleNodeClick} dim={working||boardDim} scale={scale} commenting={commenting} commentCounts={commentCounts} activeComment={composer} />
        </div>

        {commenting && (
          <div className="ax-toast" style={{ position:"absolute", top:16, left:"50%", transform:"translateX(-50%)", zIndex:30, display:"flex", alignItems:"center", gap:9, padding:"8px 12px", background:"var(--surface-1)", border:"1px solid var(--accent)", borderRadius:"var(--r-lg)", boxShadow:"var(--sh-pop)" }}>
            <Icon name="comment" size={13} style={{ color:"var(--accent)" }} />
            <span style={{ fontSize:"var(--fs-small)", color:"var(--text-1)" }}>Comment mode — click any node to leave feedback</span>
            <button onClick={()=>setTool("select")} style={{ marginLeft:6, background:"transparent", border:"1px solid var(--border-strong)", borderRadius:"var(--r-xs)", color:"var(--text-2)", fontFamily:"var(--font-mono)", fontSize:"var(--fs-micro)", padding:"1px 6px", cursor:"pointer" }}>Esc</button>
          </div>
        )}

        {cNode && (
          <CommentComposer node={cNode} onPost={postComment} onClose={()=>setComposer(null)}
            x={Math.min(box.w-274, left + (cNode.x + D.NODE_W)*scale + 10)}
            y={top + cNode.y*scale} />
        )}

        {phase==="arrived" && <ArrivedToast onDismiss={onDismissArrived} />}
        {working && <WorkingCard changes={changes} />}
      </>}

      {empty && <EmptyState />}
    </div>
  );
}

window.AXCanvas = Canvas;
})();
