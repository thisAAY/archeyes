/* @ds-bundle: {"format":4,"namespace":"ArchEyesDesignSystem_eaa862","components":[{"name":"Button","sourcePath":"components/controls/Button.jsx"},{"name":"IconButton","sourcePath":"components/controls/IconButton.jsx"},{"name":"Toolbar","sourcePath":"components/controls/Toolbar.jsx"},{"name":"ToolbarSeparator","sourcePath":"components/controls/Toolbar.jsx"},{"name":"CommentPin","sourcePath":"components/diagram/CommentPin.jsx"},{"name":"Edge","sourcePath":"components/diagram/Edge.jsx"},{"name":"GroupLayer","sourcePath":"components/diagram/GroupLayer.jsx"},{"name":"KindIcon","sourcePath":"components/diagram/KindIcon.jsx"},{"name":"KIND_META","sourcePath":"components/diagram/KindIcon.jsx"},{"name":"Legend","sourcePath":"components/diagram/Legend.jsx"},{"name":"Node","sourcePath":"components/diagram/Node.jsx"},{"name":"StatusBadge","sourcePath":"components/diagram/StatusBadge.jsx"},{"name":"STATUS_META","sourcePath":"components/diagram/StatusBadge.jsx"},{"name":"Icon","sourcePath":"components/icons/Icon.jsx"},{"name":"ICON_NAMES","sourcePath":"components/icons/Icon.jsx"}],"sourceHashes":{"components/controls/Button.jsx":"0073a0d22968","components/controls/IconButton.jsx":"099b5abd351d","components/controls/Toolbar.jsx":"d8657d25f45a","components/diagram/CommentPin.jsx":"d89e3d644592","components/diagram/Edge.jsx":"1bc03e870fd4","components/diagram/GroupLayer.jsx":"95b2b039b802","components/diagram/KindIcon.jsx":"53e8b6b74f75","components/diagram/Legend.jsx":"86fa8415e092","components/diagram/Node.jsx":"bc8e1e5ca66f","components/diagram/StatusBadge.jsx":"6ceefb92c276","components/icons/Icon.jsx":"890a81edb225","ui_kits/canvas/App.jsx":"9de703e89a67","ui_kits/canvas/CanvasBoard.jsx":"d9570be7e530","ui_kits/canvas/Inspector.jsx":"0aa961b0d71a","ui_kits/canvas/TopBar.jsx":"1a5ad3b76d53"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.ArchEyesDesignSystem_eaa862 = window.ArchEyesDesignSystem_eaa862 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/controls/Toolbar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Floating command bar for the canvas. Groups IconButtons with thin
   separators. Horizontal by default; vertical for zoom stacks. */
function Toolbar({
  orientation = "horizontal",
  style = {},
  children,
  ...rest
}) {
  const row = orientation === "horizontal";
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "toolbar",
    "aria-orientation": orientation,
    style: {
      display: "inline-flex",
      flexDirection: row ? "row" : "column",
      alignItems: "center",
      gap: 2,
      padding: 5,
      background: "var(--surface-1)",
      border: "1px solid var(--border-strong)",
      borderRadius: "var(--r-lg)",
      boxShadow: "var(--sh-raise)",
      ...style
    }
  }, rest), children);
}
function ToolbarSeparator({
  orientation = "horizontal",
  style = {}
}) {
  const row = orientation === "horizontal";
  return /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      background: "var(--border-strong)",
      flex: "none",
      width: row ? 1 : 18,
      height: row ? 18 : 1,
      margin: row ? "0 4px" : "4px 0",
      ...style
    }
  });
}
Object.assign(__ds_scope, { Toolbar, ToolbarSeparator });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/controls/Toolbar.jsx", error: String((e && e.message) || e) }); }

// components/diagram/Edge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Edge between two node ports. Diff status uses stroke STYLE
   (solid / dashed / dotted) as the colorblind-safe signal, color
   reinforcing. Render INSIDE an <svg> (it returns a <g>). */
