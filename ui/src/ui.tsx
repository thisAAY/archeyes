// Small presentational primitives ported from the _ds prototype, styled against
// the token variables. Icons come from lucide-react (MIT), same family the design
// used for node kinds.
import type { ReactNode, CSSProperties } from "react";
import { iconFor, pillClass, STATUS_GLYPH, STATUS_LABEL } from "./diff.ts";
import type { Status } from "./protocol.ts";

// The ArchEyes brand mark: an eye whose pupil is a node/box, with two side rays.
// Extracted verbatim from the Claude Design system (proto/Header.jsx). Uses
// currentColor so it inherits the logo chip's accent.
export function ArchEyesLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" style={{ flex: "none" }}>
      <path d="M1 16 H5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity=".55" />
      <path d="M26.5 16 H31" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity=".55" />
      <path d="M4 16 Q16 5 28 16 Q16 27 4 16 Z" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <rect x="11" y="11" width="10" height="10" rx="2.2" fill="currentColor" />
    </svg>
  );
}

export function KindIcon({ kind, size = "md" }: { kind: string; size?: "sm" | "md" | "lg" }) {
  const Icon = iconFor(kind);
  const box = size === "lg" ? 34 : size === "sm" ? 20 : 26;
  const px = size === "lg" ? 18 : size === "sm" ? 12 : 15;
  return (
    <span
      className="ax-kind-chip"
      style={{ width: box, height: box, borderRadius: "var(--r-sm)" }}
    >
      <Icon size={px} strokeWidth={1.9} />
    </span>
  );
}

export function StatusPill({ status }: { status: Status }) {
  const glyph = STATUS_GLYPH[status];
  return (
    <span className={pillClass(status)}>
      {glyph && <span aria-hidden>{glyph}</span>}
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Button({
  children,
  variant = "secondary",
  size = "md",
  disabled,
  onClick,
  style,
  title,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
  disabled?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
  title?: string;
}) {
  return (
    <button
      className={`ax-btn ${variant} ${size}`}
      disabled={disabled}
      onClick={onClick}
      title={title}
      style={style}
    >
      {children}
    </button>
  );
}
