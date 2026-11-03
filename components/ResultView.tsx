"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Orb, WeatherIcon } from "./Art";
import {
  AXES, CLOUD_TYPES, MOTIVE_SCALES, axisScores, enjoymentScore, faceWord, motivationScores, weatherFor,
} from "@/lib/cloudTypes";
import type { Answers } from "@/lib/questions";

/** 화면에 들어오면 한 번 true 가 되는 훅 — 스크롤하며 하나씩 펼쳐지는 결과 화면용 */
function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setInView(true); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); io.disconnect(); }
    }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, inView] as const;
}

function Reveal({ children, className = "" }: { children: (inView: boolean) => ReactNode; className?: string }) {
  const [ref, inView] = useInView<HTMLElement>();
  return (
    <section ref={ref} className={`rsec reveal ${inView ? "in" : ""} ${className}`}>
      {children(inView)}
    </section>
  );
}

export default function ResultView({ code, answers, saveFailed }: { code: string; answers: Answers; saveFailed?: boolean }) {
  const t = CLOUD_TYPES[code];
  const scores = axisScores(answers);
  const enjoy = enjoymentScore(answers);
  const wx = weatherFor(enjoy);
  const motive = motivationScores(answers);
  const word = String(answers.q50 ?? "").trim();
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = `${window.location.origin}/?from=${code}`;
    const text = `나는 조치원의 「${t.name}」. 너는 어떤 구름이야?`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "나는 어떤 조치원 구름일까?", text, url });
        return;
      }
    } catch {
      return; // 사용자가 공유 시트를 닫음
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* 클립보드 불가 */ }
  };

  const others = Object.values(CLOUD_TYPES).filter((c) => c.code !== code);
  const strongest = MOTIVE_SCALES
    .map((s) => ({ ...s, v: motive[s.key] }))
    .filter((s): s is typeof s & { v: number } => s.v != null)
    .sort((a, b) => b.v - a.v)[0];

  return (
    <div className="result">
      {/* 1. 첫 화면: 유형 이름 */}
      <div className="hero fade-seq">
        <Orb size={230} level={0.75} colors={t.colors} />
        <p className="you">당신은</p>
        <h1 className="tname display">{t.name}</h1>
        <p className="muted" style={{ margin: "8px 0 0", fontSize: 15 }}>유형입니다</p>
        <p className="code">{code}</p>
        <p className="tagline">{t.tagline}</p>
        <div className="scroll-cue" aria-hidden>
          <span>내 결과 더 보기</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
        </div>
      </div>

      {/* 2. 설명 */}
      <Reveal>
        {() => (
          <>
            <p className="body">{t.description}</p>
            <div className="tags">{t.tags.map((x) => <span key={x}>{x}</span>)}</div>
          </>
        )}
      </Reveal>

      {/* 3. 구름 성분 */}
      <Reveal>
        {(inView) => (
          <>
            <h2 className="sect-title">구름 성분</h2>
            {AXES.map((ax, i) => {
              const isA = scores[i] >= 50;
              const pct = isA ? scores[i] : 100 - scores[i];
              return (
                <div className="axis" key={ax.key}>
                  <div className="lbls">
                    <span>{isA ? <b>{ax.a.label} {pct}%</b> : ax.a.label}</span>
                    <span>{!isA ? <b>{ax.b.label} {pct}%</b> : ax.b.label}</span>
                  </div>
                  <div className="bar">
                    <i style={isA ? { left: 0, width: inView ? `${pct}%` : "0%" } : { right: 0, width: inView ? `${pct}%` : "0%" }} />
                  </div>
                </div>
              );
            })}
          </>
        )}
      </Reveal>

      {/* 4. 에너지 지도 (일상 의욕 및 동기) */}
      {strongest && (
        <Reveal>
          {(inView) => (
            <>
              <h2 className="sect-title">나의 에너지 지도</h2>
              <p className="lead">
                지금 당신에게 가장 큰 에너지는 <b>{strongest.label}</b>예요.
              </p>
              <EnergyTriangle values={MOTIVE_SCALES.map((s) => motive[s.key] ?? 0)} labels={MOTIVE_SCALES.map((s) => s.label)} show={inView} colors={t.colors} />
              <div className="energy-list">
                {MOTIVE_SCALES.map((s) => {
                  const v = motive[s.key] ?? 0;
                  return (
                    <div key={s.key} className="energy-row">
                      <div className="energy-top">
                        <b>{s.label}</b>
                        <span>{faceWord(v)}</span>
                      </div>
                      <div className="bar"><i style={{ left: 0, width: inView ? `${v}%` : "0%" }} /></div>
                      <p>{s.desc}</p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Reveal>
      )}

      {/* 5. 마음 날씨 (일반 피로 측정) */}
      <Reveal>
        {(inView) => (
          <>
            <h2 className="sect-title">요즘 마음 날씨</h2>
            <div className="weather-card">
              <div className={`wx-icon ${inView ? "in" : ""}`}><WeatherIcon kind={wx.key} size={72} /></div>
              <div className="w display">{wx.label}</div>
              <p>{wx.message}</p>
              {enjoy != null && (
                <div className="meter" aria-label={`일상 즐거움 ${Math.round(enjoy)} / 100`}>
                  <i style={{ left: inView ? `${100 - enjoy}%` : "50%" }} />
                </div>
              )}
              <div className="meter-ends"><span>맑음</span><span>소나기</span></div>
            </div>
          </>
        )}
      </Reveal>

      {/* 6. 나에게 조치원은 */}
      {word && (
        <Reveal className="word-sec">
          {() => (
            <>
              <h2 className="sect-title">나에게 조치원은</h2>
              <p className="word display">“{word}”</p>
              <p className="small muted">당신이 고른 한 단어예요. 다른 친구들은 어떤 단어를 골랐을까요?</p>
            </>
          )}
        </Reveal>
      )}

      {/* 7. 작은 처방 */}
      <Reveal>
        {() => (
          <>
            <h2 className="sect-title">작은 처방</h2>
            <p style={{ margin: 0, lineHeight: 1.8, fontSize: 16 }}>{t.tip}</p>
          </>
        )}
      </Reveal>

      {/* 8. 다른 구름 둘러보기 (옆으로 넘기기) */}
      <Reveal>
        {() => (
          <>
            <h2 className="sect-title">다른 구름들도 만나보세요</h2>
            <div className="carousel" role="list">
              {others.map((c) => (
                <div key={c.code} className="ccard" role="listitem">
                  <Orb size={64} rings={false} colors={c.colors} />
                  <b>{c.name}</b>
                  <span className="code-s">{c.code}{c.code === t.match ? " · 찰떡궁합" : ""}</span>
                  <p>{c.tagline}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </Reveal>

      <div className="result-foot">
        <button className="btn" onClick={share}>{copied ? "링크를 복사했어요" : "친구에게 공유하기"}</button>
        <p className="small faint" style={{ textAlign: "center", margin: "12px 0 0" }}>응답해주셔서 고마워요</p>
        {saveFailed && (
          <p className="small" style={{ textAlign: "center", margin: 0, color: "#c0587e" }}>
            응답 전송이 지연되고 있어요. 다음 방문 때 자동으로 다시 보낼게요.
          </p>
        )}
      </div>
    </div>
  );
}

/** 세 꼭짓점 에너지 지도 (값 0~100) */
function EnergyTriangle({ values, labels, show, colors }: { values: number[]; labels: string[]; show: boolean; colors: [string, string] }) {
  const cx = 150, cy = 128, R = 92;
  const angle = (i: number) => (-90 + i * 120) * (Math.PI / 180);
  const pt = (i: number, r: number) => [cx + Math.cos(angle(i)) * r, cy + Math.sin(angle(i)) * r] as const;
  const poly = (r: (i: number) => number) => [0, 1, 2].map((i) => pt(i, r(i)).join(",")).join(" ");
  const labelPos = [pt(0, R + 22), pt(1, R + 26), pt(2, R + 26)];
  return (
    <svg className={`triangle ${show ? "in" : ""}`} viewBox="0 0 300 260" role="img"
      aria-label={labels.map((l, i) => `${l} ${Math.round(values[i])}`).join(", ")}>
      <defs>
        <linearGradient id="tri-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={colors[0]} />
          <stop offset="1" stopColor="#c9b8ff" />
        </linearGradient>
      </defs>
      {[1, 0.66, 0.33].map((f) => (
        <polygon key={f} points={poly(() => R * f)} fill="none" stroke="rgba(90,80,140,.14)" strokeWidth="1" />
      ))}
      {[0, 1, 2].map((i) => {
        const [x, y] = pt(i, R);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(90,80,140,.12)" strokeWidth="1" />;
      })}
      <g className="tri-shape" style={{ transformOrigin: `${cx}px ${cy}px` }}>
        <polygon points={poly((i) => R * Math.max(0.08, values[i] / 100))} fill="url(#tri-fill)" fillOpacity=".55" stroke="#8b7cf6" strokeWidth="2" strokeLinejoin="round" />
        {[0, 1, 2].map((i) => {
          const [x, y] = pt(i, R * Math.max(0.08, values[i] / 100));
          return <circle key={i} cx={x} cy={y} r="5" fill="#fff" stroke="#8b7cf6" strokeWidth="2" />;
        })}
      </g>
      {labels.map((l, i) => (
        <text key={l} x={labelPos[i][0]} y={labelPos[i][1]} textAnchor="middle" dominantBaseline="middle" fontSize="13" fontWeight="600" fill="#2e2a40">{l}</text>
      ))}
    </svg>
  );
}