const STROKE = {
  existing: {
    color: "var(--st-existing)",
    width: 1.5,
    dash: undefined,
    opacity: 1
  },
  new: {
    color: "var(--st-new-line)",
    width: 2,
    dash: undefined,
    opacity: 1
  },
  modified: {
    color: "var(--st-modified-line)",
    width: 1.5,
    dash: "5 3",
    opacity: 1
  },
  deleted: {
    color: "var(--st-deleted-line)",
    width: 1.5,
    dash: "2 4",
    opacity: 0.5
  }
};
let _uid = 0;
function Edge({
  from,
  to,
  status = "existing",
  selected = false,
  curved = true,
  label,
  id,
  ...rest
}) {
  const s = STROKE[status] || STROKE.existing;
  const color = selected ? "var(--accent)" : s.color;
  const width = selected ? s.width + 0.75 : s.width;
  const mid = React.useMemo(() => `axedge-${id || ++_uid}`, [id]);
  const {
      x: x1,
      y: y1
    } = from,
    {
      x: x2,
      y: y2
    } = to;
  const dx = Math.abs(x2 - x1) * 0.5;
  const d = curved ? `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}` : `M ${x1} ${y1} L ${x2} ${y2}`;
  return /*#__PURE__*/React.createElement("g", _extends({
    opacity: s.opacity
  }, rest), /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("marker", {
    id: mid,
    markerWidth: "9",
    markerHeight: "9",
    refX: "6.5",
    refY: "3.5",
    orient: "auto"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M0,0 L7,3.5 L0,7 Z",
    fill: color
  }))), /*#__PURE__*/React.createElement("path", {
    d: d,
    fill: "none",
    stroke: color,
    strokeWidth: width,
    strokeDasharray: s.dash,
    strokeLinecap: "round",
    markerEnd: `url(#${mid})`
  }), label && /*#__PURE__*/React.createElement("text", {
    x: (x1 + x2) / 2,
    y: (y1 + y2) / 2 - 6,
    textAnchor: "middle",
    fontFamily: "var(--font-mono)",
    fontSize: "9",
    fill: "var(--text-3)"
  }, label));
}
Object.assign(__ds_scope, { Edge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/diagram/Edge.jsx", error: String((e && e.message) || e) }); }

// components/diagram/Legend.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Diff-status legend — restates the non-color treatments so a first-time
   viewer learns the border-style language. */
const ITEMS = [{
  status: "existing",
  label: "Existing",
  border: "1px solid var(--border-strong)",
  glyph: ""
}, {
  status: "new",
  label: "New",
  border: "2px solid var(--st-new-line)",
  glyph: "+"
}, {
  status: "modified",
  label: "Modified",
  border: "1.5px dashed var(--st-modified-line)",
  glyph: "~"
}, {
  status: "deleted",
  label: "Deleted",
  border: "1.5px dotted var(--st-deleted-line)",
  glyph: "\u2212",
  dim: true
}];
function Legend({
  orientation = "horizontal",
  style = {},
  ...rest
}) {
  const row = orientation === "horizontal";
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "list",
    "aria-label": "Diff status legend",
    style: {
      display: "flex",
      flexDirection: row ? "row" : "column",
      gap: row ? 14 : 8,
      alignItems: row ? "center" : "flex-start",
      fontFamily: "var(--font-mono)",
      fontSize: "var(--fs-micro)",
      color: "var(--text-2)",
      ...style
    }
  }, rest), ITEMS.map(it => /*#__PURE__*/React.createElement("span", {
    key: it.status,
    role: "listitem",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: 12,
      height: 12,
      borderRadius: 2,
      border: it.border,
      opacity: it.dim ? 0.6 : 1,
      flex: "none"
    }
  }), it.label, it.glyph ? /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      color: "var(--text-3)"
    }
  }, " ", it.glyph) : null)));
}
Object.assign(__ds_scope, { Legend });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/diagram/Legend.jsx", error: String((e && e.message) || e) }); }

// components/icons/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* ArchEyes icon set — a curated subset of Lucide (ISC licensed),
   inlined so components stay self-contained (no runtime CDN dep).
   Outline style, 2px stroke, 24px grid — the brand's icon language. */
const P = {
  // node kinds
  service: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m3.3 7 8.7 5 8.7-5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 22V12"
  })),
  repository: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("line", {
    x1: "6",
    y1: "3",
    x2: "6",
    y2: "15"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "18",
    cy: "6",
    r: "3"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "6",
    cy: "18",
    r: "3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M18 9a9 9 0 0 1-9 9"
  })),
  datastore: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("ellipse", {
    cx: "12",
    cy: "5",
    rx: "9",
    ry: "3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 5v14a9 3 0 0 0 18 0V5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 12a9 3 0 0 0 18 0"
  })),
  adapter: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M12 22v-5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M9 8V2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M15 8V2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"
  })),
  // group / layer
  layers: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"
  })),
  server: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    width: "20",
    height: "8",
    x: "2",
    y: "2",
    rx: "2"
  }), /*#__PURE__*/React.createElement("rect", {
    width: "20",
    height: "8",
    x: "2",
    y: "14",
    rx: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M6 6h.01"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M6 18h.01"
  })),
  // toolbar / actions
  cursor: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z"
  })),
  hand: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"
  })),
  plus: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M5 12h14"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 5v14"
  })),
  minus: /*#__PURE__*/React.createElement("path", {
    d: "M5 12h14"
  }),
  comment: /*#__PURE__*/React.createElement("path", {
    d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
  }),
  fit: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M8 3H5a2 2 0 0 0-2 2v3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M21 8V5a2 2 0 0 0-2-2h-3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 16v3a2 2 0 0 0 2 2h3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16 21h3a2 2 0 0 0 2-2v-3"
  })),
  zoomIn: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "11",
    r: "8"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "21",
    y1: "21",
    x2: "16.65",
    y2: "16.65"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "11",
    y1: "8",
    x2: "11",
    y2: "14"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "8",
    y1: "11",
    x2: "14",
    y2: "11"
  })),
  zoomOut: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "11",
    r: "8"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "21",
    y1: "21",
    x2: "16.65",
    y2: "16.65"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "8",
    y1: "11",
    x2: "14",
    y2: "11"
  })),
  undo: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M3 7v6h6"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"
  })),
  redo: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M21 7v6h-6"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"
  })),
  send: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m21.854 2.147-10.94 10.939"
  })),
  x: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M18 6 6 18"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m6 6 12 12"
  })),
  check: /*#__PURE__*/React.createElement("path", {
    d: "M20 6 9 17l-5-5"
  }),
  chevronDown: /*#__PURE__*/React.createElement("path", {
    d: "m6 9 6 6 6-6"
  }),
  chevronRight: /*#__PURE__*/React.createElement("path", {
    d: "m9 18 6-6-6-6"
  }),
  search: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "11",
    r: "8"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m21 21-4.3-4.3"
  })),
  sun: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 2v2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 20v2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m4.93 4.93 1.41 1.41"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m17.66 17.66 1.41 1.41"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M2 12h2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M20 12h2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m6.34 17.66-1.41 1.41"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m19.07 4.93-1.41 1.41"
  })),
  moon: /*#__PURE__*/React.createElement("path", {
    d: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"
  }),
  edit: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M12 20h9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"
  })),
  trash: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M3 6h18"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
  })),
  gitCompare: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "18",
    cy: "18",
    r: "3"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "6",
    cy: "6",
    r: "3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M13 6h3a2 2 0 0 1 2 2v7"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M11 18H8a2 2 0 0 1-2-2V9"
  })),
  filter: /*#__PURE__*/React.createElement("path", {
    d: "M22 3H2l8 9.46V19l4 2v-8.54z"
  })
};
function Icon({
  name,
  size = 16,
  strokeWidth = 2,
  className = "",
  style = {},
  title,
  ...rest
}) {
  const glyph = P[name];
  if (!glyph) return null;
  return /*#__PURE__*/React.createElement("svg", _extends({
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: className,
    style: {
      display: "block",
      flex: "none",
      ...style
    },
    role: title ? "img" : "presentation",
    "aria-hidden": title ? undefined : true,
    "aria-label": title
  }, rest), title ? /*#__PURE__*/React.createElement("title", null, title) : null, glyph);
}
const ICON_NAMES = Object.keys(P);
Object.assign(__ds_scope, { Icon, ICON_NAMES });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/icons/Icon.jsx", error: String((e && e.message) || e) }); }

