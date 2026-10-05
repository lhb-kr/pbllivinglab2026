"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import Sky from "./Sky";
import { Orb, WeatherIcon } from "./Art";
import { CLOUD_TYPES, WEATHERS, weatherFor } from "@/lib/cloudTypes";
import { LIKERT_LABELS, QUESTIONS, SCHOOLS, SECTIONS, etcKey, type Question } from "@/lib/questions";

interface Row {
  id: string;
  created_at: string;
  name: string | null;
  phone: string | null;
  school: string | null;
  consent_personal: boolean;
  answers: Record<string, string | string[] | number | undefined>;
  type_code: string;
  burnout_score: number | null;
  duration_sec: number | null;
}

type Tab = "summary" | "questions" | "text" | "people";

interface DbStatus {
  mode: "local" | "supabase";
  ready?: boolean;
  reason?: "missing-table" | "error";
  message?: string;
  canAutoSetup?: boolean;
}

const qLabel = (q: Question) => (q.number ? `Q${q.number}.` : "추가 문항 ·");
const maskName = (s: string | null) => (s ? (s.length <= 1 ? s : s[0] + "*".repeat(Math.max(1, s.length - 2)) + (s.length > 2 ? s[s.length - 1] : "")) : "");

const pct = (n: number, d: number) => (d ? Math.round((n / d) * 1000) / 10 : 0);
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
const mask = (s: string | null) => (s ? s.replace(/(\d{3})-?(\d{2})\d{1,2}-?(\d{2})(\d{2})/, "$1-$2**-**$4") : "");
const show = (v: unknown) => (Array.isArray(v) ? v.join(", ") : v == null || v === "" ? "—" : String(v));

export default function AdminDashboard() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [storage, setStorage] = useState<string>("");
  const [status, setStatus] = useState<DbStatus | null>(null);
  const [setupMsg, setSetupMsg] = useState("");
  const [tab, setTab] = useState<Tab>("summary");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    const res = await fetch("/api/admin/responses", { cache: "no-store" });
    setBusy(false);
    if (res.status === 401) return setAuthed(false);
    const data = await res.json();
    setRows(data.rows);
    setStorage(data.storage);
    setStatus(data.status ?? null);
    setAuthed(true);
  }, []);

  const setup = async () => {
    setBusy(true);
    setSetupMsg("");
    const res = await fetch("/api/admin/setup", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setSetupMsg(data.error ?? "테이블을 만들지 못했어요.");
    setSetupMsg("테이블을 만들었어요.");
    await load();
  };

  const needsSetup = status?.mode === "supabase" && status.ready === false;

  useEffect(() => { load(); }, [load]);

  const logout = async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    setAuthed(false);
    setRows([]);
  };

  const seed = async () => {
    setBusy(true);
    await fetch("/api/admin/seed", { method: "POST" });
    await load();
  };

  return (
    <>
      <Sky theme="s3" />
      {authed === false && <Login onDone={load} />}
      {authed && (
        <div className="admin">
          <div className="admin-head">
            <div>
              <h1 className="display">조치원 구름 설문 대시보드</h1>
              <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {storage === "local" ? (
                  <span className="badge warn">로컬 저장 모드 (프로토타입) · Supabase 미연결</span>
                ) : needsSetup ? (
                  <span className="badge warn">Supabase 연결됨 · 테이블 준비 필요</span>
                ) : (
                  <span className="badge">Supabase 연결됨</span>
                )}
              </div>
            </div>
            <div className="admin-actions">
              <button className="sbtn" onClick={load} disabled={busy}>{busy ? "불러오는 중…" : "새로고침"}</button>
              <a className="sbtn primary" href="/api/admin/export">CSV 다운로드</a>
              {storage === "local" && <button className="sbtn" onClick={seed} disabled={busy}>데모 응답 40개 추가</button>}
              <button className="sbtn" onClick={logout}>로그아웃</button>
            </div>
          </div>

          <div className="tabs" role="tablist">
            {([["summary", "요약"], ["questions", "문항별 결과"], ["text", "주관식"], ["people", "응답자 목록"]] as [Tab, string][]).map(([k, l]) => (
              <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>
            ))}
          </div>

          {needsSetup ? (
            <div className="card panel" style={{ maxWidth: 640 }}>
              <h3>데이터베이스 테이블을 만들어주세요</h3>
              <p className="small muted" style={{ lineHeight: 1.7 }}>
                {status?.reason === "missing-table"
                  ? "Supabase에 연결됐지만 응답을 저장할 survey_responses 테이블이 아직 없어요."
                  : `Supabase에서 오류가 났어요: ${status?.message ?? ""}`}
              </p>
              {status?.canAutoSetup ? (
                <button className="sbtn primary" onClick={setup} disabled={busy}>{busy ? "만드는 중…" : "테이블 만들기"}</button>
              ) : (
                <p className="small muted" style={{ lineHeight: 1.7 }}>
                  자동으로 만들 수 있는 연결 정보(POSTGRES_URL)가 없어요. 저장소의 <code>supabase/schema.sql</code> 내용을
                  Supabase 대시보드 → SQL Editor에 붙여넣고 실행한 뒤 새로고침해주세요.
                </p>
              )}
              {setupMsg && <p className="small" style={{ marginTop: 10 }}>{setupMsg}</p>}
            </div>
          ) : rows.length === 0 ? (
            <div className="card empty">
              <div style={{ display: "flex", justifyContent: "center" }}><Orb size={110} /></div>
              <p className="muted">아직 응답이 없어요.</p>
              {storage === "local" && <button className="sbtn primary" onClick={seed}>데모 응답으로 미리보기</button>}
            </div>
          ) : (
            <>
              {tab === "summary" && <Summary rows={rows} />}
              {tab === "questions" && <PerQuestion rows={rows} />}
              {tab === "text" && <TextAnswers rows={rows} />}
              {tab === "people" && <People rows={rows} />}
            </>
          )}
        </div>
      )}
    </>
  );
}

