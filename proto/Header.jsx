(function(){
/* global React */
const { Icon, Button, Legend } = window.ArchEyesDesignSystem_eaa862;

const PHASE_CHIP = {
  editing:      { label:"READY",          dot:"var(--text-3)",       ink:"var(--text-2)" },
  working:      { label:"AGENT WORKING",  dot:"var(--accent)",       ink:"var(--text-1)", pulse:true },
  arrived:      { label:"PLAN UPDATED",   dot:"var(--st-new-line)",  ink:"var(--st-new)" },
  disconnected: { label:"OFFLINE",        dot:"var(--st-deleted-line)", ink:"var(--st-deleted)" },
};

function RoundCounter({ round }){
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <span style={{
        display:"inline-flex", alignItems:"center", justifyContent:"center",
        width:24, height:24, borderRadius:"var(--r-full)",
        border:"1px solid var(--border-strong)", background:"var(--surface-2)",
        fontFamily:"var(--font-mono)", fontSize:"var(--fs-small)", fontWeight:700, color:"var(--text-1)",
      }}>{round}</span>
      <span style={{ display:"flex", flexDirection:"column", lineHeight:1.15 }}>
        <span style={{ fontSize:"var(--fs-small)", fontWeight:600, color:"var(--text-1)" }}>Round {round}</span>
        <span style={{ fontFamily:"var(--font-mono)", fontSize:"var(--fs-micro)", color:"var(--text-3)", letterSpacing:"var(--ls-caps)" }}>FEEDBACK LOOP</span>
      </span>
    </div>
  );
}

function StatusChip({ phase }){
  const c = PHASE_CHIP[phase] || PHASE_CHIP.editing;
  return (
    <span className={c.pulse ? "ax-pulse-chip" : ""} style={{
      display:"inline-flex", alignItems:"center", gap:6,
      height:24, padding:"0 9px", borderRadius:"var(--r-full)",
      background:"var(--surface-2)", border:"1px solid var(--border-strong)",
      fontFamily:"var(--font-mono)", fontSize:"var(--fs-micro)", fontWeight:700,
      letterSpacing:"var(--ls-caps)", color:c.ink, whiteSpace:"nowrap",
    }}>
      <span className={c.pulse ? "ax-dot-pulse" : ""} style={{ width:6, height:6, borderRadius:"50%", background:c.dot, flex:"none" }} />
      {c.label}
    </span>
  );
}

function Header({ title, branch, planNo, round, phase, theme, onToggleTheme, legendOpen, onToggleLegend }){
  return (
    <header style={{
      position:"relative", display:"flex", alignItems:"center", gap:16, height:52, flex:"none",
      padding:"0 14px", background:"var(--surface-1)", borderBottom:"1px solid var(--border)", zIndex:60,
    }}>
      {/* brand + plan title (left) */}
      <div style={{ display:"flex", alignItems:"center", gap:10, color:"var(--text-1)", minWidth:0 }}>
        <svg width="20" height="20" viewBox="0 0 32 32" fill="none" aria-hidden="true" style={{ flex:"none" }}>
          <path d="M1 16 H5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity=".55"/>
          <path d="M26.5 16 H31" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity=".55"/>
          <path d="M4 16 Q16 5 28 16 Q16 27 4 16 Z" stroke="currentColor" strokeWidth="1.8" fill="none"/>
          <rect x="11" y="11" width="10" height="10" rx="2.2" fill="currentColor"/>
        </svg>
        <span style={{ width:1, height:22, background:"var(--border)", flex:"none" }} />
        <div style={{ display:"flex", flexDirection:"column", minWidth:0, lineHeight:1.2 }}>
          <span style={{ fontSize:"var(--fs-body)", fontWeight:600, letterSpacing:"-0.01em", color:"var(--text-1)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{title}</span>
          <span style={{ display:"flex", alignItems:"center", gap:7 }}>
            <span style={{ fontFamily:"var(--font-mono)", fontSize:"var(--fs-micro)", color:"var(--text-3)" }}>{branch}</span>
            <span style={{ fontFamily:"var(--font-mono)", fontSize:"var(--fs-micro)", color:"var(--text-3)", background:"var(--surface-2)", border:"1px solid var(--border)", padding:"0 5px", borderRadius:"var(--r-xs)" }}>{planNo}</span>
          </span>
        </div>
      </div>

      {/* round counter + status chip (center) */}
      <div style={{ position:"absolute", left:"50%", transform:"translateX(-50%)", display:"flex", alignItems:"center", gap:14 }}>
        <RoundCounter round={round} />
        <span style={{ width:1, height:22, background:"var(--border)" }} />
        <StatusChip phase={phase} />
      </div>

      <div style={{ flex:1 }} />

      {/* legend + theme (right) */}
      <div style={{ position:"relative" }}>
        <Button variant={legendOpen ? "secondary" : "ghost"} size="sm" iconLeft="gitCompare" onClick={onToggleLegend} aria-expanded={legendOpen}>Diff key</Button>
        {legendOpen && (
          <div style={{
            position:"absolute", top:"calc(100% + 8px)", right:0, zIndex:80,
            background:"var(--surface-1)", border:"1px solid var(--border-strong)",
            borderRadius:"var(--r-xl)", boxShadow:"var(--sh-pop)", padding:"12px 14px", width:250,
          }}>
            <div style={{ fontFamily:"var(--font-mono)", fontSize:"var(--fs-micro)", letterSpacing:"var(--ls-caps)", color:"var(--text-3)", textTransform:"uppercase", marginBottom:10 }}>Diff key — readable without color</div>
            <Legend orientation="vertical" style={{ fontSize:"var(--fs-small)" }} />
            <div style={{ marginTop:10, paddingTop:10, borderTop:"1px solid var(--border)", fontSize:"var(--fs-small)", color:"var(--text-3)", lineHeight:1.5 }}>
              Border <em style={{ color:"var(--text-2)", fontStyle:"normal" }}>style</em> and glyph carry the status; color only reinforces.
            </div>
          </div>
        )}
      </div>
      <button onClick={onToggleTheme} title="Toggle theme" aria-label="Toggle theme" style={{
        display:"inline-flex", alignItems:"center", justifyContent:"center", width:30, height:30,
        background:"transparent", color:"var(--text-2)", border:"1px solid transparent",
        borderRadius:"var(--r-md)", cursor:"pointer",
      }}><Icon name={theme==="dark" ? "sun" : "moon"} size={15} /></button>
    </header>
  );
}

window.AXHeader = Header;
})();