// components/controls/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Primary action / general button. `primary` uses the single accent;
   everything else is quiet. Small radii, dense padding — instrument feel. */
const VARIANT = {
  primary: {
    background: "var(--accent)",
    color: "var(--accent-fg)",
    border: "1px solid var(--accent)",
    hoverBg: "var(--accent-hover)",
    hoverBorder: "var(--accent-hover)"
  },
  secondary: {
    background: "var(--surface-1)",
    color: "var(--text-1)",
    border: "1px solid var(--border-strong)",
    hoverBg: "var(--surface-2)",
    hoverBorder: "var(--border-hover)"
  },
  ghost: {
    background: "transparent",
    color: "var(--text-2)",
    border: "1px solid transparent",
    hoverBg: "var(--surface-1)",
    hoverBorder: "transparent"
  },
  danger: {
    background: "transparent",
    color: "var(--st-deleted)",
    border: "1px solid var(--st-deleted-line)",
    hoverBg: "var(--st-deleted-tint)",
    hoverBorder: "var(--st-deleted)"
  }
};
const SIZE = {
  sm: {
    height: 26,
    padding: "0 9px",
    font: "var(--fs-small)",
    gap: 5,
    icon: 13
  },
  md: {
    height: 32,
    padding: "0 12px",
    font: "var(--fs-body)",
    gap: 6,
    icon: 15
  }
};
function Button({
  variant = "secondary",
  size = "md",
  iconLeft,
  iconRight,
  disabled = false,
  style = {},
  children,
  ...rest
}) {
  const v = VARIANT[variant] || VARIANT.secondary;
  const s = SIZE[size] || SIZE.md;
  const [hover, setHover] = React.useState(false);
  const active = hover && !disabled;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    disabled: disabled,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: s.gap,
      height: s.height,
      padding: s.padding,
      fontFamily: "var(--font-sans)",
      fontSize: s.font,
      fontWeight: 500,
      letterSpacing: "var(--ls-tight)",
      background: active ? v.hoverBg : v.background,
      color: v.color,
      border: v.border,
      borderColor: active ? v.hoverBorder : undefined,
      borderRadius: "var(--r-md)",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.45 : 1,
      whiteSpace: "nowrap",
      transition: "var(--t-hover)",
      ...style
    }
  }, rest), iconLeft && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconLeft,
    size: s.icon
  }), children, iconRight && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconRight,
    size: s.icon
  }));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/controls/Button.jsx", error: String((e && e.message) || e) }); }

// components/controls/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Square icon-only button — the atom of the canvas toolbar. `active`
   marks the current tool with the accent. */
const SIZE = {
  sm: 26,
  md: 30,
  lg: 34
};
const GLYPH = {
  sm: 14,
  md: 15,
  lg: 17
};
function IconButton({
  icon,
  label,
  size = "md",
  variant = "ghost",
  active = false,
  disabled = false,
  style = {},
  ...rest
}) {
  const box = SIZE[size] || SIZE.md;
  const [hover, setHover] = React.useState(false);
  const hot = hover && !disabled && !active;
  let bg = "transparent",
    color = "var(--text-2)",
    border = "1px solid transparent";
  if (variant === "primary") {
    bg = "var(--accent)";
    color = "var(--accent-fg)";
    border = "1px solid var(--accent)";
  }
  if (active) {
    bg = "var(--accent)";
    color = "var(--accent-fg)";
    border = "1px solid var(--accent)";
  } else if (hot) {
    bg = "var(--surface-2)";
    color = "var(--text-1)";
  }
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    disabled: disabled,
    title: label,
    "aria-label": label,
    "aria-pressed": active,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: box,
      height: box,
      background: bg,
      color,
      border,
      borderRadius: "var(--r-md)",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.4 : 1,
      transition: "var(--t-hover)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: GLYPH[size] || GLYPH.md
  }));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/controls/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/diagram/CommentPin.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* A comment marker on a node. Uses the single accent — comments and
   selection are the only accent-colored things on the canvas. */
