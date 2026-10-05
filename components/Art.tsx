"use client";

import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";

/* ───────────────────────── Orb ─────────────────────────
   숨 쉬듯 천천히 커졌다 작아지며 빛이 퍼져나가는 구체.
   level(0~1)에 따라 크기와 빛의 세기가 달라집니다. */
export function Orb({
  size = 160,
  colors = ["#c9b8ff", "#ffc6d9"],
  level = 0.5,
  rings = true,
  pulseKey,
  className,
  style,
}: {
  size?: number;
  colors?: [string, string];
  level?: number;
  rings?: boolean;
  pulseKey?: string | number;
  className?: string;
  style?: CSSProperties;
}) {
  const scale = 0.82 + level * 0.3;
  return (
    <div
      className={`orb ${className ?? ""}`}
      style={{
        ["--size" as string]: `${size}px`,
        ["--c1" as string]: colors[0],
        ["--c2" as string]: colors[1],
        ["--glow" as string]: 0.35 + level * 0.5,
        ...style,
      }}
      aria-hidden
    >
      {rings && (
        <>
          <span className="ring" />
          <span className="ring r2" />
          <span className="ring r3" />
        </>
      )}
      <span className="core-wrap" style={{ transform: `scale(${scale})` }}>
        <span key={pulseKey} className={`core ${pulseKey !== undefined ? "pulse" : ""}`} />
      </span>
    </div>
  );
}

/* ───────────────────────── 5단계 점 슬라이더 ─────────────────────────
   탭하거나 드래그해서 고르는 가로 점 슬라이더. 손을 떼면 onCommit. */
export function ScaleDots({
  value,
  labels,
  tone = "calm",
  onChange,
  onCommit,
  ariaLabel,
}: {
  value: number | undefined; // 0~4
  labels: string[];
  tone?: "calm" | "severity";
  onChange: (i: number) => void;
  onCommit: (i: number) => void;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState(false);
  const last = useRef<number | undefined>(value);

  const idxAt = (clientX: number) => {
    const r = ref.current!.getBoundingClientRect();
    const t = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    return Math.round(t * 4);
  };
  const set = (i: number) => {
    if (i !== last.current) {
      last.current = i;
      try { navigator.vibrate?.(6); } catch { /* 미지원 */ }
      onChange(i);
    }
  };
  const down = (e: PointerEvent<HTMLDivElement>) => {
    ref.current?.setPointerCapture(e.pointerId);
    setDrag(true);
    set(idxAt(e.clientX));
  };
  const move = (e: PointerEvent<HTMLDivElement>) => { if (drag) set(idxAt(e.clientX)); };
  const up = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    setDrag(false);
    const i = idxAt(e.clientX);
    set(i);
    onCommit(i);
  };
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    const cur = value ?? 2;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); set(Math.min(4, cur + (value === undefined ? 0 : 1))); }
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); set(Math.max(0, cur - (value === undefined ? 0 : 1))); }
    else if ((e.key === "Enter" || e.key === " ") && value !== undefined) { e.preventDefault(); onCommit(value); }
  };

  const pos = value === undefined ? 0 : value * 25;
  return (
    <div className={`scale ${tone} ${value === undefined ? "empty" : ""} ${drag ? "dragging" : ""}`}>
      <div className="scale-now" aria-live="polite">{value === undefined ? " " : labels[value]}</div>
      <div
        ref={ref}
        className="scale-track"
        role="slider"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-valuemin={1}
        aria-valuemax={5}
        aria-valuenow={value === undefined ? undefined : value + 1}
        aria-valuetext={value === undefined ? "선택 안 함" : labels[value]}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={() => setDrag(false)}
        onKeyDown={key}
      >
        <span className="line" />
        <span className="line-fill" style={{ width: `${pos}%` }} />
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className={`dot ${value !== undefined && i <= value ? "past" : ""} ${value === i ? "cur" : ""}`}
            style={{ left: `${i * 25}%`, ["--i" as string]: i }} />
        ))}
        {value !== undefined && (
          <span className="thumb" style={{ left: `${pos}%` }}>
            <span className="halo" />
          </span>
        )}
      </div>
      <div className="scale-ends">
        <span>{labels[0]}</span>
        <span>{labels[4]}</span>
      </div>
    </div>
  );
}

/* ───────────────────────── 날씨 아이콘 (결과·관리자) ───────────────────────── */

const CLOUD_PATH =
  "M30 70 C14 70 6 60 8 49 C10 38 20 33 29 35 C30 21 42 11 56 12 C68 13 76 21 79 30 C88 24 102 27 106 38 C116 39 118 50 114 58 C110 66 102 70 94 70 Z";

export function WeatherIcon({ kind, size = 44 }: { kind: "sunny" | "partly" | "cloudy" | "overcast" | "rain"; size?: number }) {
  const sun = (cx: number, cy: number, r: number) => (
    <g>
      <circle cx={cx} cy={cy} r={r + 5} fill="#ffe3a3" opacity=".45" />
      <circle cx={cx} cy={cy} r={r} fill="#ffd27a" />
    </g>
  );
  const cloud = (x: number, y: number, s: number, fill: string) => (
    <path d={CLOUD_PATH} fill={fill} transform={`translate(${x} ${y}) scale(${s})`} />
  );
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      {kind === "sunny" && sun(24, 24, 10)}
      {kind === "partly" && (<>{sun(18, 18, 8)}{cloud(10, 18, 0.3, "#e4e2f5")}</>)}
      {kind === "cloudy" && (<>{cloud(2, 8, 0.28, "#d9d6ef")}{cloud(10, 16, 0.3, "#ebe9f8")}</>)}
      {kind === "overcast" && (<>{cloud(2, 6, 0.3, "#b3aed6")}{cloud(8, 16, 0.32, "#cdc9e8")}</>)}
      {kind === "rain" && (
        <>
          {cloud(4, 4, 0.34, "#a39dcc")}
          {[14, 22, 30].map((x, i) => (
            <line key={i} x1={x} y1={34} x2={x - 3} y2={42} stroke="#9fb0ff" strokeWidth="2.5" strokeLinecap="round" />
          ))}
        </>
      )}
    </svg>
  );
}
