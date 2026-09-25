import { QUESTIONS, etcKey, visibleQuestions, type Answers } from "./questions";

const MAX_TEXT = 2000;
const str = (v: unknown, max = MAX_TEXT) => String(v ?? "").trim().slice(0, max);

/** 알려진 문항만 남기고, 보기에 없는 값·숨겨진 문항은 제거합니다. */
export function sanitizeAnswers(raw: unknown): Answers {
  const input = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const out: Answers = {};
  for (const q of QUESTIONS) {
    const v = input[q.id];
    if (v == null || v === "") continue;
    const allowed = q.options?.map((o) => o.value);
    if (q.type === "likert") {
      const n = Number(v);
      if (Number.isInteger(n) && n >= 1 && n <= 5) out[q.id] = n;
    } else if (q.type === "multi") {
      const list = (Array.isArray(v) ? v : [v]).map((x) => str(x, 200)).filter((x) => allowed?.includes(x));
      const uniq = [...new Set(list)].slice(0, q.max ?? list.length);
      if (uniq.length) out[q.id] = uniq;
    } else if (q.type === "single" || q.type === "freq") {
      const s = str(v, 200);
      if (allowed?.includes(s)) out[q.id] = s;
    } else {
      const s = str(v);
      if (s) out[q.id] = s;
    }
    const e = str(input[etcKey(q.id)], 300);
    if (e) out[etcKey(q.id)] = e;
  }
  // 조건부로 숨겨진 문항 응답 제거
  const visible = new Set(visibleQuestions(out).map((q) => q.id));
  for (const q of QUESTIONS) {
    if (!visible.has(q.id)) {
      delete out[q.id];
      delete out[etcKey(q.id)];
    }
  }
  return out;
}

export const cleanPersonal = (v: unknown) => {
  const s = str(v, 40);
  return s || null;
};