function Login({ onDone }: { onDone: () => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    if (res.ok) onDone();
    else setErr("비밀번호가 올바르지 않아요.");
  };
  return (
    <main className="shell">
      <form className="center" onSubmit={submit}>
        <div className="card stack" style={{ textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center" }}><Orb size={120} /></div>
          <h1 className="display" style={{ fontSize: 24, margin: 0 }}>관리자 로그인</h1>
          <input className="input boxed" type="password" placeholder="비밀번호" value={pw} autoFocus onChange={(e) => setPw(e.target.value)} />
          {err && <p className="small" style={{ color: "#c0587e", margin: 0 }}>{err}</p>}
          <button className="btn" type="submit">들어가기</button>
        </div>
      </form>
    </main>
  );
}

/* ─────────── 차트 부품 ─────────── */

function HBars({ items, total, unit = "명" }: { items: { label: React.ReactNode; key: string; n: number }[]; total: number; unit?: string }) {
  const max = Math.max(1, ...items.map((i) => i.n));
  return (
    <div>
      {items.map((it) => (
        <div className="hbar" key={it.key} title={`${it.key}: ${it.n}${unit} (${pct(it.n, total)}%)`}>
          <span className="lab">{it.label}</span>
          <span className="num">{it.n}{unit} · {pct(it.n, total)}%</span>
          <span className="track"><i style={{ width: `${(it.n / max) * 100}%` }} /></span>
        </div>
      ))}
    </div>
  );
}

function Cols({ items }: { items: { label: string; n: number; tip?: string }[] }) {
  const max = Math.max(1, ...items.map((i) => i.n));
  return (
    <div>
      <div className="cols">
        {items.map((it, i) => (
          <div className="c" key={i} title={it.tip ?? `${it.label}: ${it.n}`}>
            <span className="v">{it.n}</span>
            <i style={{ height: `${(it.n / max) * 100}%`, minHeight: it.n ? 2 : 0 }} />
          </div>
        ))}
      </div>
      <div className="cols-axis">{items.map((it, i) => <span key={i}>{it.label}</span>)}</div>
    </div>
  );
}

/* ─────────── 요약 ─────────── */

function Summary({ rows }: { rows: Row[] }) {
  const today = new Date().toDateString();
  const todayN = rows.filter((r) => new Date(r.created_at).toDateString() === today).length;
  const durs = rows.map((r) => r.duration_sec).filter((x): x is number => x != null);
  const avgDur = durs.length ? durs.reduce((a, b) => a + b, 0) / durs.length : 0;
  const burns = rows.map((r) => r.burnout_score).filter((x): x is number => x != null);
  const avgBurn = burns.length ? burns.reduce((a, b) => a + b, 0) / burns.length : 0;
  const interview = rows.filter((r) => r.answers.q31 === "있다").length;
  const consent = rows.filter((r) => r.consent_personal).length;

  const typeCounts = Object.keys(CLOUD_TYPES).map((code) => ({
    key: code,
    n: rows.filter((r) => r.type_code === code).length,
    label: (
      <>
        <Orb size={24} rings={false} colors={CLOUD_TYPES[code].colors} />
        <span><b>{code}</b> {CLOUD_TYPES[code].name}</span>
      </>
    ),
  })).sort((a, b) => b.n - a.n);

  const weatherCounts = WEATHERS.map((w) => ({
    key: w.label,
    n: burns.filter((b) => weatherFor(b).key === w.key).length,
    label: (<><WeatherIcon kind={w.key} size={24} /><span>{w.label}</span></>),
  }));

  // 최근 14일 일별 응답
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (13 - i));
    return d;
  });
  const daily = days.map((d, i) => ({
    label: i === 0 || d.getDate() === 1 ? `${d.getMonth() + 1}/${d.getDate()}` : String(d.getDate()),
    tip: `${d.getMonth() + 1}/${d.getDate()}`,
    n: rows.filter((r) => new Date(r.created_at).toDateString() === d.toDateString()).length,
  })).map((x) => ({ ...x, tip: `${x.tip}: ${x.n}건` }));

  const envQs = QUESTIONS.filter((q) => q.type === "likert");
  const envMeans = envQs.map((q) => {
    const vals = rows.map((r) => Number(r.answers[q.id])).filter((n) => n >= 1);
    return { q, mean: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0, n: vals.length };
  });

  return (
    <>
      <div className="tiles">
        <Tile lab="총 응답" val={rows.length} sub={`오늘 +${todayN}`} />
        <Tile lab="평균 소요시간" val={`${Math.floor(avgDur / 60)}분 ${Math.round(avgDur % 60)}초`} />
        <Tile lab="평균 소진 지수 (CBI)" val={avgBurn.toFixed(1)} sub={`0~100 · ${weatherFor(avgBurn).label}`} />
        <Tile lab="인터뷰 희망" val={interview} sub={`${pct(interview, rows.length)}%`} />
        <Tile lab="개인정보 동의" val={consent} sub={`${pct(consent, rows.length)}%`} />
        {SCHOOLS.map((sc) => {
          const n = rows.filter((r) => r.school === sc).length;
          return <Tile key={sc} lab={sc} val={n} sub={`${pct(n, rows.length)}%`} />;
        })}
      </div>
      <div className="grid2">
        <section className="card panel">
          <h3>구름 유형 분포</h3>
          <div className="meta">n = {rows.length}</div>
          <HBars items={typeCounts} total={rows.length} />
        </section>
        <section className="card panel">
          <h3>마음 날씨 (CBI Personal Burnout)</h3>
          <div className="meta">맑음 &lt;25 · 구름 조금 &lt;50 · 흐림 &lt;75 · 소나기 ≥75 · n = {burns.length}</div>
          <HBars items={weatherCounts} total={burns.length} />
        </section>
        <section className="card panel">
          <h3>일별 응답 수</h3>
          <div className="meta">최근 14일</div>
          <Cols items={daily} />
        </section>
        <section className="card panel">
          <h3>생활환경 인식 평균</h3>
          <div className="meta">1 전혀 그렇지 않다 ~ 5 매우 그렇다</div>
          {envMeans.map(({ q, mean, n }) => (
            <div className="hbar" key={q.id} title={`Q${q.number} 평균 ${mean.toFixed(2)} (n=${n})`}>
              <span className="lab">{qLabel(q)} {q.text.length > 34 ? q.text.slice(0, 34) + "…" : q.text}</span>
              <span className="num">{mean.toFixed(2)}</span>
              <span className="track"><i style={{ width: `${((mean - 1) / 4) * 100}%` }} /></span>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}

function Tile({ lab, val, sub }: { lab: string; val: React.ReactNode; sub?: string }) {
  return (
    <div className="card tile">
      <div className="lab">{lab}</div>
      <div className="val">{val}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

/* ─────────── 문항별 ─────────── */

function PerQuestion({ rows }: { rows: Row[] }) {
  const qs = QUESTIONS.filter((q) => q.type !== "text" && q.type !== "longtext");
  let lastSection = 0;
  return (
    <div className="grid2">
      {qs.map((q) => {
        const header = q.section !== lastSection ? SECTIONS[q.section].title : null;
        lastSection = q.section;
        return (
          <Fragment key={q.id}>
            {header && <h2 className="sect-title" style={{ gridColumn: "1 / -1", margin: "12px 0 0" }}>{q.section}. {header}</h2>}
            <QuestionPanel q={q} rows={rows} />
          </Fragment>
        );
      })}
    </div>
  );
}

function QuestionPanel({ q, rows }: { q: Question; rows: Row[] }) {
  const answered = rows.filter((r) => r.answers[q.id] !== undefined && r.answers[q.id] !== "");
  const n = answered.length;
  const etcTexts = rows.map((r) => r.answers[etcKey(q.id)]).filter(Boolean) as string[];

  let body: React.ReactNode;
  if (q.type === "number") {
    const vals = answered.map((r) => Number(r.answers[q.id])).filter((n) => Number.isFinite(n));
    const lo = vals.length ? Math.min(...vals) : 0;
    const hi = vals.length ? Math.max(...vals) : 0;
    const counts = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).map((age) => ({
      label: String(age), n: vals.filter((v) => v === age).length, tip: `${age}${q.unit ?? ""}: ${vals.filter((v) => v === age).length}명`,
    }));
    const mean = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    body = (
      <>
        <Cols items={counts} />
        <div className="mean">평균 <b>{mean.toFixed(1)}</b>{q.unit}</div>
      </>
    );
  } else if (q.type === "likert") {
    const counts = [1, 2, 3, 4, 5].map((v) => answered.filter((r) => Number(r.answers[q.id]) === v).length);
    const mean = n ? answered.reduce((s, r) => s + Number(r.answers[q.id]), 0) / n : 0;
    body = (
      <>
        <Cols items={counts.map((c, i) => ({ label: String(i + 1), n: c, tip: `${i + 1} ${LIKERT_LABELS[i]}: ${c}명 (${pct(c, n)}%)` }))} />
        <div className="mean">평균 <b>{mean.toFixed(2)}</b> / 5</div>
      </>
    );
  } else {
    const items = q.options!.map((o) => ({
      key: o.label,
      label: o.label,
      n: answered.filter((r) => {
        const v = r.answers[q.id];
        return Array.isArray(v) ? v.includes(o.value) : String(v) === o.value;
      }).length,
    }));
    if (q.type === "multi") items.sort((a, b) => b.n - a.n);
    body = <HBars items={items} total={n} />;
  }

  return (
    <section className="card panel">
      <h3>{qLabel(q)} {q.text}</h3>
      <div className="meta">
        n = {n}{q.type === "multi" ? " · 복수응답 (응답자 대비 %)" : ""}{q.showIf ? " · 조건부 문항" : ""}
      </div>
      {body}
      {etcTexts.length > 0 && (
        <details style={{ marginTop: 8 }}>
          <summary className="small muted" style={{ cursor: "pointer" }}>기타 응답 {etcTexts.length}건</summary>
          <ul className="small" style={{ margin: "8px 0 0", paddingLeft: 18, lineHeight: 1.7 }}>
            {etcTexts.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </details>
      )}
    </section>
  );
}

/* ─────────── 주관식 ─────────── */

function TextAnswers({ rows }: { rows: Row[] }) {
  const words = new Map<string, number>();
  rows.forEach((r) => {
    const w = String(r.answers.q30 ?? "").trim();
    if (w) words.set(w, (words.get(w) ?? 0) + 1);
  });
  const wordList = [...words.entries()].sort((a, b) => b[1] - a[1]);
  const maxW = Math.max(1, ...wordList.map(([, c]) => c));
  const wishes = rows.filter((r) => String(r.answers.q29 ?? "").trim());

  return (
    <div className="grid2">
      <section className="card panel">
        <h3>Q30. 조치원을 한 단어로 표현한다면?</h3>
        <div className="meta">{wordList.length}개 단어 · 크기 = 응답 수</div>
        <div className="words">
          {wordList.map(([w, c]) => (
            <span key={w} title={`${c}명`} style={{ fontSize: 13 + (c / maxW) * 17 }}>{w}{c > 1 && <small className="faint"> {c}</small>}</span>
          ))}
        </div>
      </section>
      <section className="card panel">
        <h3>Q29. ‘이런 공간이나 프로그램이 있으면 좋겠다’</h3>
        <div className="meta">{wishes.length}건</div>
        <div className="quotes">
          {wishes.map((r) => (
            <blockquote key={r.id}>
              {String(r.answers.q29)}
              <footer>{CLOUD_TYPES[r.type_code]?.name} · {show(r.answers.q1)} · {fmtTime(r.created_at)}</footer>
            </blockquote>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ─────────── 응답자 목록 ─────────── */

function People({ rows }: { rows: Row[] }) {
  const [reveal, setReveal] = useState(false);
  const [onlyInterview, setOnlyInterview] = useState(false);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const list = useMemo(
    () =>
      rows.filter((r) => {
        if (onlyInterview && r.answers.q31 !== "있다") return false;
        if (!query) return true;
        const hay = [r.name, r.phone, r.school, r.type_code, CLOUD_TYPES[r.type_code]?.name].join(" ");
        return hay.includes(query);
      }),
    [rows, onlyInterview, query],
  );

  return (
    <section className="card panel">
      <div className="filters">
        <input className="input boxed" placeholder="이름·전화번호·학교·유형 검색" value={query} onChange={(e) => setQuery(e.target.value)} />
        <label className="toggle"><input type="checkbox" checked={onlyInterview} onChange={(e) => setOnlyInterview(e.target.checked)} /> 인터뷰 희망자만</label>
        <label className="toggle"><input type="checkbox" checked={reveal} onChange={(e) => setReveal(e.target.checked)} /> 개인정보 전체 보기</label>
        <span className="small muted">{list.length}명</span>
      </div>
      <div className="tablewrap">
        <table className="resp">
          <thead>
            <tr><th>제출</th><th>이름</th><th>전화번호</th><th>학교</th><th>나이</th><th>유형</th><th>소진 지수</th><th>인터뷰</th><th>소요</th></tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <Fragment key={r.id}>
                <tr className="row" onClick={() => setOpen(open === r.id ? null : r.id)}>
                  <td>{fmtTime(r.created_at)}</td>
                  <td>{r.name ? (reveal ? r.name : maskName(r.name)) : <span className="faint">—</span>}</td>
                  <td>{r.phone ? (reveal ? r.phone : mask(r.phone)) : <span className="faint">—</span>}</td>
                  <td>{r.school ?? <span className="faint">—</span>}</td>
                  <td>{show(r.answers.age)}</td>
                  <td>{r.type_code} {CLOUD_TYPES[r.type_code]?.name.replace(" 구름", "")}</td>
                  <td>{r.burnout_score ?? "—"}</td>
                  <td>{show(r.answers.q31)}</td>
                  <td>{r.duration_sec ? `${Math.floor(r.duration_sec / 60)}:${String(r.duration_sec % 60).padStart(2, "0")}` : "—"}</td>
                </tr>
                {open === r.id && (
                  <tr>
                    <td colSpan={9} className="detail">
                      <dl>
                        {QUESTIONS.map((q) => (
                          <Fragment key={q.id}>
                            <dt>{qLabel(q)} {q.text}</dt>
                            <dd>
                              {q.type === "likert" && r.answers[q.id] ? `${r.answers[q.id]} (${LIKERT_LABELS[Number(r.answers[q.id]) - 1]})` : q.type === "freq" ? show(q.options?.find((o) => o.value === r.answers[q.id])?.label) : show(r.answers[q.id])}
                              {r.answers[etcKey(q.id)] ? ` — 기타: ${r.answers[etcKey(q.id)]}` : ""}
                            </dd>
                          </Fragment>
                        ))}
                      </dl>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
