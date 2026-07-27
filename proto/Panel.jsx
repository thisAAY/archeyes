(function(){
/* global React */
const D = window.AXData;
const { Icon, KindIcon, StatusBadge, Button } = window.ArchEyesDesignSystem_eaa862;

const TYPE_META = {
  comment:   { label:"Comments",      icon:"comment" },
  reconnect: { label:"Reconnections", icon:"gitCompare" },
  add:       { label:"Additions",     icon:"plus" },
  delete:    { label:"Deletions",     icon:"trash" },
  move:      { label:"Moves",         icon:"cursor" },
};
const TYPE_ORDER = ["comment","reconnect","add","delete","move"];

function TabBar({ tab, setTab, count, hasNode }){
  const Tab = ({ id, label, badge, disabled }) => {
    const on = tab===id;
    return (
      <button onClick={()=>!disabled && setTab(id)} disabled={disabled} style={{
        position:"relative", flex:1, height:40, background:"transparent", border:0,
        borderBottom:`2px solid ${on ? "var(--accent)" : "transparent"}`,
        color: disabled ? "var(--text-3)" : (on ? "var(--text-1)" : "var(--text-2)"),
        fontFamily:"var(--font-sans)", fontSize:"var(--fs-body)", fontWeight: on?600:500,
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled?0.5:1,
        display:"inline-flex", alignItems:"center", justifyContent:"center", gap:7,
      }}>
        {label}
        {badge!=null && (
          <span style={{
            display:"inline-flex", alignItems:"center", justifyContent:"center", minWidth:17, height:17, padding:"0 5px",
            borderRadius:"var(--r-full)", background: on?"var(--accent)":"var(--surface-2)", color: on?"var(--accent-fg)":"var(--text-2)",
            border: on?"none":"1px solid var(--border-strong)",
            fontFamily:"var(--font-mono)", fontSize:"var(--fs-micro)", fontWeight:700,
          }}>{badge}</span>
        )}
      </button>
    );
  };
  return (
    <div style={{ display:"flex", flex:"none", borderBottom:"1px solid var(--border)", background:"var(--surface-1)" }}>
      <Tab id="changes" label="Changes" badge={count} />
      <Tab id="inspector" label="Inspector" disabled={!hasNode} />
    </div>
  );
}

function ChangeRow({ ch, onRemove }){
  let primary, detail;
  if (ch.type==="comment"){ primary = <>Comment on <span style={{fontWeight:600, color:"var(--text-1)"}}>{ch.node}</span></>; detail = ch.text; }
  else if (ch.type==="reconnect"){ primary = <>Reconnect <span style={{fontFamily:"var(--font-mono)", color:"var(--text-1)"}}>{ch.from} → {ch.to}</span></>; detail = `was → ${ch.was}`; }
  else if (ch.type==="delete"){ primary = <>Delete <span style={{fontWeight:600, color:"var(--text-1)"}}>{ch.node}</span></>; detail = ch.text; }
  else { primary = ch.text; }
  return (
    <div style={{ display:"flex", gap:9, padding:"9px 0", borderTop:"1px solid var(--border)" }}>
      <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", gap:3 }}>
        <div style={{ fontSize:"var(--fs-small)", color:"var(--text-2)", lineHeight:1.4 }}>{primary}</div>
        {detail && <div style={{ fontSize:"var(--fs-small)", color:"var(--text-3)", lineHeight:1.45, fontFamily: ch.type==="reconnect"?"var(--font-mono)":"var(--font-sans)", fontSize: ch.type==="reconnect"?"var(--fs-micro)":"var(--fs-small)" }}>{detail}</div>}
      </div>
      <button onClick={onRemove} aria-label="Remove this edit" title="Remove this edit" style={{
        flex:"none", width:22, height:22, background:"transparent", border:"1px solid transparent",
        borderRadius:"var(--r-sm)", color:"var(--text-3)", cursor:"pointer",
        display:"inline-flex", alignItems:"center", justifyContent:"center",
      }} onMouseEnter={e=>{e.currentTarget.style.background="var(--surface-2)";e.currentTarget.style.color="var(--text-1)";}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="var(--text-3)";}}>
        <Icon name="x" size={13} />
      </button>
    </div>
  );
}

function ChangesView({ changes, onRemove, phase, agentReply }){
  if (phase==="arrived"){
    return (
      <div style={{ padding:"14px", display:"flex", flexDirection:"column", gap:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:20, height:20, borderRadius:"50%", background:"var(--st-new-tint)", color:"var(--st-new)" }}><Icon name="check" size={13} strokeWidth={2.6} /></span>
          <span style={{ fontSize:"var(--fs-body)", fontWeight:600, color:"var(--text-1)" }}>Agent applied your feedback</span>
        </div>
        <div style={{ fontFamily:"var(--font-mono)", fontSize:"var(--fs-micro)", letterSpacing:"var(--ls-caps)", color:"var(--text-3)", textTransform:"uppercase" }}>This round · 3 changes</div>
        <div style={{ display:"flex", flexDirection:"column" }}>
          {agentReply.map((t,i)=>(
            <div key={i} style={{ display:"flex", gap:8, padding:"9px 0", borderTop:"1px solid var(--border)", fontSize:"var(--fs-small)", color:"var(--text-2)", lineHeight:1.45 }}>
              <Icon name="check" size={13} strokeWidth={2.4} style={{ color:"var(--st-new)", marginTop:1, flex:"none" }} />
              <span>{t}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize:"var(--fs-small)", color:"var(--text-3)", lineHeight:1.5 }}>Review the highlighted nodes on the canvas, then start another round of feedback.</div>
      </div>
    );
  }
  if (!changes.length){
    return (
      <div style={{ padding:"28px 20px", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
        <span style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:34, height:34, borderRadius:"var(--r-md)", background:"var(--surface-sunken)", border:"1px solid var(--border)", color:"var(--text-3)" }}><Icon name="edit" size={16} /></span>
        <div style={{ fontSize:"var(--fs-body)", fontWeight:600, color:"var(--text-1)" }}>No pending edits</div>
        <div style={{ fontSize:"var(--fs-small)", color:"var(--text-3)", lineHeight:1.5, maxWidth:220 }}>Comment on a node, reconnect an edge, or delete a component. Your edits collect here before you send them to the agent.</div>
      </div>
    );
  }
  return (
    <div style={{ padding:"6px 14px 14px" }}>
      {TYPE_ORDER.map(type=>{
        const items = changes.filter(c=>c.type===type);
        if (!items.length) return null;
        const m = TYPE_META[type];
        return (
          <div key={type} style={{ marginTop:14 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <Icon name={m.icon} size={12} style={{ color:"var(--text-3)" }} />
              <span style={{ fontFamily:"var(--font-mono)", fontSize:"var(--fs-micro)", letterSpacing:"var(--ls-caps)", color:"var(--text-3)", textTransform:"uppercase" }}>{m.label}</span>
              <span style={{ fontFamily:"var(--font-mono)", fontSize:"var(--fs-micro)", color:"var(--text-3)" }}>{items.length}</span>
            </div>
            {items.map(ch=><ChangeRow key={ch.id} ch={ch} onRemove={()=>onRemove(ch.id)} />)}
          </div>
        );
      })}
    </div>
  );
}

function MentionBox({ node }){
  const [draft, setDraft] = React.useState("");
  const [mention, setMention] = React.useState(null); // {query}
  const ref = React.useRef(null);
  const names = D.NODES.filter(n=>n.id!==node.id).map(n=>n.title);

  React.useEffect(()=>{ setDraft(""); setMention(null); }, [node.id]);

  const onChange = (e)=>{
    const v = e.target.value; setDraft(v);
    const m = /@([\w]*)$/.exec(v.slice(0, e.target.selectionStart));
    setMention(m ? { query:m[1] } : null);
  };
  const pick = (name)=>{
    setDraft(d=>d.replace(/@[\w]*$/, "@"+name+" ")); setMention(null);
    if (ref.current) ref.current.focus();
  };
  const filtered = mention ? names.filter(n=>n.toLowerCase().includes(mention.query.toLowerCase())) : [];

  return (
    <div style={{ position:"relative", display:"flex", flexDirection:"column", gap:8 }}>
      <textarea ref={ref} value={draft} onChange={onChange} rows={3}
        placeholder="Add feedback for the agent…  use @ to mention another node"
        onKeyDown={(e)=>{ if(e.key==="Escape") setMention(null); }}
        style={{ resize:"none", width:"100%", boxSizing:"border-box", padding:"9px 10px",
          background:"var(--surface-sunken)", color:"var(--text-1)",
          border:"1px solid var(--border-strong)", borderRadius:"var(--r-sm)",
          fontFamily:"var(--font-sans)", fontSize:"var(--fs-small)", lineHeight:1.5, outline:"none" }} />
      {mention && filtered.length>0 && (
        <div style={{ position:"absolute", bottom:"calc(100% + 4px)", left:0, right:0, zIndex:5,
          background:"var(--surface-1)", border:"1px solid var(--border-strong)", borderRadius:"var(--r-md)",
          boxShadow:"var(--sh-pop)", padding:4, maxHeight:150, overflowY:"auto" }}>
          <div style={{ padding:"3px 8px", fontFamily:"var(--font-mono)", fontSize:"var(--fs-micro)", letterSpacing:"var(--ls-caps)", color:"var(--text-3)" }}>MENTION A NODE</div>
          {filtered.map(name=>{
            const nd = D.NODES.find(n=>n.title===name);
            return (
              <button key={name} onClick={()=>pick(name)} style={{ display:"flex", alignItems:"center", gap:8, width:"100%", textAlign:"left", padding:"6px 8px", background:"transparent", border:0, borderRadius:"var(--r-sm)", cursor:"pointer", color:"var(--text-1)" }}
                onMouseEnter={e=>e.currentTarget.style.background="var(--surface-2)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <KindIcon kind={nd.kind} size="sm" />
                <span style={{ fontSize:"var(--fs-small)" }}>{name}</span>
              </button>
            );
          })}
        </div>
      )}
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontFamily:"var(--font-mono)", fontSize:"var(--fs-micro)", color:"var(--text-3)" }}>⌘↵ to send</span>
        <Button size="sm" variant="secondary" iconLeft="comment" style={{ marginLeft:"auto" }} disabled={!draft.trim()}>Add comment</Button>
      </div>
    </div>
  );
}

function Field({ label, children }){
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
      <span style={{ fontFamily:"var(--font-mono)", fontSize:"var(--fs-micro)", letterSpacing:"var(--ls-caps)", color:"var(--text-3)", textTransform:"uppercase" }}>{label}</span>
      {children}
    </div>
  );
}

function InspectorView({ node }){
  return (
    <div style={{ display:"flex", flexDirection:"column" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px" }}>
        <KindIcon kind={node.kind} size="lg" />
        <div style={{ minWidth:0, flex:1 }}>
          <div style={{ fontSize:"var(--fs-h2)", fontWeight:600, color:"var(--text-1)", letterSpacing:"-0.01em", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{node.title}</div>
          <div style={{ fontFamily:"var(--font-mono)", fontSize:"var(--fs-mono)", color:"var(--text-mono)" }}>{node.path}</div>
        </div>
      </div>

      <div style={{ padding:"0 14px 14px", display:"flex", flexDirection:"column", gap:14, borderBottom:"1px solid var(--border)" }}>
        <div style={{ display:"flex", gap:28 }}>
          <Field label="Kind"><span style={{ fontSize:"var(--fs-small)", color:"var(--text-1)", textTransform:"capitalize" }}>{node.kind}</span></Field>
          <Field label="Status"><StatusBadge status={node.status} /></Field>
        </div>
        <Field label="Description"><p style={{ margin:0, fontSize:"var(--fs-small)", color:"var(--text-1)", lineHeight:1.55 }}>{node.desc}</p></Field>
      </div>

      <div style={{ padding:"14px", borderBottom:"1px solid var(--border)", display:"flex", flexDirection:"column", gap:8 }}>
        <span style={{ fontFamily:"var(--font-mono)", fontSize:"var(--fs-micro)", letterSpacing:"var(--ls-caps)", color:"var(--text-3)", textTransform:"uppercase" }}>Files · {node.files.length}</span>
        <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
          {node.files.map(f=>(
            <div key={f} style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 8px", background:"var(--surface-sunken)", border:"1px solid var(--border)", borderRadius:"var(--r-sm)" }}>
              <Icon name="edit" size={11} style={{ color:"var(--text-3)", flex:"none" }} />
              <span style={{ fontFamily:"var(--font-mono)", fontSize:"var(--fs-mono)", color:"var(--text-1)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:"14px", display:"flex", flexDirection:"column", gap:10 }}>
        <span style={{ fontFamily:"var(--font-mono)", fontSize:"var(--fs-micro)", letterSpacing:"var(--ls-caps)", color:"var(--text-3)", textTransform:"uppercase" }}>Feedback to agent</span>
        <MentionBox node={node} />
      </div>
    </div>
  );
}

function Panel({ tab, setTab, changes, onRemove, node, phase, agentReply, onSend, onApprove, onCancel }){
  const count = changes.length;
  const canSend = count>0 && phase!=="working" && phase!=="arrived";
  return (
    <aside style={{ width:320, flex:"none", display:"flex", flexDirection:"column", background:"var(--surface-1)", borderLeft:"1px solid var(--border)", minHeight:0 }}>
      <TabBar tab={tab} setTab={setTab} count={count} hasNode={!!node} />

      <div style={{ flex:1, overflowY:"auto", minHeight:0 }}>
        {tab==="changes"
          ? <ChangesView changes={changes} onRemove={onRemove} phase={phase} agentReply={agentReply} />
          : (node ? <InspectorView node={node} /> :
              <div style={{ padding:"28px 20px", textAlign:"center", color:"var(--text-3)", fontSize:"var(--fs-small)", lineHeight:1.5 }}>Select a node on the canvas to inspect it.</div>)}
      </div>

      {/* footer — Send is always one click away, on both tabs */}
      <div style={{ flex:"none", padding:12, borderTop:"1px solid var(--border)", display:"flex", flexDirection:"column", gap:8, background:"var(--surface-1)" }}>
        <Button variant="primary" size="md" iconLeft="send" disabled={!canSend} onClick={onSend} style={{ width:"100%" }}>
          {phase==="arrived" ? "Feedback sent" : `Send ${count} change${count===1?"":"s"}`}
        </Button>
        <div style={{ display:"flex", gap:8 }}>
          <Button variant="secondary" size="sm" iconLeft="check" onClick={onApprove} style={{ flex:1 }}>Approve plan</Button>
          <Button variant="ghost" size="sm" onClick={onCancel} style={{ flex:1 }}>Cancel</Button>
        </div>
      </div>
    </aside>
  );
}

window.AXPanel = Panel;
})();