function CommentPin({
  count,
  active = false,
  onClick,
  style = {},
  ...rest
}) {
  const showCount = count != null && count > 0;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    onClick: onClick,
    "aria-label": showCount ? `${count} comment${count === 1 ? "" : "s"}` : "Add comment",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 3,
      height: 20,
      padding: showCount ? "0 6px 0 5px" : "0 5px",
      background: active ? "var(--accent)" : "var(--surface-1)",
      color: active ? "var(--accent-fg)" : "var(--text-2)",
      border: `1px solid ${active ? "var(--accent)" : "var(--border-strong)"}`,
      borderRadius: "var(--r-full)",
      fontFamily: "var(--font-mono)",
      fontSize: "var(--fs-micro)",
      fontWeight: 700,
      cursor: "pointer",
      boxShadow: "var(--sh-node)",
      transition: "var(--t-hover)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "comment",
    size: 11,
    strokeWidth: 2.2
  }), showCount ? count : null);
}
Object.assign(__ds_scope, { CommentPin });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/diagram/CommentPin.jsx", error: String((e && e.message) || e) }); }

// components/diagram/GroupLayer.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* A layer container — nodes read as visually CONTAINED within it via a
   translucent fill + a header tab. `domain` gets a faint accent wash to
   distinguish architectural layers without shouting. */
function GroupLayer({
  label = "Layer",
  icon = "layers",
  variant = "default",
  count,
  style = {},
  headerRight,
  children,
  ...rest
}) {
  const fill = variant === "domain" ? "var(--group-fill-domain)" : "var(--group-fill)";
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: "relative",
      background: fill,
      border: "1px solid var(--border)",
      borderRadius: "var(--r-xl)",
      padding: "34px 16px 16px",
      boxSizing: "border-box",
      fontFamily: "var(--font-sans)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: -1,
      left: -1,
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "4px 12px 5px",
      background: "var(--group-header)",
      border: "1px solid var(--border)",
      borderTopLeftRadius: "var(--r-xl)",
      borderTopRightRadius: "var(--r-lg)",
      borderBottomRightRadius: "var(--r-lg)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 12,
    style: {
      color: "var(--text-2)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-small)",
      fontWeight: 600,
      color: "var(--text-2)",
      letterSpacing: "var(--ls-wide)"
    }
  }, label), count != null && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--fs-micro)",
      color: "var(--text-3)",
      marginLeft: 2
    }
  }, count)), headerRight && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 6,
      right: 10
    }
  }, headerRight), children);
}
Object.assign(__ds_scope, { GroupLayer });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/diagram/GroupLayer.jsx", error: String((e && e.message) || e) }); }

// components/diagram/KindIcon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Kind → glyph + human label. Kind is conveyed by ICON, not color,
   so the four kinds share one neutral chip treatment. */
const KIND = {
  service: {
    icon: "service",
    label: "Service"
  },
  repository: {
    icon: "repository",
    label: "Repository"
  },
  datastore: {
    icon: "datastore",
    label: "Datastore"
  },
  adapter: {
    icon: "adapter",
    label: "Adapter"
  }
};
const SIZE = {
  sm: 18,
  md: 22,
  lg: 26
};
const GLYPH = {
  sm: 12,
  md: 13,
  lg: 15
};
function KindIcon({
  kind = "service",
  size = "md",
  style = {},
  ...rest
}) {
  const meta = KIND[kind] || KIND.service;
  const box = SIZE[size] || SIZE.md;
  return /*#__PURE__*/React.createElement("span", _extends({
    title: meta.label,
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: box,
      height: box,
      flex: "none",
      background: "var(--surface-chip)",
      color: "var(--text-2)",
      borderRadius: "var(--r-sm)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: meta.icon,
    size: GLYPH[size] || GLYPH.md
  }));
}
const KIND_META = KIND;
Object.assign(__ds_scope, { KindIcon, KIND_META });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/diagram/KindIcon.jsx", error: String((e && e.message) || e) }); }

// components/diagram/StatusBadge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Diff status → non-color treatment. The label + glyph carry meaning;
   background color only reinforces. `existing` has no pill by default. */
const STATUS = {
  existing: {
    label: "EXISTING",
    glyph: null,
    cls: "existing"
  },
  new: {
    label: "NEW",
    glyph: "plus",
    cls: "new"
  },
  modified: {
    label: "MODIFIED",
    glyph: null,
    char: "~",
    cls: "modified"
  },
  deleted: {
    label: "DELETED",
    glyph: null,
    char: "\u2212",
    cls: "deleted"
  }
};
const BG = {
  new: "var(--st-new)",
  modified: "var(--st-modified)",
  deleted: "var(--st-deleted-line)",
  existing: "transparent"
};
const FG = {
  new: "var(--st-new-ink)",
  modified: "var(--st-modified-ink)",
  deleted: "var(--st-deleted-ink)",
  existing: "var(--st-existing-ink)"
};
function StatusBadge({
  status = "existing",
  compact = false,
  style = {},
  ...rest
}) {
  const meta = STATUS[status] || STATUS.existing;
  const isExisting = status === "existing";
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 3,
      fontFamily: "var(--font-mono)",
      fontSize: "var(--fs-micro)",
      fontWeight: 700,
      letterSpacing: "var(--ls-wide)",
      lineHeight: 1.5,
      padding: compact ? "0 4px" : "1px 6px",
      borderRadius: "var(--r-full)",
      background: BG[status],
      color: FG[status],
      border: isExisting ? "1px solid var(--border-strong)" : "none",
      whiteSpace: "nowrap",
      ...style
    }
  }, rest), meta.glyph ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: meta.glyph,
    size: 9,
    strokeWidth: 3
  }) : null, meta.char ? /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, meta.char) : null, compact ? null : meta.label);
}
const STATUS_META = STATUS;
Object.assign(__ds_scope, { StatusBadge, STATUS_META });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/diagram/StatusBadge.jsx", error: String((e && e.message) || e) }); }

