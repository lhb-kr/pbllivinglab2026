"use client";

import { useMemo } from "react";
import { PlainCloud } from "./Art";

// 섹션마다 하늘 색이 새벽 → 밤으로 천천히 바뀝니다.
export const SKY_THEMES: Record<string, [string, string, string]> = {
  landing: ["#fbe3ec", "#dfe7ff", "#fff4ea"],
  s1: ["#e8e0ff", "#fde2e4", "#fff6ee"],
  s2: ["#d6ebff", "#ffeede", "#fff9f0"],
  s3: ["#c6e3ff", "#e9f4ff", "#fffaf2"],
  s4: ["#e1d8ff", "#ffe6d6", "#fff1f5"],
  s5: ["#ffd0c2", "#f3d6f0", "#e3dcff"],
  s6: ["#d2c9f5", "#ffd6e2", "#ffeede"],
  s7: ["#b4bbeb", "#d9d0ff", "#ffe0ec"],
  result: ["#f9e0f0", "#e2e4ff", "#fff1e3"],
};

export default function Sky({ theme = "landing" }: { theme?: string }) {
  const [a, b, c] = SKY_THEMES[theme] ?? SKY_THEMES.landing;
  const clouds = useMemo(
    () => [
      { top: "8%", size: 150, dur: 95, delay: -20, op: 0.85 },
      { top: "22%", size: 90, dur: 70, delay: -55, op: 0.6 },
      { top: "48%", size: 200, dur: 130, delay: -90, op: 0.55 },
      { top: "68%", size: 120, dur: 85, delay: -10, op: 0.7 },
      { top: "84%", size: 170, dur: 115, delay: -60, op: 0.5 },
    ],
    [],
  );
  const sparkles = useMemo(
    () => Array.from({ length: 14 }, (_, i) => ({ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, delay: `${(i * 0.43) % 3}s` })),
    [],
  );
  return (
    <div className="sky" style={{ ["--sky-a" as string]: a, ["--sky-b" as string]: b, ["--sky-c" as string]: c }} aria-hidden>
      <div className="glow g1" />
      <div className="glow g2" />
      <div className="glow g3" />
      {clouds.map((cl, i) => (
        <div key={i} className="drift" style={{ top: cl.top, animationDuration: `${cl.dur}s`, animationDelay: `${cl.delay}s` }}>
          <PlainCloud size={cl.size} opacity={cl.op} />
        </div>
      ))}
      {sparkles.map((s, i) => (
        <div key={i} className="sparkle" style={{ left: s.left, top: s.top, animationDelay: s.delay }} />
      ))}
    </div>
  );
}
