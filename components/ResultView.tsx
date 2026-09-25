"use client";

import { useEffect, useState } from "react";
import { Orb, WeatherIcon } from "./Art";
import { AXES, CLOUD_TYPES, axisScores, burnoutScore, weatherFor } from "@/lib/cloudTypes";
import type { Answers } from "@/lib/questions";

export default function ResultView({ code, answers, saveFailed }: { code: string; answers: Answers; saveFailed?: boolean }) {
  const t = CLOUD_TYPES[code];
  const scores = axisScores(answers);
  const burn = burnoutScore(answers);
  const wx = weatherFor(burn);
  const [grow, setGrow] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setGrow(true));
    return () => cancelAnimationFrame(id);
  }, []);

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

  return (
    <div className="result fade-seq">
      <div className="hero">
        <Orb size={240} level={0.75} colors={t.colors} />
        <p className="you">당신은</p>
        <h1 className="tname display">{t.name}</h1>
        <p className="muted" style={{ margin: "8px 0 0", fontSize: 15 }}>유형입니다</p>
        <p className="code">{code}</p>
        <p className="tagline">{t.tagline}</p>
      </div>

      <div>
        <p className="body">{t.description}</p>
        <div className="tags">{t.tags.map((x) => <span key={x}>{x}</span>)}</div>
      </div>

      <section className="rsec">
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
                <i style={isA ? { left: 0, width: grow ? `${pct}%` : "0%" } : { right: 0, width: grow ? `${pct}%` : "0%" }} />
              </div>
            </div>
          );
        })}
      </section>

      <section className="rsec">
        <h2 className="sect-title">요즘 마음 날씨</h2>
        <div className="weather">
          <WeatherIcon kind={wx.key} size={48} />
          <div>
            <div className="w">{wx.label}</div>
            <div className="small muted" style={{ lineHeight: 1.6 }}>{wx.message}</div>
          </div>
        </div>
        {burn != null && <div className="meter" title={`소진 지수 ${Math.round(burn)} / 100`}><i style={{ left: `${burn}%` }} /></div>}
      </section>

      <section className="rsec">
        <h2 className="sect-title">작은 처방</h2>
        <p style={{ margin: 0, lineHeight: 1.8, fontSize: 15 }}>{t.tip}</p>
      </section>

      <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 6 }}>
        <button className="btn" onClick={share}>{copied ? "링크를 복사했어요" : "친구에게 공유하기"}</button>
        <p className="small faint" style={{ textAlign: "center", margin: "10px 0 0" }}>응답해주셔서 고마워요</p>
        {saveFailed && (
          <p className="small" style={{ textAlign: "center", margin: 0, color: "#c0587e" }}>
            응답 전송이 지연되고 있어요. 다음 방문 때 자동으로 다시 보낼게요.
          </p>
        )}
      </div>
    </div>
  );
}