// components/diagram/Node.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Per-status recipe: border STYLE is the primary (colorblind-safe)
   signal; color reinforces. The header divider echoes the same style. */
const BORDER = {
  existing: {
    width: "var(--bw-1)",
    style: "solid",
    color: "var(--border-strong)"
  },
  new: {
    width: "var(--bw-3)",
    style: "solid",
    color: "var(--st-new-line)"
  },
  modified: {
    width: "var(--bw-2)",
    style: "dashed",
    color: "var(--st-modified-line)"
  },
  deleted: {
    width: "var(--bw-2)",
    style: "dotted",
    color: "var(--st-deleted-line)"
  }
};
const Port = ({
  side
}) => /*#__PURE__*/React.createElement("span", {
  "aria-hidden": "true",
  style: {
    position: "absolute",
    top: "50%",
    [side]: -4,
    transform: "translateY(-50%)",
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "var(--surface-chip)",
    border: "1px solid var(--border-hover)"
  }
});
function Node({
  kind = "service",
  status = "existing",
  title = "Untitled",
  path,
  selected = false,
  ports = false,
  comments = 0,
  hasComment = false,
  width = 168,
  onClick,
  style = {},
  children,
  ...rest
}) {
  const b = BORDER[status] || BORDER.existing;
  const isDeleted = status === "deleted";
  const strike = isDeleted ? {
    textDecoration: "line-through"
  } : undefined;
  const shadow = ["var(--sh-node)", status === "new" ? "var(--sh-new-ring)" : null, selected ? "var(--sh-selected)" : null].filter(Boolean).join(", ");
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    role: "group",
    "aria-label": `${title} — ${status} ${kind}`,
    style: {
      position: "relative",
      width,
      boxSizing: "border-box",
      background: isDeleted ? "var(--surface-sunken)" : "linear-gradient(var(--surface-2), var(--surface-2b))",
      border: `${b.width} ${b.style} ${selected ? "var(--accent)" : b.color}`,
      borderRadius: "var(--r-md)",
      boxShadow: shadow,
      opacity: isDeleted ? 0.55 : 1,
      cursor: onClick ? "pointer" : "default",
      transition: "box-shadow var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out)",
      fontFamily: "var(--font-sans)",
      ...style
    }
  }, rest), status !== "existing" && /*#__PURE__*/React.createElement(__ds_scope.StatusBadge, {
    status: status,
    style: {
      position: "absolute",
      top: -9,
      right: 8,
      zIndex: 2
    }
  }), hasComment && /*#__PURE__*/React.createElement("span", {
    title: `${comments || 1} comment${comments === 1 ? "" : "s"}`,
    style: {
      position: "absolute",
      top: -8,
      left: -8,
      zIndex: 2,
      display: "inline-flex",
      alignItems: "center",
      gap: 2,
      background: "var(--accent)",
      color: "var(--accent-fg)",
      fontFamily: "var(--font-mono)",
      fontSize: "var(--fs-micro)",
      fontWeight: 700,
      padding: "1px 5px",
      borderRadius: "var(--r-full)",
      lineHeight: 1.4
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "comment",
    size: 9,
    strokeWidth: 2.4
  }), comments || 1), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 10px"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.KindIcon, {
    kind: kind,
    size: "md"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-node)",
      fontWeight: 600,
      color: "var(--text-1)",
      letterSpacing: "var(--ls-tight)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      ...strike
    }
  }, title)), (path || children) && /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: `1px ${b.style} var(--border)`
    }
  }), (path || children) && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "6px 10px"
    }
  }, path && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--fs-mono)",
      color: "var(--text-mono)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      ...strike
    }
  }, path), children), ports && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Port, {
    side: "left"
  }), /*#__PURE__*/React.createElement(Port, {
    side: "right"
  })));
}
Object.assign(__ds_scope, { Node });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/diagram/Node.jsx", error: String((e && e.message) || e) }); }

