"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Sky from "./Sky";
import { Orb, ScaleDots } from "./Art";
import ResultView from "./ResultView";
import {
  LIKERT_LABELS,
  SCHOOLS,
  SECTIONS,
  etcKey,
  visibleQuestions,
  type AnswerValue,
  type Answers,
  type Question,
} from "@/lib/questions";
import { CLOUD_TYPES, typeCode } from "@/lib/cloudTypes";

type Stage = "landing" | "info" | "q" | "interlude" | "analyzing" | "result";
interface Info { name: string; phone: string; school: string; consent: boolean }
const EMPTY_INFO: Info = { name: "", phone: "", school: "", consent: false };

const SAVE_KEY = "chowon-survey-v2";
const DONE_KEY = "chowon-survey-done";
const PENDING_KEY = "chowon-survey-pending";

// 소진 빈도가 높아질수록 오브의 빛이 새벽빛 → 해질녘 보랏빛으로 가라앉음
const SEVERITY_COLORS: [string, string][] = [
  ["#ffe2a8", "#ffd0dc"],
  ["#ffd6c8", "#e6d4ff"],
  ["#dccfff", "#f5c3d6"],
  ["#bdb3f2", "#d7b6e6"],
  ["#a49ce0", "#b8a6de"],
];
const CALM: [string, string] = ["#c9b8ff", "#ffc6d9"];

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

/** 슬라이더로 표시할 문항인지, 그리고 그 라벨·값 목록 */
function scaleOf(q: Question): { labels: string[]; values: AnswerValue[]; tone: "calm" | "severity" } | null {
  if (q.type === "likert") return { labels: LIKERT_LABELS, values: [1, 2, 3, 4, 5], tone: "calm" };
  if (q.type === "freq") return { labels: q.options!.map((o) => o.label), values: q.options!.map((o) => o.value), tone: "severity" };
  if (q.scale && q.options) return { labels: q.options.map((o) => o.label), values: q.options.map((o) => o.value), tone: "calm" };
  return null;
}

