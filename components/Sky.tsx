"use client";

// 은은하게 번지는 오로라 배경. 섹션마다 빛의 색이 천천히 바뀝니다.
export const SKY_THEMES: Record<string, [string, string, string]> = {
  landing: ["#e9defc", "#ffe1ea", "#dde8ff"],
  s1: ["#e6dcff", "#ffe3ec", "#e2ecff"],
  s2: ["#dbe8ff", "#ffe8dc", "#e9e0ff"],
  s3: ["#d4ebff", "#e6e1ff", "#fff0e2"],
  s4: ["#e3dbff", "#ffe2d6", "#f2e4ff"],
  s5: ["#e8dcff", "#ffe0d8", "#e4ebff"],
  s6: ["#ffddd2", "#ecdcff", "#dde4ff"],
  s7: ["#dcd6ff", "#ffdce8", "#ffeede"],
  s8: ["#cfd3f7", "#e3d8ff", "#ffe2ee"],
  result: ["#eadcff", "#ffdfe9", "#fff0e0"],
};

export default function Sky({ theme = "landing" }: { theme?: string }) {
  const [a, b, c] = SKY_THEMES[theme] ?? SKY_THEMES.landing;
  return (
    <div className="sky" style={{ ["--sky-a" as string]: a, ["--sky-b" as string]: b, ["--sky-c" as string]: c }} aria-hidden>
      <span className="aura a1" />
      <span className="aura a2" />
      <span className="aura a3" />
    </div>
  );
}