// ui_kits/canvas/App.jsx
try { (() => {
(function () {
  /* global React, TopBar, CanvasBoard, Inspector */
  function App() {
    const [theme, setTheme] = React.useState("dark");
    const [tool, setTool] = React.useState("select");
    const [selected, setSelected] = React.useState("repo");
    React.useEffect(() => {
      document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);
    const counts = React.useMemo(() => {
      const c = {
        new: 0,
        modified: 0,
        deleted: 0,
        existing: 0
      };
      CanvasBoard.NODES.forEach(n => {
        c[n.status]++;
      });
      return c;
    }, []);
    const node = selected ? CanvasBoard.byId[selected] : null;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "var(--bg-app)"
      }
    }, /*#__PURE__*/React.createElement(TopBar, {
      theme: theme,
      onToggleTheme: () => setTheme(t => t === "dark" ? "light" : "dark"),
      counts: counts
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flex: 1,
        minHeight: 0
      }
    }, /*#__PURE__*/React.createElement(CanvasBoard, {
      tool: tool,
      setTool: setTool,
      selected: selected,
      onSelect: setSelected
    }), /*#__PURE__*/React.createElement(Inspector, {
      node: node,
      onClose: () => setSelected(null)
    })));
  }
  window.App = App;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/canvas/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/canvas/CanvasBoard.jsx
try { (() => {
(function () {
  /* global React */
  const {
    Node,
    GroupLayer,
    Edge,
    Toolbar,
    IconButton,
    ToolbarSeparator,
    Legend
  } = window.ArchEyesDesignSystem_eaa862;
  const NODE_W = 160,
    NODE_H = 64;

  // board model — absolute coords in canvas space
  const NODES = [{
    id: "order",
    kind: "service",
    status: "existing",
    title: "OrderService",
    path: "domain/order.ts",
    x: 40,
    y: 92
  }, {
    id: "pricing",
    kind: "service",
    status: "new",
    title: "PricingService",
    path: "domain/pricing.ts",
    x: 320,
    y: 92,
    comments: 1
  }, {
    id: "cart",
    kind: "service",
    status: "existing",
    title: "CartService",
    path: "domain/cart.ts",
    x: 600,
    y: 92
  }, {
    id: "repo",
    kind: "repository",
    status: "modified",
    title: "OrderRepository",
    path: "infra/order.repo.ts",
    x: 40,
    y: 320,
    comments: 2
  }, {
    id: "pg",
    kind: "datastore",
    status: "existing",
    title: "PostgresStore",
    path: "infra/postgres.ts",
    x: 320,
    y: 320
  }, {
    id: "pay",
    kind: "adapter",
    status: "new",
    title: "PaymentAdapter",
    path: "infra/payment.ts",
    x: 600,
    y: 320
  }, {
    id: "legacy",
    kind: "adapter",
    status: "deleted",
    title: "LegacyGateway",
    path: "infra/legacy.gw.ts",
    x: 600,
    y: 430
  }];
  const EDGES = [{
    from: "order",
    fromSide: "bottom",
    to: "repo",
    toSide: "top",
    status: "existing"
  }, {
    from: "order",
    fromSide: "right",
    to: "pricing",
    toSide: "left",
    status: "existing"
  }, {
    from: "pricing",
    fromSide: "bottom",
    to: "pay",
    toSide: "top",
    status: "new"
  }, {
    from: "cart",
    fromSide: "bottom",
    to: "pay",
    toSide: "top",
    status: "existing"
  }, {
    from: "repo",
    fromSide: "right",
    to: "pg",
    toSide: "left",
    status: "existing"
  }, {
    from: "pg",
    fromSide: "bottom",
    to: "legacy",
    toSide: "left",
    status: "deleted"
  }];
  const byId = Object.fromEntries(NODES.map(n => [n.id, n]));
  function port(n, side) {
    const w = n.width || NODE_W,
      h = NODE_H;
    switch (side) {
      case "left":
        return {
          x: n.x,
          y: n.y + h / 2
        };
      case "right":
        return {
          x: n.x + w,
          y: n.y + h / 2
        };
      case "top":
        return {
          x: n.x + w / 2,
          y: n.y
        };
      default:
        return {
          x: n.x + w / 2,
          y: n.y + h
        };
    }
  }
  function CanvasBoard({
    tool,
    setTool,
    selected,
    onSelect
  }) {
    return /*#__PURE__*/React.createElement("div", {
      className: "ax-canvas",
      style: {
        position: "relative",
        flex: 1,
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        top: 12,
        left: 12,
        zIndex: 20
      }
    }, /*#__PURE__*/React.createElement(Toolbar, null, /*#__PURE__*/React.createElement(IconButton, {
      icon: "cursor",
      label: "Select (V)",
      active: tool === "select",
      onClick: () => setTool("select")
    }), /*#__PURE__*/React.createElement(IconButton, {
      icon: "hand",
      label: "Pan (H)",
      active: tool === "pan",
      onClick: () => setTool("pan")
    }), /*#__PURE__*/React.createElement(ToolbarSeparator, null), /*#__PURE__*/React.createElement(IconButton, {
      icon: "plus",
      label: "Add node",
      active: tool === "add",
      onClick: () => setTool("add")
    }), /*#__PURE__*/React.createElement(IconButton, {
      icon: "comment",
      label: "Comment",
      active: tool === "comment",
      onClick: () => setTool("comment")
    }), /*#__PURE__*/React.createElement(ToolbarSeparator, null), /*#__PURE__*/React.createElement(IconButton, {
      icon: "filter",
      label: "Filter by status"
    }), /*#__PURE__*/React.createElement(IconButton, {
      icon: "gitCompare",
      label: "Diff summary"
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        bottom: 14,
        right: 14,
        zIndex: 20
      }
    }, /*#__PURE__*/React.createElement(Toolbar, {
      orientation: "vertical"
    }, /*#__PURE__*/React.createElement(IconButton, {
      icon: "zoomIn",
      label: "Zoom in"
    }), /*#__PURE__*/React.createElement(IconButton, {
      icon: "zoomOut",
      label: "Zoom out"
    }), /*#__PURE__*/React.createElement(ToolbarSeparator, {
      orientation: "vertical"
    }), /*#__PURE__*/React.createElement(IconButton, {
      icon: "fit",
      label: "Fit view"
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        bottom: 16,
        left: 16,
        zIndex: 20,
        background: "color-mix(in srgb, var(--surface-1) 82%, transparent)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-md)",
        padding: "7px 11px",
        backdropFilter: "blur(6px)"
      }
    }, /*#__PURE__*/React.createElement(Legend, null)), /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        left: 40,
        top: 24
      }
    }, /*#__PURE__*/React.createElement(GroupLayer, {
      label: "Domain",
      icon: "layers",
      variant: "domain",
      count: 3,
      style: {
        position: "absolute",
        left: 0,
        top: 44,
        width: 800,
        height: 148
      }
    }), /*#__PURE__*/React.createElement(GroupLayer, {
      label: "Infrastructure",
      icon: "server",
      count: 4,
      style: {
        position: "absolute",
        left: 0,
        top: 272,
        width: 800,
        height: 262
      }
    }), /*#__PURE__*/React.createElement("svg", {
      style: {
        position: "absolute",
        inset: 0,
        width: 820,
        height: 560,
        pointerEvents: "none",
        overflow: "visible"
      }
    }, EDGES.map((e, i) => {
      const sel = selected === e.from || selected === e.to;
      return /*#__PURE__*/React.createElement(Edge, {
        key: i,
        id: String(i),
        from: port(byId[e.from], e.fromSide),
        to: port(byId[e.to], e.toSide),
        status: e.status,
        selected: sel
      });
    })), NODES.map(n => /*#__PURE__*/React.createElement("div", {
      key: n.id,
      style: {
        position: "absolute",
        left: n.x,
        top: n.y
      }
    }, /*#__PURE__*/React.createElement(Node, {
      kind: n.kind,
      status: n.status,
      title: n.title,
      path: n.path,
      width: n.width || NODE_W,
      ports: true,
      selected: selected === n.id,
      hasComment: !!n.comments,
      comments: n.comments,
      onClick: () => onSelect(n.id)
    })))));
  }
  CanvasBoard.NODES = NODES;
  CanvasBoard.byId = byId;
  window.CanvasBoard = CanvasBoard;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/canvas/CanvasBoard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/canvas/Inspector.jsx
try { (() => {
(function () {
  /* global React */
  const {
    Icon,
    KindIcon,
    StatusBadge,
    Button,
    CommentPin
  } = window.ArchEyesDesignSystem_eaa862;
  const SEED = {
    repo: [{
      who: "you",
      ts: "now",
      text: "Keep the existing findByCustomer method — the plan drops it but three call sites still use it."
    }],
    pricing: [{
      who: "agent",
      ts: "2m",
      text: "New service extracted from OrderService. Owns tax + discount rules."
    }]
  };
  function Field({
    label,
    children
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 4
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: "var(--fs-micro)",
        letterSpacing: "var(--ls-caps)",
        color: "var(--text-3)",
        textTransform: "uppercase"
      }
    }, label), children);
  }
  function Inspector({
    node,
    onClose
  }) {
    const [draft, setDraft] = React.useState("");
    const [comments, setComments] = React.useState(SEED[node?.id] || []);
    React.useEffect(() => {
      setComments(SEED[node?.id] || []);
      setDraft("");
    }, [node?.id]);
    if (!node) return null;
    const post = () => {
      if (!draft.trim()) return;
      setComments(c => [...c, {
        who: "you",
        ts: "now",
        text: draft.trim()
      }]);
      setDraft("");
    };
    return /*#__PURE__*/React.createElement("aside", {
      style: {
        width: 316,
        flex: "none",
        display: "flex",
        flexDirection: "column",
        background: "var(--surface-1)",
        borderLeft: "1px solid var(--border)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "12px 14px",
        borderBottom: "1px solid var(--border)"
      }
    }, /*#__PURE__*/React.createElement(KindIcon, {
      kind: node.kind,
      size: "md"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 0,
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: "var(--fs-body)",
        fontWeight: 600,
        color: "var(--text-1)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }
    }, node.title), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: "var(--fs-micro)",
        color: "var(--text-mono)"
      }
    }, node.path)), /*#__PURE__*/React.createElement("button", {
      onClick: onClose,
      "aria-label": "Close",
      style: {
        background: "transparent",
        border: 0,
        color: "var(--text-3)",
        cursor: "pointer",
        padding: 4
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "x",
      size: 15
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "14px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        borderBottom: "1px solid var(--border)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 24
      }
    }, /*#__PURE__*/React.createElement(Field, {
      label: "Kind"
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: "var(--fs-small)",
        color: "var(--text-1)",
        textTransform: "capitalize"
      }
    }, node.kind)), /*#__PURE__*/React.createElement(Field, {
      label: "Status"
    }, /*#__PURE__*/React.createElement(StatusBadge, {
      status: node.status
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "secondary",
      iconLeft: "edit"
    }, "Rename"), /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "danger",
      iconLeft: "trash"
    }, "Delete"))), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "12px 14px 6px",
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: "var(--fs-micro)",
        letterSpacing: "var(--ls-caps)",
        color: "var(--text-3)",
        textTransform: "uppercase"
      }
    }, "Feedback to agent"), /*#__PURE__*/React.createElement(CommentPin, {
      count: comments.length,
      style: {
        marginLeft: "auto"
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        overflowY: "auto",
        padding: "4px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 10
      }
    }, comments.map((c, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 3
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: "var(--fs-micro)",
        fontWeight: 700,
        color: c.who === "you" ? "var(--accent)" : "var(--text-2)",
        textTransform: "uppercase",
        letterSpacing: ".04em"
      }
    }, c.who), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: "var(--fs-micro)",
        color: "var(--text-3)"
      }
    }, c.ts)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: "var(--fs-small)",
        color: "var(--text-1)",
        lineHeight: 1.45
      }
    }, c.text)))), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 12,
        borderTop: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("textarea", {
      value: draft,
      onChange: e => setDraft(e.target.value),
      onKeyDown: e => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) post();
      },
      placeholder: "Add feedback for the agent\u2026",
      rows: 2,
      style: {
        resize: "none",
        width: "100%",
        boxSizing: "border-box",
        padding: "8px 10px",
        background: "var(--surface-sunken)",
        color: "var(--text-1)",
        border: "1px solid var(--border-strong)",
        borderRadius: "var(--r-sm)",
        fontFamily: "var(--font-sans)",
        fontSize: "var(--fs-small)",
        outline: "none"
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: "var(--fs-micro)",
        color: "var(--text-3)"
      }
    }, "\u2318\u21B5 to send"), /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "primary",
      iconLeft: "send",
      style: {
        marginLeft: "auto"
      },
      onClick: post
    }, "Comment"))));
  }
  window.Inspector = Inspector;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/canvas/Inspector.jsx", error: String((e && e.message) || e) }); }