export default function Survey() {
  const [stage, setStage] = useState<Stage>("landing");
  const [answers, setAnswers] = useState<Answers>({});
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const [info, setInfo] = useState<Info>(EMPTY_INFO);
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
    const saved = store.get<{ answers: Answers }>(SAVE_KEY);
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
    setInfo({ ...EMPTY_INFO, ...saved.info });
    setStartedAt(saved.startedAt ?? Date.now());
    setDir("fwd");
    setStage("q");
  };

  const startSurvey = () => {
    const missing = !info.name.trim() ? "이름을 입력해주세요"
      : !info.phone.trim() ? "전화번호를 입력해주세요"
      : !info.school ? "학교를 선택해주세요"
      : !info.consent ? "개인정보 수집·이용에 동의해주세요"
      : null;
    if (missing) {
      if (!info.consent && info.name.trim() && info.phone.trim() && info.school) {
        setConsentWarn(true);
        setTimeout(() => setConsentWarn(false), 500);
      }
      flash(missing);
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
        name: info.name.trim(),
        phone: info.phone.trim(),
        school: info.school,
        consentPersonal: info.consent,
        durationSec: startedAt ? Math.round((Date.now() - startedAt) / 1000) : null,
      };
      const minWait = new Promise((r) => setTimeout(r, 3200));
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
      setDir("fwd");
      setIdx(cur + 1);
      if (q && nextQ.section !== q.section) setStage("interlude");
      window.scrollTo({ top: 0 });
    },
    [q, submit],
  );

  const goBack = () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    setDir("back");
    if (idx === 0) setStage("info");
    else setIdx(idx - 1);
  };

  // 챕터 카드는 잠시 머물렀다가 자동으로 넘어감
  useEffect(() => {
    if (stage !== "interlude") return;
    const t = setTimeout(() => setStage("q"), 2000);
    return () => clearTimeout(t);
  }, [stage]);

  const setAnswer = (question: Question, value: AnswerValue | undefined, advanceAfter?: number) => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    const next = { ...answers, [question.id]: value };
    setAnswers(next);
    if (advanceAfter !== undefined) advanceTimer.current = setTimeout(() => goNext(next), advanceAfter);
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
        flash(`${question.max}개까지 고를 수 있어요`);
        return;
      }
      return setAnswer(question, [...cur, value]);
    }
    const isOther = question.options?.find((o) => o.value === value)?.other;
    setAnswer(question, value, isOther ? undefined : 450);
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
      if ((e.target as HTMLElement).getAttribute?.("role") === "slider") return;
      if (e.key === "Enter" && canNext(q)) return goNext(answers);
      const n = Number(e.key);
      if (!n) return;
      const sc = scaleOf(q);
      if (sc && n <= 5) setAnswer(q, sc.values[n - 1], 700);
      else if (q.options && n <= q.options.length) choose(q, q.options[n - 1].value);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const skyTheme =
    stage === "landing" || stage === "info" ? "landing"
      : stage === "result" || stage === "analyzing" ? "result"
      : `s${q?.section ?? 1}`;

  const progress = visible.length ? (idx + (canNext(q) ? 1 : 0)) / visible.length : 0;

  // 문항 화면의 오브: 답에 따라 크기·빛·색이 반응
  const orbState = (() => {
    if (!q) return { level: 0.4, colors: CALM, pulse: undefined as string | undefined };
    const sc = scaleOf(q);
    const v = answers[q.id];
    if (sc) {
      const i = sc.values.findIndex((x) => String(x) === String(v));
      if (i < 0) return { level: 0.35, colors: CALM, pulse: undefined };
      return { level: i / 4, colors: sc.tone === "severity" ? SEVERITY_COLORS[i] : CALM, pulse: undefined };
    }
    if (q.type === "text" || q.type === "longtext" || q.type === "number") {
      const len = String(v ?? "").length;
      return { level: Math.min(1, 0.3 + len / 80), colors: CALM, pulse: undefined };
    }
    const n = Array.isArray(v) ? v.length : v ? 1 : 0;
    return { level: 0.35 + Math.min(n, 4) * 0.15, colors: CALM, pulse: JSON.stringify(v ?? "") };
  })();

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
            <div className="fade-up" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Orb size={150} level={0.5} />
              <p className="num">CHAPTER {q.section} / {Object.keys(SECTIONS).length}</p>
              <h2 className="display">{SECTIONS[q.section].title}</h2>
            </div>
          </div>
        )}

        {stage === "q" && q && (
          <>
            <div className="topbar">
              <button className="iconbtn" onClick={goBack} aria-label="이전 문항">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <div className="progress" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
                <i style={{ width: `${Math.max(progress * 100, 1)}%` }} />
              </div>
              <div className="count">{idx + 1}/{visible.length}</div>
            </div>

            <div key={q.id} className={`qwrap ${dir === "fwd" ? "slide-in" : "slide-back"}`}>
              <div className="qorb">
                <Orb size={112} level={orbState.level} colors={orbState.colors} pulseKey={orbState.pulse} />
              </div>
              <div className="qhead">
                <p className="qmeta">{q.number ? `Q${q.number} · ` : ""}{SECTIONS[q.section].title}</p>
                <h1 className="qtext">{q.text}</h1>
                {q.hint && <p className="hint">{q.hint}</p>}
              </div>

              <QuestionBody q={q} answers={answers} choose={choose} setAnswer={setAnswer} setEtc={setEtc} />

              <div className="foot">
                {needsButton(q, answers) && (
                  <button className="btn" disabled={!canNext(q)} onClick={() => goNext(answers)}>
                    {visible[idx + 1] ? (q.optional && !answers[q.id] ? "건너뛰기" : "다음") : "결과 보기"}
                  </button>
                )}
                {!needsButton(q, answers) && canNext(q) && (
                  <button className="linkbtn" onClick={() => goNext(answers)}>다음</button>
                )}
              </div>
            </div>
          </>
        )}

        {stage === "analyzing" && (
          <div className="center analyzing">
            <Orb size={220} level={0.8} />
            <p>천천히 숨을 고르며, 당신의 구름을 모으는 중</p>
          </div>
        )}

        {stage === "result" && resultCode && (
          <ResultView code={resultCode} answers={answers} saveFailed={saveFailed} />
        )}

        {toast && <div className="toast" role="status">{toast}</div>}
      </main>
    </>
  );
}

function needsButton(q: Question, a: Answers) {
  if (q.type === "multi" || q.type === "text" || q.type === "longtext" || q.type === "number") return true;
  if (q.type === "single" && !q.scale) return !!q.options?.find((o) => o.value === a[q.id])?.other;
  return false;
}

