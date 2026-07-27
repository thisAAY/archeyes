(function(){
/* global React */
const D = window.AXData;
const Header = window.AXHeader, Canvas = window.AXCanvas, Panel = window.AXPanel;
const { Icon, Button } = window.ArchEyesDesignSystem_eaa862;

const SCREENS = [
  { id:"main",         label:"Main" },
  { id:"inspector",    label:"Inspector" },
  { id:"firstrun",     label:"First-run" },
  { id:"working",      label:"Agent working" },
  { id:"arrived",      label:"Changes arrived" },
  { id:"empty",        label:"Empty" },
  { id:"disconnected", label:"Disconnected" },
];

const PRESET = {
  main:         { scenario:"normal",       phase:"editing", tab:"changes",   selected:null,     changes:"init" },
  inspector:    { scenario:"normal",       phase:"editing", tab:"inspector", selected:"order",  changes:"init" },
  firstrun:     { scenario:"firstrun",     phase:"editing", tab:"changes",   selected:null,     changes:"empty" },
  working:      { scenario:"normal",       phase:"working", tab:"changes",   selected:null,     changes:"init" },
  arrived:      { scenario:"normal",       phase:"arrived", tab:"changes",   selected:null,     changes:"empty" },
  empty:        { scenario:"empty",        phase:"editing", tab:"changes",   selected:null,     changes:"empty" },
  disconnected: { scenario:"disconnected", phase:"editing", tab:"changes",   selected:null,     changes:"init" },
};

function Navigator({ screen, onPick }){
  return (
    <div style={{
      position:"fixed", bottom:14, left:"calc((100% - 320px) / 2)", transform:"translateX(-50%)", zIndex:100,
      display:"flex", alignItems:"center", gap:8, padding:"6px 8px 6px 12px",
      background:"var(--surface-1)", border:"1px solid var(--border-strong)",
      borderRadius:"var(--r-full)", boxShadow:"var(--sh-pop)",
    }}>
      <span style={{ fontFamily:"var(--font-mono)", fontSize:"var(--fs-micro)", letterSpacing:"var(--ls-caps)", color:"var(--text-3)", textTransform:"uppercase" }}>Screens</span>
      <span style={{ width:1, height:16, background:"var(--border)" }} />
      <div style={{ display:"flex", gap:2 }}>
        {SCREENS.map((s,i)=>{
          const on = screen===s.id;
          return (
            <button key={s.id} onClick={()=>onPick(s.id)} title={s.label} style={{
              display:"inline-flex", alignItems:"center", gap:6, height:26, padding:"0 10px",
              background: on?"var(--accent)":"transparent", color: on?"var(--accent-fg)":"var(--text-2)",
              border:"1px solid "+(on?"var(--accent)":"transparent"), borderRadius:"var(--r-full)",
              fontFamily:"var(--font-sans)", fontSize:"var(--fs-small)", fontWeight: on?600:500, cursor:"pointer",
              whiteSpace:"nowrap", transition:"var(--t-hover)",
            }}
            onMouseEnter={e=>{ if(!on){e.currentTarget.style.background="var(--surface-2)";e.currentTarget.style.color="var(--text-1)";} }}
            onMouseLeave={e=>{ if(!on){e.currentTarget.style.background="transparent";e.currentTarget.style.color="var(--text-2)";} }}>
              <span style={{ fontFamily:"var(--font-mono)", fontSize:"var(--fs-micro)", opacity: on?0.8:0.6 }}>{i+1}</span>{s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DisconnectedBanner({ onReconnect }){
  return (
    <div style={{ flex:"none", display:"flex", alignItems:"center", gap:11, padding:"9px 16px",
      background:"var(--st-deleted-tint)", borderBottom:"1px solid var(--st-deleted-line)" }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--st-deleted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex:"none" }}>
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <div style={{ flex:1, minWidth:0 }}>
        <span style={{ fontSize:"var(--fs-small)", fontWeight:600, color:"var(--text-1)" }}>Connection to the agent lost.</span>{" "}
        <span style={{ fontSize:"var(--fs-small)", color:"var(--text-2)" }}>Your edits are saved locally. Reconnect by re-running the command in your terminal:</span>{" "}
        <span style={{ fontFamily:"var(--font-mono)", fontSize:"var(--fs-mono)", color:"var(--text-1)", background:"var(--surface-sunken)", border:"1px solid var(--border)", padding:"1px 6px", borderRadius:"var(--r-xs)" }}>claude plan --resume</span>
      </div>
      <Button variant="secondary" size="sm" iconLeft="undo" onClick={onReconnect}>Reconnect</Button>
    </div>
  );
}

function App(){
  const [theme, setTheme] = React.useState("dark");
  const [screen, setScreen] = React.useState("main");
  const [scenario, setScenario] = React.useState("normal");
  const [phase, setPhase] = React.useState("editing");
  const [tab, setTab] = React.useState("changes");
  const [selected, setSelected] = React.useState(null);
  const [tool, setTool] = React.useState("select");
  const [changes, setChanges] = React.useState(D.INITIAL_CHANGES);
  const [legendOpen, setLegendOpen] = React.useState(false);
  const timer = React.useRef(null);

  React.useEffect(()=>{ document.documentElement.setAttribute("data-theme", theme); }, [theme]);
  React.useEffect(()=>()=>clearTimeout(timer.current), []);

  const applyScreen = (id)=>{
    const p = PRESET[id]; if(!p) return;
    clearTimeout(timer.current);
    setScreen(id); setScenario(p.scenario); setPhase(p.phase); setTab(p.tab);
    setSelected(p.selected); setLegendOpen(false);
    setChanges(p.changes==="init" ? D.INITIAL_CHANGES : []);
  };

  const onSelect = (id)=>{ if(scenario==="empty") return; setSelected(id); setTab("inspector"); };
  const onRemove = (id)=> setChanges(cs=>cs.filter(c=>c.id!==id));
  const onAddComment = (nodeTitle, text)=> setChanges(cs=>[...cs, { id:"ch"+Date.now(), type:"comment", node:nodeTitle, text }]);

  const onSend = ()=>{
    setScreen(null); setPhase("working"); setTab("changes"); setSelected(null); setLegendOpen(false);
    clearTimeout(timer.current);
    timer.current = setTimeout(()=>{ setPhase("arrived"); setChanges([]); }, 2200);
  };
  const onDismissArrived = ()=>{ setPhase("editing"); };
  const onApprove = ()=>{ setChanges([]); setPhase("editing"); };
  const onCancel  = ()=>{ setChanges([]); setSelected(null); setTab("changes"); };
  const onReconnect = ()=> applyScreen("main");

  const node = selected ? D.byId[selected] : null;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:"var(--bg-app)", overflow:"hidden" }}>
      <Header title="Split payment flow out of OrderService" branch="feat/split-payment" planNo="plan #128"
        round={3} phase={phase} theme={theme} onToggleTheme={()=>setTheme(t=>t==="dark"?"light":"dark")}
        legendOpen={legendOpen} onToggleLegend={()=>setLegendOpen(o=>!o)} />

      {scenario==="disconnected" && <DisconnectedBanner onReconnect={onReconnect} />}

      <div style={{ display:"flex", flex:1, minHeight:0 }}>
        <Canvas scenario={scenario} phase={phase} tool={tool} setTool={setTool}
          selected={selected} onSelect={onSelect} changes={changes} onDismissArrived={onDismissArrived} onAddComment={onAddComment} />
        <Panel tab={tab} setTab={setTab} changes={changes} onRemove={onRemove} node={node}
          phase={phase} agentReply={D.AGENT_REPLY}
          onSend={onSend} onApprove={onApprove} onCancel={onCancel} />
      </div>

      <Navigator screen={screen} onPick={applyScreen} />
    </div>
  );
}

window.AXApp = App;
})();
