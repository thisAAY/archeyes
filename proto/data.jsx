(function(){
/* Plan: "Split payment flow out of OrderService" — the example from the brief.
   Coordinates are absolute canvas-space; layout below keeps all three edges
   clean (two verticals + one short horizontal + one diagonal deleted). */

const NODE_W = 184, NODE_H = 64;

const NODES = [
  { id:"orderRepo", kind:"repository", status:"existing", title:"OrderRepository",   path:"infra/order.repo.ts",   x:40,  y:150, layer:"domain",
    desc:"Persists and queries orders. Unchanged by this plan — kept as the read/write boundary for the order aggregate.",
    files:["infra/order.repo.ts"] },
  { id:"order", kind:"service", status:"modified", title:"OrderService", path:"domain/order.ts", x:260, y:86, layer:"domain", comments:1,
    desc:"Coordinates the order lifecycle. The plan extracts all payment concerns into a new PaymentService and drops the direct LegacyPayAdapter call.",
    files:["domain/order.ts","domain/order.types.ts","domain/__tests__/order.spec.ts"] },
  { id:"payment", kind:"service", status:"new", title:"PaymentService", path:"domain/payment.ts", x:476, y:86, layer:"domain",
    desc:"New service owning payment capture, refunds and gateway selection — extracted out of OrderService so payment can evolve independently.",
    files:["domain/payment.ts","domain/payment.types.ts"] },
  { id:"paymentRepo", kind:"repository", status:"new", title:"PaymentRepository", path:"infra/payment.repo.ts", x:476, y:206, layer:"domain",
    desc:"New repository persisting payment records and gateway receipts, backed by the shared Postgres store.",
    files:["infra/payment.repo.ts"] },
  { id:"postgres", kind:"datastore", status:"existing", title:"PostgresStore", path:"infra/postgres.ts", x:260, y:352, layer:"infra",
    desc:"Primary relational store. Connection pool shared across repositories; no schema change required by this plan.",
    files:["infra/postgres.ts"] },
  { id:"legacy", kind:"adapter", status:"deleted", title:"LegacyPayAdapter", path:"infra/legacy-pay.ts", x:476, y:352, layer:"infra",
    desc:"Legacy synchronous payment gateway. Removed — PaymentService replaces it with a resilient async adapter.",
    files:["infra/legacy-pay.ts","infra/__tests__/legacy-pay.spec.ts"] },
];

const EDGES = [
  { id:"e1", from:"order",   fromSide:"bottom", to:"postgres",    toSide:"top", status:"existing" },
  { id:"e2", from:"order",   fromSide:"bottom", to:"legacy",      toSide:"top", status:"deleted"  },
  { id:"e3", from:"payment", fromSide:"bottom", to:"paymentRepo", toSide:"top", status:"new"      },
];

// logical board bounds — used for scale-to-fit + the minimap
const BOARD_W = 692, BOARD_H = 446;
const GROUPS = [
  { label:"Domain",         icon:"layers", variant:"domain",  count:4, x:16, y:50,  w:660, h:232 },
  { label:"Infrastructure", icon:"server", variant:"default", count:2, x:16, y:316, w:660, h:118 },
];

// nodes the agent touched this round (for the "changes arrived" highlight)
const ARRIVED_IDS = ["payment","order","paymentRepo"];

const byId = Object.fromEntries(NODES.map(n=>[n.id,n]));

function port(n, side){
  const w = NODE_W, h = NODE_H;
  switch(side){
    case "left":  return { x:n.x,       y:n.y+h/2 };
    case "right": return { x:n.x+w,     y:n.y+h/2 };
    case "top":   return { x:n.x+w/2,   y:n.y };
    default:      return { x:n.x+w/2,   y:n.y+h };
  }
}

// pending developer edits, grouped by type — the Changes tab
const INITIAL_CHANGES = [
  { id:"ch1", type:"comment",    node:"OrderService",
    text:"Keep the existing findByCustomer method — the plan drops it but three call sites still use it." },
  { id:"ch2", type:"reconnect",  from:"OrderService", to:"PaymentService", was:"LegacyPayAdapter",
    text:"Reconnected OrderService → PaymentService" },
  { id:"ch3", type:"delete",     node:"PaymentRepository",
    text:"Delete PaymentRepository — PaymentService can reuse OrderRepository" },
];

// what the agent sends back after Send (screen 5 context)
const AGENT_REPLY = [
  "Restored findByCustomer on OrderRepository and re-pointed 3 call sites.",
  "Rewired OrderService to call PaymentService instead of LegacyPayAdapter.",
  "Kept OrderRepository; PaymentRepository now reuses its query builder.",
];

window.AXData = { NODE_W, NODE_H, NODES, EDGES, GROUPS, BOARD_W, BOARD_H, ARRIVED_IDS, byId, port, INITIAL_CHANGES, AGENT_REPLY };
})();
