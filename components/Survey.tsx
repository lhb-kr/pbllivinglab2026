"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Sky from "./Sky";
import { CloudMascot, LikertCloud, WeatherIcon, faceFor } from "./Art";
import ResultView from "./ResultView";
import {
  LIKERT_LABELS,
  SECTIONS,
  etcKey,
  visibleQuestions,
  type AnswerValue,
  type Answers,
  type Question,
} from "@/lib/questions";
import { CLOUD_TYPES, typeCode } from "@/lib/cloudTypes";

type Stage = "landing" | "info" | "q" | "interlude" | "analyzing" | "result";
interface Info { studentId: string; phone: string; consent: boolean }

const SAVE_KEY = "chowon-survey-v1";
const DONE_KEY = "chowon-survey-done";
const PENDING_KEY = "chowon-survey-pending";
const WX = ["sunny", "partly", "cloudy", "overcast", "rain"] as const;

const store = {
  get<T>(k: string): T | null {
    try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : null; } catch { return null; }
  },
  set(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* 저장 불가 환경 */ } },
  del(k: string) { try { localStorage.removeItem(k); } catch { /* noop */ } },
};

const formatPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length < 4) return d;
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, d.length - 4)}-${d.slice(-4)}`;
};

async function postResponse(payload: unknown) {
  const res = await fetch("/api/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(String(res.status));
}

export default function Survey() {
  const [stage, setStage] = useState<Stage>("landing");
  const [answers, setAnswers] = useState<Answers>({});
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const [info, setInfo] = useState<Info>({ studentId: "", phone: "", consent: false });
  const [consentWarn, setConsentWarn] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [resultCode, setResultCode] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [friend, setFriend] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ code: string; answers: Answers } | null>(null);
  const [resumable, setResumable] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const visible = useMemo(() => visibleQuestions(answers), [answers]);
  const q: Question | undefined = visible[Math.min(idx, visible.length - 1)];

  // ── 초기화: 친구 공유 링크, 이어하기, 미전송 응답 재시도 ──
  useEffect(() => {
    const from = new URLSearchParams(window.location.search).get("from");
    if (from && CLOUD_TYPES[from]) setFriend(from);
    setLastResult(store.get<{ code: string; answers: Answers }>(DONE_KEY));
    const saved = store.get<{ answers: Answers; idx: number; info: Info; startedAt: number }>(SAVE_KEY);
    if (saved && Object.keys(saved.answers ?? {}).length) setResumable(true);
    const pending = store.get(PENDING_KEY);
    if (pending) postResponse(pending).then(() => store.del(PENDING_KEY)).catch(() => {});
  }, []);

  // 진행 상황 자동 저장
  useEffect(() => {
    if (stage === "q" || stage === "interlude") store.set(SAVE_KEY, { answers, idx, info, startedAt });
  }, [answers, idx, info, startedAt, stage]);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }, []);

  const resume = () => {
    const saved = store.get<{ answers: Answers; idx: number; info: Info; startedAt: number }>(SAVE_KEY);
    if (!saved) return;
    setAnswers(saved.answers);
    setIdx(saved.idx);
    setInfo(saved.info);
    setStartedAt(saved.startedAt ?? Date.now());
    setDir("fwd");
    setStage("q");
  };

  const startSurvey = () => {
    const hasPersonal = info.studentId.trim() || info.phone.trim();
    if (hasPersonal && !info.consent) {
      setConsentWarn(true);
      flash("개인정보 수집에 동의하거나, 입력란을 비워주세요");
      setTimeout(() => setConsentWarn(false), 500);
      return;
    }
    setAnswers({});
    setIdx(0);
    setDir("fwd");
    setStartedAt(Date.now());
    setStage("interlude");
  };

  const submit = useCallback(
    async (final: Answers) => {
      setStage("analyzing");
      const code = typeCode(final);
      const payload = {
        answers: final,
        studentId: info.consent ? info.studentId : "",
        phone: info.consent ? info.phone : "",
        consentPersonal: info.consent,
        durationSec: startedAt ? Math.round((Date.now() - startedAt) / 1000) : null,
      };
      const minWait = new Promise((r) => setTimeout(r, 2600));
      let ok = false;
      for (let i = 0; i < 3 && !ok; i++) {
        try { await postResponse(payload); ok = true; } catch { await new Promise((r) => setTimeout(r, 700 * (i + 1))); }
      }
      if (!ok) store.set(PENDING_KEY, payload);
      setSaveFailed(!ok);
      await minWait;
      store.del(SAVE_KEY);
      store.set(DONE_KEY, { code, answers: final });
      setLastResult({ code, answers: final });
      setResultCode(code);
      setStage("result");
      window.scrollTo({ top: 0 });
    },
    [info, startedAt],
  );

  const goNext = useCallback(
    (ans: Answers) => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      const list = visibleQuestions(ans);
      const cur = list.findIndex((x) => x.id === q?.id);
      const nextQ = list[cur + 1];
      if (!nextQ) { submit(ans); return; }
      // 31-1: 앞에서 동의하고 입력한 번호가 있으면 미리 채워두기
      if (nextQ.id === "q31_1" && !ans.q31_1 && info.consent && info.phone) {
        ans = { ...ans, q31_1: info.phone };
        setAnswers(ans);
      }
      setDir("fwd");
      setIdx(cur + 1);
      if (q && nextQ.section !== q.section) setStage("interlude");
      window.scrollTo({ top: 0 });
    },
    [q, submit, info],
  );

  const goBack = () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    setDir("back");
    if (idx === 0) setStage("info");
    else setIdx(idx - 1);
  };

  // 인터루드(챕터 카드)는 잠깐 보여주고 자동으로 넘어감
  useEffect(() => {
    if (stage !== "interlude") return;
    const t = setTimeout(() => setStage("q"), 1500);
    return () => clearTimeout(t);
  }, [stage]);

  const setAnswer = (question: Question, value: AnswerValue | undefined, autoAdvance = false) => {
    const next = { ...answers, [question.id]: value };
    setAnswers(next);
    if (autoAdvance) {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      advanceTimer.current = setTimeout(() => goNext(next), 380);
    }
  };

  const setEtc = (question: Question, text: string) =>
    setAnswers((a) => ({ ...a, [etcKey(question.id)]: text }));

  const canNext = (question: Question | undefined) => {
    if (!question) return false;
    const v = answers[question.id];
    if (question.optional) return true;
    if (question.type === "multi") return Array.isArray(v) && v.length > 0;
    return v !== undefined && v !== "";
  };

  const choose = (question: Question, value: string) => {
    if (question.type === "multi") {
      const cur = (answers[question.id] as string[] | undefined) ?? [];
      if (cur.includes(value)) return setAnswer(question, cur.filter((x) => x !== value));
      if (question.max && cur.length >= question.max) {
        flash(`최대 ${question.max}개까지 고를 수 있어요`);
        return;
      }
      return setAnswer(question, [...cur, value]);
    }
    const isOther = question.options?.find((o) => o.value === value)?.other;
    setAnswer(question, value, !isOther);
  };

  // 키보드: 숫자키로 선택, Enter로 다음
  useEffect(() => {
    if (stage !== "q" || !q) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "TEXTAREA" || tag === "INPUT") {
        if (e.key === "Enter" && tag === "INPUT" && canNext(q)) goNext(answers);
        return;
      }
      if (e.key === "Enter" && canNext(q)) return goNext(answers);
      const n = Number(e.key);
      if (!n) return;
      if (q.type === "likert" && n <= 5) setAnswer(q, n, true);
      else if (q.options && n <= q.options.length) choose(q, q.options[n - 1].value);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const skyTheme =
    stage === "landing" || stage === "info" ? "landing"
      : stage === "result" || stage === "analyzing" ? "result"
      : `s${q?.section ?? 1}`;

  const progress = visible.length ? (idx + (canNext(q) ? 1 : 0.4)) / visible.length : 0;

  return (
    <>
      <Sky theme={skyTheme} />
      <main className="shell">
        {stage === "landing" && (
          <Landing
            friend={friend}
            lastResult={lastResult}
            resumable={resumable}
            onStart={() => setStage("info")}
            onResume={resume}
            onShowLast={() => { if (!lastResult) return; setAnswers(lastResult.answers); setResultCode(lastResult.code); setStage("result"); }}
          />
        )}

        {stage === "info" && (
          <InfoStep info={info} setInfo={setInfo} warn={consentWarn} onBack={() => setStage("landing")} onStart={startSurvey} />
        )}

        {stage === "interlude" && q && (
          <div className="center interlude" onClick={() => setStage("q")}>
            <div className="fade-up">
              <div className="big">CHAPTER {q.section} · {SECTIONS[q.section].sky}</div>
              <h2 className="display">{SECTIONS[q.section].title}</h2>
              <div className="bob" style={{ display: "inline-block", marginTop: 18 }}>
                <CloudMascot id="inter" size={120} face={q.section >= 6 ? "happy" : q.section === 4 ? "sleepy" : "dot"} />
              </div>
              <p className="muted small" style={{ marginTop: 18 }}>탭하면 바로 시작해요</p>
            </div>
          </div>
        )}

        {stage === "q" && q && (
          <>
            <div className="topbar">
              <button className="iconbtn" onClick={goBack} aria-label="이전 문항">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <div className="progress" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
                <div className="fill" style={{ width: `${progress * 100}%` }} />
                <div className="rider" style={{ left: `${progress * 100}%` }}>
                  <CloudMascot id="rider" size={34} face="happy" />
                </div>
              </div>
              <div className="count">{idx + 1} / {visible.length}</div>
            </div>

            <div key={q.id} className={`qwrap ${dir === "fwd" ? "slide-in" : "slide-back"}`}>
              <div className="qhead">
                <span className="section-chip">☁︎ {SECTIONS[q.section].title}</span>
                <p className="kicker">{q.kicker}</p>
                <h1 className="qtext display">
                  <span className="qnum">Q{q.number}.</span>
                  {q.text}
                </h1>
                {q.hint && <p className="hint">{q.hint}</p>}
              </div>

              <QuestionBody q={q} answers={answers} choose={choose} setAnswer={setAnswer} setEtc={setEtc} />

              <div className="foot">
                {(q.type === "multi" || q.type === "text" || q.type === "longtext" || hasOtherSelected(q, answers)) && (
                  <button className="btn" disabled={!canNext(q)} onClick={() => goNext(answers)}>
                    {visible[idx + 1] ? (q.optional && !answers[q.id] ? "건너뛰기" : "다음") : "결과 보기 ☁︎"}
                  </button>
                )}
                {(q.type === "single" || q.type === "likert" || q.type === "freq") && canNext(q) && !hasOtherSelected(q, answers) && (
                  <button className="linkbtn" onClick={() => goNext(answers)}>다음 →</button>
                )}
              </div>
            </div>
          </>
        )}

        {stage === "analyzing" && <Analyzing />}

        {stage === "result" && resultCode && (
          <ResultView code={resultCode} answers={answers} saveFailed={saveFailed} />
        )}

        {toast && <div className="toast" role="status">{toast}</div>}
      </main>
    </>
  );
}

function hasOtherSelected(q: Question, a: Answers) {
  if (q.type !== "single") return false;
  const opt = q.options?.find((o) => o.value === a[q.id]);
  return !!opt?.other;
}

/* ───────────────────────── 문항 본문 ───────────────────────── */

function QuestionBody({
  q, answers, choose, setAnswer, setEtc,
}: {
  q: Question;
  answers: Answers;
  choose: (q: Question, v: string) => void;
  setAnswer: (q: Question, v: AnswerValue | undefined, auto?: boolean) => void;
  setEtc: (q: Question, t: string) => void;
}) {
  const v = answers[q.id];

  if (q.type === "likert") {
    return (
      <div>
        <div className="likert" role="radiogroup" aria-label={q.text}>
          {[1, 2, 3, 4, 5].map((n, i) => (
            <button key={n} className={`lk ${v === n ? "on" : ""}`} style={{ animationDelay: `${i * 0.05}s` }}
              role="radio" aria-checked={v === n} aria-label={`${n}점 ${LIKERT_LABELS[n - 1]}`}
              onClick={() => setAnswer(q, n, true)}>
              <LikertCloud level={n} active={v === n} />
              <span className="n">{n}</span>
            </button>
          ))}
        </div>
        <div className="likert-labels"><span>전혀 그렇지 않다</span><span>매우 그렇다</span></div>
        <div className="likert-now">{typeof v === "number" ? LIKERT_LABELS[v - 1] : ""}</div>
      </div>
    );
  }

  if (q.type === "text" || q.type === "longtext") {
    const val = (v as string) ?? "";
    return q.type === "longtext" ? (
      <textarea className="input" value={val} placeholder={q.placeholder} maxLength={2000}
        onChange={(e) => setAnswer(q, e.target.value)} />
    ) : (
      <input className="input" value={val} placeholder={q.placeholder} maxLength={q.id === "q30" ? 30 : 60}
        inputMode={q.id === "q31_1" ? "tel" : "text"}
        onChange={(e) => setAnswer(q, q.id === "q31_1" ? formatPhone(e.target.value) : e.target.value)} />
    );
  }

  const selected = (val: string) => (Array.isArray(v) ? v.includes(val) : v === val);
  const otherOn = q.options?.some((o) => o.other && selected(o.value));

  return (
    <div className="opts" role={q.type === "multi" ? "group" : "radiogroup"} aria-label={q.text}>
      {q.options!.map((o, i) => {
        const on = selected(o.value);
        return (
          <button key={o.value} className={`opt ${on ? "on" : ""}`} style={{ animationDelay: `${i * 0.04}s` }}
            role={q.type === "multi" ? "checkbox" : "radio"} aria-checked={on}
            onClick={() => choose(q, o.value)}>
            {q.type === "freq" ? (
              <span className="wx"><WeatherIcon kind={WX[i]} size={30} /></span>
            ) : q.type === "multi" ? (
              <span className="box"><Check /></span>
            ) : (
              <span className="key">{i + 1}</span>
            )}
            <span>{o.label}</span>
          </button>
        );
      })}
      {otherOn && (
        <input className="input etc-input" autoFocus placeholder="직접 입력해주세요 (선택)" maxLength={100}
          value={(answers[etcKey(q.id)] as string) ?? ""} onChange={(e) => setEtc(q, e.target.value)} />
      )}
    </div>
  );
}

export function Check() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

/* ───────────────────────── 랜딩 ───────────────────────── */

function Landing({
  friend, lastResult, resumable, onStart, onResume, onShowLast,
}: {
  friend: string | null;
  lastResult: { code: string } | null;
  resumable: boolean;
  onStart: () => void;
  onResume: () => void;
  onShowLast: () => void;
}) {
  const preview = ["OTL", "OSL", "HTE", "HSL"];
  return (
    <div className="center fade-seq" style={{ textAlign: "center" }}>
      <div className="pill-row"><span className="chip">☁︎ 2026 조치원 리빙랩 PBL</span></div>

      <div className="hero-clouds">
        {preview.map((c, i) => (
          <div key={c} className="bob" style={{
            left: `${[4, 56, 18, 62][i]}%`, top: `${[36, 4, -6, 70][i]}px`, animationDelay: `${-i * 1.1}s`,
            zIndex: i === 0 || i === 1 ? 2 : 1,
          }}>
            <CloudMascot id={`hero-${c}`} size={[118, 104, 72, 70][i]} colors={CLOUD_TYPES[c].colors} face={faceFor(c)} />
          </div>
        ))}
      </div>

      <div>
        <h1 className="hero-title display">나는 어떤<br /><em>조치원 구름</em>일까?</h1>
        <p className="muted" style={{ margin: 0, lineHeight: 1.6, wordBreak: "keep-all" }}>
          조치원에서 보내는 나의 하루로 알아보는<br />8가지 구름 유형 테스트
        </p>
      </div>

      <div className="pill-row" style={{ marginTop: 16 }}>
        <span className="chip">⏱ 약 5분</span>
        <span className="chip">☁︎ 8가지 유형</span>
        <span className="chip">🌦 마음 날씨</span>
      </div>

      {friend && (
        <div className="friend-banner" style={{ marginTop: 18 }}>
          <CloudMascot id="friend" size={48} colors={CLOUD_TYPES[friend].colors} face={faceFor(friend)} />
          <span style={{ textAlign: "left" }}>친구는 <b>{CLOUD_TYPES[friend].name}</b>이었어요.<br />나는 어떤 구름일까?</span>
        </div>
      )}

      <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 10 }}>
        {resumable ? (
          <>
            <button className="btn" onClick={onResume}>이어서 하기 ☁︎</button>
            <button className="btn ghost" onClick={onStart}>처음부터 다시</button>
          </>
        ) : (
          <button className="btn" onClick={onStart}>내 구름 찾으러 가기 ☁︎</button>
        )}
        {lastResult && CLOUD_TYPES[lastResult.code] && (
          <button className="linkbtn" onClick={onShowLast}>지난번 내 결과 다시 보기</button>
        )}
      </div>

      <details className="notice card" style={{ marginTop: 20, textAlign: "left", padding: "16px 18px" }}>
        <summary>설문 안내문</summary>
        <p>
          본 설문은 조치원에서 생활하는 대학생의 생활패턴과 생활환경 경험, 피로 및 소진 수준을 파악하고
          향후 대학생을 위한 생활환경 개선 및 프로그램 개발 방향을 탐색하기 위한 조사입니다.
        </p>
        <p>
          응답 내용은 연구 및 프로젝트 수행 목적으로만 활용되며, 개인을 식별할 수 있는 형태로 공개되지 않습니다.
          설문 응답 내용에 따라 일부 응답자에게 후속 심층인터뷰 참여를 요청드릴 수 있으며, 참여 여부는 자율적으로 결정할 수 있습니다.
        </p>
      </details>
      <p className="faint small" style={{ marginTop: 10 }}>‘시작’을 누르면 위 안내에 동의한 것으로 봅니다.</p>
    </div>
  );
}

/* ───────────────────────── 개인정보 입력 & 동의 ───────────────────────── */

function InfoStep({
  info, setInfo, warn, onBack, onStart,
}: {
  info: Info;
  setInfo: (i: Info) => void;
  warn: boolean;
  onBack: () => void;
  onStart: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="center">
      <div className="topbar">
        <button className="iconbtn" onClick={onBack} aria-label="처음으로">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
      </div>
      <div className="fade-seq">
        <div>
          <p className="kicker" style={{ marginTop: 0 }}>출발 전에 잠깐!</p>
          <h1 className="qtext display">연락받을 정보를 남겨주세요</h1>
          <p className="hint" style={{ lineHeight: 1.6 }}>
            후속 인터뷰 및 관련 안내를 위해서만 사용돼요.<br />
            <b>입력하지 않아도 설문에 참여할 수 있어요.</b>
          </p>
        </div>

        <div className="card stack" style={{ marginTop: 18 }}>
          <div className="field">
            <label htmlFor="sid">학번 <span>선택</span></label>
            <input id="sid" className="input" inputMode="numeric" autoComplete="off" placeholder="예) 2024123456" maxLength={20}
              value={info.studentId} onChange={(e) => setInfo({ ...info, studentId: e.target.value.replace(/\s/g, "") })} />
          </div>
          <div className="field">
            <label htmlFor="tel">전화번호 <span>선택</span></label>
            <input id="tel" className="input" inputMode="tel" autoComplete="tel" placeholder="010-0000-0000"
              value={info.phone} onChange={(e) => setInfo({ ...info, phone: formatPhone(e.target.value) })} />
          </div>

          <div className={`consent ${info.consent ? "on" : ""} ${warn ? "warn" : ""}`}
            role="checkbox" aria-checked={info.consent} tabIndex={0}
            onClick={() => setInfo({ ...info, consent: !info.consent })}
            onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); setInfo({ ...info, consent: !info.consent }); } }}>
            <span className="box"><Check /></span>
            <span style={{ fontSize: 14, lineHeight: 1.5 }}>
              <b>[선택] 개인정보 수집·이용에 동의합니다</b>
              <br /><span className="muted small">학번·전화번호를 입력한 경우에만 필요해요</span>
            </span>
          </div>

          <button className="linkbtn" style={{ padding: 0 }} onClick={() => setOpen(!open)}>
            {open ? "동의 내용 접기" : "동의 내용 자세히 보기"}
          </button>
          {open && (
            <table className="terms">
              <tbody>
                <tr><th>수집 항목</th><td>학번, 전화번호</td></tr>
                <tr><th>수집 목적</th><td>후속 심층인터뷰 참여 안내 및 일정 조율, 관련 연구·프로그램 안내</td></tr>
                <tr><th>보유 기간</th><td>연구 종료 시까지 보관 후 지체 없이 파기</td></tr>
                <tr><th>거부 권리</th><td>동의를 거부할 수 있으며, 거부하더라도 설문 참여에는 아무런 불이익이 없습니다. 동의하지 않으면 입력한 정보는 저장되지 않습니다.</td></tr>
              </tbody>
            </table>
          )}
        </div>

        <div style={{ marginTop: 18 }}>
          <button className="btn" onClick={onStart}>설문 시작하기</button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── 분석 중 ───────────────────────── */

function Analyzing() {
  const puffs = [
    ["-160px", "-90px"], ["120px", "-110px"], ["-140px", "70px"], ["150px", "60px"], ["0px", "-150px"], ["-20px", "120px"],
  ];
  return (
    <div className="center analyzing">
      <div className="gather">
        {puffs.map(([x, y], i) => (
          <div key={i} className="puff" style={{ ["--x" as string]: x, ["--y" as string]: y, animationDelay: `${i * 0.18}s` }}>
            <CloudMascot id={`puff${i}`} size={60} face="dot" />
          </div>
        ))}
        <div style={{ transform: "translate(-50%, -50%)" }} className="bob">
          <CloudMascot id="gather-main" size={120} face="wow" />
        </div>
      </div>
      <h2 className="display" style={{ fontSize: 24, margin: "8px 0 6px" }}>
        당신의 구름을 모으는 중<span className="dots"><span>.</span><span>.</span><span>.</span></span>
      </h2>
      <p className="muted small">조치원 하늘을 살펴보고 있어요</p>
    </div>
  );
}