/* ───────────────────────── 문항 본문 ───────────────────────── */

function QuestionBody({
  q, answers, choose, setAnswer, setEtc,
}: {
  q: Question;
  answers: Answers;
  choose: (q: Question, v: string) => void;
  setAnswer: (q: Question, v: AnswerValue | undefined, advanceAfter?: number) => void;
  setEtc: (q: Question, t: string) => void;
}) {
  const v = answers[q.id];
  const sc = scaleOf(q);

  if (sc) {
    const i = sc.values.findIndex((x) => String(x) === String(v));
    return (
      <ScaleDots
        value={i < 0 ? undefined : i}
        labels={sc.labels}
        tone={sc.tone}
        ariaLabel={q.text}
        onChange={(n) => setAnswer(q, sc.values[n])}
        onCommit={(n) => setAnswer(q, sc.values[n], 700)}
      />
    );
  }

  if (q.type === "number") {
    return (
      <div className="numfield">
        <input className="input" inputMode="numeric" pattern="[0-9]*" autoFocus maxLength={2} placeholder={q.placeholder}
          aria-label={q.text} value={v === undefined ? "" : String(v)}
          onChange={(e) => {
            const d = e.target.value.replace(/\D/g, "").slice(0, 2);
            setAnswer(q, d ? Number(d) : undefined);
          }} />
        <span className="unit">{q.unit}</span>
      </div>
    );
  }

  if (q.type === "text" || q.type === "longtext") {
    const val = (v as string) ?? "";
    return q.type === "longtext" ? (
      <textarea className="input boxed" value={val} placeholder={q.placeholder} maxLength={2000}
        onChange={(e) => setAnswer(q, e.target.value)} />
    ) : (
      <input className="input" value={val} placeholder={q.placeholder} maxLength={q.id === "q30" ? 30 : 60}
        onChange={(e) => setAnswer(q, e.target.value)} />
    );
  }

  const selected = (val: string) => (Array.isArray(v) ? v.includes(val) : v === val);
  const otherOn = q.options?.some((o) => o.other && selected(o.value));
  const multi = q.type === "multi";

  return (
    <div className="opts" role={multi ? "group" : "radiogroup"} aria-label={q.text}>
      {q.options!.map((o, i) => {
        const on = selected(o.value);
        return (
          <button key={o.value} className={`opt ${on ? "on" : ""}`} style={{ animationDelay: `${0.05 + i * 0.04}s` }}
            role={multi ? "checkbox" : "radio"} aria-checked={on}
            onClick={() => choose(q, o.value)}>
            <span className={`mark ${multi ? "sq" : ""}`} />
            <span>{o.label}</span>
          </button>
        );
      })}
      {otherOn && (
        <input className="input etc-input" autoFocus placeholder="직접 입력 (선택)" maxLength={100}
          value={(answers[etcKey(q.id)] as string) ?? ""} onChange={(e) => setEtc(q, e.target.value)} />
      )}
    </div>
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
  const [notice, setNotice] = useState(false);
  return (
    <div className="center landing fade-seq">
      <Orb size={230} level={0.6} />
      <div>
        <p className="eyebrow" style={{ marginTop: 28 }}>JOCHIWON · 2026</p>
        <h1 className="display">나는 어떤<br />조치원 구름일까</h1>
        <p className="sub">5분, 나의 하루로 알아보는 구름 유형</p>
      </div>

      {friend && (
        <div className="friend">
          <Orb size={34} rings={false} colors={CLOUD_TYPES[friend].colors} />
          친구는 {CLOUD_TYPES[friend].name}
        </div>
      )}

      <div className="actions">
        {resumable ? (
          <>
            <button className="btn" onClick={onResume}>이어서 하기</button>
            <button className="linkbtn" onClick={onStart}>처음부터</button>
          </>
        ) : (
          <button className="btn" onClick={onStart}>시작하기</button>
        )}
        {lastResult && CLOUD_TYPES[lastResult.code] && (
          <button className="linkbtn" onClick={onShowLast}>지난 결과 보기</button>
        )}
        <button className="linkbtn small" onClick={() => setNotice(true)}>설문 안내 보기</button>
      </div>

      {notice && (
        <div className="sheet-bg" onClick={() => setNotice(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h2>조치원 생활환경 및 대학생 소진 경험 조사</h2>
            <p>
              안녕하십니까. 본 설문은 조치원에서 생활하는 대학생의 생활패턴과 생활환경 경험, 피로 및 소진 수준을
              파악하고 향후 생활환경 개선 및 프로그램 개발 방향을 모색하기 위해 진행됩니다.
            </p>
            <p>
              연구 참여 확인 및 후속 심층인터뷰 안내를 위해 성명과 연락처를 수집하며, 개인정보는 해당 목적에만 사용한 뒤
              연구 종료 후 폐기됩니다. 설문 결과는 개인을 식별할 수 없는 형태로 활용됩니다.
            </p>
            <p>
              설문 응답에 따라 일부 참여자에게 후속 심층인터뷰를 요청드릴 수 있으며, 인터뷰 참여 여부는 자율적으로
              결정할 수 있습니다. 설문 참여 역시 자율적이며 언제든 중단할 수 있습니다.
            </p>
            <p>예상 소요시간: 약 5분</p>
            <button className="btn soft" onClick={() => setNotice(false)}>닫기</button>
          </div>
        </div>
      )}
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
  const [terms, setTerms] = useState(false);
  const toggle = () => setInfo({ ...info, consent: !info.consent });
  return (
    <>
      <div className="topbar">
        <button className="iconbtn" onClick={onBack} aria-label="처음으로">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
      </div>
      <div className="qwrap slide-in">
        <div className="qhead" style={{ marginTop: 24 }}>
          <p className="qmeta">시작하기 전에</p>
          <h1 className="qtext">참여 확인을 위한<br />정보를 남겨주세요</h1>
        </div>

        <div className="stack">
          <div className="field">
            <label htmlFor="name">이름</label>
            <input id="name" className="input" autoComplete="name" placeholder="홍길동" maxLength={30}
              value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} />
          </div>
          <div className="field" style={{ marginTop: 26 }}>
            <label htmlFor="tel">전화번호</label>
            <input id="tel" className="input" inputMode="tel" autoComplete="tel" placeholder="010-0000-0000"
              value={info.phone} onChange={(e) => setInfo({ ...info, phone: formatPhone(e.target.value) })} />
          </div>
          <div className="field" style={{ marginTop: 26 }}>
            <label id="school-label">학교</label>
            <div className="seg" role="radiogroup" aria-labelledby="school-label">
              {SCHOOLS.map((sc) => (
                <button key={sc} role="radio" aria-checked={info.school === sc}
                  className={info.school === sc ? "on" : ""} onClick={() => setInfo({ ...info, school: sc })}>
                  {sc}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 30 }}
            className={`consent ${info.consent ? "on" : ""} ${warn ? "warn" : ""}`}
            role="checkbox" aria-checked={info.consent} tabIndex={0}
            onClick={toggle}
            onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggle(); } }}>
            <span className="mark sq" />
            <span>개인정보 수집·이용 동의 <span className="faint">(필수)</span></span>
            <button className="more" onClick={(e) => { e.stopPropagation(); setTerms(true); }}>보기</button>
          </div>
        </div>

        <div className="foot">
          <button className="btn" onClick={onStart}>시작하기</button>
        </div>
      </div>

      {terms && (
        <div className="sheet-bg" onClick={() => setTerms(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h2>개인정보 수집·이용 동의 (필수)</h2>
            <table className="terms">
              <tbody>
                <tr><th>수집 항목</th><td>성명, 연락처(전화번호), 소속 학교</td></tr>
                <tr><th>수집 목적</th><td>연구 참여 확인 및 후속 심층인터뷰 안내</td></tr>
                <tr><th>보유 기간</th><td>해당 목적에만 사용한 뒤 연구 종료 후 폐기</td></tr>
                <tr><th>거부 권리</th><td>동의를 거부할 수 있으나, 이 경우 설문에 참여할 수 없습니다. 설문 결과는 개인을 식별할 수 없는 형태로 활용됩니다.</td></tr>
              </tbody>
            </table>
            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <button className="btn soft" onClick={() => setTerms(false)}>닫기</button>
              <button className="btn" onClick={() => { setInfo({ ...info, consent: true }); setTerms(false); }}>동의하기</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
