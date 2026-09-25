import type { CSSProperties } from "react";

// 몽글몽글 구름 실루엣 (viewBox 0 0 120 80)
export const CLOUD_PATH =
  "M30 70 C14 70 6 60 8 49 C10 38 20 33 29 35 C30 21 42 11 56 12 C68 13 76 21 79 30 C88 24 102 27 106 38 C116 39 118 50 114 58 C110 66 102 70 94 70 Z";

type Face = "happy" | "dot" | "sleepy" | "wow";

export function CloudMascot({
  size = 160,
  colors = ["#ffffff", "#f1ecff"],
  face = "happy",
  id,
  style,
  className,
}: {
  size?: number;
  colors?: [string, string];
  face?: Face;
  id: string;
  style?: CSSProperties;
  className?: string;
}) {
  const g = `cm-${id}`;
  return (
    <svg width={size} height={(size * 80) / 120} viewBox="0 0 120 80" style={style} className={className} aria-hidden>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".45" stopColor={colors[1]} />
          <stop offset="1" stopColor={colors[0]} />
        </linearGradient>
      </defs>
      <path d={CLOUD_PATH} fill={`url(#${g})`} stroke="rgba(255,255,255,.9)" strokeWidth="1.2" />
      <ellipse cx="40" cy="30" rx="10" ry="4" fill="#fff" opacity=".7" transform="rotate(-18 40 30)" />
      <g fill="#4a4368" stroke="#4a4368" strokeLinecap="round" strokeWidth="2.2">
        {face === "happy" && (
          <>
            <path d="M47 50 q4 -5 8 0" fill="none" />
            <path d="M67 50 q4 -5 8 0" fill="none" />
          </>
        )}
        {face === "dot" && (
          <>
            <circle cx="51" cy="49" r="2.4" stroke="none" />
            <circle cx="71" cy="49" r="2.4" stroke="none" />
          </>
        )}
        {face === "sleepy" && (
          <>
            <path d="M47 50 q4 3 8 0" fill="none" />
            <path d="M67 50 q4 3 8 0" fill="none" />
          </>
        )}
        {face === "wow" && (
          <>
            <circle cx="51" cy="48" r="3" stroke="none" />
            <circle cx="71" cy="48" r="3" stroke="none" />
            <circle cx="52" cy="47" r="1" fill="#fff" stroke="none" />
            <circle cx="72" cy="47" r="1" fill="#fff" stroke="none" />
          </>
        )}
        {face === "wow" ? (
          <ellipse cx="61" cy="57" rx="2.4" ry="3" stroke="none" />
        ) : (
          <path d="M58 56 q3 3 6 0" fill="none" strokeWidth="1.8" />
        )}
      </g>
      <ellipse cx="42" cy="56" rx="5" ry="3" fill="#ff9fb5" opacity=".55" />
      <ellipse cx="80" cy="56" rx="5" ry="3" fill="#ff9fb5" opacity=".55" />
    </svg>
  );
}

export function PlainCloud({ size = 120, opacity = 1, tint = "#fff" }: { size?: number; opacity?: number; tint?: string }) {
  return (
    <svg width={size} height={(size * 80) / 120} viewBox="0 0 120 80" style={{ opacity }} aria-hidden>
      <path d={CLOUD_PATH} fill={tint} />
    </svg>
  );
}

export function faceFor(code: string): Face {
  if (code.startsWith("OT")) return "happy";
  if (code.startsWith("OS")) return "wow";
  if (code.startsWith("HT")) return "happy";
  return "sleepy";
}

export function WeatherIcon({ kind, size = 44 }: { kind: "sunny" | "partly" | "cloudy" | "overcast" | "rain"; size?: number }) {
  const sun = (cx: number, cy: number, r: number) => (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#ffd36e" />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4;
        return (
          <line key={i} x1={cx + Math.cos(a) * (r + 3)} y1={cy + Math.sin(a) * (r + 3)} x2={cx + Math.cos(a) * (r + 7)} y2={cy + Math.sin(a) * (r + 7)}
            stroke="#ffc94a" strokeWidth="2.5" strokeLinecap="round" />
        );
      })}
    </g>
  );
  const cloud = (x: number, y: number, s: number, fill: string) => (
    <path d={CLOUD_PATH} fill={fill} transform={`translate(${x} ${y}) scale(${s})`} stroke="#aeb3d6" strokeWidth={1.6 / s} />
  );
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      {kind === "sunny" && sun(24, 24, 10)}
      {kind === "partly" && (<>{sun(18, 18, 8)}{cloud(10, 18, 0.3, "#f4f5fd")}</>)}
      {kind === "cloudy" && (<>{cloud(2, 8, 0.28, "#dfe3f5")}{cloud(10, 16, 0.3, "#fff")}</>)}
      {kind === "overcast" && (<>{cloud(2, 6, 0.3, "#b9bedd")}{cloud(8, 16, 0.32, "#d3d7ee")}</>)}
      {kind === "rain" && (
        <>
          {cloud(4, 4, 0.34, "#a9aed3")}
          {[14, 22, 30].map((x, i) => (
            <line key={i} x1={x} y1={34} x2={x - 3} y2={42} stroke="#8fa8ff" strokeWidth="2.5" strokeLinecap="round" />
          ))}
        </>
      )}
    </svg>
  );
}

/** 리커트 척도용 — 점수가 클수록 크고 선명한 구름 */
export function LikertCloud({ level, active }: { level: number; active: boolean }) {
  const size = 36 + level * 7;
  return (
    <svg width={size} height={(size * 80) / 120} viewBox="0 0 120 80" aria-hidden>
      <path
        d={CLOUD_PATH}
        fill={active ? "url(#lk-on)" : "rgba(255,255,255,.85)"}
        stroke={active ? "#fff" : "rgba(180,170,230,.5)"}
        strokeWidth="3"
      />
      <defs>
        <linearGradient id="lk-on" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c7bcff" />
          <stop offset="1" stopColor="#f7b2cc" />
        </linearGradient>
      </defs>
    </svg>
  );
}