// ui_kits/canvas/TopBar.jsx
try { (() => {
(function () {
  /* global React */
  const {
    Icon,
    Button
  } = window.ArchEyesDesignSystem_eaa862;
  function DiffStat({
    status,
    char,
    count
  }) {
    const styleMap = {
      new: {
        color: "var(--st-new)"
      },
      modified: {
        color: "var(--st-modified)"
      },
      deleted: {
        color: "var(--st-deleted)"
      },
      existing: {
        color: "var(--text-3)"
      }
    };
    return /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontFamily: "var(--font-mono)",
        fontSize: "var(--fs-small)",
        color: "var(--text-2)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 700,
        ...styleMap[status]
      }
    }, char), count);
  }
  function TopBar({
    theme,
    onToggleTheme,
    counts
  }) {
    return /*#__PURE__*/React.createElement("header", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 16,
        height: 48,
        flex: "none",
        padding: "0 14px",
        background: "var(--surface-1)",
        borderBottom: "1px solid var(--border)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 9,
        color: "var(--text-1)"
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "20",
      height: "20",
      viewBox: "0 0 32 32",
      fill: "none",
      "aria-hidden": "true"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M1 16 H5.5",
      stroke: "currentColor",
      strokeWidth: "1.6",
      strokeLinecap: "round",
      opacity: ".55"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M26.5 16 H31",
      stroke: "currentColor",
      strokeWidth: "1.6",
      strokeLinecap: "round",
      opacity: ".55"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M4 16 Q16 5 28 16 Q16 27 4 16 Z",
      stroke: "currentColor",
      strokeWidth: "1.8",
      fill: "none"
    }), /*#__PURE__*/React.createElement("rect", {
      x: "11",
      y: "11",
      width: "10",
      height: "10",
      rx: "2.2",
      fill: "currentColor"
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 600,
        fontSize: "var(--fs-body)",
        letterSpacing: "-0.01em"
      }
    }, "ArchEyes")), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 1,
        height: 20,
        background: "var(--border)"
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "gitCompare",
      size: 13,
      style: {
        color: "var(--text-3)"
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: "var(--fs-mono)",
        color: "var(--text-2)",
        whiteSpace: "nowrap"
      }
    }, "feature/pricing-engine"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: "var(--fs-micro)",
        color: "var(--text-3)",
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        padding: "1px 6px",
        borderRadius: "var(--r-xs)"
      }
    }, "plan #128")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 14,
        marginLeft: 8
      }
    }, /*#__PURE__*/React.createElement(DiffStat, {
      status: "new",
      char: "+",
      count: counts.new
    }), /*#__PURE__*/React.createElement(DiffStat, {
      status: "modified",
      char: "~",
      count: counts.modified
    }), /*#__PURE__*/React.createElement(DiffStat, {
      status: "deleted",
      char: "\u2212",
      count: counts.deleted
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }), /*#__PURE__*/React.createElement("button", {
      onClick: onToggleTheme,
      title: "Toggle theme",
      "aria-label": "Toggle theme",
      style: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 30,
        height: 30,
        background: "transparent",
        color: "var(--text-2)",
        border: "1px solid transparent",
        borderRadius: "var(--r-md)",
        cursor: "pointer"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: theme === "dark" ? "sun" : "moon",
      size: 15
    })), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "sm",
      iconLeft: "undo",
      style: {
        paddingLeft: 8,
        paddingRight: 8
      },
      "aria-label": "Reset"
    }), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "sm",
      iconLeft: "send"
    }, "Send feedback"));
  }
  window.TopBar = TopBar;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/canvas/TopBar.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Toolbar = __ds_scope.Toolbar;

__ds_ns.ToolbarSeparator = __ds_scope.ToolbarSeparator;

__ds_ns.CommentPin = __ds_scope.CommentPin;

__ds_ns.Edge = __ds_scope.Edge;

__ds_ns.GroupLayer = __ds_scope.GroupLayer;

__ds_ns.KindIcon = __ds_scope.KindIcon;

__ds_ns.KIND_META = __ds_scope.KIND_META;

__ds_ns.Legend = __ds_scope.Legend;

__ds_ns.Node = __ds_scope.Node;

__ds_ns.StatusBadge = __ds_scope.StatusBadge;

__ds_ns.STATUS_META = __ds_scope.STATUS_META;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.ICON_NAMES = __ds_scope.ICON_NAMES;

})();

