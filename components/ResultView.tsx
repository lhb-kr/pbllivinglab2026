"use client";

import { useEffect, useState } from "react";
import { CloudMascot, WeatherIcon, faceFor } from "./Art";
import { AXES, CLOUD_TYPES, axisScores, burnoutScore, weatherFor } from "@/lib/cloudTypes";
import type { Answers } from "@/lib/questions";

export default function ResultView({ code, answers, saveFailed }: { code: string; answers: Answers; saveFailed?: boolean }) {
  const t = CLOUD_TYPES[code];
  const scores = axisScores(answers);
  const burn = burnoutScore(answers);
  const wx = weatherFor(burn);
  const match = CLOUD_TYPES[t.match];
  const [grow, setGrow] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setGrow(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const share = async () => {
    const url = `${window.location.origin}/?from=${code}`;
    const text = `나는 조치원의 「${t.name}」 ☁︎ 너는 어떤 구름이야?`;
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
      <div>
        <p className="you">당신은</p>
        <div className="mascot-stage">
          <div className="halo" style={{ background: `radial-gradient(circle, ${t.colors[0]}, transparent 70%)` }} />
          <div className="pop"><div className="bob"><CloudMascot id="result" size={210} colors={t.colors} face={faceFor(code)} /></div></div>
        </div>
        <h1 className="tname display">{t.name}</h1>
        <p style={{ textAlign: "center", margin: 0 }} className="muted">유형입니다</p>
        <div className="code">{code.split("").map((c, i) => <span key={i}>{c}</span>)}</div>
        <p className="tagline">“{t.tagline}”</p>
      </div>

      <section className="card" style={{ marginTop: 22 }}>
        <p style={{ margin: 0, lineHeight: 1.75, wordBreak: "keep-all" }}>{t.description}</p>
        <div className="tags">{t.tags.map((x) => <span key={x}>{x}</span>)}</div>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="sect-title">나의 구름 성분</h2>
        {AXES.map((ax, i) => {
          const pctA = scores[i];
          const isA = pctA >= 50;
          const pct = isA ? pctA : 100 - pctA;
          return (
            <div className="axis" key={ax.key}>
              <div className="lbls">
                <span>{isA ? <b>{ax.a.letter} {ax.a.label}</b> : `${ax.a.letter} ${ax.a.label}`}</span>
                <span>{!isA ? <b>{ax.b.label} {ax.b.letter}</b> : `${ax.b.label} ${ax.b.letter}`}</span>
              </div>
              <div className="bar">
                <i style={isA ? { left: 0, width: grow ? `${pct}%` : "0%" } : { right: 0, width: grow ? `${pct}%` : "0%" }} />
              </div>
              <div className="small muted" style={{ textAlign: isA ? "left" : "right", marginTop: 4 }}>{pct}%</div>
            </div>
          );
        })}
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="sect-title">요즘 나의 마음 날씨</h2>
        <div className="weather">
          <WeatherIcon kind={wx.key} size={56} />
          <div>
            <div className="display" style={{ fontSize: 22 }}>{wx.label}</div>
            <div className="small muted" style={{ lineHeight: 1.55, wordBreak: "keep-all" }}>{wx.message}</div>
          </div>
        </div>
        {burn != null && (
          <>
            <div className="meter"><i style={{ left: `${burn}%` }} /></div>
            <div className="small faint" style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              <span>맑음</span><span>소진 지수 {Math.round(burn)} / 100</span><span>소나기</span>
            </div>
          </>
        )}
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="sect-title">조치원 구름 처방전</h2>
        <p style={{ margin: 0, lineHeight: 1.7, wordBreak: "keep-all" }}>{t.tip}</p>
      </section>

      <section className="card" style={{ marginTop: 14, display: "flex", gap: 14, alignItems: "center" }}>
        <CloudMascot id="match" size={80} colors={match.colors} face={faceFor(match.code)} />
        <div>
          <h2 className="sect-title" style={{ marginBottom: 4 }}>찰떡궁합 구름</h2>
          <div className="display" style={{ fontSize: 19 }}>{match.name}</div>
          <div className="small muted">{match.tagline}</div>
        </div>
      </section>

      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
        <button className="btn" onClick={share}>{copied ? "링크를 복사했어요!" : "친구에게 테스트 공유하기"}</button>
        <p className="small muted" style={{ textAlign: "center", margin: 0 }}>
          소중한 응답 고마워요 ☁︎ 여러분의 이야기는 조치원을 바꾸는 데 쓰여요.
        </p>
        {saveFailed && (
          <p className="small" style={{ textAlign: "center", margin: 0, color: "#c0587e" }}>
            네트워크 문제로 응답 전송이 지연되고 있어요. 다음에 이 페이지를 열면 자동으로 다시 보내요.
          </p>
        )}
      </div>

      <section style={{ marginTop: 26 }}>
        <h2 className="sect-title" style={{ textAlign: "center" }}>조치원의 8가지 구름</h2>
        <div className="gallery">
          {Object.values(CLOUD_TYPES).map((c) => (
            <div key={c.code} className={c.code === code ? "me" : ""} title={c.tagline}>
              <CloudMascot id={`g-${c.code}`} size={56} colors={c.colors} face={faceFor(c.code)} />
              <div>{c.name.replace(" 구름", "")}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
